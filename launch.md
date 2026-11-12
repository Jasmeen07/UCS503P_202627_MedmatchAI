# MedMatch AI — Local Setup & Deployment Guide

## Architecture Overview

| Layer | Technology | Status / Implementation |
|---|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4 | Fully functional with dual-mode support (Full-stack API & static export) |
| **Backend** | FastAPI 0.115+, Python 3.12+, Pydantic v2, Uvicorn | Fully functional REST microservice with 6 modular routers |
| **Database & Identity** | Supabase (PostgreSQL 15+, Supabase Auth, Supabase Storage) | Schema with Row-Level Security (RLS) policies and private storage buckets |
| **AI / Multimodal VLM** | Google Gemini 3.6 Flash (`google-genai` SDK) | Structured handwriting extraction, dual-document check, fallback model retry |
| **Infrastructure / Caching** | Redis | Configured connection setting in `backend/config.py` (`redis_url`); workloads currently run on-demand |

---

## Running Locally

### Prerequisites
- Node.js 20+
- Python 3.12+ (tested on Python 3.14)
- A Supabase project ([supabase.com](https://supabase.com)) **or** Docker for Supabase CLI local development
- A Google Gemini API key ([aistudio.google.com](https://aistudio.google.com/apikey))

---

### 1. Database Setup (Supabase)

**Cloud:**
1. Create a free project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** from the left navigation.
3. Copy and execute the contents of [`backend/schema.sql`](./backend/schema.sql). This will create all tables, indexes, RLS policies, triggers, and the private storage bucket `prescription-images`.
4. Copy your Project URL, anon key, and service-role key from **Project Settings → API**.

**Local (Docker):**
```bash
supabase start
supabase db push
```

---

### 2. Backend Setup (FastAPI)

```bash
cd backend
```

**Option A — `uv` (Recommended — fast, no activation needed):**
```bash
# Install uv if needed:
# Windows (PowerShell): powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
# macOS / Linux:        curl -LsSf https://astral.sh/uv/install.sh | sh

uv run uvicorn main:app --reload --port 8000
```

**Option B — Classic Python `venv`:**
```bash
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Create `backend/.env` with:
```env
# Supabase
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Gemini Multimodal API Key
GEMINI_API_KEY=<your-gemini-api-key>

# Security & CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000

# Redis (Configured infrastructure for task queueing)
REDIS_URL=redis://localhost:6379

# Environment Mode
ENVIRONMENT=development
```

- **Backend API:** `http://localhost:8000`
- **Swagger Documentation:** `http://localhost:8000/docs`
- **Health Check:** `http://localhost:8000/health`

---

### 3. Frontend Setup (Next.js 16)

```bash
cd ../frontend
npm install
npm run dev
```

Create `frontend/.env.local` with:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>

# Backend Microservice URL
NEXT_PUBLIC_API_URL=http://localhost:8000

# Gemini API Key (optional client fallback in static demo mode)
NEXT_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key>
```

- **Frontend Portal:** `http://localhost:3000`
- **Doctor Portal:** `http://localhost:3000/doctor`
- **Patient Dashboard:** `http://localhost:3000/dashboard`

---

## Running Automated Tests

### Backend Unit & Integration Tests (pytest)
```bash
cd backend
python -m pytest
```

### Frontend Component & Library Tests (Vitest)
```bash
cd frontend
npx vitest run
```

### TypeScript Validation
```bash
cd frontend
npx tsc --noEmit
```

---

## Production Deployment

### Frontend Deployment

#### Option 1: GitHub Pages (Current Static Deployment)
The repository includes an automated GitHub Actions workflow [`.github/workflows/nextjs.yml`](./.github/workflows/nextjs.yml) that builds and deploys the static export (`output: "export"`) on every push to `main`.
- In repository **Settings → Pages**, set the source to **GitHub Actions**.
- Add repository secrets if needed: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GEMINI_API_KEY`.

#### Option 2: Vercel / Netlify
1. Import the repository.
2. Set **Root Directory** to `frontend/`.
3. Add the environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_API_URL`.

---

### Backend Deployment (Render / Railway / Fly.io / AWS EC2)
Vercel serverless functions have strict execution timeout limits unsuitable for multimodal VLM document inference. Deploy the FastAPI backend as a persistent container or web service:
1. Set Root Directory to `backend/`.
2. Build command: `pip install -r requirements.txt`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Configure all environment variables in your hosting dashboard:
   - `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `CORS_ALLOWED_ORIGINS` (include your production frontend domain)
   - `ENVIRONMENT=production`
