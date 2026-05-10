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

# --- Configuration ---
# Define the directory to scan for initial PDFs.
# This directory should contain the PDF files you want to embed on startup.
# You may need to create this directory and place your PDF files inside.
# The RAG pipeline will then process all '.pdf' files found here.
# --- PLEASE CONFIRM THIS PATH OR PROVIDE YOUR PREFERRED DIRECTORY ---
PDF_DIRECTORY_TO_SCAN = "data/pdf_files"

# ---------------------------------------------------------------------------
# Singleton httpx.AsyncClient dengan connection pooling
# ---------------------------------------------------------------------------
_http_client: httpx.AsyncClient | None = None

async def scan_and_embed_directory(directory_path: str):
    """
    Scans a directory for PDF files and processes each one.
    Clears the RAG cache afterwards.
    """
    print(f"Attempting to scan directory: {directory_path} for PDF files...")
    if not os.path.isdir(directory_path):
        print(f"Warning: Directory '{directory_path}' not found. Skipping initial scan.")
        return

    found_pdfs = False
    for filename in os.listdir(directory_path):
        if filename.lower().endswith(".pdf"):
            found_pdfs = True
            file_path = os.path.join(directory_path, filename)
            print(f"Processing PDF for embedding: {filename}")
            try:
                with open(file_path, "rb") as f:
                    file_bytes = f.read()
                # process_pdf is assumed to handle embedding into ChromaDB
                # It's called with asyncio.to_thread in the original upload endpoint.
                await asyncio.to_thread(process_pdf, file_bytes, filename)
                print(f"Successfully processed and embedded: {filename}")
                # Clear cache after each successful embedding, mirroring the upload endpoint behavior.
                _cached_retrieve.cache_clear()
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    if not found_pdfs:
        print(f"No PDF files found in '{directory_path}'.")
    # If files were found and processed, the cache was cleared inside the loop.


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _http_client
    _http_client = httpx.AsyncClient(
        timeout=300.0,
        limits=httpx.Limits(
            max_connections=20,
            max_keepalive_connections=10,
            keepalive_expiry=30,
        ),
    )

    # --- Initial PDF Scan on Startup ---
    # This logic will run when the FastAPI application starts.
    # It scans the configured directory for PDF files and embeds them.
    await scan_and_embed_directory(PDF_DIRECTORY_TO_SCAN)

    yield # Application starts here

    # --- Cleanup ---
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

# Pre-compiled regex
_RE_JSON_FENCE_OPEN  = re.compile(r"```json\s*")
_RE_JSON_FENCE_CLOSE = re.compile(r"\s*```")


# --- Models ---

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
    # budget_per_day sekarang opsional. Jika None / 0, AI tetap wajib
    # memperkirakan harga realistis untuk setiap bahan berdasarkan pasar Indonesia.
    budget_per_day: Optional[float] = None
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
    price_estimate: float   # WAJIB — harga dalam Rupiah (IDR)

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

    try:
        response = await _http_client.post(GEMINI_URL, json=payload)
        response.raise_for_status()
        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")


def _build_budget_instruction(budget_per_day: Optional[float]) -> str:
    """
    Mengembalikan instruksi budget untuk disertakan dalam prompt.
    Jika budget tidak diberikan, AI tetap WAJIB memperkirakan harga
    realistis berdasarkan harga pasar Indonesia.
    """
    if budget_per_day and budget_per_day > 0:
        return (
            f"Budget harian yang tersedia: Rp{budget_per_day:,.0f}. "
            f"Usahakan total pengeluaran per hari tidak melebihi budget ini."
        )
    return (
        "Tidak ada budget spesifik yang ditetapkan. "
        "Perkirakan harga setiap bahan makanan berdasarkan harga pasar Indonesia yang wajar "
        "(misalnya: beras 100g ≈ Rp1.500, ayam 100g ≈ Rp5.000, tempe 100g ≈ Rp2.000, "
        "bayam 100g ≈ Rp1.000, telur 1 butir ≈ Rp2.500). "
        "Tetap isi field price_estimate untuk SETIAP bahan dan budget_estimate untuk SETIAP meal."
    )


# --- Persona ---

PERSONA = """
Anda adalah seorang Ahli Gizi Profesional yang ahli dalam menyusun rencana menu sehat (Menu Bergizi Gratis / MBG style).
Karakteristik Anda:
1. Empatik, berbasis data, dan edukatif.
2. Selalu menggunakan referensi Panduan Gizi (Dietary Guidelines) terkini.
3. Mengutamakan bahan makanan lokal Indonesia yang mudah ditemukan dan terjangkau (seperti tempe, tahu, ikan kembung, sayur bayam, dll).
4. Menghitung kebutuhan kalori dan makronutrien (Karbohidrat, Protein, Lemak) secara presisi berdasarkan profil biodata (Usia, Berat, Tinggi, Gender, Aktivitas).

Tugas Anda adalah memberikan rekomendasi yang akurat, aman (memperhatikan alergi dan penyakit), dan sesuai dengan budget yang diberikan.
ATURAN HARGA: Untuk SETIAP bahan makanan dalam SETIAP menu, SELALU isi field price_estimate dalam Rupiah (IDR).
Jika tidak ada budget yang ditetapkan, perkirakan harga pasar yang realistis di Indonesia. JANGAN biarkan price_estimate bernilai 0 atau null.
"""


@lru_cache(maxsize=128)
def _cached_retrieve(query: str, top_k: int = 5) -> str:
    return retrieve(query, top_k=top_k)


async def build_rag_context(query: str) -> str:
    if not has_documents():
        return ""
    context = await asyncio.to_thread(_cached_retrieve, query, 5)
    if not context:
        return ""
    return ("KONTEKS PANDUAN GIZI / DIETARY GUIDELINES "
        "(Gunakan informasi ini sebagai referensi utama):"
        f"{context}"
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
    context = await build_rag_context(
        f"Nutrisi untuk {request.user_profile.goal} "
        f"dengan penyakit {request.user_profile.diseases}"
    )
    print(f"RAG Context for Generate: {context}")

    # Instruksi budget yang adaptif — selalu minta harga meski tidak ada budget
    budget_instruction = _build_budget_instruction(request.constraints.budget_per_day)

    # Daftar bahan yang harus dihindari
    excluded = request.user_profile.allergies + request.constraints.exclude_ingredients
    exclude_str = ", ".join(excluded) if excluded else "tidak ada"

    # Instruksi preferensi lokal
    local_food_str = (
        "Utamakan bahan makanan lokal Indonesia yang mudah ditemukan di pasar tradisional."
        if request.constraints.prefer_local_food
        else "Bahan makanan bebas, lokal maupun impor."
    )

    prompt = f"""
{PERSONA}

{context}

INSTRUKSI:
Buatlah rencana menu selama {request.constraints.duration_days} hari untuk profil berikut:
{request.user_profile.model_dump_json(indent=2)}

ATURAN BUDGET DAN HARGA:
{budget_instruction}

ATURAN BAHAN:
- Hindari bahan berikut: {exclude_str}
- {local_food_str}

ATURAN KETAT MENGENAI HARGA:
Setiap objek ingredient WAJIB memiliki field "price_estimate" berisi harga estimasi bahan tersebut
dalam satuan yang dipakai (gram/ml/butir) dalam Rupiah (IDR). DILARANG mengisi 0 atau null.
Contoh referensi harga pasar Indonesia:
- Beras putih 100g → Rp1.500
- Dada ayam 100g → Rp5.000
- Tempe 100g → Rp2.000
- Tahu 100g → Rp1.500
- Ikan kembung 100g → Rp4.000
- Bayam 100g → Rp1.000
- Telur ayam 1 butir (60g) → Rp2.500
- Minyak goreng 10ml → Rp300
- Bawang putih 10g → Rp500

Output HARUS berupa JSON murni mengikuti skema berikut:
{{
  "days": [
    {{
      "day": 1,
      "meals": [
        {{
          "type": "breakfast | lunch | dinner | snack",
          "name": "Nama Menu",
          "budget_estimate": 15000,
          "nutrition_summary": {{ "calories": 350, "protein": 15, "carbs": 50, "fat": 8 }},
          "ingredients": [
            {{
              "name": "Nama Bahan",
              "weight": 100,
              "unit": "gram",
              "calories": 130,
              "protein": 5,
              "carbs": 25,
              "fat": 1,
              "price_estimate": 1500
            }}
          ],
          "instructions": ["Langkah 1", "Langkah 2"]
        }}
      ],
      "daily_total_budget": 45000,
      "daily_nutrition": {{ "total_calories": 1800, "total_protein": 70, "total_carbs": 220, "total_fat": 55 }}
    }}
  ],
  "nutrition_summary": {{
    "avg_daily_calories": 1800,
    "avg_protein": 70,
    "avg_carbs": 220,
    "avg_fat": 55,
    "total_estimated_budget": 135000
  }}
}}

PASTIKAN:
1. Total kalori harian sesuai dengan panduan gizi seimbang (±10%).
2. SETIAP ingredient memiliki price_estimate > 0 dalam IDR.
3. budget_estimate setiap meal = jumlah price_estimate semua ingredientnya.
4. daily_total_budget = jumlah budget_estimate semua meal di hari itu.
5. total_estimated_budget = jumlah semua daily_total_budget.
6. Bahasa yang digunakan adalah Bahasa Indonesia yang profesional.
"""
    response_text = await call_gemini(prompt, is_json=True)
    result = safe_parse_json(response_text)

    # Post-processing: pastikan tidak ada price_estimate yang 0 atau null
    result = _ensure_price_estimates(result)

    return result


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

ATURAN KETAT:
- Pertahankan atau perbarui field "price_estimate" untuk SETIAP ingredient dalam IDR.
- JANGAN biarkan price_estimate bernilai 0 atau null. Perkirakan harga pasar yang wajar.
- Perbarui budget_estimate setiap meal dan daily_total_budget sesuai bahan yang berubah.

Output HARUS berupa JSON murni dengan skema yang sama seperti input 'meal_plan'.
"""
    response_text = await call_gemini(prompt, is_json=True)
    result = safe_parse_json(response_text)

    # Post-processing: pastikan tidak ada price_estimate yang 0 atau null
    result = _ensure_price_estimates(result)

    return result


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


# ---------------------------------------------------------------------------
# Helper: post-processing untuk memastikan price_estimate selalu terisi
# ---------------------------------------------------------------------------

# Harga acuan per 100g/100ml dalam Rupiah — digunakan sebagai fallback
_PRICE_FALLBACK_PER_100: Dict[str, float] = {
    "beras": 1500,
    "nasi": 1500,
    "ayam": 5000,
    "dada ayam": 5000,
    "ikan": 4000,
    "ikan kembung": 4000,
    "ikan lele": 3500,
    "tempe": 2000,
    "tahu": 1500,
    "telur": 4000,        # per 100g ≈ 1.6 butir
    "bayam": 1000,
    "kangkung": 1000,
    "wortel": 1500,
    "kentang": 2000,
    "mie": 2500,
    "roti": 3000,
    "susu": 2000,
    "minyak": 3000,
    "gula": 1500,
    "garam": 500,
    "bawang": 5000,
    "tomat": 2000,
    "pisang": 3000,
    "pepaya": 1500,
    "oat": 4000,
    "terigu": 1500,
    "kacang": 4000,
}

_DEFAULT_PRICE_PER_100 = 2500.0   # fallback jika nama bahan tidak dikenali


def _estimate_fallback_price(name: str, weight: float, unit: str) -> float:
    """
    Perkirakan harga bahan berdasarkan nama dan berat menggunakan tabel acuan.
    Mengembalikan harga dalam Rupiah.
    """
    name_lower = name.lower()
    base_per_100 = _DEFAULT_PRICE_PER_100
    for keyword, price in _PRICE_FALLBACK_PER_100.items():
        if keyword in name_lower:
            base_per_100 = price
            break

    # Normalkan ke 100 unit (gram/ml), unit lain dianggap 1 item ≈ 60g
    if unit in ("gram", "g", "ml", "l"):
        ref_weight = weight if unit in ("gram", "g", "ml") else weight * 1000
    else:
        # Untuk "butir", "lembar", "buah", dll — anggap 1 unit ≈ 60g
        ref_weight = weight * 60

    return round((base_per_100 / 100) * ref_weight, 0)


def _ensure_price_estimates(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Rekursif memeriksa setiap ingredient dalam struktur meal plan.
    Jika price_estimate adalah 0, None, atau tidak ada, isi dengan estimasi fallback.
    Perbarui budget_estimate meal dan daily_total_budget hari.
    """
    days = data.get("days", [])
    for day in days:
        daily_budget = 0.0
        for meal in day.get("meals", []):
            meal_budget = 0.0
            for ingredient in meal.get("ingredients", []):
                price = ingredient.get("price_estimate")
                if not price or price <= 0:
                    # Isi dengan estimasi fallback
                    ingredient["price_estimate"] = _estimate_fallback_price(
                        name=ingredient.get("name", ""),
                        weight=float(ingredient.get("weight", 100)),
                        unit=ingredient.get("unit", "gram"),
                    )
                meal_budget += ingredient.get("price_estimate", 0)

            # Perbarui budget_estimate meal jika tidak ada atau tidak konsisten
            existing_meal_budget = meal.get("budget_estimate", 0)
            if not existing_meal_budget or existing_meal_budget <= 0:
                meal["budget_estimate"] = round(meal_budget, 0)
            daily_budget += meal.get("budget_estimate", 0)

        # Perbarui daily_total_budget jika tidak ada atau nol
        if not day.get("daily_total_budget") or day.get("daily_total_budget", 0) <= 0:
            day["daily_total_budget"] = round(daily_budget, 0)

    # Perbarui total_estimated_budget di nutrition_summary
    summary = data.get("nutrition_summary", {})
    total_budget = sum(
        day.get("daily_total_budget", 0) for day in days
    )
    if not summary.get("total_estimated_budget") or summary.get("total_estimated_budget", 0) <= 0:
        summary["total_estimated_budget"] = round(total_budget, 0)
    data["nutrition_summary"] = summary

    return data


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
