"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Stethoscope, 
  Search, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  ArrowLeft, 
  ExternalLink, 
  Printer, 
  Plus, 
  Eye, 
  ChevronRight, 
  X, 
  Sparkles, 
  RefreshCw,
  LogOut,
  Send,
  AlertCircle,
  ShieldAlert,
  Calendar,
  CalendarDays,
  MapPin,
  Clock3,
  Users,
  Lock,
  Activity,
  Check,
  UserCheck,
  Shield,
  LayoutGrid,
  ListFilter,
  QrCode
} from "lucide-react";
import { DoctorQrScannerModal } from "@/components/DoctorQrScannerModal";
import { 
  verifyActiveSession,
  clearUserSession,
  UserSession
} from "@/lib/auth";
import { createClient } from "@/lib/client";
import { 
  getHospitalRegisteredPatients,
  getAllDoctorAccessRequests,
  createDoctorAccessRequest,
  getPatientPrescriptions,
  getPatientDocuments,
  downloadMedicalSummaryReport,
  verifyDoctorAccess,
  StoredPrescription,
  PatientDocument,
  DoctorPatientRecord,
  DoctorAccessPermissionRequest,
  DoctorRequest,
  getDoctorAppointments,
  syncDoctorRequestAction
} from "@/lib/patientData";

export default function DoctorPortalPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isVerifyingDoctor, setIsVerifyingDoctor] = useState(true);

  // Data state
  const [patients, setPatients] = useState<DoctorPatientRecord[]>([]);
  const [allRequests, setAllRequests] = useState<DoctorAccessPermissionRequest[]>([]);
  const [doctorAppointments, setDoctorAppointments] = useState<DoctorRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"patients" | "appointments" | "requests" | "emergency">("patients");

  // Search & Filter
  const [patientSearch, setPatientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "granted" | "pending" | "needs_request">("all");
  const [patientViewMode, setPatientViewMode] = useState<"cards" | "table">("cards");

  // Appointment filters & state
  const [appointmentFilter, setAppointmentFilter] = useState<"all" | "upcoming" | "completed">("upcoming");
  const [appointmentSearch, setAppointmentSearch] = useState("");
  const [rescheduleAppointment, setRescheduleAppointment] = useState<DoctorRequest | null>(null);
  const [rescheduleNewDate, setRescheduleNewDate] = useState("");
  const [rescheduleNewTime, setRescheduleNewTime] = useState("");
  const [rescheduleNewLocation, setRescheduleNewLocation] = useState("");

  // Selected Patient Clinical Chart Viewer (Read-Only)
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatientRecord | null>(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState<StoredPrescription[]>([]);
  const [patientDocuments, setPatientDocuments] = useState<PatientDocument[]>([]);
  const [clinicalViewerTab, setClinicalViewerTab] = useState<"prescriptions" | "reports">("prescriptions");
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);
  const [accessDeniedError, setAccessDeniedError] = useState<string | null>(null);
  const [networkOfflineNotice, setNetworkOfflineNotice] = useState<string | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState(false);

  // Request Access Modal
  const [requestTargetPatient, setRequestTargetPatient] = useState<DoctorPatientRecord | null>(null);
  const [requestScope, setRequestScope] = useState("Full Prescriptions, Medications & Diagnostic Reports");
  const [requestReason, setRequestReason] = useState("Clinical consultation, health evaluation & medication reconciliation");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Emergency Break-Glass Modal
  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState(false);
  const [emergencyTargetPatient, setEmergencyTargetPatient] = useState<DoctorPatientRecord | null>(null);
  const [emergencyReason, setEmergencyReason] = useState("Acute Emergency Resuscitation & High-Risk Drug Allergy Screening");
  const [emergencyAttestation, setEmergencyAttestation] = useState(false);
  const [emergencyError, setEmergencyError] = useState<string | null>(null);

  // Emergency QR Scanner Modal
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const getDoctorId = () => {
    if (!userSession) return "dr-reeta";
    const email = (userSession.email || "").toLowerCase();
    if (email.includes("duggal")) return "dr-duggal";
    if (email.includes("reeta") || email.includes("bhambri") || email === "doctor@medmatch.com") return "dr-reeta";
    return `doc-${userSession.email?.split("@")[0] || userSession.id || "doctor"}`;
  };

  const getDoctorName = () => {
    const email = (userSession?.email || "").toLowerCase().trim();
    if (email === "doctor@medmatch.com" || email.includes("reeta") || email.includes("bhambri")) {
      return "Dr. Reeta Bhambri";
    }
    if (!userSession?.name) return "Dr. Reeta Bhambri";
    const trimmed = userSession.name.trim();
    if (trimmed.toLowerCase().includes("sharma") && (email === "doctor@medmatch.com" || !email || email.includes("medmatch"))) {
      return "Dr. Reeta Bhambri";
    }
    if (/^dr\.?\s+/i.test(trimmed)) return trimmed;
    return `Dr. ${trimmed}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const loadRegistryData = () => {
    const docId = getDoctorId();
    const docName = getDoctorName();
    const docEmail = userSession?.email;
    const patientList = getHospitalRegisteredPatients(docId, docEmail, docName);
    setPatients(patientList);
    setAllRequests(getAllDoctorAccessRequests().filter(r => 
      r.doctorId === docId || 
      (docId === "dr-reeta" && (r.doctorId === "doc-doctor" || r.doctorName?.includes("Bhambri") || r.doctorName?.includes("Reeta"))) ||
      (docEmail && (r as any).doctorEmail?.toLowerCase() === docEmail.toLowerCase())
    ));
    const apps = getDoctorAppointments(docId, docEmail, docName, true);
    setDoctorAppointments(apps);
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
        // Strict role segregation: Patients must not access Doctor Portal
        if (session.role === "patient") {
          router.replace("/dashboard");
          return;
        }
        setUserSession(session);
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

  useEffect(() => {
    if (!isVerifyingDoctor) {
      loadRegistryData();

      const handleUpdate = () => {
        const docId = getDoctorId();
        const docName = getDoctorName();
        const docEmail = userSession?.email;
        const freshRoster = getHospitalRegisteredPatients(docId, docEmail, docName);
        setPatients(freshRoster);
        setAllRequests(getAllDoctorAccessRequests().filter(r => 
          r.doctorId === docId || 
          (docId === "dr-reeta" && (r.doctorId === "doc-doctor" || r.doctorName?.includes("Bhambri") || r.doctorName?.includes("Reeta"))) ||
          (docEmail && (r as any).doctorEmail?.toLowerCase() === docEmail.toLowerCase())
        ));
        const apps = getDoctorAppointments(docId, docEmail, docName, true);
        setDoctorAppointments(apps);

        if (selectedPatient) {
          const freshSelected = freshRoster.find(p => p.patientEmail.toLowerCase() === selectedPatient.patientEmail.toLowerCase());
          if (freshSelected) {
            setSelectedPatient(freshSelected);
            if (freshSelected.accessStatus === "granted" || freshSelected.accessStatus === "emergency_override") {
              setPatientPrescriptions(getPatientPrescriptions(freshSelected.patientEmail));
              setPatientDocuments(getPatientDocuments(freshSelected.patientEmail));
              setAccessDeniedError(null);
            } else {
              setPatientPrescriptions([]);
              setPatientDocuments([]);
              if (freshSelected.accessStatus === "revoked") {
                setAccessDeniedError("Access Revoked: The patient has revoked your clinical authorization. Record decryption keys have been invalidated.");
              } else {
                setAccessDeniedError("Authorization Required: You do not have active clinical authorization to view this patient's records.");
              }
            }
          }
        }
      };

      window.addEventListener("medmatch_access_update", handleUpdate);
      window.addEventListener("storage", handleUpdate);

      let bc: BroadcastChannel | null = null;
      if (typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("medmatch_access_channel");
        bc.onmessage = () => {
          handleUpdate();
        };
      }

      return () => {
        window.removeEventListener("medmatch_access_update", handleUpdate);
        window.removeEventListener("storage", handleUpdate);
        if (bc) bc.close();
      };
    }
  }, [isVerifyingDoctor, selectedPatient?.patientEmail, userSession?.email]);

  const handleDoctorLogout = async () => {
    await clearUserSession();
    router.replace("/login");
  };

  const handleOpenPatientChart = async (p: DoctorPatientRecord) => {
    setSelectedPatient(p);
    setClinicalViewerTab("prescriptions");
    setAccessDeniedError(null);
    setNetworkOfflineNotice(null);

    // If access is revoked or unauthorized, enforce access denied and clear data immediately
    if (p.accessStatus === "revoked") {
      setAccessDeniedError("Access Revoked: The patient has revoked your access to their medical records. Decryption authorization has been terminated.");
      setPatientPrescriptions([]);
      setPatientDocuments([]);
      return;
    }

    if (p.accessStatus !== "granted" && p.accessStatus !== "emergency_override") {
      setAccessDeniedError("Authorization Required: You do not have active clinical authorization to view this patient's records.");
      setPatientPrescriptions([]);
      setPatientDocuments([]);
      return;
    }

    // Live backend verification if backend URL is configured
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendUrl) {
      setIsLoadingChart(true);
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
        const token = data?.session?.access_token;
        const targetId = p.patientUid || p.patientEmail;

        const res = await fetch(`${backendUrl}/api/sharing/doctor/patient-records/${encodeURIComponent(targetId)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (res.status === 403) {
          const errData = await res.json().catch(() => null);
          const detail = errData?.detail || "403 Forbidden: Access revoked or not granted by the patient.";
          setAccessDeniedError(detail);
          setPatientPrescriptions([]);
          setPatientDocuments([]);
          // Synchronize local patient record status
          p.accessStatus = "revoked";
          setSelectedPatient({ ...p, accessStatus: "revoked" });
          setIsLoadingChart(false);
          return;
        }

        if (res.ok) {
          const liveData = await res.json();
          setPatientPrescriptions(liveData.prescriptions || []);
          setPatientDocuments(liveData.documents || []);
          setIsLoadingChart(false);
          return;
        } else {
          setNetworkOfflineNotice(`Backend server returned HTTP ${res.status}. Falling back to verified clinical snapshot.`);
        }
      } catch (networkErr) {
        console.warn("Backend server connection failed, using verified snapshot:", networkErr);
        setNetworkOfflineNotice("Hospital backend server is offline or unreachable. Displaying local verified clinical snapshot for demonstration.");
      } finally {
        setIsLoadingChart(false);
      }
    }

    // Fallback to local verified patient records only when access is granted
    setPatientPrescriptions(getPatientPrescriptions(p.patientEmail));
    setPatientDocuments(getPatientDocuments(p.patientEmail));
  };

  const handleClosePatientChart = () => {
    setSelectedPatient(null);
    setActiveZoomImage(null);
    setAccessDeniedError(null);
    setNetworkOfflineNotice(null);
    setIsLoadingChart(false);
  };

  const handleOpenRequestModal = (p: DoctorPatientRecord) => {
    setRequestTargetPatient(p);
    if (p.accessStatus === "revoked") {
      setRequestReason(`Re-authorization Request: Clinical record re-evaluation & medication review for ${p.patientName}`);
    } else {
      setRequestReason(`Clinical consultation, health evaluation & medication reconciliation for ${p.patientName}`);
    }
  };

  const handleQrScanSuccess = (result: {
    patientRecord?: DoctorPatientRecord;
    token?: string;
    dossierUrl?: string;
    message: string;
  }) => {
    loadRegistryData();
    setIsQrScannerOpen(false);
    if (result.patientRecord) {
      showToast(`Emergency Pass Verified: Connected to ${result.patientRecord.patientName}'s clinical vault!`);
      handleOpenPatientChart({
        ...result.patientRecord,
        accessStatus: "granted"
      });
    } else {
      showToast(result.message || "Emergency QR Pass verified.");
    }
  };

  const handleCompleteAppointment = (aptId: string | number, patientName: string) => {
    syncDoctorRequestAction(aptId, "complete");
    loadRegistryData();
    showToast(`Consultation marked as completed for ${patientName}! Patient dashboard has been updated.`);
  };

  const handleCancelDoctorAppointment = (aptId: string | number, patientName: string) => {
    if (!confirm(`Are you sure you want to cancel the appointment for ${patientName}?`)) return;
    syncDoctorRequestAction(aptId, "cancel");
    loadRegistryData();
    showToast(`Appointment cancelled for ${patientName}.`);
  };

  const handleOpenDoctorReschedule = (apt: DoctorRequest) => {
    setRescheduleAppointment(apt);
    setRescheduleNewDate(apt.date || "");
    setRescheduleNewTime(apt.time || "10:30 AM");
    setRescheduleNewLocation(apt.location || "Ranjit Maternity Clinic & Consultation Suite");
  };

  const handleSaveDoctorReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleAppointment) return;

    let formattedDate = rescheduleNewDate;
    if (rescheduleNewDate && rescheduleNewDate.includes("-")) {
      try {
        const parts = rescheduleNewDate.split("-");
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      } catch {}
    }

    syncDoctorRequestAction(rescheduleAppointment.id, "reschedule", {
      date: formattedDate,
      time: rescheduleNewTime || rescheduleAppointment.time,
      location: rescheduleNewLocation || rescheduleAppointment.location
    });

    loadRegistryData();
    showToast(`Consultation rescheduled for ${rescheduleAppointment.patientName} to ${formattedDate} at ${rescheduleNewTime}!`);
    setRescheduleAppointment(null);
  };

  const handleOpenDossierFromAppointment = (apt: DoctorRequest) => {
    const matched = patients.find(p => p.patientEmail.toLowerCase() === apt.patientEmail.toLowerCase());
    if (matched) {
      if (matched.accessStatus === "granted" || matched.accessStatus === "emergency_override") {
        handleOpenPatientChart(matched);
      } else {
        handleOpenRequestModal(matched);
      }
    } else {
      showToast(`Patient record for ${apt.patientName} not found in hospital directory.`);
    }
  };

  const handleSendAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTargetPatient) return;
    setIsSubmittingRequest(true);

    const docId = getDoctorId();
    const docName = getDoctorName();

    createDoctorAccessRequest({
      doctorId: docId,
      doctorName: docName,
      doctorSpecialty: userSession?.email?.includes("duggal") ? "Gastrointestinal Surgery" : (userSession?.email?.includes("reeta") || userSession?.email === "doctor@medmatch.com") ? "Obstetrics & Antenatal Care" : "General Medicine & Clinical Practice",
      hospital: "MedMatch Integrated Hospital & Clinical Network",
      doctorLicense: userSession?.email?.includes("duggal") ? "MCI-48192" : (userSession?.email?.includes("reeta") || userSession?.email === "doctor@medmatch.com") ? "MCI-34182" : "MCI-78190",
      patientEmail: requestTargetPatient.patientEmail,
      patientName: requestTargetPatient.patientName,
      patientUid: requestTargetPatient.patientUid,
      requestedScope: requestScope,
      clinicalReason: requestReason,
      isEmergency: false
    });

    loadRegistryData();
    setIsSubmittingRequest(false);
    showToast(`Access request dispatched to ${requestTargetPatient.patientName}! The patient has received a live authorization prompt on their dashboard.`);
    setRequestTargetPatient(null);
  };

  const handleOpenEmergencyBreakGlass = (p: DoctorPatientRecord) => {
    setEmergencyTargetPatient(p);
    setEmergencyAttestation(false);
    setEmergencyError(null);
    setIsEmergencyModalOpen(true);
  };

  const handleExecuteEmergencyBreakGlass = (e: React.FormEvent) => {
    e.preventDefault();
    setEmergencyError(null);
    if (!emergencyTargetPatient) return;
    if (!emergencyAttestation) {
      setEmergencyError("Clinical Certification required: You must certify under medical council regulations that this is a critical emergency.");
      return;
    }

    const docName = userSession?.name || "Dr. Reeta Bhambri";
    const res = verifyDoctorAccess(emergencyTargetPatient.patientUid, undefined, {
      doctorName: docName,
      doctorLicense: "MCI-34182",
      hospital: "Ranjit Maternity Clinic & Emergency Center",
      emergencyReason
    });

    if (!res.allowed) {
      setEmergencyError(res.reason || "Emergency authorization failed.");
      return;
    }

    setIsEmergencyModalOpen(false);
    loadRegistryData();
    showToast(`🚨 Emergency Break-Glass activated for ${emergencyTargetPatient.patientName}. Full records unlocked.`);
    handleOpenPatientChart({
      ...emergencyTargetPatient,
      accessStatus: "emergency_override"
    });
  };

  // Filtered patients calculation
  const filteredPatients = patients.filter((p) => {
    const query = patientSearch.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.patientName.toLowerCase().includes(query) ||
      p.patientEmail.toLowerCase().includes(query) ||
      p.patientUid.toLowerCase().includes(query) ||
      p.phoneNumber.replace(/\D/g, "").includes(query.replace(/\D/g, ""));

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "granted" && (p.accessStatus === "granted" || p.accessStatus === "emergency_override")) ||
      (statusFilter === "pending" && p.accessStatus === "pending") ||
      (statusFilter === "needs_request" && (p.accessStatus === "none" || p.accessStatus === "declined" || p.accessStatus === "revoked"));

    return matchesSearch && matchesStatus;
  });

  const authorizedCount = patients.filter(p => p.accessStatus === "granted" || p.accessStatus === "emergency_override").length;
  const pendingCount = patients.filter(p => p.accessStatus === "pending").length;
  const revokedCount = patients.filter(p => p.accessStatus === "revoked").length;
  const needsActionCount = patients.filter(p => p.accessStatus === "revoked" || p.accessStatus === "none" || p.accessStatus === "declined").length;
  const confirmedAppointmentsCount = doctorAppointments.filter(a => a.status === "confirmed" || a.status === "rescheduled").length;

  if (isVerifyingDoctor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white select-none">
        <div className="flex flex-col items-center gap-4 max-w-sm px-6 text-center animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-xl">
            <Stethoscope className="w-7 h-7 text-teal-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold tracking-tight text-white">
              MedMatch AI Clinical Workstation
            </h2>
            <p className="text-xs text-teal-200/70">
              Verifying physician credentials and clinical session security...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafbfc] dark:bg-[#090d16] text-slate-900 dark:text-slate-100 font-sans pb-24">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-lg shadow-xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Clinical Header */}
      <header className="border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-[#0c1220]/95 backdrop-blur-md sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <Link href="/" className="flex items-center gap-2.5 text-teal-900 dark:text-teal-200 font-extrabold tracking-tight text-lg hover:opacity-90 transition-opacity">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-4.5 h-4.5" />
              </div>
              <span>MedMatch <span className="text-teal-600 dark:text-teal-400">AI</span></span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700 font-light hidden sm:inline">|</span>
            <div className="flex items-center gap-2.5 text-xs">
              <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold text-xs border border-teal-200 dark:border-teal-800 shadow-xs">
                {getDoctorName().replace(/^Dr\.\s*/i, "").slice(0, 1) || "D"}
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                    {getDoctorName()}
                  </span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded font-bold bg-teal-50 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border border-teal-200/80 dark:border-teal-800">
                    PMC Regd. EP-22045
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[280px]">
                  Ranjit Maternity Clinic &amp; Medical Network
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <button
              onClick={() => setIsQrScannerOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 transition-all cursor-pointer shadow-xs"
              title="Scan Patient Emergency QR Pass"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">Scan QR Pass</span>
            </button>
            <Link
              href="/dashboard/scan"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 transition-all shadow-xs hover:shadow"
              title="Launch Prescription OCR Engine"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Prescription OCR</span>
            </Link>
            <button
              onClick={handleDoctorLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-slate-600 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-slate-200/80 dark:border-slate-800 rounded-xl transition-all cursor-pointer font-semibold"
              title="Sign Out of Doctor Workstation"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workstation Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        
        {/* Executive Clinical Telemetry Header */}
        <section className="mb-7">
          <div className="rounded-3xl bg-gradient-to-br from-white via-teal-50/25 to-slate-50 dark:from-slate-900 dark:via-teal-950/20 dark:to-slate-900/90 border border-slate-200/90 dark:border-slate-800 p-5 sm:p-6 mb-6 shadow-xs">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-teal-100/80 dark:bg-teal-950 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Hospital Clinical Workstation • Live Network
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Shift ID: OPD-2026-CH-01
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
                  {getGreeting()}, <span className="text-teal-700 dark:text-teal-300">{getDoctorName()}</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
                  Decrypted patient health records, live consent permission registry, and scheduled outpatient consultation queue.
                </p>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-center">
                <button
                  onClick={() => setIsQrScannerOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 rounded-xl transition-all shadow-sm hover:shadow flex items-center gap-2 cursor-pointer hover:scale-102"
                  title="Scan Patient Emergency QR Pass or Enter Token"
                >
                  <QrCode className="w-4 h-4 text-emerald-200" />
                  <span>Scan Emergency QR Pass</span>
                </button>
                <button
                  onClick={loadRegistryData}
                  className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                  title="Refresh patient authorization statuses"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Sync Registry</span>
                </button>
                <Link
                  href="/dashboard/scan"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Prescription Scanner (OCR)</span>
                </Link>
              </div>
            </div>
          </div>

          {/* 4 Responsive Executive Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Registered Cohort */}
            <div 
              onClick={() => { setActiveTab("patients"); setStatusFilter("all"); setSelectedPatient(null); }}
              className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-teal-500/50 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                </div>
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Registry
                </span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tracking-tight block">
                  {patients.length}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                  Hospital Patients
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Active patient cohort</span>
                <span className="text-teal-600 dark:text-teal-400 font-semibold group-hover:underline">View all →</span>
              </div>
            </div>

            {/* Card 2: Records Authorized */}
            <div 
              onClick={() => { setActiveTab("patients"); setStatusFilter("granted"); setSelectedPatient(null); }}
              className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-950/60 rounded-2xl p-5 shadow-xs hover:border-emerald-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Unlocked
                </span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 font-mono tracking-tight block">
                  {authorizedCount}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                  Records Authorized
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{patients.length > 0 ? Math.round((authorizedCount / patients.length) * 100) : 0}% of registry decrypted</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold group-hover:underline">Filter →</span>
              </div>
            </div>

            {/* Card 3: Consultation Queue */}
            <div 
              onClick={() => { setActiveTab("appointments"); setSelectedPatient(null); }}
              className="bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-950/60 rounded-2xl p-5 shadow-xs hover:border-indigo-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  OPD Queue
                </span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-indigo-700 dark:text-indigo-300 font-mono tracking-tight block">
                  {confirmedAppointmentsCount}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                  Consultation Visits
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>Scheduled OPD clinic appointments</span>
                <span className="text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline">Open Queue →</span>
              </div>
            </div>

            {/* Card 4: Action Needed & Revoked */}
            <div 
              onClick={() => { setActiveTab("patients"); setStatusFilter("needs_request"); setSelectedPatient(null); }}
              className="bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-950/60 rounded-2xl p-5 shadow-xs hover:border-rose-500/60 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold group-hover:scale-105 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/60">
                  Action Needed
                </span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-extrabold text-rose-700 dark:text-rose-400 font-mono tracking-tight block">
                  {needsActionCount}
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mt-0.5">
                  Revoked &amp; Locked
                </span>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>{revokedCount} revoked • {pendingCount} awaiting</span>
                <span className="text-rose-600 dark:text-rose-400 font-semibold group-hover:underline">Review →</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workstation Elevated Segmented Tab Controls */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-6 overflow-x-auto">
          <button
            onClick={() => { setActiveTab("patients"); setSelectedPatient(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "patients"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Registered Patients</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === "patients" ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {patients.length}
            </span>
          </button>

          <button
            onClick={() => { setActiveTab("appointments"); setSelectedPatient(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "appointments"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-indigo-500" />
            <span>Consultations &amp; OPD Queue</span>
            {confirmedAppointmentsCount > 0 && (
              <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {confirmedAppointmentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => { setActiveTab("requests"); setSelectedPatient(null); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === "requests"
                ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-teal-600" />
            <span>Authorization Requests Log</span>
            <span className={`px-2 py-0.2 rounded-full text-[10px] font-mono ${
              activeTab === "requests" ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
            }`}>
              {allRequests.length}
            </span>
          </button>

          <button
            onClick={() => setIsQrScannerOpen(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800/80 sm:ml-auto shrink-0 shadow-xs hover:shadow"
            title="Scan Patient Emergency QR Pass"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Scan Emergency QR Pass</span>
          </button>
        </div>

        {/* =========================================================================
            VIEW 1: REGISTERED PATIENT DIRECTORY
            ========================================================================= */}
        {activeTab === "patients" && !selectedPatient && (
          <div className="space-y-6">
            {/* Search, Filter & Layout Toolbar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="relative flex-1 max-w-lg">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by patient name, email, condition, phone, or UID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-slate-900 dark:text-slate-100"
                />
                {patientSearch && (
                  <button
                    onClick={() => setPatientSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Segmented Filter Pills & Layout Mode Toggle */}
              <div className="flex items-center gap-2 justify-between lg:justify-end flex-wrap">
                <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
                  {(
                    [
                      { key: "all", label: `All Patients (${patients.length})` },
                      { key: "granted", label: `Authorized (${authorizedCount})` },
                      { key: "pending", label: `Awaiting (${pendingCount})` },
                      { key: "needs_request", label: `Action Needed (${needsActionCount})` },
                    ] as const
                  ).map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => setStatusFilter(key)}
                      className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                        statusFilter === key
                          ? "bg-teal-700 text-white dark:bg-teal-600 dark:text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* View Switcher: Cards vs Table */}
                <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPatientViewMode("cards")}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                      patientViewMode === "cards"
                        ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                    title="Interactive Cards View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPatientViewMode("table")}
                    className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                      patientViewMode === "table"
                        ? "bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-300 shadow-xs"
                        : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                    title="Dense Table View"
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Structured Main Content: Split Grid with Patient Roster & Shift Companion */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Primary Column: Patients Display (Cards or Table) */}
              <div className="xl:col-span-8 space-y-4">
                {filteredPatients.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center text-slate-400 shadow-xs">
                    <Users className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      No registered patients match this filter
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Try adjusting your search criteria or switch to "All Patients" to view the complete clinic directory.
                    </p>
                  </div>
                ) : patientViewMode === "cards" ? (
                  /* Modern Cards Grid View */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredPatients.map((patient) => {
                      const isGranted = patient.accessStatus === "granted" || patient.accessStatus === "emergency_override";
                      const isPending = patient.accessStatus === "pending";
                      const isRevoked = patient.accessStatus === "revoked";
                      const upAppt = doctorAppointments.find(
                        (a) =>
                          a.patientEmail.toLowerCase() === patient.patientEmail.toLowerCase() &&
                          (a.status === "confirmed" || a.status === "rescheduled")
                      );

                      return (
                        <div
                          key={patient.patientEmail}
                          className={`relative overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border transition-all duration-200 hover:shadow-md flex flex-col justify-between ${
                            isGranted
                              ? "border-emerald-200/90 dark:border-emerald-900/60 shadow-xs"
                              : isRevoked
                              ? "border-rose-200/90 dark:border-rose-950/60"
                              : isPending
                              ? "border-amber-200/90 dark:border-amber-950/60"
                              : "border-slate-200/90 dark:border-slate-800"
                          }`}
                        >
                          {/* Status Banner Strip on Top */}
                          <div
                            className={`px-4 py-2 border-b flex items-center justify-between text-xs ${
                              isGranted
                                ? "bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-300"
                                : isRevoked
                                ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40 text-rose-800 dark:text-rose-300"
                                : isPending
                                ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40 text-amber-800 dark:text-amber-300"
                                : "bg-slate-50/70 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold">
                              {isGranted ? (
                                <>
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                  <span>Vault Decrypted &amp; Authorized</span>
                                </>
                              ) : isRevoked ? (
                                <>
                                  <Lock className="w-3.5 h-3.5 text-rose-600" />
                                  <span>Access Revoked by Patient</span>
                                </>
                              ) : isPending ? (
                                <>
                                  <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                  <span>Awaiting Patient Consent</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Authorization Required</span>
                                </>
                              )}
                            </div>

                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700">
                              {patient.patientUid}
                            </span>
                          </div>

                          {/* Card Body */}
                          <div className="p-4 space-y-3.5">
                            {/* Patient Identity & Blood Group */}
                            <div className="flex items-start gap-3">
                              <div
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold text-sm text-white shrink-0 shadow-xs ${
                                  isGranted
                                    ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                                    : isRevoked
                                    ? "bg-gradient-to-br from-rose-500 to-slate-700"
                                    : "bg-gradient-to-br from-teal-600 to-slate-700"
                                }`}
                              >
                                {patient.patientName.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate">
                                    {patient.patientName}
                                  </h4>
                                  <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800">
                                    {patient.bloodGroup}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                                  {patient.patientEmail} • {patient.phoneNumber}
                                </p>
                                <p className="text-[11px] text-slate-400">
                                  {patient.ageGender}
                                </p>
                              </div>
                            </div>

                            {/* Clinical Condition & Vault Counts */}
                            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-1.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">Primary Condition:</span>
                                <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[170px]" title={patient.primaryCondition}>
                                  {patient.primaryCondition}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[11px] font-mono">
                                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-teal-800 dark:text-teal-300 font-bold border border-slate-200/60 dark:border-slate-700">
                                  {patient.prescriptionsCount ?? 0} Prescriptions
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold border border-slate-200/60 dark:border-slate-700">
                                  {patient.documentsCount ?? 0} Lab Reports
                                </span>
                              </div>
                            </div>

                            {/* Upcoming Appointment Tag if scheduled */}
                            {upAppt && (
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/50 text-xs">
                                <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                <span className="text-indigo-900 dark:text-indigo-200 truncate">
                                  Scheduled OPD: <strong>{upAppt.date}</strong> at {upAppt.time}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Card Action Footer */}
                          <div className="p-3.5 bg-slate-50/60 dark:bg-slate-950/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                            {isGranted ? (
                              <>
                                <button
                                  onClick={() => handleOpenPatientChart(patient)}
                                  className="flex-1 px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:scale-101"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Open Medical Vault</span>
                                </button>
                                <button
                                  onClick={() => downloadMedicalSummaryReport(patient.patientEmail, { doctorName: userSession?.name || "Dr. Reeta Bhambri" })}
                                  className="px-2.5 py-2 rounded-xl font-medium text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer shrink-0"
                                  title="Download Clinical Summary"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span className="hidden sm:inline">Summary</span>
                                </button>
                              </>
                            ) : isPending ? (
                              <div className="w-full flex items-center justify-between gap-2">
                                <span className="text-xs text-amber-700 dark:text-amber-400 font-semibold flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>Authorization Pending</span>
                                </span>
                                <button
                                  onClick={() => handleOpenRequestModal(patient)}
                                  className="px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/50 hover:bg-amber-200/80 transition-colors cursor-pointer"
                                >
                                  Update
                                </button>
                              </div>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleOpenRequestModal(patient)}
                                  className="flex-1 px-3.5 py-2 rounded-xl font-bold text-xs text-white bg-teal-600 hover:bg-teal-700 transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:scale-101"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  <span>{isRevoked ? "Request Access Again" : "Request Access"}</span>
                                </button>
                                <button
                                  onClick={() => handleOpenEmergencyBreakGlass(patient)}
                                  className="px-2.5 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-semibold transition-colors shrink-0 cursor-pointer"
                                  title="Emergency Break-Glass Override"
                                >
                                  ER Override
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Dense Table View */
                  <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50/90 dark:bg-slate-950/80 border-b border-slate-200/90 dark:border-slate-800 text-[11px] text-slate-500 uppercase tracking-wider font-bold">
                            <th className="py-3.5 px-4">Patient Identity</th>
                            <th className="py-3.5 px-4">Demographics &amp; Contact</th>
                            <th className="py-3.5 px-4 text-center">Clinical Vault</th>
                            <th className="py-3.5 px-4">Authorization Status</th>
                            <th className="py-3.5 px-4 text-right">Workstation Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                          {filteredPatients.map((patient) => {
                            const isGranted = patient.accessStatus === "granted" || patient.accessStatus === "emergency_override";
                            const isPending = patient.accessStatus === "pending";
                            const isRevoked = patient.accessStatus === "revoked";

                            return (
                              <tr 
                                key={patient.patientEmail}
                                className="hover:bg-teal-50/20 dark:hover:bg-slate-800/40 transition-colors group"
                              >
                                {/* Patient Identity */}
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                                      {patient.patientName.slice(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100 flex flex-wrap items-center gap-1.5">
                                        <span>{patient.patientName}</span>
                                        {(() => {
                                          const upAppt = doctorAppointments.find(
                                            (a) =>
                                              a.patientEmail.toLowerCase() === patient.patientEmail.toLowerCase() &&
                                              (a.status === "confirmed" || a.status === "rescheduled")
                                          );
                                          if (!upAppt) return null;
                                          return (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-200/60 dark:border-indigo-800/60">
                                              <Calendar className="w-3 h-3 text-indigo-500" />
                                              <span>{upAppt.date}</span>
                                            </span>
                                          );
                                        })()}
                                      </div>
                                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                                        <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                          {patient.patientUid}
                                        </span>
                                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200/60">
                                          {patient.bloodGroup}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>

                                {/* Demographics & Contact */}
                                <td className="py-4 px-4">
                                  <div className="text-xs font-medium text-slate-800 dark:text-slate-200">{patient.patientEmail}</div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">{patient.phoneNumber}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">{patient.ageGender}</div>
                                </td>

                                {/* Clinical Vault Summary */}
                                <td className="py-4 px-4 text-center">
                                  <div className="inline-flex flex-col items-center gap-1">
                                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 max-w-[180px] truncate block" title={patient.primaryCondition}>
                                      {patient.primaryCondition}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                                        {patient.prescriptionsCount ?? 0} Rx
                                      </span>
                                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                                        {patient.documentsCount ?? 0} Labs
                                      </span>
                                    </div>
                                  </div>
                                </td>

                                {/* Access Authorization Status */}
                                <td className="py-4 px-4">
                                  {isGranted ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                      <span>Access Granted</span>
                                      {patient.accessStatus === "emergency_override" && (
                                        <span className="text-[10px] uppercase font-extrabold text-rose-600 dark:text-rose-400 ml-1">
                                          [ER Override]
                                        </span>
                                      )}
                                    </div>
                                  ) : isPending ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                                      <Clock className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                                      <span>Awaiting Approval</span>
                                    </div>
                                  ) : isRevoked ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                      <Lock className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Access Revoked</span>
                                    </div>
                                  ) : patient.accessStatus === "declined" ? (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Request Declined</span>
                                    </div>
                                  ) : (
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Authorization Required</span>
                                    </div>
                                  )}
                                </td>

                                {/* Workstation Actions */}
                                <td className="py-4 px-4 text-right">
                                  <div className="inline-flex items-center justify-end gap-2">
                                    {isGranted ? (
                                      <>
                                        <button
                                          onClick={() => handleOpenPatientChart(patient)}
                                          className="px-3.5 py-1.5 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-xs hover:scale-102"
                                          title="Open Decrypted Clinical Records"
                                        >
                                          <Eye className="w-3.5 h-3.5" />
                                          <span>View Records</span>
                                        </button>
                                        <button
                                          onClick={() => downloadMedicalSummaryReport(patient.patientEmail, { doctorName: userSession?.name || "Dr. Reeta Bhambri" })}
                                          className="px-2.5 py-1.5 rounded-xl font-medium text-slate-700 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                                          title="Download/Print Clinical Summary"
                                        >
                                          <Download className="w-3.5 h-3.5" />
                                          <span className="hidden sm:inline">Summary</span>
                                        </button>
                                      </>
                                    ) : isPending ? (
                                      <button
                                        onClick={() => handleOpenRequestModal(patient)}
                                        className="px-3.5 py-1.5 rounded-xl text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300/70 transition-colors text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5"
                                        title="Awaiting patient consent. Click to update request."
                                      >
                                        <Clock className="w-3 h-3 text-amber-600" />
                                        <span>Pending Authorization</span>
                                      </button>
                                    ) : (
                                      <div className="flex items-center justify-end gap-2">
                                        <button
                                          onClick={() => handleOpenRequestModal(patient)}
                                          className="px-3.5 py-1.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-all inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-102"
                                        >
                                          <Send className="w-3.5 h-3.5" />
                                          <span>{isRevoked ? "Request Access Again" : "Request Access"}</span>
                                        </button>
                                        <button
                                          onClick={() => handleOpenEmergencyBreakGlass(patient)}
                                          className="text-[11px] text-rose-600 hover:text-rose-800 dark:text-rose-400 font-semibold hover:underline px-1 py-1 cursor-pointer"
                                          title="Emergency Break-Glass Override"
                                        >
                                          Emergency
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Secondary Column: Clinical Shift Companion Panel */}
              <div className="xl:col-span-4 space-y-4">
                {/* Panel 1: Today's Consultation Schedule */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4.5 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Today's OPD Queue
                      </h4>
                    </div>
                    <button
                      onClick={() => { setActiveTab("appointments"); setSelectedPatient(null); }}
                      className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-semibold cursor-pointer"
                    >
                      Full Queue ({confirmedAppointmentsCount}) →
                    </button>
                  </div>

                  {doctorAppointments.filter(a => a.status === "confirmed" || a.status === "rescheduled").length === 0 ? (
                    <div className="text-center py-6 text-slate-400">
                      <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto mb-1.5" />
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No OPD visits remaining for today</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Walk-ins can be registered anytime.</p>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {doctorAppointments
                        .filter(a => a.status === "confirmed" || a.status === "rescheduled")
                        .slice(0, 3)
                        .map((apt) => (
                          <div
                            key={apt.id}
                            className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                                {apt.patientName}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                  {apt.time}
                                </span>
                                <span>•</span>
                                <span className="truncate">{apt.reason || "Clinical Consultation"}</span>
                              </div>
                            </div>
                            <button
                              onClick={() => handleOpenDossierFromAppointment(apt)}
                              className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 border border-teal-200/60 dark:border-teal-800 shrink-0 cursor-pointer"
                            >
                              Open Chart
                            </button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Emergency QR Pass Scanner Card */}
                <div className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900/5 dark:from-emerald-950/40 dark:via-teal-950/20 dark:to-slate-900 border border-emerald-200/90 dark:border-emerald-800/60 p-4.5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        Emergency QR Pass
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Instant Unlock
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Connect to patient emergency profile, blood group, critical allergies, and unlocked records by scanning their QR pass or entering token (e.g. <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">EMG-1492-VLT</span>).
                  </p>
                  <button
                    onClick={() => setIsQrScannerOpen(true)}
                    className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer hover:shadow"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>Launch QR Scanner &amp; Token Pass</span>
                  </button>
                </div>

                {/* Panel 2: Multi-Doctor Calibrated Prescription OCR */}
                <div className="rounded-2xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-slate-900/5 dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-slate-900 border border-teal-200 dark:border-teal-800/60 p-4.5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                        AI Prescription Scanner
                      </h4>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200">
                      4 Calibrated
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Decipher handwritten prescription slips with zero-hallucination dual document cross-verification.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/80 dark:bg-slate-800 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300">
                      Dr. Reeta Bhambri
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/80 dark:bg-slate-800 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300">
                      Dr. Lovepreet
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/80 dark:bg-slate-800 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300">
                      Dr. Sandeep Kumar
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-white/80 dark:bg-slate-800 border border-teal-200/80 dark:border-teal-800 text-teal-800 dark:text-teal-300">
                      Dr. Meenakshi Jain
                    </span>
                  </div>
                  <Link
                    href="/dashboard/scan"
                    className="w-full mt-2 py-2 px-3 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Launch Scanner Workstation</span>
                  </Link>
                </div>

                {/* Panel 3: Clinical Governance & Privacy Seal */}
                <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 text-xs space-y-2.5 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-900 dark:text-slate-100 font-bold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>DPDP Act 2023 &amp; Consent Directives</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    All patient clinical records are locked with patient-mediated encryption keys. Access is strictly logged into immutable audit registries with timestamp and physician license attribution.
                  </p>
                  <div className="pt-1 flex items-center gap-2 text-[10px] text-slate-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>SHA-256 Audit Integrity Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}


                {/* =========================================================================
            VIEW 2: READ-ONLY CLINICAL RECORDS CHART (When Patient Selected)
            ========================================================================= */}
        {selectedPatient && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Chart Top Navigation / Patient Overview Header */}
            <div className="pb-4 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={handleClosePatientChart}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Return to Directory"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {selectedPatient.patientName}
                    </h2>
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {selectedPatient.patientUid}
                    </span>
                    {(selectedPatient.accessStatus === "granted" || selectedPatient.accessStatus === "emergency_override") && !accessDeniedError ? (
                      <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                        Verified Clinical Vault
                      </span>
                    ) : selectedPatient.accessStatus === "revoked" || (accessDeniedError && accessDeniedError.includes("403")) ? (
                      <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 px-2 py-0.5 rounded border border-rose-200/60 dark:border-rose-800/60">
                        Access Revoked by Patient
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200/60 dark:border-amber-800/60">
                        Authorization Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPatient.patientEmail} • {selectedPatient.ageGender} • Blood Group: <strong>{selectedPatient.bloodGroup}</strong> • Allergies: <strong>{selectedPatient.allergiesSummary || "None recorded"}</strong>
                  </p>
                </div>
              </div>

              {/* Prominent Action Bar */}
              <div className="flex items-center gap-2.5">
                {(selectedPatient.accessStatus === "granted" || selectedPatient.accessStatus === "emergency_override") && !accessDeniedError ? (
                  <>
                    <button
                      onClick={() => downloadMedicalSummaryReport(selectedPatient.patientEmail, { doctorName: userSession?.name || "Dr. Reeta Bhambri" })}
                      className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Download Clinical Summary (PDF)</span>
                    </button>
                    <Link
                      href={`/dashboard/scan?patientEmail=${encodeURIComponent(selectedPatient.patientEmail)}&patientName=${encodeURIComponent(selectedPatient.patientName)}`}
                      className="px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-teal-600" />
                      <span>Scan New Prescription</span>
                    </Link>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      const p = selectedPatient;
                      handleClosePatientChart();
                      handleOpenRequestModal(p);
                    }}
                    className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Access Again</span>
                  </button>
                )}
                <button
                  onClick={handleClosePatientChart}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Close Chart
                </button>
              </div>
            </div>

            {/* If Access is Revoked, Unauthorized, or Backend 403 Forbidden */}
            {accessDeniedError || !(selectedPatient.accessStatus === "granted" || selectedPatient.accessStatus === "emergency_override") ? (
              <div className="py-12 px-6">
                <div className="bg-gradient-to-b from-rose-50/60 via-white to-rose-50/30 dark:from-rose-950/20 dark:via-slate-900 dark:to-rose-950/10 border-2 border-rose-200 dark:border-rose-900/60 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto shadow-sm space-y-5 animate-in zoom-in-95 duration-200">
                  <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto border border-rose-300 dark:border-rose-800 shadow-sm">
                    <ShieldAlert className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200 border border-rose-200 dark:border-rose-800">
                      <Lock className="w-3.5 h-3.5" />
                      403 Access Revoked
                    </span>
                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                      {accessDeniedError && accessDeniedError.includes("403")
                        ? "403 Forbidden — Clinical Access Revoked"
                        : selectedPatient.accessStatus === "revoked"
                        ? "Clinical Access Revoked by Patient"
                        : "Record Access Authorization Required"}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                      {accessDeniedError ||
                        (selectedPatient.accessStatus === "revoked"
                          ? `The patient (${selectedPatient.patientName}) has actively revoked your clinical access privileges. Cryptographic decryption keys for their prescriptions and lab scans have been terminated.`
                          : `You do not have active clinical authorization to view ${selectedPatient.patientName}'s medical vault.`)}
                    </p>
                  </div>
                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      onClick={() => {
                        const p = selectedPatient;
                        handleClosePatientChart();
                        handleOpenRequestModal(p);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Request Access Again</span>
                    </button>
                    <button
                      onClick={handleClosePatientChart}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs sm:text-sm border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                    >
                      Return to Directory
                    </button>
                  </div>
                  <div className="pt-2 border-t border-rose-100 dark:border-rose-900/30">
                    <button
                      onClick={() => {
                        const p = selectedPatient;
                        handleClosePatientChart();
                        handleOpenEmergencyBreakGlass(p);
                      }}
                      className="text-xs text-rose-600 hover:text-rose-800 dark:text-rose-400 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Emergency Break-Glass Override Protocol</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
            {/* Offline / Demonstration Notice if backend was unreachable */}
            {networkOfflineNotice && (
              <div className="mx-6 mb-4 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/90 dark:bg-amber-950/50 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{networkOfflineNotice}</span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 rounded text-amber-900 dark:text-amber-200 font-semibold">
                  Offline Demo Snapshot
                </span>
              </div>
            )}

            {isLoadingChart && (
              <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
                <p className="text-xs">Verifying authorization with hospital server...</p>
              </div>
            )}
            {/* Patient Consultations & Appointment Schedule */}
            {doctorAppointments.filter(a => a.patientEmail.toLowerCase() === selectedPatient.patientEmail.toLowerCase()).length > 0 && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-teal-600" />
                    <h3 className="font-bold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Consultation History &amp; Scheduled Appointments
                    </h3>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {doctorAppointments.filter(a => a.patientEmail.toLowerCase() === selectedPatient.patientEmail.toLowerCase()).length} recorded
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {doctorAppointments.filter(a => a.patientEmail.toLowerCase() === selectedPatient.patientEmail.toLowerCase()).map(apt => (
                    <div key={apt.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 dark:text-slate-100">{apt.reason}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          apt.status === "completed" ? "bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        }`}>
                          {apt.status === "completed" ? "Completed" : "Scheduled"}
                        </span>
                      </div>
                      <div className="text-[11px] text-teal-700 dark:text-teal-300 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3 h-3" />
                        <span>{apt.date} at {apt.time}</span>
                      </div>
                      {apt.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          &quot;{apt.notes}&quot;
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Read-Only Record Section Selector */}
            <div className="flex items-center gap-6 text-xs font-semibold border-b border-slate-200/80 dark:border-slate-800/80 pb-2">
              <button
                onClick={() => setClinicalViewerTab("prescriptions")}
                className={`pb-1 transition-colors ${
                  clinicalViewerTab === "prescriptions"
                    ? "text-teal-700 dark:text-teal-400 border-b-2 border-teal-600"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Prescriptions &amp; OCR Extractions ({patientPrescriptions.length})
              </button>
              <button
                onClick={() => setClinicalViewerTab("reports")}
                className={`pb-1 transition-colors ${
                  clinicalViewerTab === "reports"
                    ? "text-teal-700 dark:text-teal-400 border-b-2 border-teal-600"
                    : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                }`}
              >
                Diagnostic Reports &amp; Scans ({patientDocuments.length})
              </button>
            </div>

            {/* SUB-TAB 1: PRESCRIPTIONS & OCR MEDS */}
            {clinicalViewerTab === "prescriptions" && (
              <div className="space-y-6">
                {patientPrescriptions.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No prescriptions have been uploaded to this patient&apos;s vault yet.
                  </div>
                ) : (
                  patientPrescriptions.map((rx) => (
                    <div 
                      key={rx.id}
                      className="border-b border-slate-200/80 dark:border-slate-800/80 pb-6 space-y-3"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                            {rx.doc || "Physician"}
                          </span>
                          <span className="text-slate-500 ml-2">• {rx.hospital || "Medical Facility"}</span>
                        </div>
                        <div className="text-slate-500 font-mono">
                          Date: <strong className="text-slate-700 dark:text-slate-300">{rx.date}</strong> | Indication: <strong className="text-slate-700 dark:text-slate-300">{rx.diag || "General"}</strong>
                        </div>
                      </div>

                      {/* Extracted Medicines Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold bg-slate-50/60 dark:bg-slate-900/40">
                              <th className="py-2 px-3">Medication</th>
                              <th className="py-2 px-3">Dosage</th>
                              <th className="py-2 px-3">Frequency</th>
                              <th className="py-2 px-3">Duration</th>
                              <th className="py-2 px-3">Instructions</th>
                              <th className="py-2 px-3 text-right">OCR Confidence</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60">
                            {(rx.medicines || []).map((m, idx) => {
                              const name = m.name || m.medicine_name || "Medication Item";
                              const dose = m.dosage || m.dose || "—";
                              const freq = m.frequency || m.freq || "—";
                              const dur = m.duration || m.dur || "—";
                              const instr = m.instructions || m.instr || "As directed";
                              const conf = m.confidence || m.conf || rx.conf || "High";

                              return (
                                <tr key={idx} className="hover:bg-slate-50/40 dark:hover:bg-slate-900/20">
                                  <td className="py-2 px-3 font-semibold text-slate-900 dark:text-slate-100">
                                    {name}
                                  </td>
                                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{dose}</td>
                                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{freq}</td>
                                  <td className="py-2 px-3 text-slate-600 dark:text-slate-400">{dur}</td>
                                  <td className="py-2 px-3 text-slate-500 text-[11px]">{instr}</td>
                                  <td className="py-2 px-3 text-right">
                                    <span className="inline-block text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                                      {conf}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* Scanned Prescription Image Thumbnail if available */}
                      {rx.imageDataUrl && (
                        <div className="pt-2 flex items-center gap-3">
                          <button
                            onClick={() => setActiveZoomImage(rx.imageDataUrl!)}
                            className="text-xs text-teal-700 dark:text-teal-400 hover:underline inline-flex items-center gap-1 font-medium"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Original Prescription Slip</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* SUB-TAB 2: DIAGNOSTIC REPORTS & SCANS */}
            {clinicalViewerTab === "reports" && (
              <div className="space-y-4">
                {patientDocuments.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs">
                    No diagnostic reports logged for this patient.
                  </div>
                ) : (
                  patientDocuments.map((doc) => (
                    <div 
                      key={doc.id}
                      className="border-b border-slate-200/80 dark:border-slate-800/80 pb-5 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <strong className="text-slate-900 dark:text-slate-100 font-bold text-sm">
                          {doc.title}
                        </strong>
                        <span className="text-slate-500 font-mono">
                          {doc.date} • {doc.facility}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                        {doc.summary}
                      </p>
                      {doc.findings && doc.findings.length > 0 && (
                        <ul className="list-disc pl-5 space-y-0.5 text-slate-500 text-[11px]">
                          {doc.findings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
            </>
            )}
          </div>
        )}

        {/* =========================================================================
            VIEW 2: CONSULTATIONS & OPD APPOINTMENT QUEUE
            ========================================================================= */}
        {activeTab === "appointments" && !selectedPatient && (
          <div className="space-y-4">
            {/* Controls Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search consultations by patient, UID, or reason..."
                  value={appointmentSearch}
                  onChange={(e) => setAppointmentSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                {(["upcoming", "completed", "all"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setAppointmentFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      appointmentFilter === filter
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {filter === "upcoming" && `Upcoming & Confirmed (${doctorAppointments.filter(a => a.status === "confirmed" || a.status === "rescheduled").length})`}
                    {filter === "completed" && `Completed (${doctorAppointments.filter(a => a.status === "completed").length})`}
                    {filter === "all" && `All (${doctorAppointments.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Appointments Grid */}
            {(() => {
              const filteredList = doctorAppointments.filter((apt) => {
                if (appointmentFilter === "upcoming") {
                  if (apt.status === "completed" || apt.status === "cancelled") return false;
                } else if (appointmentFilter === "completed") {
                  if (apt.status !== "completed") return false;
                }
                if (!appointmentSearch.trim()) return true;
                const q = appointmentSearch.toLowerCase().trim();
                return (
                  apt.patientName.toLowerCase().includes(q) ||
                  apt.patientEmail.toLowerCase().includes(q) ||
                  apt.patientUid.toLowerCase().includes(q) ||
                  apt.reason.toLowerCase().includes(q) ||
                  (apt.notes || "").toLowerCase().includes(q) ||
                  apt.date.toLowerCase().includes(q)
                );
              });

              if (filteredList.length === 0) {
                return (
                  <div className="py-16 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/40 dark:bg-slate-900/40">
                    <CalendarDays className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      No consultations found in this queue
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      When patients book or request appointments from the patient portal, they will appear here with live synchronization.
                    </p>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredList.map((apt) => {
                    const matchedPatient = patients.find(p => p.patientEmail.toLowerCase() === apt.patientEmail.toLowerCase());
                    const hasAccess = matchedPatient && (matchedPatient.accessStatus === "granted" || matchedPatient.accessStatus === "emergency_override");
                    const isCompleted = apt.status === "completed";
                    const isCancelled = apt.status === "cancelled";

                    return (
                      <div
                        key={apt.id}
                        className={`rounded-xl border p-5 transition-all bg-white dark:bg-slate-900 flex flex-col justify-between ${
                          isCompleted
                            ? "border-slate-200/60 dark:border-slate-800/60 opacity-80"
                            : isCancelled
                            ? "border-rose-200/60 dark:border-rose-900/40 opacity-70"
                            : "border-slate-200 dark:border-slate-800 hover:border-teal-500/50 shadow-xs"
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Header: Patient Info & Badges */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                                  {apt.patientName}
                                </span>
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {apt.patientUid}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {apt.patientEmail}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {apt.urgency === "Priority" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/50 dark:border-rose-800/50">
                                  Priority
                                </span>
                              )}
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  isCompleted
                                    ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                                    : isCancelled
                                    ? "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300"
                                    : apt.status === "rescheduled"
                                    ? "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60"
                                    : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60"
                                }`}
                              >
                                {isCompleted ? "Completed" : isCancelled ? "Cancelled" : apt.status === "rescheduled" ? "Rescheduled" : "Confirmed"}
                              </span>
                            </div>
                          </div>

                          {/* Consultation Topic */}
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              {apt.reason}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              Specialty: <span className="font-medium text-slate-700 dark:text-slate-300">{apt.specialty}</span>
                            </div>
                          </div>

                          {/* Schedule Pill: Date, Time & Location */}
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs space-y-1">
                            <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-semibold">
                              <Clock className="w-3.5 h-3.5 text-teal-600" />
                              <span>{apt.date} • {apt.time}</span>
                            </div>
                            {apt.location && (
                              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                <span className="truncate">{apt.location}</span>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {apt.notes && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-teal-50/40 dark:bg-teal-950/20 p-2 rounded-lg border border-teal-100/40 dark:border-teal-900/30">
                              <span className="font-semibold text-teal-800 dark:text-teal-300">Visit Notes: </span>
                              {apt.notes}
                            </div>
                          )}
                        </div>

                        {/* Action Bar */}
                        <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDossierFromAppointment(apt)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-2xs cursor-pointer"
                              title={hasAccess ? "Open Patient Medical Vault" : "Request Clinical Access"}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{hasAccess ? "Open Dossier" : "Request Access"}</span>
                            </button>

                            <Link
                              href={`/dashboard/scan?patientEmail=${encodeURIComponent(apt.patientEmail)}&patientName=${encodeURIComponent(apt.patientName)}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                              title="Scan & Digitize Prescription for this Visit"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                              <span>Scan Rx</span>
                            </Link>
                          </div>

                          {!isCompleted && !isCancelled && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenDoctorReschedule(apt)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs transition-colors cursor-pointer"
                                title="Reschedule Consultation"
                              >
                                <Clock3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCompleteAppointment(apt.id, apt.patientName)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-200/60 dark:border-emerald-800/60 transition-colors cursor-pointer"
                                title="Mark Consultation Completed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Complete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* =========================================================================
            VIEW 3: AUTHORIZATION REQUESTS LOG
            ========================================================================= */}
        {activeTab === "requests" && (
          <div className="space-y-4">
            <div className="text-xs text-slate-500">
              Audit log of all clinical record access requests dispatched from this workstation to registered patients.
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Date Dispatched</th>
                    <th className="py-3 px-3">Patient</th>
                    <th className="py-3 px-3">Clinical Justification</th>
                    <th className="py-3 px-3">Scope Requested</th>
                    <th className="py-3 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60">
                  {allRequests.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No authorization requests dispatched yet.
                      </td>
                    </tr>
                  ) : (
                    allRequests.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-900/30">
                        <td className="py-3 px-3 font-mono text-slate-500">{r.createdAt}</td>
                        <td className="py-3 px-3 font-medium text-slate-900 dark:text-slate-100">
                          {r.patientName}
                          <div className="text-[10px] text-slate-400 font-normal">{r.patientEmail}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400">{r.clinicalReason}</td>
                        <td className="py-3 px-3 text-slate-500 text-[11px]">{r.requestedScope}</td>
                        <td className="py-3 px-3 text-right font-semibold">
                          {r.status === "approved" ? (
                            <span className="text-emerald-600 dark:text-emerald-400">Approved by Patient</span>
                          ) : r.status === "declined" ? (
                            <span className="text-rose-600 dark:text-rose-400">Declined</span>
                          ) : r.status === "revoked" ? (
                            <span className="text-rose-600 dark:text-rose-400">Revoked by Patient</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400">Pending Patient Response</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </main>

      {/* =========================================================================
          MODAL: REQUEST ACCESS DIALOG
          ========================================================================= */}
      {requestTargetPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 dark:bg-teal-950 text-teal-600 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {requestTargetPatient.accessStatus === "revoked" ? "Re-Request Clinical Record Access" : "Request Clinical Record Access"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {requestTargetPatient.accessStatus === "revoked" ? "Send re-authorization prompt to patient" : "Patient consent required to decrypt records"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setRequestTargetPatient(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendAccessRequest} className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/70 dark:border-teal-900/50 text-slate-700 dark:text-slate-300 leading-relaxed">
                <span className="text-slate-500 text-[11px] block">Target Patient:</span>
                <div className="font-bold text-sm text-teal-900 dark:text-teal-200 mt-0.5">
                  {requestTargetPatient.patientName} • {requestTargetPatient.patientUid}
                </div>
                <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-1">
                  {requestTargetPatient.patientEmail} • {requestTargetPatient.phoneNumber}
                </div>
                <div className="text-[11px] text-slate-500 mt-2 pt-2 border-t border-teal-100 dark:border-teal-900/40">
                  {requestTargetPatient.accessStatus === "revoked"
                    ? "Notice: Access was previously revoked by this patient. Submitting this form dispatches a new re-authorization request to their patient dashboard."
                    : "The patient will receive an authorization prompt on their dashboard and can review your clinical justification."}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Requested Clinical Scope
                </label>
                <select
                  value={requestScope}
                  onChange={(e) => setRequestScope(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="Full Prescriptions, Medications & Diagnostic Reports">Full Prescriptions, Medications &amp; Diagnostic Reports</option>
                  <option value="Active Medications & Drug-Drug Safety History">Active Medications &amp; Drug-Drug Safety History</option>
                  <option value="Diagnostic Lab Scans & Ultrasonic Imaging">Diagnostic Lab Scans &amp; Ultrasonic Imaging</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Clinical Justification &amp; Consultation Reason
                </label>
                <textarea
                  rows={3}
                  required
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="e.g. Antenatal consultation, medication reconciliation and allergy check"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRequestTargetPatient(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-all inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>
                    {isSubmittingRequest
                      ? "Dispatching Request..."
                      : requestTargetPatient.accessStatus === "revoked"
                      ? "Dispatch Re-Authorization Request"
                      : "Send Request to Patient"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EMERGENCY BREAK-GLASS OVERRIDE
          ========================================================================= */}
      {isEmergencyModalOpen && emergencyTargetPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-xl p-6 shadow-2xl border border-rose-200 dark:border-rose-900 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100 dark:border-rose-900/60 text-rose-700 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-base">
                Emergency Break-Glass Record Access Protocol
              </h3>
            </div>

            <form onSubmit={handleExecuteEmergencyBreakGlass} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/80 text-rose-900 dark:text-rose-200 leading-relaxed">
                <strong>Legal Medical Audit Notice:</strong> This protocol bypasses routine patient consent exclusively for acute life-threatening emergencies. Your physician identity, medical council registration, timestamp, and clinical justification are permanently sealed into the immutable audit ledger.
              </div>

              {emergencyError && (
                <div className="p-2.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-medium">
                  {emergencyError}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Target Patient
                </label>
                <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-semibold">
                  {emergencyTargetPatient.patientName} ({emergencyTargetPatient.patientUid})
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Clinical Emergency Justification
                </label>
                <input
                  type="text"
                  required
                  value={emergencyReason}
                  onChange={(e) => setEmergencyReason(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="attestation"
                  checked={emergencyAttestation}
                  onChange={(e) => setEmergencyAttestation(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="attestation" className="text-slate-700 dark:text-slate-300 text-[11px] leading-tight cursor-pointer">
                  I certify under Medical Council regulations that emergency record access is clinically imperative for immediate resuscitation and high-risk safety screening.
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEmergencyModalOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Execute Emergency Override</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: DOCTOR RESCHEDULE CONSULTATION
          ========================================================================= */}
      {rescheduleAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-teal-700 dark:text-teal-400 font-bold text-base">
                <Calendar className="w-4 h-4" />
                <h3>Reschedule Consultation</h3>
              </div>
              <button 
                onClick={() => setRescheduleAppointment(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveDoctorReschedule} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 text-slate-700 dark:text-slate-300">
                Rescheduling consultation for:
                <div className="font-bold text-teal-900 dark:text-teal-200 mt-0.5">
                  {rescheduleAppointment.patientName} ({rescheduleAppointment.reason})
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Current: {rescheduleAppointment.date} at {rescheduleAppointment.time}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  New Date
                </label>
                <input
                  type="date"
                  required
                  value={rescheduleNewDate.includes("-") ? rescheduleNewDate : ""}
                  onChange={(e) => setRescheduleNewDate(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Consultation Time Slot
                </label>
                <select
                  value={rescheduleNewTime}
                  onChange={(e) => setRescheduleNewTime(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="09:30 AM">09:30 AM (Morning OPD)</option>
                  <option value="10:30 AM">10:30 AM (Morning OPD)</option>
                  <option value="11:45 AM">11:45 AM (Clinical Rounds)</option>
                  <option value="02:30 PM">02:30 PM (Afternoon OPD)</option>
                  <option value="04:00 PM">04:00 PM (Evening Consultation)</option>
                  <option value="05:15 PM">05:15 PM (Evening Review)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Consultation Location / Clinic Room
                </label>
                <input
                  type="text"
                  value={rescheduleNewLocation}
                  onChange={(e) => setRescheduleNewLocation(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRescheduleAppointment(null)}
                  className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm &amp; Sync Schedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX MODAL: ORIGINAL PRESCRIPTION SLIP ZOOM
          ========================================================================= */}
      {activeZoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-3xl w-full bg-slate-900 rounded-xl overflow-hidden shadow-2xl relative">
            <div className="p-3 bg-slate-800 flex items-center justify-between text-white text-xs">
              <span className="font-semibold">Original Scanned Prescription Slip (High-Resolution)</span>
              <button
                onClick={() => setActiveZoomImage(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-black max-h-[80vh] overflow-auto">
              <img
                src={activeZoomImage}
                alt="Original prescription slip"
                className="max-w-full max-h-[75vh] object-contain rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: TIME-LIMITED EMERGENCY PATIENT QR PASS SCANNER
          ========================================================================= */}
      <DoctorQrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onScanSuccess={handleQrScanSuccess}
        doctorInfo={{
          doctorId: getDoctorId(),
          doctorName: getDoctorName(),
          hospital: "Ranjit Maternity Clinic & Emergency Center"
        }}
      />
    </div>
  );
}
