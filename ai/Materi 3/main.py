import os
from fastapi import FastAPI, Request, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv
from rag import process_pdf, retrieve, has_documents

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_key_val = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key_val)

class ChatRequest(BaseModel):
    message: str

@app.get("/", response_class=HTMLResponse)
async def get_index():
    with open("index.html", "r") as f:
        return f.read()

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if file.content_type != "application/pdf":
        return {"error": "File harus berformat PDF"}
    try:
        file_bytes = await file.read()
        chunk_count = process_pdf(file_bytes)
        return {"message": "PDF berhasil diproses", "chunks": chunk_count}
    except Exception as e:
        print(f"UPLOAD ERROR: {e}")
        return {"error": f"Gagal memproses PDF: {str(e)}"}


@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        personality = (
            "Act as an assistant in Competitive Programming.\n"
            "Be as acknowledgeable in the subject as possible.\n"
            "Be as annoying as possible. Connect every single prompt to competitive programming.\n"
            "Even a simple hello should be connected to competitive programming.\n"
            "Act like you're trying to 'solve' the user's message, even if it's not a problem to solve.\n"
            "Please use standard LaTeX for math and Markdown for bolding.\n"
        )

        user_msg = request.message

        if has_documents():
            context = retrieve(user_msg)
            prompt = (
                f"{personality}\n"
                f"Berikut konteks dari dokumen yang relevan:\n{context}\n\n"
                f"Pertanyaan: {user_msg}"
            )
        else:
            prompt = f"{personality}This is your next prompt: {user_msg}"

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )

        return {"response": response.text}
    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        return {"response": f"Internal Error: {str(e)}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)