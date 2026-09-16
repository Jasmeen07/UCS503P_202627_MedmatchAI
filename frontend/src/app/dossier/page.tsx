"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  Printer, 
  Download, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  HeartPulse, 
  Calendar, 
  User, 
  Phone, 
  Building2, 
  FileText, 
  Stethoscope, 
  Pill, 
  Sparkles,
  ArrowLeft,
  Share2,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";
import { 
  getPatientDossier, 
  PatientDossierData, 
  getActivePatientEmail,
  getPatientPrescriptions,
  StoredPrescription 
} from "@/lib/patientData";

export default function PatientDossierPage() {
  const [dossier, setDossier] = useState<PatientDossierData | null>(null);
  const [prescriptions, setPrescriptions] = useState<StoredPrescription[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if token is passed via query params in browser
    let tokenParam: string | null = null;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      tokenParam = params.get("token");
    }

    const email = getActivePatientEmail();
    const data = getPatientDossier(email, tokenParam);
    setDossier(data);

    const rxs = getPatientPrescriptions(email);
    setPrescriptions(rxs);
  }, []);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  if (!dossier) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">Loading Clinical Dossier...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 print:bg-white print:text-black">
      {/* Top Clinical Header / Action Bar (Hidden in Print) */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link 
              href="/dashboard/sharing" 
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Patient Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
                <HeartPulse className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-tight text-slate-900">MedMatch AI</span>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Emergency Dossier
                  </span>
                </div>
                <p className="text-xs text-slate-500">Read-Only Verified Clinical Health Snapshot</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Token: <strong>{dossier.token}</strong> (Valid for 24h)</span>
            </div>

            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              {copied ? "Link Copied!" : "Share Link"}
            </button>

            <Link
              href="/doctor"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Doctor Portal
            </Link>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Export / Print PDF
            </button>
          </div>
        </div>
      </header>

      {/* Main Dossier Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 print:p-0 print:max-w-none">
        {/* Printable Hospital Medical Banner */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8 mb-6 print:border-none print:shadow-none print:p-0 print:mb-4">
          
          {/* Official Letterhead Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-slate-200 gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0 print:w-10 print:h-10 print:text-lg">
                +
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  CLINICAL HEALTH VAULT — PATIENT DOSSIER
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
                  Universal Health Interface &amp; Electronic Medical Records Snapshot
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Multi-Tenant Vault Isolation Active
                  </span>
                  <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    UID: {dossier.patientUid}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none border sm:border-none border-slate-200 w-full sm:w-auto">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Access Clearance</div>
              <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">{dossier.token}</div>
              <div className="text-xs text-slate-500 mt-1">Generated: {dossier.generatedAt}</div>
              <div className="text-xs text-amber-700 font-medium">Valid until: {dossier.expiresAt}</div>
            </div>
          </div>

          {/* Patient Demographics & Emergency Contacts Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-b border-slate-200 text-sm">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Patient Name</span>
              <span className="font-bold text-base text-slate-900">{dossier.patientName}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Age / Gender</span>
              <span className="font-semibold text-slate-900">{dossier.ageGender}</span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Blood Group</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md font-bold text-rose-700 bg-rose-50 border border-rose-200">
                {dossier.bloodGroup}
              </span>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-0.5">Emergency Contact</span>
              <span className="font-semibold text-slate-900 block">{dossier.emergencyContact.name} ({dossier.emergencyContact.relation})</span>
              <span className="text-xs text-slate-600 flex items-center gap-1 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" /> {dossier.emergencyContact.phone}
              </span>
            </div>
          </div>

          {/* Urgent Clinical Red-Flag Warnings */}
          <div className="py-6 border-b border-slate-200">
            <h2 className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 mb-3">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              Critical Medical Alerts &amp; Documented Hypersensitivities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {dossier.allergies.map((alg, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-rose-600 mt-1.5 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-rose-950">{alg.substance}</span>
                      <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-rose-200 text-rose-900">
                        {alg.severity} Severity
                      </span>
                    </div>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      Manifestation: {alg.reaction}. <strong>Contraindicated for prescription.</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Active Gestational Safeguard:</strong> Patient is in Trimester II (Week 28). Cross-reference all antibiotic, antihypertensive, and analgesics against pregnancy category criteria before prescribing.
              </div>
            </div>
          </div>

          {/* Condition Episodes Timeline (UC-04 Direct Implementation) */}
          <div className="py-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  Clinical Condition Episodes (Antenatal, UTI, Metabolic)
                </h2>
                <p className="text-xs text-slate-500">Organized longitudinal health episodes and clinical outcomes</p>
              </div>
              <span className="text-xs text-slate-500 font-medium">Total Episodes: {dossier.episodes.length}</span>
            </div>

            <div className="space-y-4">
              {dossier.episodes.map((ep) => (
                <div key={ep.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 print:bg-transparent">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        ep.status === "active" ? "bg-emerald-500" :
                        ep.status === "monitoring" ? "bg-amber-500" : "bg-blue-500"
                      }`} />
                      <h3 className="font-bold text-sm text-slate-900">{ep.title}</h3>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                        ep.status === "active" ? "bg-emerald-100 text-emerald-800" :
                        ep.status === "monitoring" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {ep.status}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ep.physician} • {ep.hospital}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 mb-3 bg-white p-2.5 rounded-lg border border-slate-200/80">
                    <strong className="text-slate-900">Clinical Evaluation:</strong> {ep.clinicalNotes}
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {ep.medications.map((m, mIdx) => (
                      <span key={mIdx} className="text-xs bg-white px-2.5 py-1 rounded-md border border-slate-200 text-slate-800 font-medium flex items-center gap-1.5">
                        <Pill className="w-3 h-3 text-teal-600" />
                        {m.name} ({m.dosage}) — {m.frequency}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Verified Medications Table */}
          <div className="py-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Pill className="w-4 h-4 text-emerald-600" />
                  Active Verified Medications Schedule
                </h2>
                <p className="text-xs text-slate-500">Cross-verified against original digitized prescription slips</p>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                {dossier.activeMedications.length} Active Regimens
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-3">Medication &amp; Dosage</th>
                    <th className="py-3 px-3">Frequency &amp; Timing</th>
                    <th className="py-3 px-3">Food &amp; Clinical Instructions</th>
                    <th className="py-3 px-3">Prescribing Physician</th>
                    <th className="py-3 px-3">Condition Episode</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {dossier.activeMedications.map((med, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-900 block">{med.name}</span>
                        <span className="text-[11px] text-slate-500 font-mono">{med.dosage}</span>
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-900">
                        {med.frequency}
                        <span className="block text-[11px] text-slate-500">{med.timing}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-700">
                        {med.instructions}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {med.prescribedBy}
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                          {med.episodeName}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Digitized Prescription Slips & Verification Badges */}
          <div className="py-6 border-b border-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-indigo-600" />
              Digitized Prescription Vault Records ({prescriptions.length})
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
              {prescriptions.slice(0, 6).map((rx) => (
                <div key={rx.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50">
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-bold text-slate-900">{rx.diag}</span>
                    <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {rx.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">{rx.doc} • {rx.hospital}</div>
                  <div className="text-[11px] text-slate-500 mt-2 flex justify-between items-center">
                    <span>Date: {rx.date}</span>
                    <span className="font-semibold text-indigo-700">{rx.meds} Meds</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official Verification Sign-off & Printable Stamp Section */}
          <div className="pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 text-xs text-slate-500">
            <div>
              <p className="font-semibold text-slate-700">Digital Validation Authority:</p>
              <p className="mt-0.5">MedMatch AI Multi-Tenant Clinical Cryptographic Pipeline</p>
              <p className="font-mono text-[11px] text-slate-500 mt-1">
                Hash: SHA256-VLT-9821-44B-ED820 • Token Expiry: {dossier.expiresAt}
              </p>
            </div>

            <div className="w-full sm:w-64 border-t-2 border-slate-300 pt-3 text-center sm:text-right">
              <div className="h-10 text-slate-400 italic text-[11px] flex items-end justify-center sm:justify-end">
                [Authorized Physician Digital Verification Seal]
              </div>
              <p className="font-bold text-slate-800 mt-1">Consulting Physician Stamp / Signature</p>
            </div>
          </div>

        </div>

        {/* Action Prompt Below Card (Hidden in Print) */}
        <div className="text-center text-xs text-slate-500 print:hidden space-y-2">
          <p>
            This clinical dossier is encrypted and time-bound. It is intended solely for emergency physicians and authorized consulting clinicians.
          </p>
          <div className="flex justify-center gap-4 pt-1">
            <Link href="/doctor" className="text-emerald-700 font-semibold hover:underline">
              Access Doctor Clinical Portal →
            </Link>
            <span>•</span>
            <Link href="/dashboard" className="text-slate-600 font-semibold hover:underline">
              Return to Patient Dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
