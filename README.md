# Menu Bergizi Generator

> Final Project Seleksi Calon Admin Algoritma dan Pemrograman (Alpro)

Final Project pada kali ini kami bawakan dengan tema **Makan Bergizi Generator**. Kami mengambil tema tersebut dengan beberapa pertimbangan yang salah satunya adalah karena *relate* dan dekat dengan keseharian kita, khususnya sebagai mahasiswa. Sesuai dengan ketentuan final project, kami menggabungkan konsep **Frontend, Backend, dan AI**, yang mana untuk frontend kami menggunakan **React (TypeScript)** dengan **Vite** sebagai build tool, Backend menggunakan **Go (Gin framework)**, sedangkan AI-nya kami menggunakan **Gemini API** yang terintegrasi melalui service **FastAPI (Python)** dengan teknik **RAG (Retrieval Augmented Generation)**.

---

## Daftar Isi

- [Latar Belakang](#latar-belakang)
- [Konsep dan Fitur](#konsep-dan-fitur)
- [Tech Stack](#tech-stack)
- [Arsitektur dan Alur Integrasi](#arsitektur-dan-alur-integrasi)
- [Struktur Project](#struktur-project)
- [Cara Install dan Menjalankan](#cara-install-dan-menjalankan)
- [Penggunaan RAG (Retrieval Augmented Generation)](#penggunaan-rag-retrieval-augmented-generation)
- [Tim Pengembang](#tim-pengembang)

---

## Latar Belakang

Tema **Menu Bergizi Generator** kami pilih karena beberapa pertimbangan. Yang paling utama adalah karena tema ini sangat *relate* dan dekat dengan keseharian kita, khususnya sebagai mahasiswa yang sering kali kebingungan dalam menentukan menu makanan yang sesuai dengan kebutuhan, kondisi tubuh, dan juga budget yang tersedia. Selain itu, isu mengenai gizi dan pola makan sehat sedang menjadi perhatian banyak orang, sehingga kami merasa project ini bisa memberikan kontribusi yang nyata, meskipun dalam skala kecil.

Project ini juga kami buat untuk memenuhi ketentuan final project yang mengharuskan integrasi tiga komponen utama, yaitu **Frontend, Backend, dan AI**, sehingga sangat cocok dengan ide rekomendasi menu yang membutuhkan ketiga komponen tersebut secara simultan.

## Konsep dan Fitur

Konsep yang dihadirkan pada final project kami berupa fitur **rekomendasi takar makanan** yang sesuai dengan kebutuhan kita, baik sebagai orang normal, orang yang aktif dalam fitness (gym), maupun orang yang mau melakukan diet. Setiap profil pengguna memiliki perhitungan dan kebutuhan kalori serta nutrisi yang berbeda, dan AI kami akan menyesuaikan rekomendasi tersebut secara otomatis.

Kami juga menghadirkan fitur **Generate** yang terbagi menjadi dua mode:

1. **Fast Generate**, mode cepat yang langsung menghasilkan rekomendasi menu bergizi berdasarkan input minimal dari pengguna. Cocok untuk yang ingin hasil instan tanpa banyak konfigurasi.
2. **Specific Generate**, mode yang lebih detail di mana pengguna dapat memasukkan parameter tambahan seperti usia, berat badan, tinggi badan, gender, tingkat aktivitas, goal, alergi, penyakit, dan preferensi makanan, sehingga hasilnya lebih sesuai dengan kebutuhan personal.

Pada kedua mode tersebut, terdapat input **jumlah hari** (1–3 hari) dan **budget per hari** yang disesuaikan dengan kesanggupan pengguna. Dengan begitu, output yang dihasilkan tidak hanya bergizi, tetapi juga realistis untuk dijalankan secara harian.

Selain fitur generate, kami juga menyediakan **fitur chat AI** yang terintegrasi di dashboard. Pengguna dapat melakukan:
- **Refine Menu** untuk memodifikasi meal plan yang sudah di-generate melalui instruksi dalam chat (misalnya: "ganti ayam jadi tempe").
- **Ask Question** untuk bertanya seputar gizi dan nutrisi kepada AI yang akan menjawab berbasis data dari dokumen ahli gizi.

### Ringkasan Fitur

| Fitur | Deskripsi |
|---|---|
| Autentikasi | Register & Login dengan JWT (JSON Web Token) |
| Profil Pengguna | Usia, Berat, Tinggi, Gender, Aktivitas, Goal, Alergi, Penyakit, Preferensi Makanan |
| Mode Generate | Fast (input minimal) dan Specific (input detail) |
| Input Jumlah Hari | Pengguna bisa menentukan rentang 1–3 hari |
| Input Budget Harian | Disesuaikan dengan kesanggupan pengguna (dalam Rupiah) |
| Rekomendasi Takar | Porsi makanan diukur sesuai kebutuhan profil beserta bahan, instruksi, dan estimasi harga |
| Chat AI (Refine) | Modifikasi meal plan yang sudah ada melalui instruksi natural language |
| Chat AI (Ask) | Tanya jawab seputar gizi berbasis RAG |
| Versioning Meal Plan | Setiap perubahan meal plan tercatat sebagai versi baru |
| Integrasi AI | Gemini API (model `gemini-2.5-flash`) + RAG dengan ChromaDB |

## Tech Stack

| Layer | Teknologi |
|---|---|
| **Frontend** | React 18 + TypeScript, Vite, Tailwind CSS v4, Radix UI, Shadcn/ui, Zustand (state), React Router v7 |
| **Backend** | Go 1.26 (Gin framework), GORM (ORM), PostgreSQL |
| **AI / RAG Service** | Python (FastAPI + Uvicorn), Gemini API (Google), ChromaDB, Sentence Transformers, LangChain |
| **Database** | PostgreSQL 15 (via Docker Compose) |
| **Vector Store** | ChromaDB (persistent, lokal) |
| **Knowledge Source** | RAG dengan dokumen PDF (*Dietary Guidelines for Americans 2025–2030*) |
| **Komunikasi** | REST API — Frontend ↔ Backend (Go) ↔ AI Service (Python) |
| **Viewer/Debug** | Streamlit (ChromaDB Viewer) |

## Arsitektur dan Alur Integrasi

Proses pembuatannya, kami membuat **Frontend-nya terlebih dahulu** dan juga **AI-nya**. Kemudian kami membuat **Backend-nya menggunakan Go (Gin)**. Setelah semua bisa dibuat, kami mengintegrasikan ketiganya melalui **REST API** dari setiap bagian. Frontend berkomunikasi dengan Backend Go, lalu Backend Go meneruskan request ke AI Service (FastAPI Python) yang menggunakan Gemini API dan RAG untuk menghasilkan rekomendasi menu.

Alur sederhananya seperti berikut:

```
[ User ]
   ↓ (input: profil, hari, budget, mode)
[ Frontend — React + TypeScript (Vite) ]
   ↓ (HTTP request via REST API, JWT auth)
[ Backend - Go (Gin) ]
   ↓ (forward request ke RAG service)
[ AI Service — Python (FastAPI) ]
   ↓ (RAG retrieval dari ChromaDB + prompt ke Gemini API)
[ Gemini API dari Google ]
   ↓ (output rekomendasi menu dalam JSON)
[ AI Service ] → [ Backend ] → [ Frontend ] → [ User ]
```

Dengan arsitektur seperti ini, masing-masing komponen memiliki tanggung jawab yang jelas dan terpisah:
- **Frontend** bertanggung jawab untuk UI/UX dan interaksi pengguna.
- **Backend (Go)** bertanggung jawab untuk autentikasi (JWT), manajemen user & profil, penyimpanan meal plan ke database, dan orkestrasi request.
- **AI Service (Python)** bertanggung jawab untuk RAG pipeline, prompt engineering, dan komunikasi dengan Gemini API.

## Struktur Project

```
menu-bergizi-generator/
├── frontend/                    # React + TypeScript (Vite)
│   ├── src/
│   │   ├── main.tsx             # Entry point React
│   │   ├── styles/              # CSS (Tailwind v4)
│   │   └── app/
│   │       ├── App.tsx          # Root component + routing
│   │       ├── pages/
│   │       │   ├── LandingPage.tsx
│   │       │   ├── AuthPage.tsx
│   │       │   ├── DashboardPage.tsx
│   │       │   ├── ProfilePage.tsx
│   │       │   └── CompleteProfilePage.tsx
│   │       ├── components/
│   │       │   ├── AppShell.tsx          # Layout wrapper
│   │       │   ├── ChatPanel.tsx         # Chat AI panel
│   │       │   ├── MealPlanView.tsx      # Tampilan meal plan
│   │       │   ├── MealPlanSkeleton.tsx  # Loading skeleton
│   │       │   ├── GeneratorPicker.tsx   # Pemilih mode generate
│   │       │   ├── RequireAuth.tsx       # Auth guard
│   │       │   ├── Brand.tsx            # Logo / branding
│   │       │   ├── Markdown.tsx         # Markdown renderer
│   │       │   ├── forms/
│   │       │   │   ├── FastForm.tsx      # Form mode Fast
│   │       │   │   └── SpecificForm.tsx  # Form mode Specific
│   │       │   └── ui/                   # Shadcn/ui components (48 files)
│   │       └── lib/
│   │           ├── api.ts               # API client (fetch + mock)
│   │           ├── auth.ts              # JWT token manager
│   │           ├── env.ts               # Environment variables
│   │           ├── mock.ts              # Mock API untuk development
│   │           └── mealPlanStore.tsx     # Zustand state management
│   ├── index.html
│   ├── vite.config.ts
│   ├── package.json
│   └── .env                     # VITE_API_URL, VITE_MOCK_API
│
├── backend/                     # Go (Gin framework)
│   ├── cmd/
│   │   └── main.go              # Entry point aplikasi
│   ├── config/
│   │   └── database.go          # Koneksi PostgreSQL via GORM
│   ├── database/
│   │   └── entities/
│   │       ├── common.go            # Base model (ID, timestamps)
│   │       ├── user_entity.go       # User + UserProfile entity
│   │       ├── meal_plan_entity.go  # MealPlan + MealPlanVersion entity
│   │       └── chat_history_entity.go  # ChatHistory entity
│   ├── middlewares/
│   │   ├── authentication.go    # JWT authentication middleware
│   │   └── cors.go              # CORS middleware
│   ├── modules/
│   │   ├── auth/                # Modul autentikasi (login, register, JWT)
│   │   │   ├── routes.go
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── dto/
│   │   │   └── validation/
│   │   ├── user/                # Modul user (profil, data user)
│   │   │   ├── routes.go
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── dto/
│   │   │   └── validation/
│   │   ├── meal_plan/           # Modul meal plan (generate, list, delete)
│   │   │   ├── routes.go
│   │   │   ├── controller/
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   ├── dto/
│   │   │   └── validation/
│   │   └── chat/                # Modul chat AI (refine menu, ask question)
│   │       ├── routes.go
│   │       ├── controller/
│   │       ├── service/
│   │       ├── repository/
│   │       ├── dto/
│   │       └── validation/
│   ├── pkg/
│   │   ├── helpers/             # Helper functions
│   │   ├── utils/               # Utility (response formatter, dll)
│   │   └── ragclient/
│   │       └── rag_client.go    # HTTP client untuk AI Service
│   ├── docker-compose.yml       # PostgreSQL container
│   ├── go.mod
│   ├── go.sum
│   └── .env                     # APP_PORT, DB_HOST, DB_NAME, dll
│
├── ai/                          # Python AI + RAG Service
│   ├── main.py                  # FastAPI app (endpoints: /rag/generate, /rag/refine, /rag/ask, /chat)
│   ├── rag_pipeline.py          # RAG pipeline (PDF processing, embedding, retrieval via ChromaDB)
│   ├── viewer.py                # Streamlit ChromaDB Viewer (debug tool)
│   ├── chroma_db/               # Persistent ChromaDB vector store
│   ├── *.pdf                    # Dokumen sumber gizi (Dietary Guidelines)
│   └── .env                     # GEMINI_API_KEY
│
├── .gitignore
└── README.md
```

## Cara Install dan Menjalankan

### Prasyarat

- **Node.js** (v18 atau lebih baru) untuk Frontend
- **Go** (v1.26 atau lebih baru) untuk Backend
- **Python** (v3.10 atau lebih baru) untuk AI Service
- **Docker** (opsional, untuk menjalankan PostgreSQL via Docker Compose)
- **PostgreSQL** (v15, bisa via Docker atau install manual)
- **Gemini API Key** — bisa didapatkan di [Google AI Studio](https://aistudio.google.com/)

### 1. Clone Repository

```bash
git clone https://github.com/ahmdlka/menu-bergizi-generator.git
cd menu-bergizi-generator
```

### 2. Setup Database (PostgreSQL)

Jalankan PostgreSQL menggunakan Docker Compose:

```bash
cd backend
docker-compose up -d
```

Ini akan menjalankan PostgreSQL 15 di port `5432` dengan konfigurasi default:
- **User:** `postgres`
- **Password:** `postgres`
- **Database:** `alpro_db`

> Jika tidak menggunakan Docker, pastikan PostgreSQL sudah terinstall dan buat database secara manual.

### 3. Setup AI Service (Python)

```bash
cd ai
python -m venv venv

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# Mac / Linux:
source venv/bin/activate

# Install dependencies
pip install fastapi uvicorn httpx pydantic python-dotenv chromadb sentence-transformers langchain-community langchain-text-splitters pypdf
```

Buat file `.env` di folder `ai/` dan tambahkan:

```env
GEMINI_API_KEY=your_api_key_here
```

Jalankan AI Service:

```bash
python main.py
```

AI Service akan berjalan di `http://localhost:8000`.

> **Catatan:** Saat pertama kali dijalankan, AI Service akan otomatis memproses file PDF yang ada di folder `ai/` untuk di-embed ke ChromaDB sebagai knowledge source RAG.

### 4. Setup Backend (Go)

Buka terminal baru, lalu:

```bash
cd backend
```

Buat file `.env` di folder `backend/` dan tambahkan:

```env
APP_ENV=local
APP_PORT=8080

DB_HOST=localhost
DB_PORT=5432
DB_NAME=alpro_db
DB_USER=postgres
DB_PASS=postgres
```

Jalankan backend:

```bash
go run cmd/main.go
```

Backend akan berjalan di `http://localhost:8080`. GORM akan otomatis melakukan auto-migrate untuk membuat tabel-tabel yang dibutuhkan di database.

### 5. Setup Frontend (React)

Buka terminal baru, lalu:

```bash
cd frontend
npm install
```

Pastikan file `.env` di folder `frontend/` berisi:

```env
VITE_API_URL="http://localhost:8080/api"
VITE_MOCK_API=false
```

> Set `VITE_MOCK_API=true` jika ingin menjalankan frontend tanpa backend (mode mock/demo).

Jalankan frontend:

```bash
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`.

### 6. Buka Aplikasi

Akses aplikasi melalui browser di `http://localhost:5173`.

### (Opsional) ChromaDB Viewer

Untuk melihat dan mengelola data yang tersimpan di ChromaDB, gunakan Streamlit Viewer:

```bash
cd ai
streamlit run viewer.py
```

Viewer akan berjalan di `http://localhost:8501`.

## Penggunaan RAG (Retrieval Augmented Generation)

Di sini kami juga menggunakan **pengetahuan / informasi** yang kami dapatkan dengan menggunakan **RAG (Retrieval Augmented Generation)** terhadap file PDF *"Release of the 2025–2030 Dietary Guidelines for Americans"*.

Dengan menggunakan RAG, AI tidak hanya mengandalkan training data umum dari Gemini, tetapi juga **disuplai dengan konteks tambahan** berupa dokumen PDF yang berisi pengetahuan spesifik tentang gizi, takaran makanan, dan rekomendasi pola makan. Hal ini membuat output yang dihasilkan menjadi lebih akurat, relevan, dan dapat dipertanggungjawabkan secara nutrisi.

Alur RAG yang kami gunakan secara sederhana:

1. PDF dari ahli gizi di-*chunk* menjadi potongan-potongan teks menggunakan `RecursiveCharacterTextSplitter` (chunk size: 800, overlap: 100).
2. Setiap chunk diubah menjadi *embedding* menggunakan model **`all-MiniLM-L6-v2`** (Sentence Transformers) dan disimpan ke **ChromaDB** (persistent vector store).
3. Saat user melakukan request, query akan di-encode menjadi embedding dan dicari kecocokannya di ChromaDB (top-5 results).
4. Chunk yang paling relevan (dengan skor di atas threshold 0.3) dijadikan **context** untuk prompt ke Gemini API.
5. Gemini menghasilkan jawaban berdasarkan context tersebut, dikombinasikan dengan persona "Ahli Gizi Profesional" yang kami rancang.

### Optimasi yang Diterapkan

| Optimasi | Deskripsi |
|---|---|
| Singleton HTTP Client | Menggunakan satu `httpx.AsyncClient` dengan connection pooling sepanjang umur aplikasi |
| Pre-compiled Regex | Regex untuk parsing JSON di-compile sekali di module-level |
| LRU Cache RAG | Cache 128 query RAG terakhir agar retrieval yang sama tidak diulang |
| Thread Pool Delegation | RAG retrieval (sinkronus) didelegasikan ke thread pool agar tidak memblokir event loop |

## Tim Pengembang

Project ini dikerjakan oleh tim yang terdiri dari:

- **Ahmad Loka A.** - 5025241044
- **Naufal Bintang Brillian** - 5025241168


## Penutup

Demikian laporan singkat dari final project kami. Kami berharap project ini dapat menjadi gambaran kemampuan kami dalam menggabungkan tiga konsep utama (Frontend, Backend, dan AI) sekaligus menjadi solusi sederhana yang berguna dalam keseharian. Kritik dan saran sangat kami terima untuk pengembangan ke depannya.
