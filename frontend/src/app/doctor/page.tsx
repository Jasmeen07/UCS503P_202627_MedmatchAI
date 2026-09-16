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
  AlertTriangle
} from "lucide-react";
import { 
  getPatientAppointments, 
  AppointmentItem, 
  getActivePatientEmail,
  getPatientDossier,
  PatientDossierData,
  getPatientAccessControl,
  verifyDoctorAccess
} from "@/lib/patientData";

interface DoctorRequest {
  id: string | number;
  patientName: string;
  patientEmail: string;
  patientUid: string;
  reason: string;
  date: string;
  time: string;
  specialty: string;
  urgency: "Routine" | "Priority" | "Follow-up";
  status: "pending" | "confirmed" | "rescheduled" | "completed";
  dossierToken: string;
  notes?: string;
}

const INITIAL_REQUESTS: DoctorRequest[] = [
  {
    id: "req-1",
    patientName: "Simranjit Kaur",
    patientEmail: "jk0822123@gmail.com",
    patientUid: "PT-2026-LUD-8821",
    reason: "Antenatal Ultrasound & 28-Week Gestational Review",
    date: "Sept 18, 2026",
    time: "10:30 AM",
    specialty: "Obstetrics & Antenatal Care",
    urgency: "Priority",
    status: "pending",
    dossierToken: "EMG-8821-VLT",
    notes: "Patient reports mild ankle edema. Blood pressure stable. Folic acid and iron adherence reported regular."
  },
  {
    id: "req-2",
    patientName: "Harpreet Singh",
    patientEmail: "harpreet.s@example.com",
    patientUid: "PT-2026-LUD-3312",
    reason: "Post-Operative Wound Inspection & Suture Removal",
    date: "Sept 17, 2026",
    time: "11:45 AM",
    specialty: "General Surgery",
    urgency: "Routine",
    status: "confirmed",
    dossierToken: "EMG-3312-VLT",
    notes: "Day 10 post-laparoscopic follow-up. Sterile dressing intact."
  },
  {
    id: "req-3",
    patientName: "Amandeep Sharma",
    patientEmail: "amandeep.sharma@example.com",
    patientUid: "PT-2026-LUD-4091",
    reason: "Routine Antenatal BP & Hemoglobin Assessment",
    date: "Sept 19, 2026",
    time: "05:15 PM",
    specialty: "Obstetrics & Antenatal Care",
    urgency: "Follow-up",
    status: "pending",
    dossierToken: "EMG-4091-VLT",
    notes: "Second visit. Needs routine complete blood count review."
  }
];

export default function DoctorPortalPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<DoctorRequest[]>(INITIAL_REQUESTS);
  const [activeTab, setActiveTab] = useState<"requests" | "schedule" | "calibration">("requests");

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
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "confirmed" } : r));
    showToast(`Slot confirmed for ${req.patientName}! Clinic Scheduler locked calendar slot at ${req.time}.`);
  };

  const handleOpenReschedule = (req: DoctorRequest) => {
    setRescheduleModalItem(req);
  };

  const handleConfirmReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleModalItem) return;

    setRequests(prev => prev.map(r => 
      r.id === rescheduleModalItem.id 
        ? { ...r, date: newRescheduleDate, time: newRescheduleTime, status: "rescheduled" } 
        : r
    ));

    showToast(`Slot rescheduled for ${rescheduleModalItem.patientName} to ${newRescheduleDate} at ${newRescheduleTime}.`);
    setRescheduleModalItem(null);
  };

  const handleMarkCompleted = (id: string | number) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "completed" } : r));
    showToast("Consultation marked completed and clinical notes archived.");
  };

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
            <Link 
              href="/dashboard"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Return to Patient Vault"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-slate-900 leading-tight">Dr. Reeta Bhambri</h1>
                  <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 border border-teal-200">
                    Clinic Portal (UC-04)
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Ranjit Maternity Clinic &amp; Nursing Home • Reg #34182
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard"
              className="text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 px-3.5 py-2 rounded-xl transition-colors shadow-sm"
            >
              Patient Vault View
            </Link>
            <Link
              href="/dossier?token=EMG-8821-VLT"
              className="text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 px-3.5 py-2 rounded-xl transition-colors shadow-sm inline-flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Active Patient Dossier
            </Link>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        
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
        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === "requests" 
                ? "bg-teal-50 text-teal-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarCheck className="w-4 h-4" />
            <span>Consultation Requests &amp; Slot Locking</span>
            <span className="text-[10px] bg-teal-200 text-teal-900 px-2 py-0.5 rounded-full font-bold">
              {requests.filter(r => r.status === "pending").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("schedule")}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
              activeTab === "schedule" 
                ? "bg-teal-50 text-teal-800 shadow-sm" 
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Clinic Working Hours &amp; Capacity</span>
          </button>

          <button
            onClick={() => setActiveTab("calibration")}
            className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2 ${
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

        {/* TAB 1: CONSULTATION REQUESTS QUEUE & SLOT MANAGEMENT */}
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
    </div>
  );
}
