import os
import json
import httpx
import re
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, Request, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse, PlainTextResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from rag_pipeline import process_pdf, retrieve, has_documents

load_dotenv()

app = FastAPI(title="MBG - Makan Bergizi Generator RAG Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.5-flash" 
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"

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
    type: str # breakfast | lunch | dinner | snack
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
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"\s*```", "", text)
    text = text.strip()

    # Detect truncated response before trying to parse
    if not text.endswith("}"):
        raise HTTPException(
            status_code=500,
            detail="LLM response was truncated (JSON incomplete). Try reducing duration_days or simplifying the request."
        )

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end+1])
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"JSON parse failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"No valid JSON object found in response.")
    
async def call_gemini(prompt: str, is_json: bool = True) -> str:
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.2 if is_json else 0.7,
            "topP": 0.8,
            "topK": 40,
            "maxOutputTokens": 32768,  # ← increase from 8192
        }
    }
    
    if is_json:
        payload["generationConfig"]["response_mime_type"] = "application/json"

    async with httpx.AsyncClient(timeout=90.0) as client:
        try:
            response = await client.post(GEMINI_URL, json=payload)
            response.raise_for_status()
            data = response.json()
            return data["candidates"][0]["content"]["parts"][0]["text"]
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Gemini API Error: {str(e)}")

# --- Persona & Prompts ---

PERSONA = """
Anda adalah seorang Ahli Gizi Profesional yang ahli dalam menyusun rencana makan sehat (Makan Bergizi Gratis / MBG style).
Karakteristik Anda:
1. Empatik, berbasis data, dan edukatif.
2. Selalu menggunakan referensi Panduan Gizi (Dietary Guidelines) terkini.
3. Mengutamakan bahan makanan lokal Indonesia yang mudah ditemukan dan terjangkau (seperti tempe, tahu, ikan kembung, sayur bayam, dll).
4. Menghitung kebutuhan kalori dan makronutrien (Karbohidrat, Protein, Lemak) secara presisi berdasarkan profil biodata (Usia, Berat, Tinggi, Gender, Aktivitas).

Tugas Anda adalah memberikan rekomendasi yang akurat, aman (memperhatikan alergi dan penyakit), dan sesuai dengan budget yang diberikan.
"""

def build_rag_context(query: str) -> str:
    if has_documents():
        context = retrieve(query, top_k=5)
        if context:
            return f"\n\nKONTEKS PANDUAN GIZI / DIETARY GUIDELINES (Gunakan informasi ini sebagai referensi utama):\n{context}\n"
    return ""

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
        chunk_count = process_pdf(file_bytes, source_name=file.filename)
        return {"message": "PDF berhasil diproses", "chunks": chunk_count}
    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memproses PDF: {str(e)}")

@app.post("/chat")
async def chat_legacy(request: ChatRequest):
    default_profile = UserProfile(
        age=25, weight_kg=70, height_cm=170, gender="male", 
        activity_level="moderate", goal="healthy_eating"
    )
    profile = request.user_profile or default_profile
    {
    "message": "failed to generate meal plan from AI: rag service error (status 500): {\"detail\":\"Gemini API Error: Client error '404 Not Found' for url 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyDnEUbZEx2ZQw4kM4xTWN_F28SjiKpHYNs'\\nFor more information check: https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/404\"}",
    "status": "error"
}
    context = build_rag_context(request.message)
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
    context = build_rag_context(f"Nutrisi untuk {request.user_profile.goal} dengan penyakit {request.user_profile.diseases}")
    
    prompt = f"""
{PERSONA}

{context}

INSTRUKSI:
Buatlah rencana makan selama {request.constraints.duration_days} hari untuk profil berikut:
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
2. Harga estimasi dalam Rupiah (IDR) yang realistis.
3. Hindari bahan: {', '.join(request.user_profile.allergies + request.constraints.exclude_ingredients)}.
4. Bahasa yang digunakan adalah Bahasa Indonesia yang profesional.
"""
    response_text = await call_gemini(prompt, is_json=True)
    return safe_parse_json(response_text)

@app.post("/rag/refine")
async def refine_meal_plan(request: RefineRequest):
    context = build_rag_context(request.instruction)
    
    prompt = f"""
{PERSONA}

{context}

Tugas: Modifikasi rencana makan yang ada berdasarkan instruksi user.
Rencana Makan Saat Ini: {request.meal_plan.model_dump_json()}
Profil User: {request.user_profile.model_dump_json()}
Instruksi Modifikasi: "{request.instruction}"

Output HARUS berupa JSON murni dengan skema yang sama seperti input 'meal_plan'.
"""
    response_text = await call_gemini(prompt, is_json=True)
    return safe_parse_json(response_text)

@app.post("/rag/ask")
async def ask_question(request: AskRequest):
    context = build_rag_context(request.question)
    
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
