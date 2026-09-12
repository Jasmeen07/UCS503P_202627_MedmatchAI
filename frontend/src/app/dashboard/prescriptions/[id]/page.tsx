"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft, 
  FileText, 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Receipt,
  ShieldAlert,
  Sparkles
} from "lucide-react";

interface MedicineDetail {
  medicine_name?: string;
  name?: string;
  dosage?: string;
  dose?: string;
  frequency?: string;
  freq?: string;
  duration?: string;
  dur?: string;
  instructions?: string;
  instr?: string;
  intended_use?: string;
  confidence?: "high" | "medium" | "low" | string;
  conf?: "high" | "medium" | "low" | string;
  needs_review?: boolean;
  candidate_suggestions?: string[];
  verified_source?: "prescription_slip" | "pharmacy_bill" | "medicine_strip" | "manual" | string;
}

interface PrescriptionRecord {
  id: string | number;
  doc: string;
  hospital: string;
  diag: string;
  date: string;
  status: string;
  source?: string;
  notes?: string;
  overview?: string;
  review_warning?: string;
  clinical_context?: string;
  imageDataUrl?: string | null;
  verificationImageDataUrl?: string | null;
  medicines?: MedicineDetail[];
  meds?: MedicineDetail[] | number;
}

const defaultMockPrescriptions: Record<string, PrescriptionRecord> = {
  "1": {
    id: "1",
    doc: "Dr. Sharma",
    hospital: "City Hospital",
    diag: "Upper Respiratory Infection",
    date: "2026-09-01",
    status: "active",
    clinical_context: "Chest Congestion & Cough",
    notes: "Rest and warm fluids. Return if fever persists beyond 3 days.",
    overview: "Treatment regimen for acute upper respiratory infection focusing on symptom relief and infection control.",
    medicines: [
      { medicine_name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily", duration: "5 days", instructions: "After food", intended_use: "Bacterial infection control", confidence: "high", needs_review: false },
      { medicine_name: "Paracetamol", dosage: "650mg", frequency: "As needed (max 3/day)", duration: "3 days", instructions: "Take for fever or body ache", intended_use: "Fever and headache relief", confidence: "high", needs_review: false },
      { medicine_name: "Cetirizine", dosage: "10mg", frequency: "Once daily at night", duration: "5 days", instructions: "May cause slight drowsiness", intended_use: "Runny nose and allergic rhinitis", confidence: "high", needs_review: false }
    ]
  },
  "2": {
    id: "2",
    doc: "Dr. Patel",
    hospital: "Lifeline Clinic",
    diag: "Type 2 Diabetes",
    date: "2026-08-15",
    status: "active",
    clinical_context: "Diabetes / High Sugar",
    notes: "Follow up in 3 months with fasting blood sugar and HbA1c results.",
    overview: "Glycemic management regimen combining biguanides, sulfonylureas, and cardiovascular lipid protection.",
    medicines: [
      { medicine_name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "90 days", instructions: "Take with meals", intended_use: "Insulin sensitization and blood glucose reduction", confidence: "high", needs_review: false },
      { medicine_name: "Glimepiride", dosage: "2mg", frequency: "Once daily", duration: "90 days", instructions: "Take before breakfast", intended_use: "Stimulates pancreatic insulin secretion", confidence: "high", needs_review: false },
      { medicine_name: "Atorvastatin", dosage: "10mg", frequency: "Once daily", duration: "90 days", instructions: "Take at bedtime", intended_use: "Lowers LDL cholesterol and prevents cardiovascular events", confidence: "medium", needs_review: false },
      { medicine_name: "Pregabalin", dosage: "50mg", frequency: "Once daily", duration: "30 days", instructions: "For neuropathic tingling", intended_use: "Diabetic peripheral neuropathy relief", confidence: "low", needs_review: true, candidate_suggestions: ["Pregabalin 50", "Gabapentin 100"] }
    ]
  }
};

export default function PrescriptionDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [rx, setRx] = useState<PrescriptionRecord | null>(null);
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    // Check localStorage first
    try {
      const stored = localStorage.getItem("medmatch_prescriptions");
      if (stored) {
        const list: PrescriptionRecord[] = JSON.parse(stored);
        const match = list.find((p) => p.id?.toString() === id.toString());
        if (match) {
          setRx(match);
          return;
        }
      }
    } catch (e) {
      console.warn("Error reading stored prescriptions:", e);
    }

    // Check fallback mocks
    if (defaultMockPrescriptions[id]) {
      setRx(defaultMockPrescriptions[id]);
    } else {
      setRx({
        id,
        doc: "Dr. Medical Specialist",
        hospital: "General Healthcare Center",
        diag: "Clinical Prescription Record",
        date: new Date().toISOString().split("T")[0],
        status: "active",
        notes: "Prescription record details retrieved from local archive.",
        overview: "Prescription medications recorded for patient treatment plan.",
        medicines: []
      });
    }
  }, [id]);

  if (!rx) {
    return (
      <div className="p-12 text-center text-sm text-slate-500">
        Loading prescription details...
      </div>
    );
  }

  // Normalize medicines list
  const medicineList: MedicineDetail[] = Array.isArray(rx.medicines)
    ? rx.medicines
    : Array.isArray(rx.meds)
    ? (rx.meds as MedicineDetail[])
    : [];

  const reviewCount = medicineList.filter(
    (m) => m.needs_review || m.confidence === "low" || m.conf === "low"
  ).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      {/* Header Bar */}
      <div className="flex items-center gap-4 mb-2">
        <Link 
          href="/dashboard/prescriptions" 
          className="p-2 -ml-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {rx.diag}
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border border-teal-200 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300">
              {rx.status ? rx.status.charAt(0).toUpperCase() + rx.status.slice(1) : "Active"}
            </span>
            {rx.source === "ocr_cross_verified" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Receipt className="w-3 h-3" />
                Cross-Verified with Pharmacy Bill
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 font-medium text-sm mt-1">
            {rx.doc} • {rx.hospital} • {rx.date}
          </p>
        </div>
        
        <div className="hidden sm:flex items-center gap-2">
          <Link 
            href="/dashboard/insights" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium rounded transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
            Check Interactions
          </Link>
        </div>
      </div>

      {/* Clinical Summary & Purpose Card */}
      {rx.overview && (
        <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-slate-50 dark:bg-slate-900/60 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Clinical Overview & Treatment Purpose
                </h3>
                {rx.clinical_context && (
                  <p className="text-[11px] text-teal-700 dark:text-teal-400">
                    Clinical Context: {rx.clinical_context}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium">
                {medicineList.length} Medicines Recorded
              </span>
              {reviewCount > 0 ? (
                <span className="text-xs px-2.5 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300 font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  {reviewCount} Need Review
                </span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              )}
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/80 p-3 rounded border border-slate-200 dark:border-slate-800">
            {rx.overview}
          </p>
          {reviewCount > 0 && (
            <div className="p-3 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div>
                <p className="font-semibold">Review Alert for Cursive Handwriting</p>
                <p className="text-amber-800 dark:text-amber-300 leading-relaxed mt-0.5">
                  {rx.review_warning || "Certain medication entries contain ambiguous strokes. Please verify dosages and brand names against your medicine strips or with your pharmacist."}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Original Documents & Details */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Primary Prescription Document */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Doctor's Prescription Slip
            </h3>
            {rx.imageDataUrl ? (
              <div className="space-y-2">
                <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-72 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-1">
                  <img 
                    src={rx.imageDataUrl} 
                    alt="Prescription Document" 
                    className="max-h-68 object-contain rounded cursor-pointer"
                    onClick={() => setModalImage(rx.imageDataUrl || null)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setModalImage(rx.imageDataUrl || null)}
                  className="w-full py-1.5 text-xs text-center border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  View Full Prescription
                </button>
              </div>
            ) : (
              <div className="p-8 border border-dashed border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-800/40 text-center flex flex-col items-center">
                <FileText className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">Digital Record</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Saved without image attachment</p>
              </div>
            )}
          </div>

          {/* Secondary Verification Document (Pharmacy Bill or Strip) */}
          {rx.verificationImageDataUrl && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg bg-white dark:bg-slate-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  Pharmacy Bill / Strip
                </h3>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-medium">
                  Verified
                </span>
              </div>
              <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-72 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-1">
                <img 
                  src={rx.verificationImageDataUrl} 
                  alt="Pharmacy Receipt" 
                  className="max-h-68 object-contain rounded cursor-pointer"
                  onClick={() => setModalImage(rx.verificationImageDataUrl || null)}
                />
              </div>
              <button
                type="button"
                onClick={() => setModalImage(rx.verificationImageDataUrl || null)}
                className="w-full py-1.5 text-xs text-center border border-slate-200 dark:border-slate-700 rounded text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                View Full Pharmacy Bill
              </button>
            </div>
          )}
          
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-white dark:bg-slate-900 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              Prescription Info
            </h3>
            <div className="space-y-3 text-xs">
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Doctor</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{rx.doc}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Hospital / Clinic</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{rx.hospital}</p>
              </div>
              <div>
                <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Prescribed Date</p>
                <p className="font-medium text-slate-900 dark:text-slate-100">{rx.date}</p>
              </div>
              {rx.notes && (
                <div>
                  <p className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] mb-0.5">Doctor Notes</p>
                  <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800 p-2.5 rounded border border-slate-200 dark:border-slate-700">
                    {rx.notes}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Col: Medicines Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-white dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                  Prescribed Medications ({medicineList.length})
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Dosage schedules, intended therapeutic uses, and verification status
                </p>
              </div>
            </div>

            {medicineList.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">
                No medication details recorded for this prescription.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                      <th className="pb-3 pr-3">Medicine & Dose</th>
                      <th className="pb-3 px-3">Schedule</th>
                      <th className="pb-3 px-3">Duration</th>
                      <th className="pb-3 px-3">What It Is Used For</th>
                      <th className="pb-3 pl-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {medicineList.map((med, i) => {
                      const name = med.medicine_name || med.name || `Medicine #${i + 1}`;
                      const dosage = med.dosage || med.dose || "";
                      const freq = med.frequency || med.freq || "-";
                      const dur = med.duration || med.dur || "-";
                      const instr = med.instructions || med.instr || "";
                      const use = med.intended_use || "Therapeutic indication";
                      const needsRev = med.needs_review || med.confidence === "low" || med.conf === "low";
                      const isBillVerified = med.verified_source === "pharmacy_bill" || rx.source === "ocr_cross_verified";

                      return (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 pr-3">
                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                              {name} {dosage && <span className="font-normal text-slate-500">({dosage})</span>}
                            </p>
                            {instr && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{instr}</p>
                            )}
                            {med.candidate_suggestions && med.candidate_suggestions.length > 0 && (
                              <p className="text-[10px] text-teal-600 dark:text-teal-400 mt-0.5 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                Candidates: {med.candidate_suggestions.join(", ")}
                              </p>
                            )}
                          </td>
                          <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-300">
                            {freq}
                          </td>
                          <td className="py-3 px-3 text-slate-600 dark:text-slate-400">
                            {dur}
                          </td>
                          <td className="py-3 px-3 text-slate-700 dark:text-slate-300 max-w-xs">
                            {use}
                          </td>
                          <td className="py-3 pl-3 text-right">
                            {needsRev ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                                <AlertTriangle className="w-3 h-3" /> Needs Review
                              </span>
                            ) : isBillVerified ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Bill Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                                <CheckCircle2 className="w-3 h-3" /> Verified
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Full Image Modal */}
      {modalImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 p-2 rounded shadow-2xl">
            <img 
              src={modalImage} 
              alt="Document View" 
              className="max-h-[85vh] object-contain rounded"
            />
            <button
              type="button"
              onClick={() => setModalImage(null)}
              className="absolute top-4 right-4 bg-slate-900 text-white text-xs px-3 py-1.5 rounded font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
