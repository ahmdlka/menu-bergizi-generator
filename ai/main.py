import os
import json
import httpx
import re
import asyncio
from functools import lru_cache
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, PlainTextResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from rag_pipeline import process_pdf, retrieve, has_documents

load_dotenv()

# ---------------------------------------------------------------------------
# OPTIMASI 1: Singleton httpx.AsyncClient dengan connection pooling
#
# Sebelumnya: `async with httpx.AsyncClient(timeout=90.0) as client:` dibuat
# ulang di setiap request → TCP handshake baru setiap kali, overhead tinggi.
#
# Sesudahnya: satu client yang hidup sepanjang umur aplikasi, dengan batas
# koneksi eksplisit (limits) agar tidak bocor resource.
# ---------------------------------------------------------------------------
_http_client: httpx.AsyncClient | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inisialisasi resource satu kali saat startup, bersihkan saat shutdown."""
    global _http_client
    _http_client = httpx.AsyncClient(
        timeout=90.0,
        limits=httpx.Limits(
            max_connections=20,
            max_keepalive_connections=10,
            keepalive_expiry=30,
        ),
    )
    yield
    await _http_client.aclose()

app = FastAPI(title="MBG - Menu Bergizi Generator RAG Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL   = "gemini-2.5-flash"
GEMINI_URL     = (
    f"https://generativelanguage.googleapis.com/v1beta/models"
    f"/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
)

# ---------------------------------------------------------------------------
# OPTIMASI 2: Pre-compile regex
#
# Sebelumnya: re.sub(r"```json...") dikompilasi ulang setiap kali fungsi
# dipanggil karena Python tidak meng-cache pola secara eksplisit.
#
# Sesudahnya: compile sekali di module-level → lookup O(1) per panggilan.
# ---------------------------------------------------------------------------
_RE_JSON_FENCE_OPEN  = re.compile(r"```json\s*")
_RE_JSON_FENCE_CLOSE = re.compile(r"\s*```")


# --- Models (tidak berubah) ---

class UserProfile(BaseModel):
    age: int
    weight_kg: float
    height_cm: float
    gender: str
    activity_level: str
    goal: str
    allergies: List[str] = []
    diseases: List[str] = []
    food_preferences: List[str] = []

class Constraints(BaseModel):
    duration_days: int = 1
    budget_per_day: float
    exclude_ingredients: List[str] = []
    prefer_local_food: bool = True

class GenerateRequest(BaseModel):
    user_profile: UserProfile
    constraints: Constraints

class Ingredient(BaseModel):
    name: str
    weight: float
    unit: str = "gram"
    calories: float
    protein: float
    carbs: float
    fat: float
    price_estimate: float

class Meal(BaseModel):
    type: str
    name: str
    budget_estimate: float
    nutrition_summary: Dict[str, float]
    ingredients: List[Ingredient]
    instructions: List[str]

class DayPlan(BaseModel):
    day: int
    meals: List[Meal]
    daily_total_budget: float
    daily_nutrition: Dict[str, float]

class MealPlan(BaseModel):
    days: List[DayPlan]
    nutrition_summary: Dict[str, float]

class RefineRequest(BaseModel):
    meal_plan: MealPlan
    instruction: str
    user_profile: UserProfile

class AskRequest(BaseModel):
    question: str
    user_profile: UserProfile

class ChatRequest(BaseModel):
    message: str
    user_profile: Optional[UserProfile] = None


# --- Utilities ---

def safe_parse_json(text: str) -> Dict[str, Any]:
    # Gunakan regex yang sudah pre-compiled
    text = _RE_JSON_FENCE_OPEN.sub("", text)
    text = _RE_JSON_FENCE_CLOSE.sub("", text)
    text = text.strip()

    if not text.endswith("}"):
        raise HTTPException(
            status_code=500,
            detail=(
                "LLM response was truncated (JSON incomplete). "
                "Try reducing duration_days or simplifying the request."
            ),
        )

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end   = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start : end + 1])
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"JSON parse failed: {str(e)}")
        raise HTTPException(status_code=500, detail="No valid JSON object found in response.")


async def call_gemini(prompt: str, is_json: bool = True) -> str:
    payload: Dict[str, Any] = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2 if is_json else 0.7,
            "topP": 0.8,
            "topK": 40,
            "maxOutputTokens": 32768,
        },
    }
    if is_json:
        payload["generationConfig"]["response_mime_type"] = "application/json"

    # ---------------------------------------------------------------------------
    # OPTIMASI 1 (lanjutan): Gunakan _http_client singleton, bukan buat baru.
    # ---------------------------------------------------------------------------
    try:
        response = await _http_client.post(GEMINI_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")


# --- Persona & Prompts ---

PERSONA = """
Anda adalah seorang Ahli Gizi Profesional yang ahli dalam menyusun rencana menu sehat (Menu Bergizi Gratis / MBG style).
Karakteristik Anda:
1. Empatik, berbasis data, dan edukatif.
2. Selalu menggunakan referensi Panduan Gizi (Dietary Guidelines) terkini.
3. Mengutamakan bahan makanan lokal Indonesia yang mudah ditemukan dan terjangkau (seperti tempe, tahu, ikan kembung, sayur bayam, dll).
4. Menghitung kebutuhan kalori dan makronutrien (Karbohidrat, Protein, Lemak) secara presisi berdasarkan profil biodata (Usia, Berat, Tinggi, Gender, Aktivitas).

Tugas Anda adalah memberikan rekomendasi yang akurat, aman (memperhatikan alergi dan penyakit), dan sesuai dengan budget yang diberikan. Jika tidak ada budget yang diberikan tetap hitung estimasi budget dari meal plan.
"""

# ---------------------------------------------------------------------------
# OPTIMASI 3: Cache hasil RAG retrieval untuk query yang identik
#
# Sebelumnya: setiap request memanggil `retrieve()` ke vector store meskipun
# query-nya sama persis (e.g., endpoint /ask dipanggil berulang).
#
# Sesudahnya: lru_cache(maxsize=128) menyimpan 128 query terakhir. Karena
# `retrieve` sinkronus, cache ini aman di-apply langsung pada wrapper-nya.
# Jika corpus PDF sering berganti, panggil `_cached_retrieve.cache_clear()`.
# ---------------------------------------------------------------------------
@lru_cache(maxsize=128)
def _cached_retrieve(query: str, top_k: int = 5) -> str:
    return retrieve(query, top_k=top_k)


# ---------------------------------------------------------------------------
# OPTIMASI 4: Jalankan RAG retrieval di thread pool, bukan di event loop
#
# Sebelumnya: `retrieve(...)` (sinkronus, CPU/IO-bound) dipanggil langsung
# di dalam coroutine → memblokir seluruh event loop selama proses berlangsung,
# membuat request lain harus menunggu.
#
# Sesudahnya: `asyncio.to_thread` mendelegasikan pekerjaan ke thread pool
# bawaan Python, sehingga event loop tetap bebas melayani request lain.
# ---------------------------------------------------------------------------
async def build_rag_context(query: str) -> str:
    if not has_documents():
        return ""
    context = await asyncio.to_thread(_cached_retrieve, query, 5)
    if not context:
        return ""
    return (
        "\n\nKONTEKS PANDUAN GIZI / DIETARY GUIDELINES "
        "(Gunakan informasi ini sebagai referensi utama):\n"
        f"{context}\n"
    )


# --- Endpoints ---

@app.get("/", response_class=HTMLResponse)
async def get_index():
    try:
        with open("index.html", "r") as f:
            return f.read()
    except FileNotFoundError:
        return "index.html not found."


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="File harus berformat PDF")
    try:
        file_bytes = await file.read()
        # ---------------------------------------------------------------------------
        # OPTIMASI 4 (lanjutan): process_pdf juga sinkronus → pindah ke thread.
        # Sekaligus clear cache RAG agar dokumen baru langsung terpakai.
        # ---------------------------------------------------------------------------
        chunk_count = await asyncio.to_thread(process_pdf, file_bytes, file.filename)
        _cached_retrieve.cache_clear()
        return {"message": "PDF berhasil diproses", "chunks": chunk_count}
    except HTTPException:
        raise
    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memproses PDF: {str(e)}")


@app.post("/chat")
async def chat_legacy(request: ChatRequest):
    default_profile = UserProfile(
        age=25, weight_kg=70, height_cm=170, gender="male",
        activity_level="moderate", goal="healthy_eating",
    )
    profile = request.user_profile or default_profile

    # ---------------------------------------------------------------------------
    # OPTIMASI 5: Hapus dead code (dict literal tanpa assignment yang ada di
    # versi asli). Tidak ada dampak fungsional, tapi mengurangi bytecode yang
    # dievaluasi Python di setiap request.
    # ---------------------------------------------------------------------------

    # OPTIMASI 3+4: gunakan cache + thread untuk RAG
    context = await build_rag_context(request.message)

    prompt = f"""
{PERSONA}

{context}

User Profile: {profile.model_dump_json()}
Pertanyaan: "{request.message}"

Berikan jawaban yang edukatif, ramah, dan berbasis data nutrisi. Gunakan referensi Panduan Gizi jika relevan.
"""
    response_text = await call_gemini(prompt, is_json=False)
    return {"response": response_text}


@app.post("/rag/generate")
async def generate_meal_plan(request: GenerateRequest):
    # ---------------------------------------------------------------------------
    # OPTIMASI 6: Jalankan RAG dan validasi input secara paralel dengan
    # asyncio.gather jika ada pra-pemrosesan async lain di masa depan.
    # Saat ini, RAG adalah satu-satunya I/O sebelum Gemini → langsung await.
    # ---------------------------------------------------------------------------
    context = await build_rag_context(
        f"Nutrisi untuk {request.user_profile.goal} "
        f"dengan penyakit {request.user_profile.diseases}"
    )
    print(f"RAG Context for Generate:\n{context}\n")  # Debug log untuk RAG context

    prompt = f"""
{PERSONA}

{context}

INSTRUKSI:
Buatlah rencana menu selama {request.constraints.duration_days} hari untuk profil berikut:
{request.user_profile.model_dump_json(indent=2)}

Batasan Tambahan:
{request.constraints.model_dump_json(indent=2)}

Output HARUS berupa JSON murni mengikuti skema berikut:
{{
  "days": [
    {{
      "day": 1,
      "meals": [
        {{
          "type": "breakfast | lunch | dinner | snack",
          "name": "Nama Menu",
          "budget_estimate": 0,
          "nutrition_summary": {{ "calories": 0, "protein": 0, "carbs": 0, "fat": 0 }},
          "ingredients": [
            {{
              "name": "Bahan",
              "weight": 0,
              "unit": "gram",
              "calories": 0,
              "protein": 0,
              "carbs": 0,
              "fat": 0,
              "price_estimate": 0
            }}
          ],
          "instructions": ["Langkah 1", "Langkah 2"]
        }}
      ],
      "daily_total_budget": 0,
      "daily_nutrition": {{ "total_calories": 0, "total_protein": 0, "total_carbs": 0, "total_fat": 0 }}
    }}
  ],
  "nutrition_summary": {{
    "avg_daily_calories": 0,
    "avg_protein": 0,
    "avg_carbs": 0,
    "avg_fat": 0,
    "total_estimated_budget": 0
  }}
}}

PASTIKAN:
1. Total kalori harian sesuai dengan panduan gizi seimbang (±10%).
2. Harga estimasi dari meal plan dalam Rupiah (IDR) yang realistis.
3. Hindari bahan: {', '.join(request.user_profile.allergies + request.constraints.exclude_ingredients)}.
4. Bahasa yang digunakan adalah Bahasa Indonesia yang profesional.
"""
    response_text = await call_gemini(prompt, is_json=True)
    return safe_parse_json(response_text)


@app.post("/rag/refine")
async def refine_meal_plan(request: RefineRequest):
    context = await build_rag_context(request.instruction)

    prompt = f"""
{PERSONA}

{context}

Tugas: Modifikasi rencana menu yang ada berdasarkan instruksi user.
Rencana Menu Saat Ini: {request.meal_plan.model_dump_json()}
Profil User: {request.user_profile.model_dump_json()}
Instruksi Modifikasi: "{request.instruction}"

Output HARUS berupa JSON murni dengan skema yang sama seperti input 'meal_plan'.
"""
    response_text = await call_gemini(prompt, is_json=True)
    return safe_parse_json(response_text)


@app.post("/rag/ask")
async def ask_question(request: AskRequest):
    context = await build_rag_context(request.question)

    prompt = f"""
{PERSONA}

{context}

User Profile: {request.user_profile.model_dump_json()}
Pertanyaan: "{request.question}"

Berikan jawaban yang edukatif, ramah, dan berbasis data nutrisi. Gunakan referensi Panduan Gizi (Dietary Guidelines) jika relevan.
"""
    response_text = await call_gemini(prompt, is_json=False)
    return PlainTextResponse(content=response_text)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)