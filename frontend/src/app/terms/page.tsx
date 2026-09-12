import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, AlertTriangle, Scale, CheckSquare, Shield } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms and Conditions | MedMatch AI",
  description:
    "Terms of Service and clinical usage disclaimer for MedMatch AI medical records management platform.",
};

export default function TermsPage() {
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
              <Scale className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
              Service Terms and Clinical Disclaimer
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-white mb-2">
              Terms and Conditions
            </h1>
            <p className="text-sm text-slate-500">
              Effective Date: September 12, 2026
            </p>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
            {/* Medical Disclaimer Alert */}
            <div className="p-5 rounded border border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30 text-amber-950 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm text-amber-900 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                CRITICAL MEDICAL DISCLAIMER - NOT MEDICAL ADVICE
              </div>
              <p className="text-xs leading-relaxed">
                MedMatch AI is a personal document management and record-keeping software tool. MedMatch AI is NOT a licensed healthcare provider, medical facility, pharmacy, or diagnostic laboratory. The software, automated text extraction services, and interaction reference alerts do NOT constitute the practice of medicine or professional clinical advice. Always consult a qualified, licensed medical physician regarding any medication regimen, diagnosis, or health condition. Never disregard professional medical advice or delay seeking medical attention because of information viewed on this platform. If you are experiencing a medical emergency, call your local emergency services immediately.
              </p>
            </div>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                1. Agreement to Terms
              </h2>
              <p>
                By creating an account, uploading files, or accessing the MedMatch AI platform ("Service"), you agree to be legally bound by these Terms and Conditions. If you do not agree to all terms stated herein, you must immediately discontinue use of the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                2. Automated Extraction and Mandatory Human Verification
              </h2>
              <p>
                Our optical character recognition (OCR) and text extraction pipelines utilize machine learning models to identify printed and handwritten text on prescription images. You acknowledge and agree that:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Automated extraction is provided solely as an administrative transcription convenience.</li>
                <li>Handwriting legibility, scan quality, camera angles, and medical abbreviations can impact recognition accuracy.</li>
                <li>You are strictly required to verify all extracted drug names, dosages, frequencies, and instructions against the original physical prescription before relying on the record.</li>
                <li>MedMatch AI bears no liability for transcribing errors resulting from ambiguous or illegible physician handwriting.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                3. User Accounts and Account Security
              </h2>
              <p>
                You must provide accurate, current information when registering an account. You are solely responsible for:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Maintaining the confidentiality of your authentication credentials and session tokens.</li>
                <li>All activities that occur under your account.</li>
                <li>Promptly notifying MedMatch AI of any suspected unauthorized account access or security breach.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                4. Physician Access Grants and User Authorization
              </h2>
              <p>
                When using the Doctor Access feature to share medical summaries or records with a third party, you affirm that you have the full legal right and capacity to share the designated records. You acknowledge that sharing links generated with custom expirations grant read access to any party holding the valid token until expired or revoked.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                5. Intellectual Property and Data Ownership
              </h2>
              <p>
                You retain complete, exclusive ownership of all medical documents, images, and personal health data you upload to the platform. MedMatch AI retains all rights, title, and interest in and to the platform software, algorithms, user interface, brand assets, and service documentation.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                6. Prohibited Activities
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Upload fraudulent, falsified, or forged medical prescriptions.</li>
                <li>Attempt to bypass or tamper with Row-Level Security policies or authentication tokens.</li>
                <li>Upload malicious files, viruses, or code intended to compromise server infrastructure.</li>
                <li>Reverse-engineer or decompile any portion of the MedMatch AI application codebase.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                7. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by applicable law, MedMatch AI and its developers, affiliates, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation damages for personal injury, adverse medical reactions, loss of health data, or service interruption arising out of your use or inability to use the platform.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                8. Modifications to Service and Terms
              </h2>
              <p>
                We reserve the right to modify these Terms and Conditions at any time. Continued use of the platform following notification of updated terms constitutes binding acceptance of the revised conditions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-semibold text-slate-950 dark:text-white">
                9. Contact Information
              </h2>
              <p>
                For questions regarding these Terms and Conditions, please reach out to:
              </p>
              <p className="font-mono text-xs text-slate-600 dark:text-slate-400">
                legal@medmatch.ai
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
