"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  UserCheck, 
  Shield, 
  Clock, 
  XCircle, 
  Link as LinkIcon, 
  Plus, 
  X, 
  CheckCircle2, 
  FileText,
  QrCode,
  Copy,
  Check,
  RefreshCw,
  Printer,
  ExternalLink,
  Stethoscope,
  Share2,
  AlertCircle,
  KeyRound,
  Lock,
  Unlock,
  ShieldAlert,
  Smartphone,
  ShieldCheck,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { 
  DoctorShareItem, 
  getPatientShares, 
  addPatientShare, 
  revokePatientShare, 
  getActivePatientEmail,
  getEmergencyToken,
  generateEmergencyToken,
  getPatientAccessControl,
  setPatientDoctorAccessState,
  regeneratePatientDoctorPasscode,
  PatientAccessControl,
  AccessAuditEntry
} from "@/lib/patientData";

// Crisp SVG QR Code Component with Medical Cross Emblem
function EmergencyQrCodeSvg({ token }: { token: string }) {
  return (
    <div className="relative p-3 bg-white rounded-2xl border-2 border-emerald-500/30 shadow-md inline-block">
      <svg
        viewBox="0 0 160 160"
        width="144"
        height="144"
        className="w-36 h-36"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background */}
        <rect width="160" height="160" fill="#FFFFFF" rx="8" />

        {/* Finder Pattern Top-Left */}
        <rect x="14" y="14" width="38" height="38" rx="5" fill="#0F172A" />
        <rect x="20" y="20" width="26" height="26" rx="3" fill="#FFFFFF" />
        <rect x="26" y="26" width="14" height="14" rx="2" fill="#059669" />

        {/* Finder Pattern Top-Right */}
        <rect x="108" y="14" width="38" height="38" rx="5" fill="#0F172A" />
        <rect x="114" y="20" width="26" height="26" rx="3" fill="#FFFFFF" />
        <rect x="120" y="26" width="14" height="14" rx="2" fill="#059669" />

        {/* Finder Pattern Bottom-Left */}
        <rect x="14" y="108" width="38" height="38" rx="5" fill="#0F172A" />
        <rect x="20" y="114" width="26" height="26" rx="3" fill="#FFFFFF" />
        <rect x="26" y="120" width="14" height="14" rx="2" fill="#059669" />

        {/* Timing Lines */}
        <line x1="56" y1="28" x2="104" y2="28" stroke="#0F172A" stroke-width="3" stroke-dasharray="4,4" />
        <line x1="28" y1="56" x2="28" y2="104" stroke="#0F172A" stroke-width="3" stroke-dasharray="4,4" />

        {/* Data Matrix Glyphs */}
        <rect x="62" y="14" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="76" y="18" width="6" height="6" rx="1.5" fill="#0F172A" />
        <rect x="90" y="14" width="8" height="8" rx="1.5" fill="#0F172A" />

        <rect x="60" y="38" width="7" height="7" rx="1.5" fill="#0F172A" />
        <rect x="74" y="38" width="8" height="8" rx="1.5" fill="#059669" />
        <rect x="88" y="42" width="6" height="6" rx="1.5" fill="#0F172A" />

        <rect x="16" y="62" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="30" y="66" width="6" height="6" rx="1.5" fill="#0F172A" />
        <rect x="42" y="60" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="110" y="62" width="7" height="7" rx="1.5" fill="#0F172A" />
        <rect x="124" y="66" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="138" y="60" width="6" height="6" rx="1.5" fill="#0F172A" />

        <rect x="14" y="78" width="6" height="6" rx="1.5" fill="#0F172A" />
        <rect x="26" y="80" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="40" y="76" width="7" height="7" rx="1.5" fill="#0F172A" />
        <rect x="112" y="78" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="126" y="80" width="6" height="6" rx="1.5" fill="#059669" />
        <rect x="138" y="76" width="8" height="8" rx="1.5" fill="#0F172A" />

        <rect x="62" y="112" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="78" y="116" width="6" height="6" rx="1.5" fill="#0F172A" />
        <rect x="92" y="110" width="7" height="7" rx="1.5" fill="#0F172A" />

        <rect x="60" y="132" width="7" height="7" rx="1.5" fill="#0F172A" />
        <rect x="74" y="136" width="8" height="8" rx="1.5" fill="#059669" />
        <rect x="88" y="130" width="6" height="6" rx="1.5" fill="#0F172A" />

        <rect x="112" y="112" width="7" height="7" rx="1.5" fill="#0F172A" />
        <rect x="126" y="116" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="138" y="110" width="6" height="6" rx="1.5" fill="#0F172A" />

        <rect x="110" y="132" width="8" height="8" rx="1.5" fill="#0F172A" />
        <rect x="124" y="134" width="6" height="6" rx="1.5" fill="#0F172A" />
        <rect x="136" y="130" width="8" height="8" rx="1.5" fill="#059669" />

        {/* Center Clinical Cross Emblem */}
        <rect x="65" y="65" width="30" height="30" rx="7" fill="#FFFFFF" stroke="#059669" stroke-width="2" />
        <rect x="77" y="70" width="6" height="20" rx="2" fill="#059669" />
        <rect x="70" y="77" width="20" height="6" rx="2" fill="#059669" />
      </svg>
    </div>
  );
}

export default function SharingPage() {
  const [activeEmail, setActiveEmail] = useState<string>("");
  const [activeShares, setActiveShares] = useState<DoctorShareItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [scope, setScope] = useState("All Records");
  const [durationDays, setDurationDays] = useState("14 days");
  
  // Emergency QR Token State
  const [emergencyToken, setEmergencyToken] = useState("EMG-8821-VLT");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // In-Clinic Doctor PIN Access Control
  const [accessControl, setAccessControl] = useState<PatientAccessControl | null>(null);
  const [pinCopied, setPinCopied] = useState(false);

  const [history, setHistory] = useState([
    { id: 101, email: "dr.reeta@ranjitmaternity.com", action: "Emergency QR Scanned", date: "Sep 16, 2026" },
    { id: 102, email: "dr.mehta@apollo.com", action: "Access Expired", date: "Sep 8, 2026" },
    { id: 103, email: "dr.patel@hospital.com", action: "Viewed Prescription History", date: "Sep 5, 2026" },
  ]);

  useEffect(() => {
    const email = getActivePatientEmail();
    setActiveEmail(email);
    const shares = getPatientShares(email);
    setActiveShares(shares);
    const token = getEmergencyToken(email);
    setEmergencyToken(token);
    const ac = getPatientAccessControl(email);
    setAccessControl(ac);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  const handleToggleDoctorAccess = () => {
    if (!accessControl) return;
    const newState = !accessControl.accessGranted;
    setPatientDoctorAccessState(newState, activeEmail);
    const updated = getPatientAccessControl(activeEmail);
    setAccessControl(updated);
    showToast(
      newState 
        ? "Doctor In-Clinic Access ENABLED. Doctors can now unlock your records with your PIN." 
        : "Doctor In-Clinic Access PAUSED. All external doctor PIN lookups are blocked."
    );
  };

  const handleRegeneratePin = () => {
    const newPin = regeneratePatientDoctorPasscode(activeEmail);
    const updated = getPatientAccessControl(activeEmail);
    setAccessControl(updated);
    showToast(`New 6-digit Doctor Passcode generated: ${newPin}. Previous PIN invalidated.`);
  };

  const handleCopyPin = () => {
    if (!accessControl) return;
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(accessControl.doctorPasscode);
      setPinCopied(true);
      setTimeout(() => setPinCopied(false), 2500);
      showToast(`Doctor Passcode (${accessControl.doctorPasscode}) copied to clipboard!`);
    }
  };

  const handleRegenerateToken = () => {
    const newToken = generateEmergencyToken(activeEmail);
    setEmergencyToken(newToken);
    showToast(`New Emergency Pass generated: ${newToken}. Previous QR invalidated.`);
  };

  const handleCopyToken = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(emergencyToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2500);
      showToast("Emergency token copied to clipboard!");
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/dossier?token=${emergencyToken}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
      showToast("Read-only dossier access link copied!");
    }
  };

  const handleGrantAccess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doctorEmail.trim()) return;

    const todayStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const newShare = addPatientShare({
      email: doctorEmail.trim(),
      scope,
      date: todayStr,
      expires: durationDays,
      type: scope.includes("All") ? "full" : "partial"
    }, activeEmail);

    setActiveShares(prev => [newShare, ...prev]);
    setHistory(prev => [
      { id: Date.now(), email: doctorEmail.trim(), action: `Access Granted (${scope})`, date: todayStr },
      ...prev
    ]);

    setIsModalOpen(false);
    setDoctorEmail("");
    setScope("All Records");
    setDurationDays("14 days");
    showToast(`Access granted to ${doctorEmail.trim()} for ${durationDays}!`);
  };

  const handleRevoke = (id: number | string, emailToRevoke: string) => {
    revokePatientShare(id, activeEmail);
    setActiveShares(prev => prev.filter(s => String(s.id) !== String(id)));
    setHistory(prev => [
      { id: Date.now(), email: emailToRevoke, action: "Access Revoked by Patient", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ...prev
    ]);
    showToast(`Access revoked for ${emailToRevoke}.`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1050px] mx-auto pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      <PageHeader 
        title="Doctor Access & Emergency Sharing" 
        subtitle="Manage temporary clinical access passes, in-clinic 6-digit PINs, and emergency QR dossiers"
        action={
          <div className="flex items-center gap-2.5">
            <Link
              href="/doctor"
              className="dash-btn-secondary flex items-center gap-2 text-xs py-2"
            >
              <Stethoscope className="w-4 h-4 text-teal-600" />
              Doctor Portal View
            </Link>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="dash-btn-primary flex items-center gap-2 text-xs py-2"
            >
              <Plus className="w-4 h-4" />
              Grant New Access
            </button>
          </div>
        }
      />

      {/* PATIENT IN-CLINIC DOCTOR CONSULTATION PASS (PIN) */}
      <div className="bg-white rounded-2xl border-2 border-teal-600/30 p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-start justify-between gap-6">
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200">
                  <KeyRound className="w-3.5 h-3.5 text-teal-600" />
                  <span>Simple In-Clinic Consultation Pass</span>
                </span>
                {accessControl?.accessGranted ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    Doctor Access Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                    <Lock className="w-3 h-3 text-rose-600" />
                    Doctor Access Paused (Locked)
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                In-Clinic Doctor Consultation Pass
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
                When you visit a doctor or clinic, tell them your <strong>Mobile Number</strong> or <strong>Patient ID</strong>, then provide your <strong>6-digit Passcode</strong>. Only your medical records will be opened. You maintain total privacy control: pause access anytime with one tap.
              </p>
            </div>

            {/* Credentials Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Your Identifier (Mobile or ID)
                </span>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-base font-bold text-slate-900">{accessControl?.phoneNumber || "+91 98765-43210"}</div>
                    <div className="text-xs font-mono text-slate-500">ID: {accessControl?.patientUid || "PT-2026-LUD-8821"}</div>
                  </div>
                  <Smartphone className="w-6 h-6 text-teal-600/70" />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-teal-50/50 border border-teal-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-teal-900 uppercase tracking-wider">
                    6-Digit Doctor Passcode
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopyPin}
                      className="text-xs font-semibold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                      title="Copy Passcode"
                    >
                      {pinCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      <span>{pinCopied ? "Copied" : "Copy"}</span>
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={handleRegeneratePin}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1"
                      title="Generate Fresh PIN"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>New PIN</span>
                    </button>
                  </div>
                </div>

                {/* 6 Digit Display */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {(accessControl?.doctorPasscode || "882194").split("").map((digit, idx) => (
                    <div
                      key={idx}
                      className="w-8 h-10 sm:w-9 sm:h-11 rounded-lg bg-white border-2 border-teal-500/60 shadow-xs flex items-center justify-center font-mono font-black text-xl text-teal-950"
                    >
                      {digit}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Consent Privacy Toggle Switch */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${accessControl?.accessGranted ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                  {accessControl?.accessGranted ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">
                    Patient Authorization: {accessControl?.accessGranted ? "Access Allowed" : "Access Paused"}
                  </div>
                  <p className="text-xs text-slate-500">
                    {accessControl?.accessGranted 
                      ? "Doctors can look up your dossier with your 6-digit PIN." 
                      : "All external doctor lookups are currently blocked for your security."}
                  </p>
                </div>
              </div>

              <button
                onClick={handleToggleDoctorAccess}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 ${
                  accessControl?.accessGranted
                    ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
                }`}
              >
                {accessControl?.accessGranted ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Pause Doctor Access</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Enable Doctor Access</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* UC-04 PROMINENT EMERGENCY QR CODE GENERATOR CARD */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
          
          {/* QR Visual */}
          <div className="flex flex-col items-center shrink-0">
            <EmergencyQrCodeSvg token={emergencyToken} />
            <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Valid • Auto-expires in 23h 48m</span>
            </div>
          </div>

          {/* Details & Actions */}
          <div className="flex-1 space-y-4 text-center lg:text-left">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-50 text-teal-800 text-xs font-bold border border-teal-200 mb-2">
                <Shield className="w-3.5 h-3.5 text-teal-600" />
                <span>UC-04: Clinical Health Vault Emergency QR Sharing</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900">
                Time-Limited Emergency Patient QR Pass
              </h2>
              <p className="text-sm text-slate-600 mt-1 leading-relaxed max-w-2xl">
                Present this QR code to consulting physicians or hospital emergency departments. Scanning grants instantaneous read-only access to your verified clinical dossier, condition timelines, and drug allergy warnings without exposing editing permissions.
              </p>
            </div>

            {/* Token Bar */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2.5 pt-1">
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 font-mono text-sm font-bold text-slate-800">
                <span className="text-xs text-slate-400 font-sans font-normal uppercase">Token:</span>
                <span>{emergencyToken}</span>
              </div>

              <button
                onClick={handleCopyToken}
                className="dash-btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
                title="Copy Token to Clipboard"
              >
                {tokenCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{tokenCopied ? "Copied!" : "Copy Token"}</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="dash-btn-secondary text-xs px-3 py-2 flex items-center gap-1.5"
                title="Copy Shareable Link"
              >
                {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Share2 className="w-3.5 h-3.5" />}
                <span>{linkCopied ? "Link Copied!" : "Share Link"}</span>
              </button>

              <button
                onClick={handleRegenerateToken}
                className="text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-2.5 py-2 rounded-xl transition-colors flex items-center gap-1"
                title="Regenerate Token"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Regenerate</span>
              </button>
            </div>

            {/* Main Action Buttons */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-2">
              <Link
                href={`/dossier?token=${emergencyToken}`}
                className="dash-btn-primary text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-bold shadow-sm"
              >
                <FileText className="w-4 h-4" />
                <span>Preview Doctor Clinical Dossier</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <Link
                href={`/dossier?token=${emergencyToken}`}
                className="dash-btn-secondary text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 font-semibold"
              >
                <Printer className="w-4 h-4 text-slate-600" />
                <span>Export Complete Health History (PDF)</span>
              </Link>
            </div>

            <div className="text-xs text-slate-500 pt-1">
              Physician or clinic operator?{" "}
              <Link href="/doctor" className="text-teal-700 font-bold hover:underline inline-flex items-center gap-1">
                Open Doctor Clinical Portal →
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* ACTIVE ACCESS GRANTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--dash-text)]">Active Provider Grants ({activeShares.length})</h3>
        </div>

        {activeShares.length === 0 ? (
          <div className="dash-card p-12 text-center border border-[var(--dash-border)] rounded-2xl bg-[var(--dash-surface)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-[var(--dash-text)] mb-1">No Specific Email Grants</h4>
            <p className="text-sm text-[var(--dash-text-secondary)] max-w-md mx-auto mb-6">
              You haven&apos;t invited any specific physician emails. Your Emergency QR Pass above is active for in-clinic consultations.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="dash-btn-primary inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Grant Access to Doctor Email
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {activeShares.map((share) => (
              <div key={share.id} className="dash-card card-interactive p-5 flex flex-col h-full border-t-4 border-[var(--dash-sage)] rounded-2xl">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[var(--dash-surface-warm)] flex items-center justify-center text-[var(--dash-text-secondary)]">
                      <UserCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--dash-text)]">{share.email}</h4>
                      <p className="text-xs text-[var(--dash-text-tertiary)]">Granted on {share.date}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[var(--dash-bg)] rounded-lg p-3 mb-5 border border-[var(--dash-border)]">
                  <div className="text-xs uppercase tracking-wider font-semibold text-[var(--dash-text-tertiary)] mb-1">Access Scope</div>
                  <div className="text-sm font-medium text-[var(--dash-text)]">{share.scope}</div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-[var(--dash-border)]">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-[var(--dash-amber)]">
                    <Clock className="w-4 h-4" />
                    Expires in {share.expires}
                  </div>
                  <button 
                    onClick={() => handleRevoke(share.id, share.email)}
                    className="text-sm font-medium text-rose-600 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACCESS AUDIT HISTORY & SECURITY LEDGER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-lg font-bold text-[var(--dash-text)]">Access History &amp; Security Audit Trail</h3>
          <span className="text-xs text-[var(--dash-text-tertiary)]">Immutable audit ledger tracking doctor accesses &amp; emergency overrides</span>
        </div>
        
        <div className="dash-card overflow-hidden rounded-2xl border border-[var(--dash-border)]">
          <div className="divide-y divide-[var(--dash-border)]">
            {accessControl?.auditLog && accessControl.auditLog.length > 0 ? (
              accessControl.auditLog.map((item) => {
                const isEmergency = item.accessType === "Emergency Break-Glass";
                const isRevoked = item.status === "Revoked";
                return (
                  <div 
                    key={item.id} 
                    className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                      isEmergency 
                        ? "bg-amber-500/5 border-l-4 border-amber-500 hover:bg-amber-500/10" 
                        : isRevoked 
                          ? "bg-rose-500/5 border-l-4 border-rose-500 hover:bg-rose-500/10"
                          : "hover:bg-[var(--dash-surface-warm)]/50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm text-[var(--dash-text)]">
                          {item.accessorName}
                        </span>
                        {item.accessorLicense && (
                          <span className="text-xs text-slate-500 font-mono">
                            (Reg #{item.accessorLicense})
                          </span>
                        )}
                        {isEmergency && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                            Break-Glass Override
                          </span>
                        )}
                        {item.accessType === "Passcode Verified" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                            <KeyRound className="w-3 h-3 text-teal-600" />
                            6-Digit PIN Verified
                          </span>
                        )}
                        {item.accessType === "QR Code Scanned" && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <QrCode className="w-3 h-3 text-slate-600" />
                            QR Pass Scanned
                          </span>
                        )}
                        {isRevoked && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            <Lock className="w-3 h-3 text-rose-600" />
                            Access Blocked
                          </span>
                        )}
                      </div>
                      
                      <div className="text-xs text-[var(--dash-text-secondary)] flex flex-wrap items-center gap-2">
                        {item.hospital && (
                          <span className="font-medium text-slate-700">{item.hospital}</span>
                        )}
                        {item.hospital && <span className="text-slate-300">&bull;</span>}
                        <span>{item.reason}</span>
                      </div>
                    </div>

                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-xs text-[var(--dash-text-tertiary)] block">{item.timestamp}</span>
                      <span className="text-[10px] font-mono text-slate-400 block mt-0.5">ID: {item.id}</span>
                    </div>
                  </div>
                );
              })
            ) : (
              history.map((item) => (
                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[var(--dash-surface-warm)]/50 transition-colors">
                  <div>
                    <p className="font-medium text-[var(--dash-text)]">{item.action}</p>
                    <p className="text-sm text-[var(--dash-text-secondary)] mt-0.5">{item.email}</p>
                  </div>
                  <span className="text-sm text-[var(--dash-text-tertiary)]">{item.date}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* GRANT ACCESS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="dash-card bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--dash-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--dash-text)]">Grant Clinical Access</h3>
                  <p className="text-xs text-[var(--dash-text-secondary)]">Create a secure temporary view-only pass</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--dash-surface-warm)] flex items-center justify-center text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGrantAccess} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Doctor or Clinic Email *
                </label>
                <input 
                  type="email" 
                  required
                  placeholder="e.g. dr.reeta@ranjitmaternity.com" 
                  value={doctorEmail}
                  onChange={(e) => setDoctorEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Access Scope
                </label>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                >
                  <option value="All Records">All Records (Prescriptions, Regimens &amp; Dosing)</option>
                  <option value="Prescription History Only">Prescription History Only</option>
                  <option value="Antenatal &amp; Maternal Health Dossier">Antenatal &amp; Maternal Health Dossier</option>
                  <option value="Cardiovascular &amp; Metabolic Dossier">Cardiovascular &amp; Metabolic Dossier</option>
                  <option value="Active Medications Only">Active Medications Only</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Access Validity Period
                </label>
                <select
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                >
                  <option value="3 days">3 Days (Quick Consultation)</option>
                  <option value="7 days">7 Days (Standard Follow-up)</option>
                  <option value="14 days">14 Days (Two Weeks)</option>
                  <option value="30 days">30 Days (Ongoing Treatment Review)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--dash-text)] flex items-start gap-2.5">
                <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Providers receive a read-only token. Access can be immediately revoked at any moment from this screen.</span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--dash-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="dash-btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn-primary px-5 py-2 text-sm font-semibold"
                >
                  Generate &amp; Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
