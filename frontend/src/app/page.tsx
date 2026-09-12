import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { LandingInteractive } from "@/components/landing-interactive";
import {
  FileText,
  Shield,
  Clock,
  UserCheck,
  CheckCircle,
  ArrowRight,
  Database,
  Lock,
  Search,
} from "lucide-react";

export const metadata: Metadata = {
  title: "MedMatch AI: Personal Health Record & Prescription Management",
  description:
    "Secure digital storage for prescriptions, condition-based treatment groups, medication interaction alerts, and authorized physician access.",
};

const capabilities = [
  {
    icon: FileText,
    title: "Prescription Storage",
    desc: "Digitally archive doctor prescriptions in image or PDF formats with structured extraction of doctor, diagnosis, and medication schedules.",
  },
  {
    icon: Database,
    title: "Treatment Grouping",
    desc: "Group related prescriptions by disease or chronic condition to maintain clear continuity of care across multiple clinical visits.",
  },
  {
    icon: Search,
    title: "Drug Safety & Interaction Checks",
    desc: "Automated reference checks for potential drug-drug interactions, contraindications, and cautionary guidelines across active prescriptions.",
  },
  {
    icon: UserCheck,
    title: "Physician Access Grants",
    desc: "Grant time-limited, revocable read access to consulting doctors so they can review pertinent medical history during consultations.",
  },
  {
    icon: Clock,
    title: "Appointment Management",
    desc: "Schedule clinical follow-ups, record physician details, and track upcoming medical appointments in one consolidated interface.",
  },
  {
    icon: Lock,
    title: "Row-Level Security & Privacy",
    desc: "Medical records are isolated with PostgreSQL Row-Level Security policies. Only the authenticated patient and explicitly authorized doctors can view records.",
  },
];

const technicalStandards = [
  "End-to-end user authentication with session tokens",
  "PostgreSQL database with strict Row-Level Security",
  "Encrypted document storage with private access links",
  "Audit trail tracking of record views and sharing grants",
  "Time-bounded access tokens for external medical review",
  "Exportable health history and medication timelines",
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Navbar */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              <img
                src="/logos/logo_light.png"
                alt="MedMatch AI Logo"
                className="w-6 h-6 object-contain dark:hidden"
              />
              <img
                src="/logos/logo_dark.png"
                alt="MedMatch AI Logo"
                className="w-6 h-6 object-contain hidden dark:block"
              />
            </div>
            <span className="font-semibold text-lg tracking-tight">
              MedMatch AI
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <a href="#capabilities" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Capabilities
            </a>
            <a href="#security" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Security Standards
            </a>
            <Link href="/privacy" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
              Terms
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <LandingInteractive />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 py-10 px-6">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-slate-500">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <img
                src="/logos/logo_light.png"
                alt="MedMatch AI Logo"
                className="w-4 h-4 object-contain dark:hidden"
              />
              <img
                src="/logos/logo_dark.png"
                alt="MedMatch AI Logo"
                className="w-4 h-4 object-contain hidden dark:block"
              />
            </div>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              MedMatch AI
            </span>
            <span className="text-xs text-slate-400">
              (c) {new Date().getFullYear()} All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-xs"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-xs"
            >
              Terms of Service
            </Link>
            <Link
              href="/login"
              className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors text-xs"
            >
              Patient Portal
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
