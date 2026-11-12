# MedMatch AI

> Intelligent Clinical Handwriting Transcription, Multimodal Verification & Patient Data Governance Ecosystem

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Google Gemini](https://img.shields.io/badge/Gemini-3.6_Flash-blue?style=flat&logo=google)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL_RLS-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)

**MedMatch AI** is a clinical healthcare intelligence platform engineered to eliminate the medical illegibility bottleneck. It accurately deciphers unstructured, hurried cursive physician prescriptions into structured digital regimens, cross-verifies them against printed pharmacy receipts or medicine packaging barcodes to prevent Look-Alike Sound-Alike (LASA) dispensing errors, and organizes health history into cryptographically isolated patient vaults protected by PostgreSQL Row-Level Security (RLS) with supportive Drug-Drug Interaction (DDI) screening.

---

## The Healthcare Problem & Clinical Motivation

- **1.5 Million+ Preventable Adverse Drug Events (ADEs)** occur annually worldwide due to illegible handwriting, dosage ambiguity, and dispensing misinterpretations.
- **7,000+ Fatalities per Year** are traced directly to misunderstood physician cursive script (FDA / Institute of Medicine data).
- **$40 Billion+ Annual Economic Burden** spent on avoidable hospital readmissions, toxicity counter-treatments, and prolonged emergency stays.
- **The Outpatient Workflow Reality:** In high-volume Indian outpatient clinics, physicians write at high speed on custom letterheads, blending symptoms, examination findings (e.g., `P/V Examination`), diagnosis, and medications into dense, unconstrained cursive with non-standard abbreviations (`T.`, `Cap.`, `BD`, `OD hs`, `SOS`, `650m` = `650mg`, `7ds` = `7 days`). Patients leave clinics unable to decipher their regimens, and retail pharmacists under heavy pressure risk dispensing incorrect drug strengths or substituted molecules.

---

## Machine Learning Evolution & Technical Journey

Our team conducted extensive experimental iterations to solve handwritten clinical note transcription:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Phase 1: Traditional Optical Character Recognition (TrOCR & Florence-2)          │
│ └── Tested: Microsoft TrOCR (Large) and Microsoft Florence-2 on real slips.      │
│ └── Result: 14–22% Character Error Rate (CER), >41% Word Error Rate (WER).       │
│ └── Flaws: Token collapse on cursive ligatures and baseline slants; repeatedly   │
│     hallucinated common conversational words (e.g. 'table clock' for 'T. Cefolac').│
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Phase 2: Post-OCR Dictionary Correction (Levenshtein & SymSpell)                 │
│ └── Implemented: Distance-based candidate search over 40,000+ Indian drug names.  │
│ └── Result: ~89% accuracy on isolated, tightly cropped single-word strips.       │
│ └── Flaws: Collapsed completely (<38%) on full-page prescriptions due to merged  │
│     spacing (e.g., 'Cefolac200mg') and unstructured multi-line text layouts.     │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Phase 3: OpenCV Line & Word Segmentation Algorithms                              │
│ └── Implemented: Horizontal projection profiles, Otsu thresholding & contours.   │
│ └── Flaw 1 (Over-Segmentation): Shattered hyphenated brands ('Cefolac-XL 200'    │
│     split into three detached bounding boxes: 'Cefolac', 'XL', '200').           │
│ └── Flaw 2 (Relational Context Loss): Bounding boxes severed spatial links       │
│     connecting medicine names with their dosages, frequencies, and durations.    │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Phase 4: Multimodal Vision-Language Model (Google Gemini 3.6 Flash)              │
│ └── Breakthrough: 2D spatial self-attention processes whole document in a single │
│     inference pass without physical image slicing.                               │
│ └── Enforces strict JSON Schema for structured entity extraction:                │
│     [brand_name, generic_name, dosage, frequency, duration, route, instructions]│
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Phase 5: Doctor Handwriting Calibration (Few-Shot & In-Context Learning)         │
│ └── Evaluated few-shot visual calibration (prescription_reader_simple.ipynb).    │
│ └── In-context rules for Dr. Reeta Bhambri (Ranjit Maternity Clinic):            │
│     shorthands 'Tab.' with loop, '650m', 'Gestofit 200', 'P/V Exam'.             │
│ └── Note: In-context few-shot prompt adaptation; not weight-level fine-tuning.   │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Phase 6: Anti-Bias Context Scoping (Zero-Drift Architecture)                     │
│ └── Guardrail: Doctor calibration context is injected ONLY when matching clinic  │
│     or physician header is selected.                                             │
│ └── Preserves 0% bias drift; unfamiliar doctors route to base clinical ontology. │
└────────────────────────────────────────┬─────────────────────────────────────────┘
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────┐
│ Phase 7: Secondary Document Cross-Verification (Closed-Loop Safety)              │
│ └── Dual-Document Input: Fuses doctor handwritten slip with printed pharmacy     │
│     sales receipt or medicine box packaging barcode in multimodal prompt.        │
│ └── Resolves cursive ambiguities using printed verification text; clears flags.   │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## End-to-End System Architecture

```
                               ┌─────────────────────────────┐
                               │       Patient / Doctor      │
                               └──────────────┬──────────────┘
                                              │ HTTPS
                                              ▼
                               ┌─────────────────────────────┐
                               │  Next.js 16 Web Interface   │
                               │ (React 19, Tailwind CSS v4) │
                               └──────────────┬──────────────┘
                                              │
                    ┌─────────────────────────┴─────────────────────────┐
                    │ REST API / Bearer Token                           │ REST API
                    ▼                                                   ▼
┌───────────────────────────────────────┐           ┌───────────────────────────────────────┐
│       Supabase Auth & Sessions        │           │       FastAPI Backend Engine          │
│   - Patient & Doctor Identity Scoping │           │   - Image Preprocessing & Headers     │
│   - JWT Bearer Validation (auth.py)   │           │   - Contextual Prompt Construction    │
│   - Role-Based Routing (RBAC)         │           │   - DDI Interaction & Summary API     │
└───────────────────┬───────────────────┘           └───────────────────┬───────────────────┘
                    │                                                   │
                    ▼                                                   │
┌───────────────────────────────────────┐                               │
│       Supabase PostgreSQL & RLS       │◄──────────────────────────────┘
│   - Multi-Tenant Row-Level Security   │
│   - Prescriptions & Medicines Tables  │                               │
│   - Time-Bounded Doctor Access Grants │                               ▼
│   - Immutable Access Audit Ledger     │           ┌───────────────────────────────────────┐
│   - Private Storage (Signed URLs)     │           │    Gemini 3.6 Flash Multimodal VLM    │
└───────────────────────────────────────┘           │   - 2D Spatial Attention Reading      │
                                                    │   - Few-Shot In-Context Calibration   │
                                                    │   - Fallback Model Retry Ladder       │
                                                    │   - Strict JSON Schema Enforcement    │
                                                    └───────────────────────────────────────┘
```

---

## Core System Modules

### 1. Calibrated Prescription Transcription
- Ingests high-resolution images or multi-page PDF prescription documents.
- Uses **Google Gemini 3.6 Flash** multimodal VLM with whole-document 2D spatial attention.
- Injects doctor-specific handwriting glyph mappings and abbreviations (e.g. `Tab.` with high loop deciphered as `Tab.`, `650m` normalized to `650mg`, `7ds` to `7 days`).
- Normalizes extracted medicines into structured records containing brand name, generic pharmacological molecule, exact strength, administration frequency (`OD`, `BD`, `TDS`, `1-0-1`, `SOS`), duration, and dietary instructions.
- Enforces field-level confidence ratings (`high`, `medium`, `low`) and flags ambiguous cursive lines with `needs_review: true` and candidate brand suggestions.

### 2. Secondary Document Cross-Verification
- Closes the safety loop by allowing patients to upload their printed pharmacy receipt, cash memo, or packaging alongside the handwritten prescription.
- Employs multimodal dual-document prompt corroboration: Gemini compares handwritten prescription lines against clear printed text on the secondary document to decisively resolve ambiguous cursive.
- Items verified against secondary documentation receive `verified_source: "pharmacy_bill"` or `"medicine_strip"`, elevated confidence (`high`), and cleared review flags.

### 3. Condition-Based Treatment Grouping
- Automatically organizes longitudinal prescription history into clinical episodes (e.g., Antenatal Care, Acute UTI, Chronic Hypertension).
- Consolidates medicines prescribed across multiple clinical visits into a unified, conflict-free regimen timeline.
- Enables patients to track symptom resolution and episode milestones without sifting through scattered paper files.

### 4. LLM-Assisted Drug-Drug Interaction (DDI) Screening & Chronotherapy
- **Screening Aid:** Performs LLM-assisted interaction analysis via Gemini 3.6 Flash (`/api/analytics/interactions`) and an extensive client-side deterministic safety matrix (`src/lib/drug-interactions.ts`).
- Identifies pharmacological interactions, contraindications, and allergy precautions (e.g., ACE inhibitors + ARBs, Fluoroquinolones + QT-prolonging agents).
- **Chronotherapeutic Schedule:** Generates an optimal daily dosing schedule (morning, afternoon, night) based on chronobiology and gastric protection rules.
- *Clinical Note: Designed as an educational consultation aid for patient-physician discussions, not a certified standalone clinical decision support engine.*

### 5. Multi-Tenant Patient Data Isolation & PostgreSQL RLS
- Strict data partitioning enforced at the database layer via **Supabase PostgreSQL Row-Level Security (RLS)**.
- Every patient record is partitioned by authenticated user UUID (`auth.uid() = user_id`).
- Zero cross-tenant data leakage: newly registered accounts receive clean, private vaults, while demo records are allocated strictly to the designated evaluation account (`jk0822123@gmail.com`).

### 6. Clinical Care & Emergency QR Sharing (`/dashboard/sharing` & `/dossier`)
- Generates encrypted, time-bounded Emergency QR codes enabling emergency physicians and consulting clinicians to view a read-only clinical dossier without requiring patient login credentials.
- **Read-Only Emergency Dossier (`/dossier?token=...`):** High-fidelity clinical snapshot displaying patient demographics, blood group, emergency contacts, active condition episodes, active verified medications, and documented allergy warnings.
- **Downloadable Summary Reports:** Single-click comprehensive text/PDF summary report export available from the Prescriptions archive, Scanner HUD, and Doctor Portal.

### 7. Doctor Clinical Portal & Consent Workstation (`/doctor`)
- Dedicated clinic workstation for medical practitioners (e.g., Dr. Reeta Bhambri, Ranjit Hospital & Maternity Home).
- **Hospital Patient Directory:** Displays registered patients with real-time access status badges (`none`, `pending`, `granted`, `declined`, `revoked`).
- **Bidirectional Access Request Dispatch:** Doctors submit clinical access requests with mandatory clinical justification and scope.
- **Verified Patient Chart Viewer:** View read-only prescriptions, extracted medicines, and diagnostic lab reports once authorized by the patient.
- **Instant Patient Revocation Lockout:** If a patient revokes access from their dashboard, the doctor portal locks the records in real time across sessions. To view records again, the doctor must dispatch a new request.
- **Emergency "Break-Glass" Override:** Strict clinical override protocol for acute life-threatening situations requiring physician license attestation, permanently sealed into the immutable audit ledger.

---

## Technology Stack

| Layer | Technology | Version / Specifications | Purpose & Architecture Role |
| :--- | :--- | :--- | :--- |
| **Frontend UI** | Next.js | 16 (App Router) | Responsive clinical portal, camera upload, live cards |
| **UI Library** | React | 19 | Client hydration, reactive state management, modals |
| **Styling** | Tailwind CSS | v4 | Modern clinical light palette, zero dark gradients |
| **Icons** | Lucide React | Latest | Standardized medical and action iconography |
| **Backend Microservice**| FastAPI | 0.115+ (Python 3.12/3.14) | Async REST endpoints, CORS, modular routers |
| **Data Validation** | Pydantic | v2 | Strict JSON schema definitions and type safety |
| **Database** | Supabase PostgreSQL | 15+ | Multi-tenant partitioned vaults, Row-Level Security |
| **Document Storage** | Supabase Storage | Private bucket | `prescription-images` bucket with signed URLs (3600s TTL) |
| **AI / VLM Engine** | Google Gemini | 3.6 Flash (`google-genai`) | Whole-document handwriting transcription & entity extraction |
| **Identity & IAM** | Supabase Auth | JWT Bearer Tokens | User authentication, password hashing, RBAC (`patient`, `doctor`) |
| **Task Queue / Cache** | Redis | `redis://localhost:6379` | Configured in `config.py` for task queues; currently runs on-demand |
| **Deployment** | GitHub Pages / Render | Static Export / Container | Static web app on GitHub Pages; backend on persistent container |

---

## Project Monorepo Structure

```
Medmatch-AI/
├── frontend/                     # Next.js 16 Web Application (App Router)
│   ├── src/app/
│   │   ├── page.tsx              # Public clinical landing page
│   │   ├── login/                # Role-aware authentication (patient vs doctor)
│   │   ├── register/             # Multi-tenant account registration
│   │   ├── doctor/               # Doctor workstation (patient directory & chart viewer)
│   │   ├── dossier/              # Read-only Emergency Clinical Dossier (token-routed)
│   │   └── dashboard/            # Authenticated Patient Health Portal
│   │       ├── scan/             # Dual-upload prescription OCR scanner with laser HUD
│   │       ├── prescriptions/    # Prescription history & detail card view
│   │       ├── treatments/       # Condition-based episode groupings
│   │       ├── appointments/     # Interactive appointment booking
│   │       ├── insights/         # LLM health insights & DDI screening
│   │       └── sharing/          # Emergency QR access, requests & instant revocation
│   ├── src/components/           # Reusable UI cards, headers, modals, theme toggles
│   └── src/lib/                  # Client SDKs, data engine, and calibration
│       ├── client.ts             # Supabase browser client factory (`createClient()`)
│       ├── auth.ts               # Session management and role-based routing
│       ├── patientData.ts        # Tenant-isolated data engine & consent lifecycle
│       ├── gemini-client.ts      # Client-side Google Gemini runner fallback
│       ├── doctorCalibration.ts  # Doctor handwriting prompt calibration rules
│       └── drug-interactions.ts  # Rule-based DDI matrix & chronotherapeutic schedules
├── backend/                      # FastAPI Python Service
│   ├── main.py                   # REST app, CORS middleware, router registration, /health
│   ├── config.py                 # Pydantic Settings (.env configuration loader)
│   ├── auth.py                   # HTTPBearer JWT dependency, token validation, RLS client
│   ├── requirements.txt          # Python dependencies (FastAPI, Supabase, GenAI, Pydantic)
│   ├── schema.sql                # PostgreSQL database schema, tables, RLS policies, triggers
│   └── routers/                  # Modular route controllers
│       ├── prescriptions.py      # Prescription CRUD, stats, clinical summary report export
│       ├── documents.py          # Medical file uploads, Supabase Storage signed URLs
│       ├── ocr.py                # Gemini 3.6 Flash multimodal prescription OCR
│       ├── analytics.py          # LLM health summaries, DDI screening, lifestyle tips
│       ├── appointments.py       # Consultation booking CRUD and upcoming filters
│       └── sharing.py            # Doctor access requests, patient consent, and revocation
├── uml_diagrams/                 # SVG architecture and use-case diagrams
├── prescription_reader_simple.ipynb # Standalone few-shot calibration & OCR exploration notebook
├── launch.md                     # Step-by-step local setup and deployment guide
├── ARCHITECTURE.md               # Detailed technical architecture specification
└── README.md                     # Comprehensive project documentation
```

---

## Getting Started Locally

### Prerequisites
- **Node.js**: v20+
- **Python**: 3.12+ (tested on Python 3.14)
- **Supabase Account**: project URL and keys from [supabase.com](https://supabase.com)
- **Google Gemini API Key**: free key from [aistudio.google.com](https://aistudio.google.com/apikey)

### 1. Database Setup (Supabase)
1. Create a project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor**, paste the contents of [`backend/schema.sql`](./backend/schema.sql), and execute.
3. This creates all tables, RLS policies, triggers, and the private storage bucket `prescription-images`.

### 2. Backend Setup
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

Create `backend/.env` with your Supabase and Gemini credentials (see [`backend/README.md`](./backend/README.md)).

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```

Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key>
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Academic Capstone Metadata

- **Course:** UCS503P — Software Engineering Capstone (Academic Year 2026–2027)
- **Institution:** Thapar Institute of Engineering & Technology, Patiala
- **Engineering Roles & Member Contributions:**
  - **Jasmeen Kaur** (Roll: 1024030103) — Lead ML & Backend Security Architect
    - Evaluated TrOCR & Florence-2 benchmarks; architected Gemini 3.6 Flash VLM pipeline.
    - Engineered Doctor Handwriting Calibration Engine with Dr. Reeta Bhambri dataset.
    - Implemented Anti-Bias Context Scoping and multi-tenant patient vault isolation.
    - Designed real-time Drug-Drug Interaction (DDI) screening matrix.
  - **Maitri Mishra** (Roll: 1024030124) — Lead Frontend & Systems Integration Engineer
    - Initialized monorepo scaffolding and FastAPI REST backend structure.
    - Built responsive clinical UI in Next.js 16 with accessible components and modals.
    - Implemented interactive appointment scheduler and condition timeline views.
    - Conducted OpenCV line and contour segmentation benchmarks.
