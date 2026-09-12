import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock, Eye, Database, FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | MedMatch AI",
  description:
    "Comprehensive privacy policy detailing the protection, encryption, and confidentiality of personal health information on MedMatch AI.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-950/90 sticky top-0 z-40">
        <div className="mx-auto max-w-4xl px-6 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to MedMatch AI
          </Link>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono">
              Version 1.2
            </span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 py-12 px-6">
        <article className="mx-auto max-w-4xl space-y-10">
          <div>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 mb-4">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Patient Health Information Privacy Standard
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-sm text-slate-500">
              Effective Date: September 12, 2026
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                1. Introduction and Scope
              </h2>
              <p>
                MedMatch AI ("we," "our," or "us") provides a specialized personal health record platform enabling patients to digitally store medical prescriptions, organize treatments by health condition, review medication schedules, and selectively share records with certified physicians. This Privacy Policy governs the collection, storage, processing, and protection of all user information and Protected Health Information (PHI).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                2. Information We Collect
              </h2>
              <p>We collect only information necessary to deliver clinical record management services:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">Account Credentials:</strong> Email address, encrypted password hashes, and user role designation (patient, doctor, or pharmacy).
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">Prescription and Document Records:</strong> Uploaded images or PDF files of prescriptions, physician names, clinic/hospital names, prescribed dates, diagnostic notes, and medication regimens.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">Treatment and Schedule Data:</strong> User-defined treatment group categorizations (such as chronic disease groupings) and scheduled doctor appointments.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">System Audit Logs:</strong> Cryptographic timestamps, IP addresses, and session IDs corresponding to document uploads, record edits, and sharing authorizations.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                3. Purpose of Processing and Strict Non-Disclosure
              </h2>
              <p>Your medical information is processed strictly for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Extracting readable text from handwritten and printed prescription files uploaded by the patient.</li>
                <li>Presenting a chronological medical timeline for patient self-review.</li>
                <li>Evaluating potential drug interactions and contraindications across actively prescribed medications.</li>
                <li>Enabling patient-authorized physician access during clinical consultations.</li>
              </ul>
              <div className="p-4 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 my-4 text-xs space-y-2">
                <strong className="text-slate-900 dark:text-slate-100 block">Strict Data Isolation Guarantee:</strong>
                <p>
                  We do NOT sell, rent, monetize, or disclose patient medical data to insurance providers, advertisers, pharmaceutical corporations, or third-party data brokers. Patient health records are NEVER used to train public commercial AI models.
                </p>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                4. Database Security & Row-Level Isolation
              </h2>
              <p>
                Our infrastructure implements enterprise-tier security standards designed to safeguard sensitive health data:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">Row-Level Security (RLS):</strong> Every database table enforces PostgreSQL Row-Level Security policies. Queries executed on behalf of a user are restricted at the database engine level to records owned by that authenticated user.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">Encryption Standards:</strong> Data in transit is protected using TLS 1.3 encryption. Document files stored within object storage buckets are encrypted at rest using AES-256 standards.
                </li>
                <li>
                  <strong className="text-slate-900 dark:text-slate-100">Private Bucket Isolation:</strong> Uploaded prescription media are stored in restricted buckets inaccessible to the public internet. Access URLs are signed with short expiration windows.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                5. Physician Sharing and Access Revocation
              </h2>
              <p>
                Sharing medical records with a consulting physician is entirely under the patient's control. When a patient generates an access grant:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The patient defines the precise scope (all records or a specific treatment group).</li>
                <li>An explicit expiration timestamp is attached (for example, 24 hours or 7 days).</li>
                <li>The patient retains the right to instantly revoke active access at any time from the Doctor Access dashboard.</li>
                <li>All physician views and record accesses are recorded in an immutable audit log accessible to the patient.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                6. Patient Rights and Data Deletion
              </h2>
              <p>
                In compliance with applicable data protection regulations, patients have the following continuous rights:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Right to inspect, export, or download all stored prescriptions and medication histories.</li>
                <li>Right to correct or rectify any improperly extracted clinical values.</li>
                <li>Right to request immediate and complete account and record deletion. Upon a verified deletion request, all database entries, associated files, and authentication records are permanently purged from active servers.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                7. Contact Information
              </h2>
              <p>
                For privacy inquiries, audit requests, or compliance questions, please contact our Data Protection Officer at:
              </p>
              <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                privacy@medmatch.ai
              </p>
            </section>
          </div>
        </article>
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 px-6 text-center text-xs text-slate-500">
        MedMatch AI (c) {new Date().getFullYear()} - Personal Health Records Platform
      </footer>
    </div>
  );
}
