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
  AlertCircle
} from "lucide-react";
import { 
  verifyActiveSession,
  clearUserSession,
  UserSession
} from "@/lib/auth";
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
  DoctorAccessPermissionRequest
} from "@/lib/patientData";

export default function DoctorPortalPage() {
  const router = useRouter();
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isVerifyingDoctor, setIsVerifyingDoctor] = useState(true);

  // Data state
  const [patients, setPatients] = useState<DoctorPatientRecord[]>([]);
  const [allRequests, setAllRequests] = useState<DoctorAccessPermissionRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"patients" | "requests" | "emergency">("patients");

  // Search & Filter
  const [patientSearch, setPatientSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "granted" | "pending" | "needs_request">("all");

  // Selected Patient Clinical Chart Viewer (Read-Only)
  const [selectedPatient, setSelectedPatient] = useState<DoctorPatientRecord | null>(null);
  const [patientPrescriptions, setPatientPrescriptions] = useState<StoredPrescription[]>([]);
  const [patientDocuments, setPatientDocuments] = useState<PatientDocument[]>([]);
  const [clinicalViewerTab, setClinicalViewerTab] = useState<"prescriptions" | "reports">("prescriptions");
  const [activeZoomImage, setActiveZoomImage] = useState<string | null>(null);

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

  // Toast Notification
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  const loadRegistryData = () => {
    const docId = userSession?.email?.includes("duggal") ? "dr-duggal" : "dr-reeta";
    const patientList = getHospitalRegisteredPatients(docId);
    setPatients(patientList);
    setAllRequests(getAllDoctorAccessRequests().filter(r => r.doctorId === docId));
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
        loadRegistryData();
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
    }
  }, [isVerifyingDoctor, selectedPatient?.patientEmail]);

  const handleDoctorLogout = async () => {
    await clearUserSession();
    router.replace("/login");
  };

  const handleOpenPatientChart = (p: DoctorPatientRecord) => {
    setSelectedPatient(p);
    setPatientPrescriptions(getPatientPrescriptions(p.patientEmail));
    setPatientDocuments(getPatientDocuments(p.patientEmail));
    setClinicalViewerTab("prescriptions");
  };

  const handleClosePatientChart = () => {
    setSelectedPatient(null);
    setActiveZoomImage(null);
  };

  const handleOpenRequestModal = (p: DoctorPatientRecord) => {
    setRequestTargetPatient(p);
    setRequestReason(`Clinical consultation, health evaluation & medication reconciliation for ${p.patientName}`);
  };

  const handleSendAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestTargetPatient) return;
    setIsSubmittingRequest(true);

    const docId = userSession?.email?.includes("duggal") ? "dr-duggal" : "dr-reeta";
    const docName = userSession?.name || "Dr. Reeta Bhambri";

    createDoctorAccessRequest({
      doctorId: docId,
      doctorName: docName,
      doctorSpecialty: "Obstetrics & Antenatal Care",
      hospital: "Ranjit Maternity Clinic & Nursing Home",
      doctorLicense: "MCI-34182",
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
      (statusFilter === "needs_request" && (p.accessStatus === "none" || p.accessStatus === "declined"));

    return matchesSearch && matchesStatus;
  });

  const authorizedCount = patients.filter(p => p.accessStatus === "granted" || p.accessStatus === "emergency_override").length;
  const pendingCount = patients.filter(p => p.accessStatus === "pending").length;

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
      <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0c1220] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold tracking-tight text-base hover:opacity-85 transition-opacity">
              <Stethoscope className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <span>MedMatch AI</span>
            </Link>
            <span className="text-slate-300 dark:text-slate-700 font-light">|</span>
            <div className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {userSession?.name || "Dr. Reeta Bhambri"}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60 font-bold">
                MCI-34182
              </span>
              <span className="text-slate-400 hidden sm:inline">• Ranjit Maternity Clinic &amp; Emergency Center</span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <Link
              href="/dashboard/scan"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/40 border border-teal-200/70 dark:border-teal-800/60 font-medium transition-colors"
              title="Launch Prescription OCR Engine"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-600" />
              <span>Scan Prescription (OCR)</span>
            </Link>
            <button
              onClick={handleDoctorLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg transition-colors"
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
        
        {/* Unified Editorial Telemetry Strip (NO BOXES / NO CARDS) */}
        <section className="py-4 border-b border-slate-200/80 dark:border-slate-800/80 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Hospital Patient Workstation
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct clinical record access, prescription verification &amp; patient consent directory
              </p>
            </div>

            {/* Seamless Linear Metrics */}
            <div className="flex items-center divide-x divide-slate-200 dark:divide-slate-800 text-xs">
              <div className="pr-5">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Hospital Patients</span>
                <span className="text-xl font-bold text-slate-900 dark:text-slate-100 font-mono">{patients.length}</span>
              </div>
              <div className="px-5">
                <span className="text-[11px] text-teal-600 dark:text-teal-400 uppercase tracking-wider block">Records Authorized</span>
                <span className="text-xl font-bold text-teal-700 dark:text-teal-300 font-mono">{authorizedCount}</span>
              </div>
              <div className="pl-5">
                <span className="text-[11px] text-amber-600 dark:text-amber-400 uppercase tracking-wider block">Awaiting Consent</span>
                <span className="text-xl font-bold text-amber-700 dark:text-amber-300 font-mono">{pendingCount}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Workstation View Switcher Tabs (Simple Clinical Tabs, No Boxes) */}
        <div className="flex items-center gap-6 border-b border-slate-200/80 dark:border-slate-800/80 pb-3 mb-6 text-xs font-semibold">
          <button
            onClick={() => { setActiveTab("patients"); setSelectedPatient(null); }}
            className={`pb-2 -mb-3 transition-colors relative ${
              activeTab === "patients"
                ? "text-teal-700 dark:text-teal-400 border-b-2 border-teal-600"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            Registered Patient Directory ({patients.length})
          </button>
          <button
            onClick={() => { setActiveTab("requests"); setSelectedPatient(null); }}
            className={`pb-2 -mb-3 transition-colors relative ${
              activeTab === "requests"
                ? "text-teal-700 dark:text-teal-400 border-b-2 border-teal-600"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            Authorization Requests Log ({allRequests.length})
          </button>
        </div>

        {/* =========================================================================
            VIEW 1: REGISTERED PATIENT DIRECTORY
            ========================================================================= */}
        {activeTab === "patients" && !selectedPatient && (
          <div className="space-y-4">
            {/* Search and Category Filter Strip (Minimal, Clean) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search registered patients by name, email, or UID..."
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Status Filter Pills */}
              <div className="flex items-center gap-1.5 text-xs">
                {(["all", "granted", "pending", "needs_request"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                      statusFilter === filter
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    {filter === "all" && "All"}
                    {filter === "granted" && "Authorized"}
                    {filter === "pending" && "Awaiting Patient"}
                    {filter === "needs_request" && "Action Needed"}
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Directory Table / Ledger (NO BOXES, Clean Clinical Rows) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Patient Identity</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3 text-center">Prescriptions</th>
                    <th className="py-3 px-3 text-center">Diagnostic Reports</th>
                    <th className="py-3 px-3">Access Authorization</th>
                    <th className="py-3 px-3 text-right">Workstation Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-900/60">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        No registered patients matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map((patient) => {
                      const isGranted = patient.accessStatus === "granted" || patient.accessStatus === "emergency_override";
                      const isPending = patient.accessStatus === "pending";

                      return (
                        <tr 
                          key={patient.patientEmail}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-900/40 transition-colors group"
                        >
                          {/* Patient Identity */}
                          <td className="py-3.5 px-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-700 dark:text-slate-300 text-xs shrink-0">
                                {patient.patientName.slice(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 dark:text-slate-100">
                                  {patient.patientName}
                                </div>
                                <div className="font-mono text-[10px] text-slate-400">
                                  {patient.patientUid} • {patient.bloodGroup}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                            <div>{patient.patientEmail}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{patient.phoneNumber}</div>
                          </td>

                          {/* Prescriptions */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                              {patient.prescriptionsCount ?? 0}
                            </span>
                          </td>

                          {/* Diagnostic Reports */}
                          <td className="py-3.5 px-3 text-center">
                            <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                              {patient.documentsCount ?? 0}
                            </span>
                          </td>

                          {/* Access Authorization Status */}
                          <td className="py-3.5 px-3">
                            {isGranted ? (
                              <div className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Access Granted</span>
                                {patient.accessStatus === "emergency_override" && (
                                  <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-400 ml-1">
                                    [ER Break-Glass]
                                  </span>
                                )}
                              </div>
                            ) : isPending ? (
                              <div className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-300 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                <span>Awaiting Patient Approval</span>
                              </div>
                            ) : patient.accessStatus === "declined" ? (
                              <div className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-300 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>Request Declined</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                                <span>Authorization Required</span>
                              </div>
                            )}
                          </td>

                          {/* Workstation Actions */}
                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center justify-end gap-2">
                              {isGranted ? (
                                <>
                                  <button
                                    onClick={() => handleOpenPatientChart(patient)}
                                    className="px-3 py-1.5 rounded-md font-semibold text-teal-800 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/60 transition-colors inline-flex items-center gap-1"
                                    title="Open Read-Only Clinical Records"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>View Records</span>
                                  </button>
                                  <button
                                    onClick={() => downloadMedicalSummaryReport(patient.patientEmail, { doctorName: userSession?.name || "Dr. Reeta Bhambri" })}
                                    className="px-2.5 py-1.5 rounded-md font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                                    title="Download/Print Clinical Summary"
                                  >
                                    <Download className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Summary</span>
                                  </button>
                                </>
                              ) : isPending ? (
                                <button
                                  onClick={() => handleOpenRequestModal(patient)}
                                  className="px-3 py-1.5 rounded-md text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 transition-colors text-xs font-medium"
                                  title="Resend or update clinical access request"
                                >
                                  Pending Authorization
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => handleOpenRequestModal(patient)}
                                    className="px-3 py-1.5 rounded-md font-semibold text-white bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-600 transition-colors inline-flex items-center gap-1"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Request Access</span>
                                  </button>
                                  <button
                                    onClick={() => handleOpenEmergencyBreakGlass(patient)}
                                    className="text-[11px] text-rose-600 hover:text-rose-800 dark:text-rose-400 font-medium hover:underline ml-1"
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
                    })
                  )}
                </tbody>
              </table>
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
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60">
                      Verified Clinical Vault
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedPatient.patientEmail} • {selectedPatient.ageGender} • Blood Group: <strong>{selectedPatient.bloodGroup}</strong> • Allergies: <strong>{selectedPatient.allergiesSummary || "None recorded"}</strong>
                  </p>
                </div>
              </div>

              {/* Prominent Action Bar */}
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => downloadMedicalSummaryReport(selectedPatient.patientEmail, { doctorName: userSession?.name || "Dr. Reeta Bhambri" })}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-white bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Download Clinical Summary (PDF)</span>
                </button>
                <Link
                  href={`/dashboard/scan?patient=${encodeURIComponent(selectedPatient.patientEmail)}`}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600" />
                  <span>Scan New Prescription</span>
                </Link>
                <button
                  onClick={handleClosePatientChart}
                  className="px-3 py-2 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Close Chart
                </button>
              </div>
            </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                Request Clinical Record Access
              </h3>
              <button 
                onClick={() => setRequestTargetPatient(null)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSendAccessRequest} className="space-y-3.5 text-xs">
              <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/50 text-slate-700 dark:text-slate-300 leading-relaxed">
                You are requesting permission to access the personal health records of:
                <div className="font-bold text-teal-900 dark:text-teal-200 mt-1">
                  {requestTargetPatient.patientName} ({requestTargetPatient.patientEmail})
                </div>
                <div className="text-[11px] text-teal-700 dark:text-teal-400 mt-0.5">
                  The patient will receive an authorization prompt on their dashboard and can accept or reject access.
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Clinical Scope
                </label>
                <select
                  value={requestScope}
                  onChange={(e) => setRequestScope(e.target.value)}
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                >
                  <option value="Full Prescriptions, Medications & Diagnostic Reports">Full Prescriptions, Medications &amp; Diagnostic Reports</option>
                  <option value="Active Medications & Drug-Drug Safety History">Active Medications &amp; Drug-Drug Safety History</option>
                  <option value="Diagnostic Lab Scans & Ultrasonic Imaging">Diagnostic Lab Scans &amp; Ultrasonic Imaging</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                  Clinical Justification / Reason
                </label>
                <textarea
                  rows={2}
                  required
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="e.g. Antenatal consultation, medication reconciliation and allergy check"
                  className="w-full p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestTargetPatient(null)}
                  className="px-3 py-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-4 py-2 rounded-lg font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors inline-flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingRequest ? "Dispatching..." : "Send Request to Patient"}</span>
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
    </div>
  );
}
