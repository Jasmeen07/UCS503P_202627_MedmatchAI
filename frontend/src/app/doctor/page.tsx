"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Stethoscope, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  User, 
  Search, 
  QrCode, 
  FileText, 
  ExternalLink, 
  ShieldCheck, 
  Building2, 
  Phone, 
  ChevronRight, 
  ArrowLeft, 
  Plus, 
  Sparkles, 
  Lock, 
  CalendarCheck,
  Check,
  X,
  KeyRound,
  ShieldAlert,
  Key,
  AlertTriangle,
  Pill,
  Activity,
  Layers,
  Send,
  UserPlus,
  RefreshCw,
  FolderOpen,
  Eye,
  Filter,
  Users,
  ScanLine,
  Image as ImageIcon,
  ChevronDown,
  LogOut,
  HeartPulse
} from "lucide-react";
import { 
  verifyActiveSession,
  clearUserSession,
  UserSession
} from "@/lib/auth";
import { 
  getPatientAppointments, 
  AppointmentItem, 
  getActivePatientEmail,
  getPatientDossier,
  PatientDossierData,
  getPatientAccessControl,
  verifyDoctorAccess,
  DoctorRequest,
  getDoctorRequests,
  syncDoctorRequestAction,
  DoctorPatientRecord,
  getDoctorAssociatedPatients,
  saveDoctorAssociatedPatients,
  addDoctorAssociatedPatient,
  createDoctorAccessRequest,
  updateDoctorPatientAccessStatus,
  getPatientPrescriptions,
  getPatientDocuments,
  searchRegisteredPatients,
  StoredPrescription,
  PatientDocument
} from "@/lib/patientData";

export default function DoctorPortalPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isVerifyingDoctor, setIsVerifyingDoctor] = useState(true);

  const [requests, setRequests] = useState<DoctorRequest[]>([]);
  const [patients, setPatients] = useState<DoctorPatientRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"patients" | "requests" | "schedule" | "calibration">("patients");

  // Patients Roster Search & Filter State
  const [patientSearch, setPatientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "granted" | "pending" | "needs_request">("all");

  // Clinical Records Viewer Drawer/Modal State
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatientRecord | null>(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState<StoredPrescription[]>([]);
  const [patientDocuments, setPatientDocuments] = useState<PatientDocument[]>([]);
  const [clinicalModalTab, setClinicalModalTab] = useState<"prescriptions" | "reports" | "episodes">("prescriptions");
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

  // Request Access Modal State
  const [requestAccessModalPatient, setRequestAccessModalPatient] = useState<DoctorPatientRecord | null>(null);
  const [requestScope, setRequestScope] = useState("Full Clinical History, Prescriptions & Lab Scans");
  const [requestReason, setRequestReason] = useState("Antenatal routine evaluation & medication reconciliation");

  // Add Patient Modal State
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");
  const [newPatientPhone, setNewPatientPhone] = useState("+91 98881-");
  const [newPatientUid, setNewPatientUid] = useState("PT-2026-LUD-");
  const [newPatientAgeGender, setNewPatientAgeGender] = useState("28 Y / Female");
  const [newPatientBloodGroup, setNewPatientBloodGroup] = useState("B+ (Rh Positive)");
  const [newPatientCondition, setNewPatientCondition] = useState("");
  const [newPatientAllergies, setNewPatientAllergies] = useState("None known");

  const loadDoctorData = () => {
    setRequests(getDoctorRequests());
    setPatients(getDoctorAssociatedPatients("dr-reeta"));
  };

  useEffect(() => {
    let isMounted = true;
    const verifyDocAuth = async () => {
      try {
        const session = await verifyActiveSession();
        if (!isMounted) return;
        if (!session) {
          router.replace(`/login?redirect=${encodeURIComponent("/doctor")}`);
          return;
        }
        setUserSession(session);
        if (session.name) {
          setEmergencyDoctorName(session.name);
        }
        setIsVerifyingDoctor(false);
      } catch (err) {
        console.warn("Doctor auth check error:", err);
        router.replace(`/login?redirect=${encodeURIComponent("/doctor")}`);
      }
    };
    verifyDocAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleDoctorLogout = async () => {
    await clearUserSession();
    router.replace("/login");
  };

  useEffect(() => {
    loadDoctorData();

    const handleUpdate = () => {
      loadDoctorData();
      if (selectedPatient) {
        setPatientPrescriptions(getPatientPrescriptions(selectedPatient.patientEmail));
        setPatientDocuments(getPatientDocuments(selectedPatient.patientEmail));
      }
    };

    window.addEventListener("medmatch_access_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("medmatch_access_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [selectedPatient?.patientEmail]);

  // Dual-mode Patient Access State
  const [accessMode, setAccessMode] = useState<"passcode" | "breakglass">("passcode");
  const [patientQuery, setPatientQuery] = useState("PT-2026-LUD-8821");
  const [passcodeInput, setPasscodeInput] = useState("882194");
  const [accessError, setAccessError] = useState<string | null>(null);

  // Break-glass emergency state
  const [emergencyDoctorName, setEmergencyDoctorName] = useState("Dr. Reeta Bhambri");
  const [emergencyDoctorLicense, setEmergencyDoctorLicense] = useState("MCI-34182");
  const [emergencyHospital, setEmergencyHospital] = useState("Ranjit Maternity Clinic & Emergency Center");
  const [emergencyReason, setEmergencyReason] = useState("Acute Resuscitation & High-Risk Drug Allergy Screening");
  const [emergencyAttestation, setEmergencyAttestation] = useState(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);

  // Reschedule Modal State
  const [rescheduleModalItem, setRescheduleModalItem] = useState<DoctorRequest | null>(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState("Sept 20, 2026");
  const [newRescheduleTime, setNewRescheduleTime] = useState("11:00 AM");

  // Notification Toast
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const handleVerifyPasscode = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAccessError(null);
    const result = verifyDoctorAccess(patientQuery, passcodeInput);
    if (!result.allowed) {
      setAccessError(result.reason || "Access verification failed.");
      return;
    }
    showToast(`Access granted for ${result.patientName}! Opening clinical dossier...`);
    if (result.dossierUrl) {
      router.push(result.dossierUrl);
    }
  };

  const handleBreakGlass = (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyError(null);
    if (!emergencyAttestation) {
      setEmergencyError("Mandatory certification: You must certify under clinical regulations that this is a life-threatening emergency.");
      return;
    }
    const result = verifyDoctorAccess(patientQuery, undefined, {
      doctorName: emergencyDoctorName,
      doctorLicense: emergencyDoctorLicense,
      hospital: emergencyHospital,
      emergencyReason
    });
    if (!result.allowed) {
      setEmergencyError(result.reason || "Emergency authentication failed.");
      return;
    }
    showToast(`🚨 Emergency Break-Glass logged for ${result.patientName}!`);
    if (result.dossierUrl) {
      router.push(result.dossierUrl);
    }
  };

  const handleAccept = (req: DoctorRequest) => {
    syncDoctorRequestAction(req.id, "confirm");
    setRequests(getDoctorRequests());
    showToast(`Slot confirmed for ${req.patientName}! Clinic Scheduler locked calendar slot at ${req.time}.`);
  };

  const handleOpenReschedule = (req: DoctorRequest) => {
    setRescheduleModalItem(req);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalItem) return;

    syncDoctorRequestAction(rescheduleModalItem.id, "reschedule", {
      date: newRescheduleDate,
      time: newRescheduleTime
    });
    setRequests(getDoctorRequests());

    showToast(`Slot rescheduled for ${rescheduleModalItem.patientName} to ${newRescheduleDate} at ${newRescheduleTime}.`);
    setRescheduleModalItem(null);
  };

  const handleMarkCompleted = (id: string | number) => {
    syncDoctorRequestAction(id, "complete");
    setRequests(getDoctorRequests());
    showToast("Consultation marked completed and clinical notes archived.");
  };

  // Filtered Patients computation
  const filteredPatients = patients.filter((p) => {
    const query = patientSearch.toLowerCase();
    const matchesSearch =
      p.patientName.toLowerCase().includes(query) ||
      p.patientEmail.toLowerCase().includes(query) ||
      p.patientUid.toLowerCase().includes(query) ||
      p.phone.includes(query) ||
      p.condition.toLowerCase().includes(query);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "granted" && (p.accessStatus === "granted" || p.accessStatus === "emergency_override")) ||
      (statusFilter === "pending" && p.accessStatus === "pending") ||
      (statusFilter === "needs_request" && (p.accessStatus === "none" || p.accessStatus === "revoked"));

    return matchesSearch && matchesStatus;
  });

  const handleOpenPatientFile = (patient: DoctorPatientRecord) => {
    setSelectedPatient(patient);
    setPatientPrescriptions(getPatientPrescriptions(patient.patientEmail));
    setPatientDocuments(getPatientDocuments(patient.patientEmail));
    setClinicalModalTab("prescriptions");
  };

  const handleOpenRequestAccessModal = (patient: DoctorPatientRecord) => {
    setRequestAccessModalPatient(patient);
    setRequestReason(`Clinical consultation, records review & medication reconciliation for ${patient.condition || "routine care"}`);
  };

  const handleSendAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestAccessModalPatient) return;

    createDoctorAccessRequest(
      requestAccessModalPatient.patientEmail,
      requestScope,
      requestReason,
      "dr-reeta",
      "Dr. Reeta Bhambri"
    );
    loadDoctorData();
    showToast(`Access request dispatched to ${requestAccessModalPatient.patientName} (${requestAccessModalPatient.patientEmail})! Patient will receive an instant notification in their vault.`);
    setRequestAccessModalPatient(null);
  };

  const handleAddPatientSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatientName.trim() || !newPatientEmail.trim()) {
      showToast("Please enter patient name and email.");
      return;
    }
    const newRec: DoctorPatientRecord = {
      id: `pat-${Date.now()}`,
      doctorId: "dr-reeta",
      patientEmail: newPatientEmail.trim().toLowerCase(),
      patientName: newPatientName.trim(),
      patientUid: newPatientUid.trim() || `PT-2026-LUD-${Math.floor(1000 + Math.random() * 9000)}`,
      phone: newPatientPhone.trim(),
      ageGender: newPatientAgeGender.trim(),
      bloodGroup: newPatientBloodGroup.trim(),
      condition: newPatientCondition.trim() || "General Consultation",
      allergies: newPatientAllergies.trim().split(",").map((s) => s.trim()).filter(Boolean),
      accessStatus: "none",
      lastVisit: "Scheduled Today",
      pendingRequestId: null,
    };
    addDoctorAssociatedPatient(newRec);
    loadDoctorData();
    showToast(`Added ${newRec.patientName} to your associated patient roster!`);
    setIsAddPatientModalOpen(false);
    // Reset form
    setNewPatientName("");
    setNewPatientEmail("");
    setNewPatientCondition("");
  };

  const handleQuickAddPreset = (
    name: string,
    email: string,
    uid: string,
    phone: string,
    ageGender: string,
    blood: string,
    cond: string,
    allergies: string[]
  ) => {
    const existing = patients.find((p) => p.patientEmail.toLowerCase() === email.toLowerCase());
    if (existing) {
      showToast(`${name} is already in your associated patients roster.`);
      return;
    }
    const newRec: DoctorPatientRecord = {
      id: `pat-${Date.now()}`,
      doctorId: "dr-reeta",
      patientEmail: email.toLowerCase(),
      patientName: name,
      patientUid: uid,
      phone: phone,
      ageGender: ageGender,
      bloodGroup: blood,
      condition: cond,
      allergies: allergies,
      accessStatus: "none",
      lastVisit: "Scheduled Today",
      pendingRequestId: null,
    };
    addDoctorAssociatedPatient(newRec);
    loadDoctorData();
    showToast(`Added ${name} to your associated patients roster!`);
    setIsAddPatientModalOpen(false);
  };

  const handleBreakGlassForPatient = (patient: DoctorPatientRecord) => {
    setPatientQuery(patient.patientUid);
    setAccessMode("breakglass");
    showToast(`Emergency Break-Glass form pre-filled for ${patient.patientName} (${patient.patientUid}). Complete certification below.`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (isVerifyingDoctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none">
        <div className="flex flex-col items-center gap-4 max-w-sm px-6 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 shadow-xl animate-pulse">
            <Stethoscope className="w-8 h-8 text-teal-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold tracking-tight text-white">
              MedMatch AI Clinic Workstation
            </h2>
            <p className="text-xs text-teal-200/70">
              Verifying physician credentials and session security...
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-teal-500 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-tight">
                  {userSession?.name || "Dr. Reeta Bhambri"}
                </h1>
                <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                  Doctor Clinical Portal
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 font-semibold">
                  MCI-34182
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Ranjit Maternity Clinic &amp; Nursing Home • <span className="text-teal-700 font-medium">{userSession?.email || "doctor@medmatch.com"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/scan"
              className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
              title="Launch Prescription OCR Scanner"
            >
              <ScanLine className="w-3.5 h-3.5 text-teal-600" />
              <span>OCR Scanner</span>
            </Link>
            <Link
              href="/dossier?token=EMG-8821-VLT"
              className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-2 rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Patient Dossier</span>
            </Link>
            <button
              onClick={handleDoctorLogout}
              className="text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3.5 py-2 rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
              title="Sign out of Doctor Portal"
            >
              <LogOut className="w-3.5 h-3.5 text-rose-500" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* Patient Warning Banner if a patient navigates to doctor portal */}
        {userSession?.role === "patient" && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <strong>Signed in as Patient:</strong> You are currently signed in as <strong>{userSession.name}</strong> ({userSession.email}). The Doctor Portal is reserved for verified physicians.
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard"
                className="px-3.5 py-2 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-sm hover:bg-teal-700 transition-colors"
              >
                Go to Patient Dashboard
              </Link>
              <button
                type="button"
                onClick={handleDoctorLogout}
                className="px-3.5 py-2 rounded-xl bg-white text-slate-700 font-semibold text-xs border border-slate-300 hover:bg-slate-100 transition-colors"
              >
                Sign in as Doctor
              </button>
            </div>
          </div>
        )}
        
        {/* Patient-Authorized Verification & Emergency Break-Glass Access Portal (UC-04) */}
        <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-emerald-950 text-white rounded-2xl p-6 sm:p-7 shadow-xl border border-teal-800/40 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 text-xs font-semibold border border-white/10">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>UC-04: Patient Consent-Gated Access &amp; Emergency Break-Glass</span>
              </div>

              {/* Mode Toggle Switcher */}
              <div className="flex bg-black/40 rounded-xl p-1 border border-white/10 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setAccessMode("passcode");
                    setAccessError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    accessMode === "passcode"
                      ? "bg-emerald-500 text-slate-950 font-bold shadow-sm"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Patient 6-Digit PIN (Routine Care)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccessMode("breakglass");
                    setEmergencyError(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    accessMode === "breakglass"
                      ? "bg-rose-500 text-white font-bold shadow-sm"
                      : "text-rose-300 hover:text-white"
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>🚨 Emergency Break-Glass (ER Override)</span>
                </button>
              </div>
            </div>

            {/* Mode 1: Patient-Authorized Consultation (Friendly Phone + PIN) */}
            {accessMode === "passcode" && (
              <div className="space-y-4">
                <div className="max-w-3xl">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Patient-Authorized Consultation Verification
                  </h2>
                  <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed mt-1">
                    Patients generate a dynamic 6-digit Doctor Passcode on their MedMatch mobile screen. Records remain cryptographically encrypted until the patient authorizes your consultation.
                  </p>
                </div>

                <form onSubmit={handleVerifyPasscode} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 max-w-3xl">
                    <div className="sm:col-span-6 relative">
                      <label className="block text-[11px] font-semibold text-teal-200 uppercase tracking-wider mb-1">
                        Patient Mobile Number or UID
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          value={patientQuery}
                          onChange={(e) => setPatientQuery(e.target.value)}
                          placeholder="e.g. +91 98765-43210 or PT-8821"
                          className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-teal-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-medium"
                        />
                        <User className="w-4 h-4 text-teal-300 absolute left-3 top-3" />
                      </div>
                    </div>

                    <div className="sm:col-span-3 relative">
                      <label className="block text-[11px] font-semibold text-teal-200 uppercase tracking-wider mb-1">
                        6-Digit Doctor PIN
                      </label>
                      <div className="relative">
                        <input 
                          type="text" 
                          maxLength={6}
                          value={passcodeInput}
                          onChange={(e) => setPasscodeInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="e.g. 882194"
                          className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-teal-200/50 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono tracking-widest text-center font-bold"
                        />
                        <Key className="w-3.5 h-3.5 text-teal-300 absolute left-2.5 top-3" />
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex items-end">
                      <button 
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <span>Verify &amp; Open</span>
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Clinic Patient Presets for Testing / Demonstrations */}
                  <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                    <span className="text-slate-400 text-[11px]">Waiting Patients:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientQuery("PT-2026-LUD-8821");
                        setPasscodeInput("882194");
                        setAccessError(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 border border-white/10 transition-colors"
                    >
                      Simranjit Kaur (PIN: <strong>882194</strong>)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientQuery("PT-2026-LUD-3312");
                        setPasscodeInput("331205");
                        setAccessError(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-200 border border-white/10 transition-colors"
                    >
                      Harpreet Singh (PIN: <strong>331205</strong>)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPatientQuery("PT-2026-LUD-4091");
                        setPasscodeInput("409172");
                        setAccessError(null);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-teal-200 border border-white/10 transition-colors"
                    >
                      Amandeep Sharma (PIN: <strong>409172</strong>)
                    </button>
                  </div>

                  {accessError && (
                    <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-center gap-2 max-w-3xl animate-in fade-in">
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      <span>{accessError}</span>
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* Mode 2: Emergency Break-Glass Protocol */}
            {accessMode === "breakglass" && (
              <div className="space-y-4 bg-rose-950/40 rounded-xl p-4 sm:p-5 border border-rose-500/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                      <span>Emergency Clinical Override (Break-Glass Protocol)</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-600 text-white">
                        Legally Audited
                      </span>
                    </h2>
                    <p className="text-xs text-rose-200/90 leading-relaxed mt-0.5">
                      Invoked only for acute trauma, anaphylaxis, or unconscious patients unable to provide consent. Requires verified physician credentials and mandatory clinical justification.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleBreakGlass} className="space-y-3.5 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-rose-200 uppercase tracking-wider mb-1">
                        Attending Doctor Name
                      </label>
                      <input 
                        type="text" 
                        value={emergencyDoctorName}
                        onChange={(e) => setEmergencyDoctorName(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-rose-200 uppercase tracking-wider mb-1">
                        Medical Council Reg / License #
                      </label>
                      <input 
                        type="text" 
                        value={emergencyDoctorLicense}
                        onChange={(e) => setEmergencyDoctorLicense(e.target.value)}
                        placeholder="e.g. MCI-34182"
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white font-mono uppercase text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-rose-200 uppercase tracking-wider mb-1">
                        Hospital / Department
                      </label>
                      <input 
                        type="text" 
                        value={emergencyHospital}
                        onChange={(e) => setEmergencyHospital(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-rose-200 uppercase tracking-wider mb-1">
                        Target Patient Identifier
                      </label>
                      <select
                        value={patientQuery}
                        onChange={(e) => setPatientQuery(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
                      >
                        <option value="PT-2026-LUD-8821">Simranjit Kaur (PT-2026-LUD-8821 / Antenatal Trimester II)</option>
                        <option value="PT-2026-LUD-3312">Harpreet Singh (PT-2026-LUD-3312 / Post-Op Cholecystectomy)</option>
                        <option value="PT-2026-LUD-4091">Amandeep Sharma (PT-2026-LUD-4091 / Antenatal Trimester I)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-rose-200 uppercase tracking-wider mb-1">
                        Mandatory Emergency Clinical Indication
                      </label>
                      <select
                        value={emergencyReason}
                        onChange={(e) => setEmergencyReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/20 text-white text-xs focus:ring-2 focus:ring-rose-400 focus:outline-none"
                      >
                        <option value="Acute Resuscitation & High-Risk Drug Allergy Screening">Acute Resuscitation &amp; High-Risk Drug Allergy Screening</option>
                        <option value="Unconscious ER Trauma Admission (GCS < 8)">Unconscious ER Trauma Admission (GCS &lt; 8)</option>
                        <option value="Severe Anaphylaxis / Emergency Intubation Contraindication">Severe Anaphylaxis / Emergency Intubation Contraindication</option>
                        <option value="Acute Hemorrhagic Shock / Obstetric Crisis">Acute Hemorrhagic Shock / Obstetric Crisis</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-3 bg-black/40 rounded-lg border border-rose-500/20">
                    <label className="flex items-start gap-2.5 text-xs text-rose-100 cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={emergencyAttestation}
                        onChange={(e) => setEmergencyAttestation(e.target.checked)}
                        className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4 border-rose-400"
                      />
                      <span>
                        <strong>Legal &amp; Clinical Certification:</strong> I certify under Medical Council regulations and Indian Medical Ethics Code that this is an acute life-threatening emergency and the patient is incapable of providing consent. I understand this access is permanently recorded and subject to regulatory scrutiny.
                      </span>
                    </label>
                  </div>

                  {emergencyError && (
                    <div className="p-2.5 rounded-lg bg-rose-600/30 border border-rose-400 text-rose-100 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                      <span>{emergencyError}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-md transition-colors inline-flex items-center gap-2"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Authenticate &amp; Execute Break-Glass Override</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        </div>

        {/* Doctor Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm overflow-x-auto">
          <button
            onClick={() => setActiveTab("patients")}
            className={`flex-1 min-w-[210px] py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === "patients" 
                ? "bg-teal-50 text-teal-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-4 h-4 text-teal-600" />
            <span>Associated Patients &amp; Records</span>
            <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">
              {patients.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 min-w-[210px] py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === "requests" 
                ? "bg-teal-50 text-teal-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Consultation Requests &amp; Slots</span>
            <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">
              {requests.filter(r => r.status === "pending").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 min-w-[180px] py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === "schedule" 
                ? "bg-teal-50 text-teal-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Clinic Hours &amp; Capacity</span>
          </button>

          <button
            onClick={() => setActiveTab("calibration")}
            className={`flex-1 min-w-[210px] py-2.5 px-3 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === "calibration" 
                ? "bg-teal-50 text-teal-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Handwriting Calibration Profile</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
              +34.2% Boost
            </span>
          </button>
        </div>

        {/* TAB 0: ASSOCIATED PATIENTS & CLINICAL FILES (UC-04 & OCR INTEGRATION) */}
        {activeTab === "patients" && (
          <div className="space-y-5">
            {/* Action Bar & Search / Filter Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-teal-600" />
                    <span>Associated Patients Roster</span>
                    <span className="text-xs bg-slate-100 text-slate-700 font-mono px-2 py-0.5 rounded-full border border-slate-200">
                      {patients.length} Total Patients
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Consent-governed patient roster. Request access to view confidential prescriptions and lab scans, or initiate OCR scanning.
                  </p>
                </div>

                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsAddPatientModalOpen(true)}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Patient to Roster</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      loadDoctorData();
                      showToast("Patient records synchronized with live vault.");
                    }}
                    className="p-2 rounded-xl text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 transition-colors"
                    title="Refresh Patient Roster"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search and Status Filters */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={(e) => setPatientSearch(e.target.value)}
                    placeholder="Search by patient name, email, UID, phone or condition..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-slate-400"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  {patientSearch && (
                    <button
                      type="button"
                      onClick={() => setPatientSearch("")}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                      statusFilter === "all"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    All ({patients.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("granted")}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                      statusFilter === "granted"
                        ? "bg-emerald-600 text-white"
                        : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Authorized ({patients.filter(p => p.accessStatus === "granted" || p.accessStatus === "emergency_override").length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("pending")}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                      statusFilter === "pending"
                        ? "bg-amber-600 text-white"
                        : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200"
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending ({patients.filter(p => p.accessStatus === "pending").length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatusFilter("needs_request")}
                    className={`px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                      statusFilter === "needs_request"
                        ? "bg-slate-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200"
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Locked ({patients.filter(p => p.accessStatus === "none" || p.accessStatus === "revoked").length})</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Patients Cards Grid */}
            {filteredPatients.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-10 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <User className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-slate-800 text-sm">No associated patients found</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {patientSearch || statusFilter !== "all"
                    ? "Try adjusting your search criteria or filter tags."
                    : "No patients are currently linked with Dr. Reeta Bhambri. Add a patient to get started."}
                </p>
                {(patientSearch || statusFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setPatientSearch("");
                      setStatusFilter("all");
                    }}
                    className="text-xs font-semibold text-teal-600 hover:underline"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPatients.map((patient) => {
                  const isGranted = patient.accessStatus === "granted" || patient.accessStatus === "emergency_override";
                  const isPending = patient.accessStatus === "pending";
                  const isLocked = patient.accessStatus === "none" || patient.accessStatus === "revoked";

                  return (
                    <div
                      key={patient.id}
                      className={`bg-white rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
                        patient.accessStatus === "emergency_override"
                          ? "border-rose-300 ring-1 ring-rose-200 hover:border-rose-400"
                          : isGranted
                          ? "border-emerald-200 hover:border-emerald-400"
                          : isPending
                          ? "border-amber-300 bg-amber-50/20 hover:border-amber-400"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {/* Top Row: Name, UID, Status Badge */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isGranted 
                                ? "bg-emerald-100 text-emerald-800" 
                                : isPending 
                                ? "bg-amber-100 text-amber-800" 
                                : "bg-slate-100 text-slate-700"
                            }`}>
                              {patient.patientName.charAt(0)}
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900 leading-tight">
                                {patient.patientName}
                              </h4>
                              <span className="text-[11px] font-mono text-slate-500">
                                {patient.patientUid}
                              </span>
                            </div>
                          </div>

                          {/* Access Status Pill */}
                          {patient.accessStatus === "emergency_override" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                              <ShieldAlert className="w-3 h-3 text-rose-600" />
                              <span>🚨 ER Break-Glass</span>
                            </span>
                          )}
                          {patient.accessStatus === "granted" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Access Granted</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 shrink-0">
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Consent Pending</span>
                            </span>
                          )}
                          {isLocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300 shrink-0">
                              <Lock className="w-3 h-3 text-slate-500" />
                              <span>Access Locked</span>
                            </span>
                          )}
                        </div>

                        {/* Demographics & Clinical Condition */}
                        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-slate-600">
                            <span>{patient.ageGender}</span>
                            <span className="font-semibold text-slate-800">Blood: {patient.bloodGroup}</span>
                          </div>
                          <div className="font-medium text-slate-800 truncate" title={patient.condition}>
                            <strong>Condition:</strong> {patient.condition}
                          </div>
                          <div className="text-[11px] text-slate-500 truncate" title={patient.patientEmail}>
                            {patient.patientEmail} • {patient.phone}
                          </div>
                        </div>

                        {/* Allergies Warning */}
                        {patient.allergies && patient.allergies.length > 0 ? (
                          <div className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            <span className="truncate">
                              <strong>Allergies:</strong> {patient.allergies.join(", ")}
                            </span>
                          </div>
                        ) : (
                          <div className="text-[11px] text-slate-400 px-1">
                            No known drug allergies reported
                          </div>
                        )}
                      </div>

                      {/* Card Action Footer */}
                      <div className="pt-4 mt-4 border-t border-slate-100 space-y-2">
                        {isGranted ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenPatientFile(patient)}
                              className="w-full py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                            >
                              <FolderOpen className="w-4 h-4" />
                              <span>View Clinical Records &amp; Rx</span>
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                              <Link
                                href={`/dashboard/scan?patientEmail=${encodeURIComponent(patient.patientEmail)}&patientName=${encodeURIComponent(patient.patientName)}`}
                                className="py-1.5 px-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-center font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                              >
                                <ScanLine className="w-3.5 h-3.5 text-teal-600" />
                                <span>Scan Rx (OCR)</span>
                              </Link>
                              <Link
                                href={`/dossier?patient=${encodeURIComponent(patient.patientEmail)}`}
                                className="py-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-center font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5 text-slate-600" />
                                <span>Dossier</span>
                              </Link>
                            </div>
                          </>
                        ) : isPending ? (
                          <div className="space-y-2">
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-tight">
                              Authorization request active. Waiting for patient to click &quot;Accept&quot; on their MedMatch mobile dashboard.
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenRequestAccessModal(patient)}
                                className="py-1.5 px-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Resend</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBreakGlassForPatient(patient)}
                                className="py-1.5 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>ER Override</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-tight">
                              Confidential medical records locked. Request patient authorization to view prescriptions &amp; scans.
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenRequestAccessModal(patient)}
                                className="sm:col-span-8 py-2 px-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
                              >
                                <KeyRound className="w-4 h-4" />
                                <span>Request Patient Access</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleBreakGlassForPatient(patient)}
                                className="sm:col-span-4 py-2 px-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                                title="Emergency Break-Glass Override"
                              >
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                                <span>Break-Glass</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CONSULTATION REQUESTS QUEUE & SLOT MANAGEMENT */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Incoming Patient Consultation Slots
                </h3>
                <p className="text-xs text-slate-500">
                  Clinic Scheduler Actor detects double bookings and locks calendar appointments
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Calendar Slot Locking: <strong>Active</strong></span>
              </div>
            </div>

            <div className="space-y-3.5">
              {requests.map((req) => (
                <div 
                  key={req.id} 
                  className={`bg-white rounded-2xl border p-5 shadow-sm transition-all ${
                    req.status === "pending" ? "border-amber-300 ring-1 ring-amber-200" :
                    req.status === "confirmed" ? "border-emerald-300" :
                    req.status === "rescheduled" ? "border-blue-300" : "border-slate-200 opacity-80"
                  }`}
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0 border border-teal-100">
                        {req.patientName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-base text-slate-900">{req.patientName}</h4>
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {req.patientUid}
                          </span>
                          <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full ${
                            req.status === "pending" ? "bg-amber-100 text-amber-800" :
                            req.status === "confirmed" ? "bg-emerald-100 text-emerald-800" :
                            req.status === "rescheduled" ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-700"
                          }`}>
                            {req.status === "pending" ? "Pending Approval" :
                             req.status === "confirmed" ? "Confirmed & Slot Locked" :
                             req.status === "rescheduled" ? "Rescheduled" : "Completed"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          Reason: <strong className="text-slate-800">{req.reason}</strong>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div className="bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-left md:text-right">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>{req.date}</span>
                        </div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{req.time}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes & Actions */}
                  <div className="pt-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="text-xs text-slate-600 max-w-xl">
                      <span className="font-semibold text-slate-800">Clinical Background: </span>
                      {req.notes}
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                      <Link
                        href={`/dossier?token=${req.dossierToken}`}
                        className="text-xs font-semibold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg border border-teal-200 inline-flex items-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Dossier</span>
                      </Link>

                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleOpenReschedule(req)}
                            className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                          >
                            Reschedule
                          </button>
                          <button
                            onClick={() => handleAccept(req)}
                            className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept Slot</span>
                          </button>
                        </>
                      )}

                      {req.status === "confirmed" && (
                        <button
                          onClick={() => handleMarkCompleted(req.id)}
                          className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Mark Completed</span>
                        </button>
                      )}

                      {req.status === "rescheduled" && (
                        <button
                          onClick={() => handleAccept(req)}
                          className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-sm transition-colors"
                        >
                          Confirm New Slot
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: CLINIC WORKING HOURS & CAPACITY SCHEDULER */}
        {activeTab === "schedule" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Clinic Working Hours &amp; Capacity Allocation
              </h3>
              <p className="text-xs text-slate-500">
                Ranjit Maternity Clinic &amp; Nursing Home • Model Town, Ludhiana
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-teal-950">Morning Session</span>
                  <span className="text-xs font-bold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
                    8 Slots Max
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Timings:</strong> 10:00 AM – 02:00 PM (Monday to Saturday)
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Focus:</strong> Antenatal Care, High-Risk Pregnancy Consultations &amp; Doppler Ultrasounds
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Booked Capacity</span>
                    <span className="font-semibold text-slate-800">5 of 8 Booked (62%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-teal-600 h-2 rounded-full" style={{ width: "62%" }} />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-900">Evening Session</span>
                  <span className="text-xs font-bold text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    6 Slots Max
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Timings:</strong> 05:00 PM – 08:00 PM (Monday to Saturday)
                </div>
                <div className="text-xs text-slate-600">
                  <strong>Focus:</strong> General Gynaecology, Lab Review &amp; Post-Op Follow-ups
                </div>
                <div className="pt-2">
                  <div className="flex justify-between text-xs text-slate-500 mb-1">
                    <span>Booked Capacity</span>
                    <span className="font-semibold text-slate-800">3 of 6 Booked (50%)</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div className="bg-slate-700 h-2 rounded-full" style={{ width: "50%" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-xs text-emerald-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="text-emerald-950">Automated Conflict Detection:</strong> The Clinic Scheduler Actor automatically validates every requested slot against Dr. Bhambri&apos;s hospital surgery schedule. Overlapping requests trigger instant auto-rescheduling recommendations.
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: HANDWRITING CALIBRATION PROFILE */}
        {activeTab === "calibration" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Handwriting Calibration Engine — Dr. Reeta Bhambri
                </h3>
                <p className="text-xs text-slate-500">
                  Personalized physician transcription profile with continuous stroke mapping
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-3 py-1 rounded-full">
                +34.2% Transcription Fidelity Boost
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Calibrated Slips</span>
                <span className="font-bold text-base text-slate-900">14 Verified</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Custom Formulations</span>
                <span className="font-bold text-base text-slate-900">42 Medicines</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Confusable Pairs</span>
                <span className="font-bold text-base text-slate-900">16 Rules</span>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">OCR Error Rate</span>
                <span className="font-bold text-base text-emerald-700">0.8% (Target &lt;2%)</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2.5">
                Calibrated Letterforms &amp; Frequency Shorthands
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <strong className="text-slate-900">&quot;OD&quot;</strong> → Once Daily (Morning)
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <strong className="text-slate-900">&quot;BD&quot;</strong> → Twice Daily (12h)
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <strong className="text-slate-900">&quot;TDS&quot;</strong> → Three Times Daily
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50">
                  <strong className="text-slate-900">&quot;Folvite&quot;</strong> → Folic Acid 5mg
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Reschedule Modal */}
      {rescheduleModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-base text-slate-900">Reschedule Consultation Slot</h3>
              <button
                onClick={() => setRescheduleModalItem(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Proposing alternative consultation slot for <strong className="text-slate-900">{rescheduleModalItem.patientName}</strong>. The patient will be notified automatically in their health vault.
            </p>

            <form onSubmit={handleConfirmReschedule} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Proposed Date</label>
                <input 
                  type="text"
                  value={newRescheduleDate}
                  onChange={(e) => setNewRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Proposed Time</label>
                <select 
                  value={newRescheduleTime}
                  onChange={(e) => setNewRescheduleTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="10:30 AM">10:30 AM (Morning Session)</option>
                  <option value="11:30 AM">11:30 AM (Morning Session)</option>
                  <option value="05:30 PM">05:30 PM (Evening Session)</option>
                  <option value="06:30 PM">06:30 PM (Evening Session)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRescheduleModalItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm"
                >
                  Lock &amp; Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 1. Patient Clinical Records Viewer Modal */}
      {selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-6 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-4xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex flex-wrap items-start justify-between gap-4 border-b border-slate-800 shrink-0">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-500 text-slate-950 font-extrabold text-xl flex items-center justify-center shrink-0 shadow-lg">
                  {selectedPatient.patientName.charAt(0)}
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-white leading-tight">
                      {selectedPatient.patientName}
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-white/10 text-teal-300 border border-white/10">
                      {selectedPatient.patientUid}
                    </span>
                    {selectedPatient.accessStatus === "emergency_override" ? (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>🚨 ER Break-Glass</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Consent Verified</span>
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>{selectedPatient.ageGender}</span>
                    <span>•</span>
                    <span>Blood: <strong className="text-white">{selectedPatient.bloodGroup}</strong></span>
                    <span>•</span>
                    <span>{selectedPatient.phone}</span>
                    <span>•</span>
                    <span className="text-teal-300">{selectedPatient.patientEmail}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons in Modal Header */}
              <div className="flex items-center gap-2">
                <Link
                  href={`/dashboard/scan?patientEmail=${encodeURIComponent(selectedPatient.patientEmail)}&patientName=${encodeURIComponent(selectedPatient.patientName)}`}
                  className="px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <ScanLine className="w-4 h-4" />
                  <span>Scan Rx (OCR)</span>
                </Link>
                <Link
                  href={`/dossier?patient=${encodeURIComponent(selectedPatient.patientEmail)}`}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-teal-300" />
                  <span>Full Dossier</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Allergies Alert Banner */}
            {selectedPatient.allergies && selectedPatient.allergies.length > 0 && (
              <div className="bg-rose-50 border-b border-rose-200 px-5 sm:px-6 py-2.5 flex items-center gap-2.5 text-xs text-rose-900 shrink-0">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  <strong>CRITICAL DRUG ALLERGY WARNING:</strong> Patient has documented hypersensitivity to{" "}
                  <strong className="underline">{selectedPatient.allergies.join(", ")}</strong>. Avoid penicillin derivatives and NSAID formulations.
                </span>
              </div>
            )}

            {/* Clinical Drawer Sub-tabs */}
            <div className="flex border-b border-slate-200 bg-slate-50 px-5 sm:px-6 pt-2 shrink-0">
              <button
                type="button"
                onClick={() => setClinicalModalTab("prescriptions")}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  clinicalModalTab === "prescriptions"
                    ? "border-teal-600 text-teal-900 bg-white rounded-t-lg shadow-sm"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Pill className="w-4 h-4 text-teal-600" />
                <span>Prescriptions &amp; Digital Slips</span>
                <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                  {patientPrescriptions.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setClinicalModalTab("reports")}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  clinicalModalTab === "reports"
                    ? "border-teal-600 text-teal-900 bg-white rounded-t-lg shadow-sm"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Diagnostic Lab Scans &amp; Reports</span>
                <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                  {patientDocuments.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setClinicalModalTab("episodes")}
                className={`py-2.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                  clinicalModalTab === "episodes"
                    ? "border-teal-600 text-teal-900 bg-white rounded-t-lg shadow-sm"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                <Activity className="w-4 h-4 text-teal-600" />
                <span>Clinical Notes &amp; Encounters</span>
              </button>
            </div>

            {/* Modal Body Scroll Area */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 grow">
              {/* SUBTAB 1: PRESCRIPTIONS */}
              {clinicalModalTab === "prescriptions" && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Active Prescriptions &amp; Digitized Slips
                      </h4>
                      <p className="text-xs text-slate-500">
                        Extracted via Gemini Vision OCR with Handwriting Calibration Profile
                      </p>
                    </div>
                    <Link
                      href={`/dashboard/scan?patientEmail=${encodeURIComponent(selectedPatient.patientEmail)}&patientName=${encodeURIComponent(selectedPatient.patientName)}`}
                      className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Scan New Prescription for this Patient</span>
                    </Link>
                  </div>

                  {patientPrescriptions.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl space-y-3">
                      <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">No prescriptions found in this patient&apos;s vault.</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Use the OCR portal to scan doctor slips or pharmacy bills and link them to this patient.
                      </p>
                      <Link
                        href={`/dashboard/scan?patientEmail=${encodeURIComponent(selectedPatient.patientEmail)}&patientName=${encodeURIComponent(selectedPatient.patientName)}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors"
                      >
                        <ScanLine className="w-4 h-4" />
                        <span>Launch OCR Prescription Scanner</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientPrescriptions.map((rx) => (
                        <div
                          key={rx.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-200 transition-all space-y-3"
                        >
                          <div className="flex flex-wrap items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-bold text-sm text-slate-900">{rx.diag || "Prescription Record"}</h5>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
                                  {rx.id}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                Prescribed by <strong>{rx.doc}</strong> • {rx.hospital} • {rx.date}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              {rx.doc && rx.doc.toLowerCase().includes("reeta") ? (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                  <Sparkles className="w-3 h-3 text-emerald-600" />
                                  <span>Calibrated Dr. Reeta Profile</span>
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                                  Universal Transcription
                                </span>
                              )}

                              {rx.imageDataUrl && (
                                <button
                                  type="button"
                                  onClick={() => setActiveZoomImage(rx.imageDataUrl!)}
                                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 flex items-center gap-1 transition-colors"
                                  title="Inspect Original Slip"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>View Slip</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Medicines List */}
                          {rx.medicines && rx.medicines.length > 0 ? (
                            <div className="space-y-2">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Prescribed Medications ({rx.medicines.length})
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {rx.medicines.map((med: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs flex flex-col justify-between"
                                  >
                                    <div className="flex items-start justify-between gap-1">
                                      <span className="font-bold text-slate-900">{med.medicine_name}</span>
                                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-700">
                                        {med.dosage || "As advised"}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-slate-600 mt-1 flex items-center gap-2">
                                      <span><strong>Freq:</strong> {med.frequency || "OD"}</span>
                                      <span>•</span>
                                      <span><strong>Duration:</strong> {med.duration || "Ongoing"}</span>
                                    </div>
                                    {med.instructions && (
                                      <div className="text-[10px] text-slate-500 mt-1 italic">
                                        {med.instructions}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">Prescription medicines summary: {rx.meds || 0} items.</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 2: LAB SCANS & REPORTS */}
              {clinicalModalTab === "reports" && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Diagnostic Scans, Ultrasounds &amp; Lab Panels
                      </h4>
                      <p className="text-xs text-slate-500">
                        Verified pathology and imaging uploads from clinical labs
                      </p>
                    </div>
                  </div>

                  {patientDocuments.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-300 rounded-2xl space-y-2">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="text-xs font-semibold text-slate-700">No lab reports or scans uploaded yet.</p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Patients can upload obstetric ultrasound reports, CBC panels, and imaging scans through their MedMatch vault.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-teal-200 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-slate-900">{doc.title}</h5>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                doc.type === "ultrasound"
                                  ? "bg-purple-100 text-purple-800 border border-purple-200"
                                  : doc.type === "blood_test"
                                  ? "bg-red-100 text-red-800 border border-red-200"
                                  : "bg-blue-100 text-blue-800 border border-blue-200"
                              }`}>
                                {doc.type.replace("_", " ")}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600">{doc.summary}</p>
                            <p className="text-[11px] text-slate-400">
                              Facility: {doc.facility} • Date: {doc.date}
                            </p>
                          </div>

                          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1.5 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Verified Lab Record</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SUBTAB 3: CLINICAL ENCOUNTERS & NOTES */}
              {clinicalModalTab === "episodes" && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900">
                    Clinical Encounters &amp; Treatment History
                  </h4>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-700 font-semibold">
                      <span>Recent Consultation: {selectedPatient.lastVisit}</span>
                      <span className="text-teal-700">Clinic Visit</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Patient presented for routine evaluation. Chief diagnosis documented as <strong>{selectedPatient.condition}</strong>. Medication adherence confirmed. Vital parameters stable.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-medium">
                Governed under MedMatch Patient-Centric Confidentiality Protocol (UC-04).
              </span>
              <button
                type="button"
                onClick={() => setSelectedPatient(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 shadow-sm"
              >
                Close Records Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Image Slip Zoom Modal */}
      {activeZoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-2xl w-full shadow-2xl overflow-hidden p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <h4 className="font-bold text-sm text-slate-900">Original Prescription Slip (Raw Capture)</h4>
              </div>
              <button
                type="button"
                onClick={() => setActiveZoomImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeZoomImage}
                alt="Prescription Slip"
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setActiveZoomImage(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Close Zoom View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Request Access Modal */}
      {requestAccessModalPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <KeyRound className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Request Patient Access</h3>
                  <p className="text-[11px] text-slate-500">UC-04: Patient Consent-Gated Access</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRequestAccessModalPatient(null)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="text-slate-500">Target Patient:</div>
              <div className="font-bold text-slate-900 text-sm">{requestAccessModalPatient.patientName}</div>
              <div className="font-mono text-slate-600 text-[11px]">{requestAccessModalPatient.patientUid} • {requestAccessModalPatient.patientEmail}</div>
            </div>

            <form onSubmit={handleSendAccessRequest} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Requested Clinical Scope
                </label>
                <select
                  value={requestScope}
                  onChange={(e) => setRequestScope(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                >
                  <option value="Full Clinical History, Prescriptions & Lab Scans">
                    Full Clinical History, Prescriptions &amp; Lab Scans (Recommended)
                  </option>
                  <option value="Prescriptions & Medication History Only">
                    Prescriptions &amp; Medication History Only
                  </option>
                  <option value="Lab Scans & Diagnostic Reports Only">
                    Lab Scans &amp; Diagnostic Reports Only
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Indication / Reason for Request
                </label>
                <textarea
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-[11px] text-teal-900 leading-relaxed">
                <strong>Patient Notification:</strong> When you send this request, a high-priority notification will immediately appear on <strong>{requestAccessModalPatient.patientName}&apos;s</strong> patient dashboard. The patient can authorize access with one click.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRequestAccessModalPatient(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Access Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Add Patient Modal */}
      {isAddPatientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-teal-700" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Add Patient to Roster</h3>
                  <p className="text-[11px] text-slate-500">Associate an active patient with Dr. Reeta Bhambri</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddPatientModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Presets */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                Quick Add Registered Patients:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() =>
                    handleQuickAddPreset(
                      "Jasmeen Kaur",
                      "jk0822123@gmail.com",
                      "PT-2026-LUD-8821",
                      "+91 98765-43210",
                      "28 Y / Female",
                      "B+ (Rh Positive)",
                      "Antenatal Trimester II (24 W)",
                      ["Penicillin", "Cefixime"]
                    )
                  }
                  className="p-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 text-left font-medium transition-colors"
                >
                  <div className="font-bold">Jasmeen Kaur</div>
                  <div className="text-[10px] text-teal-700 truncate">jk0822123@gmail.com</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickAddPreset(
                      "Harpreet Singh",
                      "harpreet.s@example.com",
                      "PT-2026-LUD-3312",
                      "+91 98140-55219",
                      "42 Y / Male",
                      "O+ (Rh Positive)",
                      "Post-Op Cholecystectomy Follow-up",
                      ["NSAIDs (Diclofenac)"]
                    )
                  }
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-left font-medium transition-colors"
                >
                  <div className="font-bold">Harpreet Singh</div>
                  <div className="text-[10px] text-slate-600 truncate">harpreet.s@example.com</div>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleQuickAddPreset(
                      "Amandeep Sharma",
                      "amandeep.sharma@example.com",
                      "PT-2026-LUD-4091",
                      "+91 98722-11009",
                      "31 Y / Female",
                      "A+ (Rh Positive)",
                      "Antenatal Trimester I (9 W)",
                      ["None known"]
                    )
                  }
                  className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 text-left font-medium transition-colors"
                >
                  <div className="font-bold">Amandeep Sharma</div>
                  <div className="text-[10px] text-slate-600 truncate">amandeep.sharma@...</div>
                </button>
              </div>
            </div>

            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-2 text-[10px] text-slate-400 uppercase font-bold">Or Enter Details</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <form onSubmit={handleAddPatientSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Patient Full Name</label>
                  <input
                    type="text"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    placeholder="e.g. Jasmeen Kaur"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Patient Email (Vault ID)</label>
                  <input
                    type="email"
                    value={newPatientEmail}
                    onChange={(e) => setNewPatientEmail(e.target.value)}
                    placeholder="e.g. jk0822123@gmail.com"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Phone Number</label>
                  <input
                    type="text"
                    value={newPatientPhone}
                    onChange={(e) => setNewPatientPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Patient UID</label>
                  <input
                    type="text"
                    value={newPatientUid}
                    onChange={(e) => setNewPatientUid(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Age &amp; Gender</label>
                  <input
                    type="text"
                    value={newPatientAgeGender}
                    onChange={(e) => setNewPatientAgeGender(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Blood Group</label>
                  <input
                    type="text"
                    value={newPatientBloodGroup}
                    onChange={(e) => setNewPatientBloodGroup(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Clinical Condition / Chief Complaint</label>
                <input
                  type="text"
                  value={newPatientCondition}
                  onChange={(e) => setNewPatientCondition(e.target.value)}
                  placeholder="e.g. Antenatal Trimester II"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Known Drug Allergies (Comma separated)</label>
                <input
                  type="text"
                  value={newPatientAllergies}
                  onChange={(e) => setNewPatientAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, Cefixime"
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddPatientModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add to Roster</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
