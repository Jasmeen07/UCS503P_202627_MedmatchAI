# MedMatch AI — Technical Architecture & System Design

> Comprehensive architectural specification of the MedMatch AI clinical handwriting transcription, multimodal verification, and patient data governance platform.

---

## 1. Architectural Overview & Design Philosophy

MedMatch AI is engineered to eliminate the critical healthcare bottleneck of illegible handwritten prescriptions, medication misinterpretation, and fragmented patient records. The platform follows a **decoupled, 3-tier microservice architecture** with strict data isolation, defense-in-depth security, and a **dual-mode deployment strategy** that supports both connected enterprise cloud environments and zero-configuration static presentations.

```mermaid
flowchart TD
    subgraph ClientLayer["Tier 1: Presentation Layer (Next.js 16 + React 19)"]
        Landing["Public Landing Page (/)"]
        AuthUI["Role-Aware Auth (/login, /register)"]
        PatientPortal["Patient Health Portal (/dashboard/*)"]
        DoctorWorkstation["Doctor Clinical Workstation (/doctor)"]
        DossierView["Emergency Clinical Dossier (/dossier?token=)"]
        ClientEngine["Hybrid State & Calibration Engine (src/lib/*)"]
    end

    subgraph ServiceLayer["Tier 2: Application Microservice (FastAPI + Python 3.14)"]
        FastAPIMain["FastAPI Core Engine (main.py)"]
        AuthMiddleware["JWT Bearer Validation (auth.py)"]
        RxRouter["Prescriptions Router (/api/prescriptions)"]
        DocRouter["Documents Router (/api/documents)"]
        OCRRouter["Multimodal OCR Router (/api/ocr)"]
        AnalyticsRouter["Analytics & Screening Router (/api/analytics)"]
        AppointmentsRouter["Appointments Router (/api/appointments)"]
        SharingRouter["Clinical Sharing Router (/api/sharing)"]
    end

    subgraph PersistenceLayer["Tier 3: Database, Storage & Identity (Supabase)"]
        SupaAuth["Supabase Auth (Identity & JWT Issuer)"]
        PostgresDB["PostgreSQL 15+ with Row-Level Security (RLS)"]
        SupaStorage["Supabase Storage (prescription-images bucket)"]
        AuditLedger["Immutable Audit Log (audit_log table)"]
    end

    subgraph AILayer["Foundation AI Services"]
        GeminiFlash["Google Gemini 3.6 Flash (Primary VLM)"]
        GeminiLite["Google Gemini 3.5 Flash Lite (Fallback VLM)"]
        GeminiLatest["Google Gemini Flash Latest (Safety Net)"]
    end

    PatientPortal -->|HTTPS / REST| FastAPIMain
    DoctorWorkstation -->|HTTPS / REST| FastAPIMain
    AuthUI -->|Auth Credentials| SupaAuth
    FastAPIMain --> AuthMiddleware
    AuthMiddleware -->|Bearer Token Verification| SupaAuth
    AuthMiddleware -->|RLS-Scoped Queries| PostgresDB

    DocRouter -->|Private Signed Uploads| SupaStorage
    RxRouter -->|CRUD & Summary Reports| PostgresDB
    SharingRouter -->|Access Requests & Revocation| PostgresDB
    AppointmentsRouter -->|Appointment Bookings| PostgresDB
    SharingRouter -->|Security Events| AuditLedger

    OCRRouter -->|Multi-Image Multimodal Prompt| GeminiFlash
    GeminiFlash -.->|On 503 Overload| GeminiLite
    GeminiLite -.->|On Failure| GeminiLatest
    AnalyticsRouter -->|Screening Prompts| GeminiFlash

    ClientEngine -.->|Static Demo Fallback Mode| PatientPortal
```

---

## 2. Dual-Mode Deployment Architecture

To balance enterprise full-stack capabilities with real-world presentation and automated continuous deployment constraints, MedMatch AI supports two distinct execution modes:

```mermaid
flowchart LR
    subgraph FullStack["Full-Stack Enterprise Cloud Mode"]
        direction TB
        F_Client["Next.js Web Client"] -->|REST API Requests| F_API["FastAPI Backend (:8000)"]
        F_API -->|JWT RLS Queries| F_DB["Supabase PostgreSQL 15+"]
        F_API -->|Private Uploads| F_Storage["Supabase Storage"]
        F_API -->|google-genai SDK| F_AI["Gemini 3.6 Flash VLM"]
    end

    subgraph StaticDemo["Static Deployment / GitHub Pages Demo Mode"]
        direction TB
        S_Client["Next.js Client (Static Export)"] -->|LocalStorage Partitioning| S_Cache["Client-Side Tenant Vault"]
        S_Client -->|Cross-Tab Broadcast| S_Events["Custom Event Dispatcher"]
        S_Client -->|Direct Fallback Client| S_AI["Gemini Client SDK"]
        S_Client -->|Deterministic Matrix| S_DDI["Client DDI Rule Engine"]
    end
```

### Full-Stack Enterprise Mode (Local & Containerized Cloud)
- **Frontend:** Communicates via standard HTTPS REST requests to `NEXT_PUBLIC_API_URL` (FastAPI).
- **Backend:** FastAPI validates incoming Supabase JWT bearer tokens, enforces role-based permissions, and communicates with Supabase PostgreSQL using token-authenticated sessions (`client.postgrest.auth(user["token"])`).
- **AI Inference:** Processed server-side in `backend/routers/ocr.py` and `backend/routers/analytics.py` using `google-genai`.

### Static Export / Demo Mode (GitHub Pages Deployment)
- **Deployment Platform:** GitHub Pages via `.github/workflows/nextjs.yml` using `next build` (`output: "export"`).
- **Static Host Constraint:** GitHub Pages cannot execute Python, Uvicorn, or server daemons.
- **Resilient Fallback Engine:** When running in static mode, [`src/lib/patientData.ts`](./frontend/src/lib/patientData.ts) provides an isolated client-side reactive storage engine. User sessions and data are partitioned by email, access request state transitions update across browser tabs via `storage` and `medmatch_access_update` window events, and client-side Gemini invocations handle OCR directly when a browser API key is supplied.

---

## 3. Database Architecture & PostgreSQL Schema

The database is built on **Supabase PostgreSQL 15+** with extensive Row-Level Security (RLS) policies defined in [`backend/schema.sql`](./backend/schema.sql).

```mermaid
erDiagram
    PROFILES ||--o{ PRESCRIPTIONS : owns
    PROFILES ||--o{ APPOINTMENTS : books
    PROFILES ||--o{ DOCUMENTS : uploads
    PROFILES ||--o{ TREATMENT_GROUPS : manages
    PROFILES ||--o{ DOCTOR_ACCESS_REQUESTS : targets_or_dispatches
    PROFILES ||--o{ DOCTOR_ACCESS_GRANTS : permits_or_receives

    PRESCRIPTIONS ||--|{ PRESCRIPTION_MEDICINES : contains
    PRESCRIPTIONS ||--o{ TREATMENT_GROUP_MEMBERS : groups
    TREATMENT_GROUPS ||--o{ TREATMENT_GROUP_MEMBERS : includes
    PRESCRIPTIONS ||--o{ DOCUMENTS : references

    PROFILES {
        uuid id PK
        string role
        string display_name
        string phone
        date date_of_birth
        string blood_group
        string_array allergies
        timestamp created_at
    }

    PRESCRIPTIONS {
        uuid id PK
        uuid user_id FK
        string doctor_name
        string hospital_name
        string diagnosis
        date prescribed_date
        string notes
        string status
        string source
        real ocr_confidence
        timestamp created_at
    }

    PRESCRIPTION_MEDICINES {
        uuid id PK
        uuid prescription_id FK
        string medicine_name
        string dosage
        string frequency
        string duration
        string instructions
        string intended_use
        string confidence
        boolean needs_review
    }

    DOCTOR_ACCESS_REQUESTS {
        uuid id PK
        uuid doctor_id FK
        string doctor_name
        string doctor_specialty
        string hospital
        string doctor_license
        uuid patient_id FK
        string patient_email
        string patient_name
        string patient_uid
        string requested_scope
        string clinical_reason
        string status
        boolean is_emergency
        timestamp created_at
        timestamp updated_at
    }

    DOCTOR_ACCESS_GRANTS {
        uuid id PK
        uuid patient_id FK
        string doctor_email
        uuid doctor_id FK
        string scope
        string access_token
        timestamp expires_at
        boolean revoked
        timestamp created_at
    }

    AUDIT_LOG {
        uuid id PK
        uuid user_id FK
        string action
        string resource_type
        uuid resource_id
        jsonb metadata
        string ip_address
        timestamp created_at
    }
```

### Row-Level Security (RLS) Policy Design

Every table has RLS enabled (`alter table <table> enable row level security;`). Access policies enforce:

1. **Patient Data Sovereignty:** Patients can only read, insert, update, or delete records where `auth.uid() = user_id` (or `patient_id`).
2. **Authorized Physician Inspection:** Consulting doctors are granted read permissions to a patient's `prescriptions`, `prescription_medicines`, and `documents` **only if** an active, un-revoked grant exists in `doctor_access_grants` that has not expired (`expires_at > now()` and `revoked = false`).
3. **Immutable Audit Trails:** Users can read their own access audit logs, but audit entries can only be inserted by system processes (`with check (true)`), preventing tampering.

---

## 4. Authentication, Authorization & User Roles

Authentication is implemented via **Supabase Auth** paired with stateless JSON Web Tokens (JWT).

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient or Doctor
    participant Client as Next.js Web Client
    participant SupaAuth as Supabase Auth Service
    participant API as FastAPI Backend (auth.py)
    participant DB as PostgreSQL (RLS)

    User->>Client: Submit Email & Password
    Client->>SupaAuth: signInWithPassword(email, password)
    SupaAuth-->>Client: Issue JWT (sub, email, role, exp)
    Client->>Client: Route by Role: Doctor → /doctor, Patient → /dashboard

    Note over Client,API: Subsequent Authenticated Requests
    Client->>API: HTTP Request + Header "Authorization: Bearer <JWT>"
    API->>API: get_current_user Dependency (HTTPBearer)
    API->>SupaAuth: Validate Token Signature & Expiry
    SupaAuth-->>API: User Record & Metadata
    API->>DB: client.postgrest.auth(user["token"])
    DB->>DB: Evaluate RLS: auth.uid() == user_id
    DB-->>API: Filtered Tenant Records Only
    API-->>Client: 200 OK + JSON Response
```

### Role Model
- **`patient`:** Default role. Owns personal health records, treatment groups, and appointments. Can approve, decline, or revoke doctor access requests.
- **`doctor`:** Healthcare professional role. Routed to `/doctor`. Permitted to view hospital patient rosters, dispatch clinical access requests, view verified charts upon approval, and record emergency overrides.
- **`pharmacy`:** Reserved role for dispensing verification.

---

## 5. Bidirectional Doctor Access Request & Instant Revocation

Patient data sharing operates on an explicit consent state machine rather than permanent links or static passwords:

```mermaid
stateDiagram-v2
    [*] --> none : Patient registers in hospital system
    
    none --> pending : Doctor submits clinical access request (/api/sharing/request-access)
    
    pending --> approved : Patient approves request (/api/sharing/patient/requests/{id}/respond)
    pending --> declined : Patient declines request
    
    declined --> pending : Doctor re-requests access with updated justification
    
    approved --> revoked : Patient revokes access anytime (/api/sharing/patient/revoke)
    approved --> expired : Time-bounded grant reaches expiration (30 days)
    
    revoked --> pending : Doctor submits a fresh access request
    expired --> pending : Doctor re-requests access
    
    state approved {
        [*] --> ActiveViewing
        ActiveViewing --> ChartInspection : Doctor reviews prescriptions & reports
        ActiveViewing --> ExportSummary : Doctor downloads clinical summary
    }

    state revoked {
        [*] --> LockedOut
        LockedOut : Doctor chart locked (403 Forbidden)
        LockedOut : Prescriptions & scans hidden immediately
    }
```

### Real-Time Revocation Safeguards
- When a patient clicks **"Revoke Access"** on `/dashboard` or `/dashboard/sharing`:
  1. The backend sets `status = "revoked"` on the request and `revoked = true` on all active grants.
  2. The system appends an immutable event to `audit_log`: `ACCESS_CONSENT_REVOKED`.
  3. The frontend emits a `medmatch_access_update` window event and cross-tab storage signal, instantly locking open doctor workstation tabs without needing a page refresh.
  4. Subsequent record fetch attempts to `/api/sharing/doctor/patient-records/{patient_id}` fail with `403 Forbidden`.

---

## 6. AI & Multimodal Prescription OCR Pipeline

```mermaid
flowchart TD
    subgraph Inputs["Multimodal Ingestion"]
        RxImg["Primary Input: Doctor Prescription Photo (JPEG/PNG/PDF)"]
        SecDoc["Secondary Input: Printed Pharmacy Bill or Blister Strip (Optional)"]
        Context["Clinical Prior: Suspected Diagnosis / Chief Complaint (Optional)"]
    end

    subgraph PromptEngine["Contextual Prompt Constructor (ocr.py)"]
        BaseSystem["System Pharmacist Instructions & Schema Enforcement"]
        IndianLexicon["Indian Brand Formulary (Dolo 650, Augmentin, Glycomet, etc.)"]
        ContextConditioning["Top-Down Diagnosis Conditioning (90% Class Pruning)"]
        DualDocInstructions["Multimodal Reconciliation Directives (Physical Corroboration)"]
    end

    subgraph InferenceLadder["Resilient Inference Ladder"]
        M1["Primary: Gemini 3.6 Flash (gemini-3.6-flash)"]
        M2["Fallback 1: Gemini 3.5 Flash Lite (gemini-3.5-flash-lite)"]
        M3["Fallback 2: Gemini Flash Latest (gemini-flash-latest)"]
    end

    subgraph OutputExtraction["Structured Extraction & Validation"]
        JSONParse["JSON Schema Parsing (response_mime_type: application/json)"]
        MedFields["Medicine Entities: Brand, Strength, Frequency, Duration, Route"]
        ConfidenceScoring["Field-Level Confidence Tagging (high, medium, low)"]
        HITLFlag["Human-in-the-Loop Triaging: needs_review = true for ambiguous cursive"]
        CandidateAlt["Candidate Suggestions: Top 2-4 alternative brand candidates"]
    end

    RxImg --> PromptEngine
    SecDoc --> PromptEngine
    Context --> PromptEngine

    BaseSystem & IndianLexicon & ContextConditioning & DualDocInstructions --> M1
    M1 -.->|On 503 Transient Overload| M2
    M2 -.->|On Extended Overload| M3

    M1 & M2 & M3 --> JSONParse
    JSONParse --> MedFields
    MedFields --> ConfidenceScoring
    ConfidenceScoring --> HITLFlag
    HITLFlag --> CandidateAlt
```

### Key Technical Aspects of the OCR Engine
1. **Whole-Document 2D Self-Attention:** Avoids physical image slicing or OpenCV contour bounding-box fragmentation, preserving spatial linkages between medication names, dosages, and instructions across tabular and columnar prescription layouts.
2. **Indian Clinical Terminology & Shorthand:** Prompts are conditioned on common Indian medical shorthand (`1-0-1`, `0-0-1`, `OD hs`, `SOS`, `650m` = `650mg`, `7ds` = `7 days`).
3. **Clinical Prior Conditioning:** When a suspected diagnosis (e.g. "Chest congestion and cough") is supplied, the model eliminates irrelevant therapeutic classes and focuses attention on bronchodilator, mucolytic, and respiratory formulations.
4. **Secondary Document Multimodal Verification:** When a printed pharmacy tax bill or medicine packaging strip is uploaded alongside the handwritten slip, the VLM cross-corroborates handwritten lines with printed text, setting `verified_source: "pharmacy_bill"`, elevating confidence to `high`, and clearing review flags.

---

## 7. Doctor Handwriting Calibration: Technical Reality

> [!IMPORTANT]
> **Few-Shot In-Context Learning vs. Model Fine-Tuning**  
> Doctor handwriting calibration in MedMatch AI is implemented through **few-shot prompting and in-context learning**, **NOT weight-level model fine-tuning**. Google Gemini does not offer public weight-level fine-tuning for multimodal vision models in this tier.

### 1. Notebook Implementation (`prescription_reader_simple.ipynb`)
Demonstrates few-shot visual calibration:
- The user provides 2 to 5 labeled calibration image snippets (e.g., sample lines written by a specific physician) alongside ground-truth text labels.
- The notebook formats these labeled image pairs directly into the prompt payload before the unlabeled prescription image.
- Gemini uses these few-shot image demonstrations in-context to adapt to the physician's handwriting style, loops, and ligatures.

### 2. Application Implementation (`frontend/src/lib/doctorCalibration.ts`)
Demonstrates rule-based in-context prompt calibration:
- For Dr. Reeta Bhambri (Ranjit Maternity Clinic & Nursing Home), specific ligature rules (`Tab.` written with high top loop resembling `Tas`), dosage abbreviations (`650m` = `650mg`), confusable pairs (`Augmentin` vs `Augmentin Duo`), and specialty formulary mappings (antenatal & gynecological care) are injected into the extraction prompt.
- **Anti-Bias Scoping:** Doctor calibration context is injected **only** when that specific doctor profile is selected. For other practitioners, universal unbiased clinical prompting is applied.

---

## 8. Clinical Safety & Drug-Drug Interaction Screening

### Drug-Drug Interaction (DDI) Detection
- **Backend (`/api/analytics/interactions`):** Performs **LLM-assisted screening** using Gemini 3.6 Flash to identify pharmacological interactions, contraindications, and allergy risks from a list of medication names.
- **Frontend (`src/lib/drug-interactions.ts`):** Implements a deterministic client-side safety matrix containing over 1,200 lines of documented interaction rules (e.g., ACE inhibitors + ARBs, Fluoroquinolones + QT-prolonging agents, Warfarin + NSAIDs), severity classifications (Severe, Moderate, Mild), and chronotherapeutic timing guidance.
- **Regulatory Qualification:** DDI screening is explicitly documented as a **supportive screening aid** rather than a certified, standalone clinical decision support system. It is designed to assist patient consultation with licensed healthcare professionals.

### Prescription Summary Generation
- Both `/api/prescriptions/{rx_id}/summary` (single prescription) and `/api/prescriptions/patient/{patient_id}/summary` (aggregate patient record) generate structured plain-English clinical summaries ready for clinical handover and patient export.

---

## 9. Infrastructure, Background Jobs & Redis Status

- **Configuration:** `backend/config.py` contains `redis_url: str = "redis://localhost:6379"`.
- **Implementation Status:** Redis is configured as an infrastructure setting in the application configuration.
- **Current Execution Model:** All OCR transcriptions, AI analyses, and summary generation routines execute **synchronously on-demand** within async FastAPI request handlers. There are currently no active Celery workers, RQ processes, or background job consumers running in the codebase.
- **Future Roadmap:** As request volume increases, the architecture can decouple OCR processing into asynchronous queue workers using this pre-configured Redis URL.

---

## 10. Audit Ledger & Emergency Break-Glass Protocol

- **Audit Logging:** Every critical clinical access event (request creation, patient approval, patient decline, patient revocation, and clinical record inspection) is recorded in `public.audit_log` with user UUID, timestamp, action, and JSON metadata.
- **Emergency "Break-Glass" Access:** In acute emergencies where a patient is unconscious or unable to provide consent, emergency physicians can activate an emergency override. The system requires physician attestation, MCI license recording, and logs a high-severity entry to the immutable audit ledger.
- **Emergency QR Dossier (`/dossier`):** Generates an encrypted time-bounded token (`EMG-8821-VLT`) allowing emergency clinicians to view essential allergies, active medications, and blood group without granting administrative access to the patient's account.
