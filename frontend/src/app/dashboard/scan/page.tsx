"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Upload,
  FileText,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Scan,
  Loader2,
  ArrowRight,
  RefreshCw,
  X,
  Activity,
  ShieldAlert,
  Receipt,
  PackageCheck,
  Sparkles,
  Stethoscope,
  CheckCheck,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { createClient } from "@/lib/client";

interface MedicineItem {
  medicine_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  intended_use?: string;
  confidence: "high" | "medium" | "low";
  needs_review: boolean;
  candidate_suggestions?: string[];
  verified_source?: "prescription_slip" | "pharmacy_bill" | "medicine_strip" | "manual";
}

interface ClinicalSummary {
  overview?: string;
  total_medicines?: number;
  review_warning?: string;
}

interface ExtractedData {
  patient_name?: string;
  patient_age_gender?: string;
  date?: string;
  doctor_name?: string;
  clinic_name?: string;
  diagnosis?: string | string[];
  clinical_context?: string;
  vitals?: string;
  investigations?: string[];
  clinical_summary?: ClinicalSummary;
  medicines?: MedicineItem[];
  other_notes?: string;
}

const COMMON_CONDITIONS = [
  "Chest Congestion & Cough",
  "Fever & Bacterial Infection",
  "Hypertension / High BP",
  "Diabetes / High Sugar",
  "Acidity & Gastric Reflux",
  "Skin Allergy / Rash",
  "Joint Pain & Arthritis",
];

export default function ScanPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Secondary verification file (Pharmacy receipt or medicine strip packaging)
  const [verificationFile, setVerificationFile] = useState<File | null>(null);
  const [verificationPreviewUrl, setVerificationPreviewUrl] = useState<string | null>(null);

  // Clinical Context state
  const [clinicalContext, setClinicalContext] = useState("");

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);

  // Form edit states
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [medicines, setMedicines] = useState<MedicineItem[]>([]);
  const [clinicalSummary, setClinicalSummary] = useState<ClinicalSummary | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const router = useRouter();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (verificationPreviewUrl) URL.revokeObjectURL(verificationPreviewUrl);
    };
  }, [previewUrl, verificationPreviewUrl]);

  const handleFileSelect = (selectedFile: File) => {
    setApiError(null);
    setExtractedData(null);
    setClinicalSummary(null);

    const validTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/heic",
      "application/pdf",
    ];
    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.match(/\.(jpg|jpeg|png|webp|pdf)$/i)
    ) {
      setApiError(
        "Please select a valid image file (JPEG, PNG, WebP) or PDF document."
      );
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setApiError("File size exceeds 10MB limit. Please upload a smaller file.");
      return;
    }

    setFile(selectedFile);

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleVerificationFileSelect = (selectedFile: File) => {
    setApiError(null);

    const validTypes = ["image/jpeg", "image/png", "image/webp", "image/heic"];
    if (
      !validTypes.includes(selectedFile.type) &&
      !selectedFile.name.match(/\.(jpg|jpeg|png|webp)$/i)
    ) {
      setApiError(
        "Please select an image file (JPEG, PNG, WebP) for the pharmacy bill or medicine strip."
      );
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setApiError("Verification file size exceeds 10MB limit.");
      return;
    }

    setVerificationFile(selectedFile);
    const url = URL.createObjectURL(selectedFile);
    setVerificationPreviewUrl(url);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const onVerificationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleVerificationFileSelect(e.target.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const clearSelectedFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setClinicalSummary(null);
    setApiError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const clearVerificationFile = () => {
    if (verificationPreviewUrl) URL.revokeObjectURL(verificationPreviewUrl);
    setVerificationFile(null);
    setVerificationPreviewUrl(null);
    if (verificationInputRef.current) {
      verificationInputRef.current.value = "";
    }
  };

  const extractWithAi = async () => {
    if (!file) return;

    setIsProcessing(true);
    setApiError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      if (clinicalContext.trim()) {
        formData.append("clinical_context", clinicalContext.trim());
      }
      if (verificationFile) {
        formData.append("verification_file", verificationFile);
      }

      const response = await fetch("/api/ocr/scan", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg =
          result.message ||
          result.error ||
          "OCR extraction failed. Please verify your connection or Gemini API key.";
        setApiError(errorMsg);
        return;
      }

      const data: ExtractedData = result.data || {};
      setExtractedData(data);
      setClinicalSummary(data.clinical_summary || null);

      setDoctorName(data.doctor_name || "");
      setHospitalName(data.clinic_name || "");
      setPrescriptionDate(
        data.date || new Date().toISOString().split("T")[0]
      );
      setDiagnosis(
        Array.isArray(data.diagnosis)
          ? data.diagnosis.join(", ")
          : data.diagnosis || clinicalContext || ""
      );
      setMedicines(data.medicines || []);
    } catch {
      setApiError(
        "Network error: Could not reach the OCR processing service. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleSavePrescription = async () => {
    setIsSaving(true);
    setApiError(null);
    try {
      const rxId = "rx-" + Date.now();

      // Convert images to base64 for local persistence preview
      let imageBase64: string | null = null;
      if (file && file.type.startsWith("image/") && file.size < 4 * 1024 * 1024) {
        try {
          imageBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(file);
          });
        } catch {
          // ignore error
        }
      }

      let verificationBase64: string | null = null;
      if (
        verificationFile &&
        verificationFile.type.startsWith("image/") &&
        verificationFile.size < 4 * 1024 * 1024
      ) {
        try {
          verificationBase64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = () => resolve(null);
            reader.readAsDataURL(verificationFile);
          });
        } catch {
          // ignore error
        }
      }

      const newPrescription = {
        id: rxId,
        doc: doctorName || "Unknown Doctor",
        hospital: hospitalName || "General Clinic",
        diag: diagnosis || clinicalContext || "Prescription Record",
        date: prescriptionDate || new Date().toISOString().split("T")[0],
        meds: medicines.length,
        status: "active",
        source: verificationFile ? "ocr_cross_verified" : "ocr_scan",
        conf: medicines.some((m) => m.needs_review) ? "medium" : "high",
        overview: clinicalSummary?.overview || "",
        review_warning: clinicalSummary?.review_warning || "",
        clinical_context: clinicalContext || "",
        medicines: medicines,
        imageDataUrl: imageBase64,
        verificationImageDataUrl: verificationBase64,
        created_at: new Date().toISOString(),
      };

      // 1. Local Storage persistence
      try {
        const stored = localStorage.getItem("medmatch_prescriptions");
        const list = stored ? JSON.parse(stored) : [];
        list.unshift(newPrescription);
        localStorage.setItem(
          "medmatch_prescriptions",
          JSON.stringify(list.slice(0, 25))
        );
      } catch (storageErr) {
        console.warn("Could not save to localStorage:", storageErr);
      }

      // 2. Supabase persistence if user is logged in
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          const { data: rxData, error: rxErr } = await supabase
            .from("prescriptions")
            .insert({
              user_id: user.id,
              doctor_name: doctorName || "Unknown Doctor",
              hospital_name: hospitalName || "General Clinic",
              diagnosis: diagnosis || clinicalContext || "Prescription Record",
              prescribed_date:
                prescriptionDate || new Date().toISOString().split("T")[0],
              status: "active",
              source: verificationFile ? "ocr_cross_verified" : "ocr_scan",
              ocr_confidence: medicines.some((m) => m.needs_review) ? 0.75 : 0.95,
            })
            .select()
            .single();

          if (rxData && !rxErr) {
            const medsPayload = medicines.map((m) => ({
              prescription_id: rxData.id,
              medicine_name: m.medicine_name,
              dosage: m.dosage,
              frequency: m.frequency,
              duration: m.duration,
              instructions: m.instructions,
              intended_use: m.intended_use,
              confidence: m.confidence,
              needs_review: m.needs_review,
            }));
            await supabase.from("prescription_medicines").insert(medsPayload);
          }
        }
      } catch (supaErr) {
        console.warn("Supabase persistence deferred:", supaErr);
      }

      setSaveSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/prescriptions/${rxId}`);
      }, 400);
    } catch {
      setApiError("Failed to save prescription. Please review your entries and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateMedicine = (
    index: number,
    field: keyof MedicineItem,
    value: any
  ) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const applyCandidateSuggestion = (index: number, candidate: string) => {
    setMedicines((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        medicine_name: candidate,
        needs_review: false,
        confidence: "high",
        verified_source: "manual",
      };
      return updated;
    });
  };

  const addMedicineRow = () => {
    setMedicines((prev) => [
      ...prev,
      {
        medicine_name: "",
        dosage: "",
        frequency: "",
        duration: "",
        instructions: "",
        intended_use: "",
        confidence: "high",
        needs_review: false,
      },
    ]);
  };

  const removeMedicineRow = (index: number) => {
    setMedicines((prev) => prev.filter((_, i) => i !== index));
  };

  const reviewCount = medicines.filter((m) => m.needs_review).length;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Prescription Scanner & Cross-Verifier"
        subtitle="Upload handwritten doctor prescriptions and optionally cross-verify with pharmacy receipts or medicine strip packaging."
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        className="hidden"
      />
      <input
        type="file"
        ref={verificationInputRef}
        onChange={onVerificationInputChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Pre-Scan Setup (Clinical Context & Dual Upload Slots) */}
      {!extractedData && (
        <div className="space-y-5">
          {/* Clinical Context Helper Card */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-white dark:bg-slate-900 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Clinical Context & Suspected Diagnosis (Recommended)
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Entering your diagnosis or symptoms helps the AI eliminate 90% of irrelevant drug classes and suggest exact condition-matched candidates.
                  </p>
                </div>
              </div>
              {clinicalContext && (
                <button
                  type="button"
                  onClick={() => setClinicalContext("")}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Quick condition chips */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
                Quick Select:
              </span>
              {COMMON_CONDITIONS.map((cond) => {
                const isSelected = clinicalContext === cond;
                return (
                  <button
                    key={cond}
                    type="button"
                    onClick={() => setClinicalContext(isSelected ? "" : cond)}
                    className={`px-2.5 py-1 text-xs rounded border transition-colors ${
                      isSelected
                        ? "border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900 font-medium"
                        : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {cond}
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <input
                type="text"
                value={clinicalContext}
                onChange={(e) => setClinicalContext(e.target.value)}
                placeholder="Or type custom symptoms (e.g. chest congestion and cough, hypertension, acidity)"
                className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </div>
          </div>

          {/* Dual Document Upload Slots (Primary Prescription + Secondary Verification) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* 1. Primary Doctor's Prescription Slip */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col justify-between transition-colors ${
                isDragging
                  ? "border-slate-800 bg-slate-100 dark:border-slate-300 dark:bg-slate-900"
                  : file
                  ? "border-teal-500/50 bg-teal-50/20 dark:bg-teal-950/20 dark:border-teal-700/50"
                  : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50"
              }`}
            >
              <div>
                <div className="mx-auto w-10 h-10 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-3 bg-white dark:bg-slate-800">
                  <Upload className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  1. Doctor's Prescription Slip
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Handwritten or printed prescription from doctor. (JPEG, PNG, WebP, PDF)
                </p>

                {previewUrl ? (
                  <div className="relative scan-hud-container border border-slate-200 dark:border-slate-800 rounded p-2.5 bg-white dark:bg-slate-900 mb-4 overflow-hidden text-left">
                    {isProcessing && (
                      <>
                        <div className="scan-hud-grid"></div>
                        <div className="scan-laser-beam"></div>
                      </>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                        <img
                          src={previewUrl}
                          alt="Prescription Preview"
                          className="w-full h-full object-cover"
                        />
                        {isProcessing && <div className="scan-laser-beam"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                          {file?.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {file ? formatFileSize(file.size) : ""}
                        </p>
                        {isProcessing && (
                          <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium flex items-center gap-1.5 mt-1">
                            <Sparkles className="w-3 h-3 animate-spin" />
                            Laser HUD: Scanning handwritten lines...
                          </p>
                        )}
                      </div>
                      {!isProcessing && (
                        <button
                          type="button"
                          onClick={clearSelectedFile}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  {file ? "Change Prescription File" : "Select Prescription Slip"}
                </button>
              </div>
            </div>

            {/* 2. Secondary Verification: Pharmacy Bill or Medicine Strip */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center flex flex-col justify-between transition-colors ${
                verificationFile
                  ? "border-emerald-500/50 bg-emerald-50/20 dark:bg-emerald-950/20 dark:border-emerald-700/50"
                  : "border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50"
              }`}
            >
              <div>
                <div className="mx-auto w-10 h-10 rounded border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 mb-3 bg-white dark:bg-slate-800">
                  <Receipt className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                  2. Pharmacy Bill or Medicine Strip (Optional)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Take a photo of the printed pharmacy bill or medicine packaging strip to auto-verify brand names.
                </p>

                {verificationPreviewUrl ? (
                  <div className="relative scan-hud-container border border-slate-200 dark:border-slate-800 rounded p-2.5 bg-white dark:bg-slate-900 mb-4 overflow-hidden text-left">
                    {isProcessing && (
                      <>
                        <div className="scan-hud-grid"></div>
                        <div className="scan-laser-beam"></div>
                      </>
                    )}
                    <div className="flex items-center gap-3">
                      <div className="relative w-16 h-16 rounded border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0">
                        <img
                          src={verificationPreviewUrl}
                          alt="Verification Document Preview"
                          className="w-full h-full object-cover"
                        />
                        {isProcessing && <div className="scan-laser-beam"></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                          {verificationFile?.name}
                        </p>
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          {isProcessing ? "Correlating printed text..." : "Ready for cross-verification"}
                        </p>
                      </div>
                      {!isProcessing && (
                        <button
                          type="button"
                          onClick={clearVerificationFile}
                          className="text-slate-400 hover:text-slate-700 p-1"
                          title="Remove verification file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => verificationInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full py-2 px-3 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-medium rounded transition-colors disabled:opacity-50"
                >
                  {verificationFile ? "Change Pharmacy Bill / Strip" : "Add Pharmacy Bill or Strip"}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Laser Scanning HUD Feedback Banner */}
          {isProcessing && (
            <div className="p-3.5 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/70 dark:bg-teal-950/40 text-xs text-teal-900 dark:text-teal-200 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-spin shrink-0" />
                <span className="font-medium">
                  {verificationFile
                    ? "Laser HUD Active: Cross-verifying cursive handwriting with printed pharmacy receipt..."
                    : "Laser HUD Active: Deciphering lines with clinical context class elimination..."}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200">
                Gemini 3.6 Flash
              </span>
            </div>
          )}

          {apiError && (
            <div className="p-4 rounded border border-rose-300 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Extraction Notice</p>
                <p className="text-xs leading-relaxed">{apiError}</p>
              </div>
            </div>
          )}

          {/* Extract Action Button */}
          <div className="pt-2 flex items-center justify-end gap-3">
            {file && (
              <button
                type="button"
                onClick={clearSelectedFile}
                disabled={isProcessing}
                className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Reset
              </button>
            )}
            <button
              type="button"
              onClick={extractWithAi}
              disabled={!file || isProcessing}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-sm font-medium rounded transition-colors disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {verificationFile
                    ? "Cross-Verifying Prescription & Receipt..."
                    : "Analyzing Prescription..."}
                </>
              ) : (
                <>
                  <Scan className="w-4 h-4" />
                  {verificationFile
                    ? "Extract & Cross-Verify with Pharmacy Bill"
                    : "Extract Prescription Data"}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Results & Verification Form */}
      {extractedData && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Prescription Details & Verification
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review extracted medicines, clinical indications, and verify any ambiguous items.
              </p>
            </div>
            <button
              type="button"
              onClick={clearSelectedFile}
              className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Scan Another Slip
            </button>
          </div>

          {/* Clinical Summary & Medication Purpose Card */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-5 bg-slate-50 dark:bg-slate-900/60 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-teal-50 dark:bg-teal-950 border border-teal-200 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Clinical Summary & Medication Purpose
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    All {medicines.length} prescribed medications identified with their therapeutic use.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {clinicalContext && (
                  <span className="text-xs px-2.5 py-1 rounded border border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-300 font-medium">
                    Context: {clinicalContext}
                  </span>
                )}
                <span className="text-xs px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {medicines.length} Medicine{medicines.length !== 1 ? "s" : ""} Found
                </span>
                {reviewCount > 0 ? (
                  <span className="text-xs px-2.5 py-1 rounded border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-300 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {reviewCount} Need Review
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-1 rounded border border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All Verified
                  </span>
                )}
              </div>
            </div>

            {/* Overview Sentence */}
            {clinicalSummary?.overview && (
              <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-800/80 p-3 rounded border border-slate-200 dark:border-slate-800">
                {clinicalSummary.overview}
              </p>
            )}

            {/* Review Alert Callout */}
            {reviewCount > 0 && (
              <div className="p-3.5 rounded border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">Review Alert for Cursive Handwriting</p>
                    <p className="text-amber-800 dark:text-amber-300 leading-relaxed mt-0.5">
                      {clinicalSummary?.review_warning ||
                        `${medicines
                          .filter((m) => m.needs_review)
                          .map((m) => m.medicine_name || "Prescribed item")
                          .join(", ")} contain ambiguous handwriting strokes.`}
                    </p>
                  </div>
                </div>

                {/* Practical Pharmacy Receipt Guidance */}
                <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded border border-amber-200 dark:border-amber-900 text-slate-800 dark:text-slate-200 flex items-start gap-2">
                  <Receipt className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    <span className="font-semibold">Tip from Clinical Practice:</span> When you visit a medical shop, the pharmacist dispenses the physical medicine boxes and gives a printed pharmacy bill. Check the printed bill or packaging, click the candidate suggestions below, or type the verified brand name into the fields before saving.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Attached Document Thumbnails */}
            <div className="space-y-4">
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 space-y-3">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Doctor's Prescription Slip
                </p>
                {previewUrl ? (
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-60 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-1">
                    <img
                      src={previewUrl}
                      alt="Prescription"
                      className="max-h-56 object-contain rounded"
                    />
                  </div>
                ) : (
                  <div className="p-6 border border-slate-200 dark:border-slate-800 rounded bg-slate-50 dark:bg-slate-800/50 flex flex-col items-center justify-center text-slate-500 text-xs">
                    <FileText className="w-8 h-8 mb-2" />
                    <p>{file?.name}</p>
                  </div>
                )}
                <div className="text-xs text-slate-500 space-y-0.5">
                  <p className="truncate">File: {file?.name}</p>
                  <p>Size: {file ? formatFileSize(file.size) : "N/A"}</p>
                </div>
              </div>

              {/* Secondary Verification Document Thumbnail if uploaded */}
              {verificationPreviewUrl && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      Pharmacy Bill / Strip
                    </p>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-medium">
                      Cross-Verified
                    </span>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded overflow-hidden max-h-60 bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-1">
                    <img
                      src={verificationPreviewUrl}
                      alt="Pharmacy Bill"
                      className="max-h-56 object-contain rounded"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Right Col: Editable Medical Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-white dark:bg-slate-900 space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b border-slate-200 dark:border-slate-800 pb-2">
                  Clinical Overview
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Doctor Name
                    </label>
                    <input
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Kumar"
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Hospital / Clinic
                    </label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="e.g. Apollo Hospital"
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Prescription Date
                    </label>
                    <input
                      type="date"
                      value={prescriptionDate}
                      onChange={(e) => setPrescriptionDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Diagnosis / Condition
                    </label>
                    <input
                      type="text"
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      placeholder="e.g. Hypertension, Chest congestion and cough"
                      className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* Medicines Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-6 bg-white dark:bg-slate-900 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Prescribed Medications ({medicines.length})
                    </h3>
                    <p className="text-xs text-slate-500">
                      Verify brand names, schedules, and clinical indications below
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addMedicineRow}
                    className="text-xs text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium underline"
                  >
                    + Add Medication
                  </button>
                </div>

                {medicines.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No medications identified. Click "+ Add Medication" to record items manually.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {medicines.map((med, idx) => (
                      <div
                        key={idx}
                        className={`p-3.5 border rounded bg-slate-50 dark:bg-slate-800/40 space-y-3 ${
                          med.needs_review
                            ? "border-amber-300 dark:border-amber-800/80"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={med.medicine_name}
                            onChange={(e) =>
                              updateMedicine(idx, "medicine_name", e.target.value)
                            }
                            placeholder="Medicine Name (e.g. Dolo 650, Muphyline)"
                            className="font-medium text-sm px-2.5 py-1.5 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 flex-1"
                          />
                          <span
                            className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                              med.needs_review
                                ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800"
                                : med.verified_source === "pharmacy_bill" ||
                                  med.verified_source === "medicine_strip"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800"
                                : "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
                            }`}
                          >
                            {med.needs_review
                              ? "Needs Review"
                              : med.verified_source === "pharmacy_bill"
                              ? "Bill Verified"
                              : med.confidence || "Verified"}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeMedicineRow(idx)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded"
                            title="Remove medication"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Condition-Matched Candidate Suggestions */}
                        {med.candidate_suggestions &&
                          med.candidate_suggestions.length > 0 && (
                            <div className="p-2.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5">
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                                <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                                <span>
                                  Condition-Matched Candidates (
                                  {clinicalContext || "Clinical Context"}):
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5">
                                {med.candidate_suggestions.map((candidate, cIdx) => (
                                  <button
                                    key={cIdx}
                                    type="button"
                                    onClick={() =>
                                      applyCandidateSuggestion(idx, candidate)
                                    }
                                    className="px-2.5 py-1 text-xs rounded border border-teal-300 bg-teal-50 hover:bg-teal-100 text-teal-800 dark:border-teal-800 dark:bg-teal-950/60 dark:hover:bg-teal-950 dark:text-teal-300 transition-colors font-medium flex items-center gap-1"
                                    title="Click to apply verified brand"
                                  >
                                    <CheckCheck className="w-3 h-3 text-teal-600" />
                                    {candidate}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase">Dosage</label>
                            <input
                              type="text"
                              value={med.dosage}
                              onChange={(e) => updateMedicine(idx, "dosage", e.target.value)}
                              placeholder="e.g. 500mg"
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase">Frequency</label>
                            <input
                              type="text"
                              value={med.frequency}
                              onChange={(e) => updateMedicine(idx, "frequency", e.target.value)}
                              placeholder="e.g. 1-0-1"
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase">Duration</label>
                            <input
                              type="text"
                              value={med.duration}
                              onChange={(e) => updateMedicine(idx, "duration", e.target.value)}
                              placeholder="e.g. 5 days"
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-500 uppercase">Instructions</label>
                            <input
                              type="text"
                              value={med.instructions}
                              onChange={(e) => updateMedicine(idx, "instructions", e.target.value)}
                              placeholder="e.g. After food"
                              className="w-full px-2 py-1 border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] text-slate-500 uppercase">
                            What this is used for / Therapeutic Purpose
                          </label>
                          <input
                            type="text"
                            value={med.intended_use || ""}
                            onChange={(e) => updateMedicine(idx, "intended_use", e.target.value)}
                            placeholder="e.g. Blood pressure management, Chest congestion relief"
                            className="w-full px-2.5 py-1 text-xs border border-slate-300 dark:border-slate-700 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={clearSelectedFile}
                  disabled={isSaving}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={handleSavePrescription}
                  disabled={isSaving || medicines.length === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving Prescription...
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Saved! Redirecting...
                    </>
                  ) : (
                    <>
                      Save to Prescriptions
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
