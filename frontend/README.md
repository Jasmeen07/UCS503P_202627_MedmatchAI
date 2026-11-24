# MedMatch AI — Frontend Application

> Modern, accessible clinical web interface engineered with Next.js 16 (App Router), React 19, Tailwind CSS v4, Supabase Authentication, and Lucide React.

---

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) 16 (App Router)
- **UI Library:** [React](https://react.dev/) 19 with Server/Client Components
- **Language:** TypeScript 5.0+
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) v4 with medical-aligned palette (sage, teal, slate)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Auth & Database SDK:** `@supabase/ssr` and `@supabase/supabase-js`
- **Testing:** [Vitest](https://vitest.dev/) (`vitest.config.ts`)

---

## Quick Start

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Create `.env.local` in `frontend/`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<your-anon-or-publishable-key>

# Backend Microservice URL (optional in standalone mode; default: http://localhost:8000)
NEXT_PUBLIC_API_URL=http://localhost:8000

# Google Gemini API Key (for client-side OCR fallback in standalone/demo mode)
NEXT_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key>
```

> [!NOTE]
> Never commit `.env.local` to version control. It is ignored by Git in `.gitignore`.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for Production

```bash
# Static export build (used by GitHub Pages deployment)
npm run build
```

---

## Environment Variables Reference

| Variable | Required | Default / Description |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** (in full-stack mode) | Your Supabase project URL (`https://<project>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | **Yes** (in full-stack mode) | Supabase anonymous / publishable key (safe in browser) |
| `NEXT_PUBLIC_API_URL` | Optional | FastAPI backend base URL (default: `http://localhost:8000`) |
| `NEXT_PUBLIC_GEMINI_API_KEY` | Optional | Google Gemini API key used for client-side OCR fallback when backend is unavailable |

---

## Architecture & Dual-Mode Execution

The frontend is architected to operate seamlessly in two deployment environments:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            Next.js 16 Web Client                            │
│  (Patient Dashboard, Doctor Workstation, Multimodal Scanner, Emergency Pass)│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌───────────────────────────────┐             ┌───────────────────────────────┐
│     Full-Stack Cloud Mode     │             │     Static / Demo Mode        │
│   (Local dev or container)    │             │   (GitHub Pages Deployment)   │
│                               │             │                               │
│  • REST API calls to FastAPI  │             │  • Local reactive state cache │
│    backend on port 8000       │             │    in localStorage            │
│  • Direct Supabase Auth & RLS │             │  • Client-side Gemini fallback│
│    token-scoped sessions      │             │  • Zero-config demo accounts  │
│  • Supabase Storage signed URLs│             │  • Cross-tab event sync       │
└───────────────────────────────┘             └───────────────────────────────┘
```

1. **Full-Stack Mode:** When `NEXT_PUBLIC_API_URL` is available, the client makes authenticated REST calls to the FastAPI backend microservice for prescription management, OCR, document uploads, and analytics.
2. **Static Export / Demo Mode:** When deployed to static hosting like GitHub Pages (`output: "export"` in `next.config.ts`), the frontend activates a resilient client-side state engine ([`src/lib/patientData.ts`](./src/lib/patientData.ts)) and direct client-side Gemini runner ([`src/lib/gemini-client.ts`](./src/lib/gemini-client.ts)). All patient records and doctor access controls persist across browser tabs in real time without external infrastructure failures.

---

## Project Structure

```
frontend/
├── next.config.ts            # Next.js configuration (static export, assetPrefix)
├── package.json              # Dependencies and scripts (dev, build, lint, test)
├── tsconfig.json             # TypeScript compiler settings and path aliases (@/*)
├── vitest.config.ts          # Vitest unit and integration test configuration
└── src/
    ├── app/                  # Next.js App Router
    │   ├── page.tsx          # Public clinical landing page
    │   ├── login/            # Role-aware authentication page (patient vs doctor)
    │   ├── register/         # Multi-tenant account registration
    │   ├── doctor/           # Doctor workstation (patient directory & chart viewer)
    │   ├── dossier/          # Read-only Emergency Clinical Dossier (token-routed)
    │   └── dashboard/        # Authenticated Patient Health Portal
    │       ├── page.tsx      # Patient overview dashboard
    │       ├── scan/         # Dual-upload prescription OCR scanner with laser HUD
    │       ├── prescriptions/# Prescription archive and summary exports
    │       ├── treatments/   # Condition-based episode timelines
    │       ├── appointments/ # Clinical consultation booking
    │       ├── insights/     # LLM health insights & DDI screening
    │       └── sharing/      # Emergency QR code, doctor requests, & instant revocation
    ├── components/           # Reusable UI components
    │   ├── landing-interactive.tsx # Interactive landing page hero
    │   ├── theme-provider.tsx      # Dark/light theme context provider
    │   ├── theme-toggle.tsx        # UI theme toggle button
    │   └── dashboard/              # Shared dashboard cards, headers, stat badges
    └── lib/                  # Client utility and business logic libraries
        ├── client.ts         # Supabase browser client factory (`createClient()`)
        ├── server.ts         # Supabase server client helper
        ├── auth.ts           # Session validation, role-based routing, demo hydration
        ├── patientData.ts    # Tenant-isolated data engine, consent workflow, summary downloads
        ├── gemini-client.ts  # Client-side Google Gemini multimodal extraction runner
        ├── doctorCalibration.ts # Multi-doctor handwriting calibration engine (Dr. Reeta Bhambri, Dr. Lovepreet, Dr. Sandeep Kumar, Dr. Meenakshi Jain)
        ├── drug-interactions.ts # Rule-based DDI matrix & chronotherapeutic schedules
        └── utils.ts          # Classname concatenation helper (`cn`)
```

---

## Application Routes Reference

| Route | Role / Scope | Key Features |
| :--- | :--- | :--- |
| `/` | Public | Clinical landing page, problem statement, technology overview |
| `/login` | Public | Role-aware login (routes doctors to `/doctor`, patients to `/dashboard`) |
| `/register` | Public | New patient registration with multi-tenant data isolation |
| `/dashboard` | Patient | Active prescriptions overview, doctor access grants, adherence stats |
| `/dashboard/scan` | Patient | Multimodal prescription scanner, dual-upload verification, direct summary download |
| `/dashboard/prescriptions` | Patient | Digital prescription archive, detailed line items, printable PDF reports |
| `/dashboard/treatments` | Patient | Condition-based clinical episode grouping (e.g. Antenatal, Hypertension) |
| `/dashboard/sharing` | Patient | Incoming doctor access requests, active provider grants with **Revoke Access**, dynamic emergency pass with live QR generator and Medical ID editor |
| `/dashboard/appointments` | Patient | Book and manage clinic consultation appointments |
| `/dashboard/insights` | Patient | LLM-assisted drug interaction screening, chronotherapeutic schedule, lifestyle tips |
| `/doctor` | Doctor | Hospital patient directory with interactive card / dense table view, shift telemetry, access request dispatch, verified clinical chart viewer, emergency override |
| `/dossier` | Emergency / Public Token | Read-only verified clinical dossier accessed via emergency QR token (`/dossier?token=...`) |

---

## Related Documentation

- [`../backend/README.md`](../backend/README.md) — FastAPI Python microservice documentation
- [`../launch.md`](../launch.md) — Step-by-step local development setup guide
- [`../ARCHITECTURE.md`](../ARCHITECTURE.md) — Complete technical architecture guide
