# MedMatch AI — Backend Service

> High-performance clinical backend microservice powered by FastAPI, Supabase (PostgreSQL with Row-Level Security), and Google Gemini Multimodal Vision-Language Models.

---

## Technology Stack

- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (0.115+) with [Uvicorn](https://www.uvicorn.org/) (0.32+)
- **Runtime:** Python 3.12+ (tested on Python 3.14)
- **Data Validation & Settings:** [Pydantic v2](https://docs.pydantic.dev/) and `pydantic-settings`
- **Database & Identity:** [Supabase](https://supabase.com/) Python Client (`supabase>=2.31.0`) with PostgreSQL 15+ and Row-Level Security (RLS)
- **Document & Image Storage:** Supabase Storage (private bucket `prescription-images` with signed URLs)
- **AI & Multimodal OCR:** [Google GenAI SDK](https://github.com/googleapis/python-genai) (`google-genai>=1.0.0`) utilizing Gemini 3.6 Flash (`gemini-3.6-flash`) with automated fallback to `gemini-3.5-flash-lite` and `gemini-flash-latest`
- **Infrastructure / Caching:** Redis connection string configured in `config.py` (`redis_url`, default `redis://localhost:6379`) for planned task queueing; current OCR and analytics workloads execute synchronously on-demand via async I/O.

---

## Quick Start

### Option A — Using `uv` (Recommended — Fast, No Activation Needed)

```bash
# Install uv if needed:
# Windows (PowerShell): powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
# macOS / Linux:        curl -LsSf https://astral.sh/uv/install.sh | sh

cd backend
uv run fastapi dev main.py
```

### Option B — Using Standard `venv`

```bash
cd backend
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# macOS / Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

- **Backend API:** `http://localhost:8000`
- **Interactive Swagger Documentation:** `http://localhost:8000/docs`
- **Alternative ReDoc Documentation:** `http://localhost:8000/redoc`

---

## Environment Configuration

Create a `.env` file in `backend/` with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Google Gemini API Key
GEMINI_API_KEY=<your-gemini-api-key>

# Security & CORS (comma-separated allowed origins)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://jasmeen07.github.io

# Redis (Configured infrastructure for task queueing)
REDIS_URL=redis://localhost:6379

# Environment Mode ("development" | "production")
ENVIRONMENT=development
```

### Environment Variables Reference

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `SUPABASE_URL` | **Yes** | — | Supabase project REST API endpoint URL |
| `SUPABASE_ANON_KEY` | **Yes** | — | Supabase public/anonymous API key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | — | Privileged service-role key (backend only; bypasses RLS for administrative synchronization) |
| `GEMINI_API_KEY` | Optional | `""` | Google Gemini API key for OCR transcription and analytics screening |
| `CORS_ALLOWED_ORIGINS` | No | `http://localhost:3000` | Comma-separated list of permitted frontend origins |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection URL (infrastructure setting) |
| `ENVIRONMENT` | No | `development` | Deployment environment (`development` or `production`) |

> [!CAUTION]
> The `SUPABASE_SERVICE_ROLE_KEY` has full administrative database privileges. It must **never** be checked into version control, exposed to the frontend, or logged.

---

## Project Structure

```
backend/
├── main.py              # FastAPI application factory, CORS middleware, router registration, /health
├── config.py            # Pydantic BaseSettings class loading configuration from .env
├── auth.py              # HTTPBearer JWT dependency, token validation, Supabase client factory
├── requirements.txt     # Pinned Python package dependencies
├── schema.sql           # PostgreSQL database schema, tables, indexes, triggers, and RLS policies
└── routers/             # Modular API route controllers
    ├── prescriptions.py # Prescription & medicine CRUD, stats, clinical summary report export
    ├── documents.py     # Medical file uploads, Supabase Storage integration, signed URLs
    ├── ocr.py           # Gemini 3.6 Flash multimodal prescription OCR & secondary document cross-check
    ├── analytics.py     # LLM-assisted health summaries, DDI screening, lifestyle recommendations
    ├── appointments.py  # Consultation booking CRUD and upcoming appointment filters
    └── sharing.py       # Bidirectional doctor access requests, patient consent, and instant revocation
```

---

## API Endpoints Reference

### 1. Health & Status
- `GET /` — Welcome message and API status.
- `GET /health` — Health-check reporting service status and environment.

### 2. Prescriptions (`/api/prescriptions`)
- `POST /api/prescriptions/` — Create a prescription record with nested structured medicine lines.
- `GET /api/prescriptions/` — List all prescriptions for the authenticated patient (optional `?status=active|completed|discontinued` filter).
- `GET /api/prescriptions/stats` — Return prescription counts (`total`, `active`, `completed`).
- `GET /api/prescriptions/{rx_id}` — Retrieve a single prescription with all medicine line items.
- `PUT /api/prescriptions/{rx_id}` — Update prescription metadata and status.
- `DELETE /api/prescriptions/{rx_id}` — Remove a prescription and its associated medicines.
- `GET /api/prescriptions/{rx_id}/summary` — Generate a downloadable clinical summary text report for a specific prescription.
- `GET /api/prescriptions/patient/{patient_id}/summary` — Generate an aggregate clinical summary of all active prescriptions for a patient (accessible to patient or authorized consulting doctor).

### 3. Medical Documents (`/api/documents`)
- `POST /api/documents/upload` — Upload prescription images or lab PDFs (max 10MB; JPEG, PNG, PDF) to Supabase Storage bucket `prescription-images`.
- `GET /api/documents/{doc_id}/url` — Generate a temporary signed download URL (3600-second TTL).
- `DELETE /api/documents/{doc_id}` — Delete a document file from storage and database.

### 4. Multimodal Prescription OCR (`/api/ocr`)
- `POST /api/ocr/scan` — Multimodal OCR extraction powered by Gemini 3.6 Flash.
  - Ingests `file` (handwritten prescription slip) and optional `verification_file` (printed pharmacy bill or medicine packaging strip).
  - Accepts optional `clinical_context` to filter out irrelevant drug classes.
  - Enforces structured JSON output with field-level confidence scores (`high`, `medium`, `low`) and `needs_review` flags.
  - Automatically falls back to `gemini-3.5-flash-lite` and `gemini-flash-latest` with exponential backoff on transient 503 errors.

### 5. Clinical Analytics & Screening (`/api/analytics`)
- `POST /api/analytics/summary` — Generate a concise natural-language clinical summary from active prescriptions.
- `POST /api/analytics/interactions` — LLM-assisted screening for drug-drug interactions, contraindications, and allergy warnings for a list of medications.
- `POST /api/analytics/insights` — Generate personalized lifestyle recommendations, dietary precautions, and foods to avoid based on prescribed regimens.

### 6. Appointments (`/api/appointments`)
- `POST /api/appointments/` — Create a new clinical consultation appointment.
- `GET /api/appointments/` — List patient appointments with optional status filter.
- `GET /api/appointments/upcoming` — List appointments occurring within the next 7 days.
- `PUT /api/appointments/{apt_id}` — Update appointment scheduling, location, or status.
- `DELETE /api/appointments/{apt_id}` — Cancel/delete an appointment.

### 7. Clinical Sharing & Consent Lifecycle (`/api/sharing`)
- `POST /api/sharing/request-access` — Doctor dispatches an access request for a registered patient with clinical reason and scope.
- `GET /api/sharing/patient/requests` — Patient retrieves incoming doctor access requests.
- `POST /api/sharing/patient/requests/{request_id}/respond` — Patient approves or declines a doctor request.
- `POST /api/sharing/patient/revoke` — Patient revokes doctor access at any time, immediately locking out records.
- `GET /api/sharing/doctor/patients` — Doctor retrieves hospital patient directory with real-time access status (`none`, `pending`, `granted`, `declined`, `revoked`).
- `GET /api/sharing/doctor/patient-records/{patient_id}` — Doctor retrieves patient records if access is granted (returns `403 Forbidden` if revoked or unauthorized).
- `POST /api/sharing/grant` — Legacy direct token grant creation.
- `GET /api/sharing/active` — List active token grants.
- `DELETE /api/sharing/revoke/{grant_id}` — Revoke token grant by ID.

---

## Database Architecture & RLS

The database schema is defined in [`schema.sql`](./schema.sql). It creates the following tables:

| Table | Purpose | Security Policy |
| :--- | :--- | :--- |
| `profiles` | Extends `auth.users` with role (`patient`, `doctor`, `pharmacy`), blood group, allergies | Users read/update own profile |
| `prescriptions` | Header records (doctor, hospital, diagnosis, date, status, OCR confidence) | Patient-isolated; authorized doctors with active grants have read access |
| `prescription_medicines` | Structured items (name, dosage, frequency, duration, instructions, intended use) | Linked to prescription ownership |
| `treatment_groups` | Clinical episodes grouping related prescriptions (e.g., Antenatal Care) | Patient-isolated |
| `treatment_group_members` | Junction table mapping prescriptions to treatment groups | Patient-isolated |
| `documents` | Metadata for uploaded scans/PDFs referencing Supabase Storage paths | Patient-isolated; authorized doctors have read access |
| `ai_analyses` | Cached LLM health summaries and interaction screening results | Patient-isolated |
| `appointments` | Doctor consultation dates, times, reminders, and status | Patient-isolated |
| `doctor_access_grants` | Active time-bounded authorizations for doctors (`expires_at`, `revoked`) | Patient owns grants; assigned doctor has read access |
| `doctor_access_requests` | Formal consultation requests (`pending`, `approved`, `declined`, `revoked`) | Doctors view dispatched; patients view and respond |
| `audit_log` | Immutable ledger of access grants, views, revocations, and emergency overrides | User reads own audit history; system inserts append-only |

### Applying Schema to Supabase

1. Open your project at [database.new](https://database.new) or [supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor**.
3. Copy the entire contents of [`schema.sql`](./schema.sql) and click **Run**.
4. The schema idempotently provisions tables, indexes, triggers (`on_auth_user_created`), and private storage bucket `prescription-images`.

---

## Key Design Principles

1. **Least-Privilege Token Delegation:** The client never receives the Supabase service-role key. Standard user requests arrive with a Bearer JWT, which FastAPI validates before creating an RLS-scoped database client (`client.postgrest.auth(user["token"])`).
2. **Patient-Governed Data Sovereignty:** Patient consent is the single source of truth. Doctors can only view records when an explicit, un-revoked grant exists. A patient can revoke access at any time, immediately locking the records.
3. **Graceful Multi-Model Degradation:** OCR endpoints automatically retry transient API errors and fall back across the Gemini multimodal family (`gemini-3.6-flash` → `gemini-3.5-flash-lite` → `gemini-flash-latest`) to maintain uptime.
