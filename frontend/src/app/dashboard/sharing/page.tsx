"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
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
  AlertTriangle,
  Edit3,
  HeartPulse,
  Phone,
  Trash2
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
  AccessAuditEntry,
  DoctorAccessPermissionRequest,
  getDoctorAccessRequestsForPatient,
  respondToAccessRequest,
  revokeDoctorAccess,
  getPatientEmergencyProfile,
  savePatientEmergencyProfile,
  PatientEmergencyProfile,
  PatientAllergy
} from "@/lib/patientData";

// Dynamic Scannable QR Code Component with Medical Cross Emblem
function DynamicEmergencyQr({ 
  token, 
  qrDataUrl 
}: { 
  token: string; 
  qrDataUrl: string;
}) {
  return (
    <div className="relative p-3 bg-white rounded-2xl border-2 border-emerald-500/40 shadow-lg inline-block group">
      {qrDataUrl ? (
        <div className="relative">
          <img 
            src={qrDataUrl} 
            alt={`Emergency QR Code for ${token}`} 
            className="w-36 h-36 object-contain rounded-xl"
          />
          {/* Center Clinical Cross Emblem */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-8 h-8 rounded-lg bg-white shadow-md border-2 border-emerald-600 flex items-center justify-center">
              <span className="text-emerald-700 font-black text-lg leading-none">+</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-36 h-36 flex items-center justify-center bg-slate-50 rounded-xl">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      )}
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
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [emergencyProfile, setEmergencyProfile] = useState<PatientEmergencyProfile | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState<PatientEmergencyProfile>({
    bloodGroup: "B+ (Rh Positive)",
    allergies: [],
    emergencyContact: { name: "", relation: "", phone: "" },
    chronicConditions: [],
    organDonor: true,
    medicalDirectives: ""
  });
  const [newAllergySubstance, setNewAllergySubstance] = useState("");
  const [newAllergyReaction, setNewAllergyReaction] = useState("");
  const [newAllergySeverity, setNewAllergySeverity] = useState<"High" | "Moderate" | "Low">("High");
  const [tokenCopied, setTokenCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  // Patient Access Control & Audit Log
  const [accessControl, setAccessControl] = useState<PatientAccessControl | null>(null);

  // Incoming Doctor Access Requests (Patient Consent Flow)
  const [pendingRequests, setPendingRequests] = useState<DoctorAccessPermissionRequest[]>([]);
  const [activeDoctorRequests, setActiveDoctorRequests] = useState<DoctorAccessPermissionRequest[]>([]);

  const [history, setHistory] = useState([
    { id: 101, email: "dr.reeta@ranjitmaternity.com", action: "Emergency QR Scanned", date: "Sep 16, 2026" },
    { id: 102, email: "dr.mehta@apollo.com", action: "Access Expired", date: "Sep 8, 2026" },
    { id: 103, email: "dr.patel@hospital.com", action: "Viewed Prescription History", date: "Sep 5, 2026" },
  ]);

  const loadSharingData = (email: string) => {
    setActiveEmail(email);
    const shares = getPatientShares(email);
    setActiveShares(shares);
    const token = getEmergencyToken(email);
    setEmergencyToken(token);
    const ac = getPatientAccessControl(email);
    setAccessControl(ac);
    const requests = getDoctorAccessRequestsForPatient(email);
    setPendingRequests(requests.filter(r => r.status === "pending"));
    setActiveDoctorRequests(requests.filter(r => r.status === "approved"));
    const prof = getPatientEmergencyProfile(email);
    setEmergencyProfile(prof);
    setProfileForm(prof);
  };

  useEffect(() => {
    if (!emergencyToken) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
    const targetUrl = `${origin}/dossier?token=${emergencyToken}`;
    QRCode.toDataURL(targetUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: "#0F172A",
        light: "#FFFFFF"
      },
      errorCorrectionLevel: "H"
    }).then(url => {
      setQrDataUrl(url);
    }).catch(err => {
      console.error("Failed to generate emergency QR:", err);
    });
  }, [emergencyToken]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    savePatientEmergencyProfile(profileForm, activeEmail);
    setEmergencyProfile(profileForm);
    setIsEditProfileOpen(false);
    showToast("Emergency Medical ID & Allergy Profile updated.");
  };

  const handleAddAllergy = () => {
    if (!newAllergySubstance.trim()) return;
    const newAllergy: PatientAllergy = {
      substance: newAllergySubstance.trim(),
      reaction: newAllergyReaction.trim() || "Hypersensitivity / Rash",
      severity: newAllergySeverity
    };
    setProfileForm(prev => ({
      ...prev,
      allergies: [...prev.allergies, newAllergy]
    }));
    setNewAllergySubstance("");
    setNewAllergyReaction("");
    setNewAllergySeverity("High");
  };

  const handleRemoveAllergy = (index: number) => {
    setProfileForm(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  useEffect(() => {
    const email = getActivePatientEmail();
    loadSharingData(email);

    const handleUpdate = () => loadSharingData(email);
    window.addEventListener("medmatch_access_update", handleUpdate);
    window.addEventListener("storage", handleUpdate);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("medmatch_access_channel");
      bc.onmessage = () => {
        loadSharingData(email);
      };
    }

    return () => {
      window.removeEventListener("medmatch_access_update", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
      if (bc) bc.close();
    };
  }, []);

  const handleAcceptRequest = (req: DoctorAccessPermissionRequest) => {
    respondToAccessRequest(req.id, "approved", activeEmail);
    loadSharingData(activeEmail);
    showToast(`Access granted to ${req.doctorName}! Doctor can now review your health history & prescriptions.`);
  };

  const handleDeclineRequest = (req: DoctorAccessPermissionRequest) => {
    respondToAccessRequest(req.id, "declined", activeEmail);
    loadSharingData(activeEmail);
    showToast(`Access request from ${req.doctorName} was declined.`);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3500);
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
    const docId = (emailToRevoke.toLowerCase().includes("reeta") || emailToRevoke.toLowerCase().includes("bhambri") || emailToRevoke.toLowerCase().includes("doctor"))
      ? "dr-reeta"
      : emailToRevoke;
    revokeDoctorAccess(activeEmail, docId);
    setActiveShares(prev => prev.filter(s => String(s.id) !== String(id)));
    setHistory(prev => [
      { id: Date.now(), email: emailToRevoke, action: "Access Revoked by Patient", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ...prev
    ]);
    const ac = getPatientAccessControl(activeEmail);
    setAccessControl(ac);
    showToast(`Access revoked for ${emailToRevoke}. Decryption authorization invalidated.`);
  };

  const handleRevokeDoctorGrant = (req: DoctorAccessPermissionRequest) => {
    revokeDoctorAccess(activeEmail, req.doctorId);
    loadSharingData(activeEmail);
    setHistory(prev => [
      { id: Date.now(), email: req.doctorName, action: `Access Revoked by Patient (${req.doctorName})`, date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ...prev
    ]);
    showToast(`Access revoked for ${req.doctorName}. The doctor must submit a new request if they need to access your records again.`);
  };

  const handleRevokeAllDoctorGrants = () => {
    if (!confirm("Are you sure you want to revoke all active doctor access grants? All consulting physicians will immediately lose access to your records.")) return;
    revokeDoctorAccess(activeEmail, "all");
    activeShares.forEach(s => revokePatientShare(s.id, activeEmail));
    setActiveShares([]);
    loadSharingData(activeEmail);
    setHistory(prev => [
      { id: Date.now(), email: "All Consulting Doctors", action: "All Doctor Access Grants Revoked by Patient", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ...prev
    ]);
    showToast("All doctor access grants have been revoked. Records are locked.");
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
        subtitle="Manage doctor consultation requests, active provider grants, and emergency QR dossiers"
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

      {/* UC-04 PROMINENT EMERGENCY QR CODE GENERATOR CARD */}
      <div className="bg-white rounded-2xl border-2 border-emerald-500/40 p-6 sm:p-8 shadow-sm overflow-hidden relative">
        <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8">
          
          {/* QR Visual */}
          <div className="flex flex-col items-center shrink-0">
            <DynamicEmergencyQr token={emergencyToken} qrDataUrl={qrDataUrl} />
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

      {/* EMERGENCY MEDICAL ID & ALLERGY PROFILE CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200 shrink-0">
              <HeartPulse className="w-5 h-5 text-rose-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">
                  Emergency Medical ID &amp; Allergy Profile
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Live in QR Pass
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Critical trauma data displayed instantly to ER doctors and first responders when scanning your QR pass.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (emergencyProfile) setProfileForm(emergencyProfile);
              setIsEditProfileOpen(true);
            }}
            className="dash-btn-secondary text-xs px-3.5 py-2 flex items-center gap-1.5 self-start sm:self-auto font-bold text-teal-700 bg-teal-50 border-teal-200 hover:bg-teal-100"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Medical ID</span>
          </button>
        </div>

        {/* 4-Column Clinical Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
          {/* Blood Group */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Blood Group &amp; Rh Factor
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-black text-rose-700 bg-rose-100 px-3 py-0.5 rounded-lg border border-rose-300">
                {emergencyProfile?.bloodGroup || "O+ (Rh Positive)"}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-2">Compatible for emergency transfusion matching</span>
          </div>

          {/* Emergency Contact */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Primary Emergency Contact
            </span>
            <div className="text-sm font-bold text-slate-900 mt-1">
              {emergencyProfile?.emergencyContact.name || "Primary Contact"}
            </div>
            <div className="text-xs text-slate-600">
              Relationship: {emergencyProfile?.emergencyContact.relation || "Family"}
            </div>
            <a
              href={`tel:${emergencyProfile?.emergencyContact.phone || "+919876543210"}`}
              className="text-xs font-semibold text-teal-700 hover:underline flex items-center gap-1 mt-1.5"
            >
              <Phone className="w-3 h-3 text-teal-600" />
              {emergencyProfile?.emergencyContact.phone || "+91 98765-43210"}
            </a>
          </div>

          {/* Documented Drug Allergies */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Documented Drug Allergies
            </span>
            {emergencyProfile && emergencyProfile.allergies.length > 0 ? (
              <div className="space-y-1.5 mt-1.5 max-h-24 overflow-y-auto">
                {emergencyProfile.allergies.map((alg, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-white px-2 py-1 rounded border border-rose-200">
                    <span className="font-bold text-rose-950 truncate">{alg.substance}</span>
                    <span className="text-[9px] font-extrabold uppercase px-1 rounded bg-rose-100 text-rose-800">
                      {alg.severity}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-emerald-700 font-semibold mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                NKDA (No Known Drug Allergies)
              </div>
            )}
          </div>

          {/* Directives & Organ Donor */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
              Directives &amp; Organ Donor
            </span>
            <div className="text-xs font-semibold text-slate-800 mt-1">
              Organ Donor:{" "}
              <span className={emergencyProfile?.organDonor ? "text-emerald-700 font-bold" : "text-slate-500"}>
                {emergencyProfile?.organDonor ? "Yes (Registered)" : "Not Registered"}
              </span>
            </div>
            <p className="text-[11px] text-slate-600 mt-1.5 line-clamp-2 italic">
              "{emergencyProfile?.medicalDirectives || "Full resuscitation code protocol."}"
            </p>
          </div>
        </div>
      </div>

      {/* PENDING DOCTOR CONSULTATION ACCESS REQUESTS */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">
                Pending Doctor Consultation Access Requests
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {pendingRequests.length} Action Required
              </span>
            </div>
            <span className="text-xs text-slate-500 font-medium">Explicit Patient Consent Required (UC-04)</span>
          </div>

          <div className="space-y-3.5">
            {pendingRequests.map((req) => (
              <div 
                key={req.id} 
                className="bg-gradient-to-r from-amber-50/70 via-white to-amber-50/30 p-5 rounded-2xl border-2 border-amber-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-bold text-base text-slate-900">
                        {req.doctorName}
                      </h4>
                      <span className="text-xs text-slate-500 font-mono">
                        (Reg #{req.doctorLicense})
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                        {req.doctorSpecialty}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600">
                      <strong>Clinic / Facility:</strong> {req.hospital}
                    </p>

                    <div className="text-xs text-slate-700 bg-white/80 p-2.5 rounded-xl border border-amber-200 mt-1.5">
                      <span className="font-semibold text-slate-900">Clinical Justification: </span>
                      {req.clinicalReason}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center gap-3 pt-1">
                      <span>Requested Scope: <strong className="text-slate-700">{req.requestedScope}</strong></span>
                      <span>•</span>
                      <span>Requested: {req.createdAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end pt-2 md:pt-0">
                  <button
                    onClick={() => handleDeclineRequest(req)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                  >
                    Decline Request
                  </button>
                  <button
                    onClick={() => handleAcceptRequest(req)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Authorize &amp; Grant Access</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVE ACCESS GRANTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[var(--dash-text)]">
            Active Provider Grants ({activeShares.length + activeDoctorRequests.length})
          </h3>
          {(activeShares.length > 0 || activeDoctorRequests.length > 0) && (
            <button
              onClick={handleRevokeAllDoctorGrants}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-colors cursor-pointer flex items-center gap-1.5"
              title="Instantly revoke record access for all consulting physicians"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Revoke All Access</span>
            </button>
          )}
        </div>

        {activeShares.length === 0 && activeDoctorRequests.length === 0 ? (
          <div className="dash-card p-12 text-center border border-[var(--dash-border)] rounded-2xl bg-[var(--dash-surface)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-[var(--dash-text)] mb-1">No Active Doctor Grants</h4>
            <p className="text-sm text-[var(--dash-text-secondary)] max-w-md mx-auto mb-6">
              You haven&apos;t authorized any doctors or external physician emails. Your Emergency QR Pass above remains active for in-clinic emergency consultations.
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
            {/* Active Doctor Portal Requests */}
            {activeDoctorRequests.map((req) => (
              <div key={req.id} className="dash-card card-interactive p-5 flex flex-col h-full border-t-4 border-teal-600 rounded-2xl bg-white shadow-xs">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-700">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-slate-900">{req.doctorName}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                          {req.doctorLicense}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{req.hospital} • {req.doctorSpecialty}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Active Access
                  </span>
                </div>
                
                <div className="bg-slate-50 rounded-lg p-3 mb-5 border border-slate-200/80">
                  <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-0.5">Authorized Clinical Scope</div>
                  <div className="text-xs font-medium text-slate-800">{req.requestedScope}</div>
                  <div className="text-[10px] text-slate-400 mt-1">Authorized on {req.updatedAt || req.createdAt}</div>
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-teal-600" />
                    Clinical Records Accessible
                  </div>
                  <button 
                    onClick={() => handleRevokeDoctorGrant(req)}
                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                    title="Revoke access. The doctor will need to request permission again."
                  >
                    <XCircle className="w-3.5 h-3.5" /> Revoke Access
                  </button>
                </div>
              </div>
            ))}

            {/* Manual Email Shares */}
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
                    className="text-sm font-medium text-rose-600 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
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

      {/* EDIT EMERGENCY MEDICAL ID MODAL */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-50 rounded-xl text-rose-600 border border-rose-200">
                  <HeartPulse className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Emergency Medical ID
                  </h3>
                  <p className="text-xs text-slate-500">
                    Update your blood group, emergency contact, and drug allergies
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Blood Group &amp; Rh Factor
                </label>
                <select
                  value={profileForm.bloodGroup}
                  onChange={(e) => setProfileForm(p => ({ ...p, bloodGroup: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
                >
                  <option value="O+ (Rh Positive)">O+ (Rh Positive)</option>
                  <option value="O- (Rh Negative)">O- (Rh Negative) - Universal Donor</option>
                  <option value="A+ (Rh Positive)">A+ (Rh Positive)</option>
                  <option value="A- (Rh Negative)">A- (Rh Negative)</option>
                  <option value="B+ (Rh Positive)">B+ (Rh Positive)</option>
                  <option value="B- (Rh Negative)">B- (Rh Negative)</option>
                  <option value="AB+ (Rh Positive)">AB+ (Rh Positive) - Universal Recipient</option>
                  <option value="AB- (Rh Negative)">AB- (Rh Negative)</option>
                </select>
              </div>

              {/* Emergency Contact */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Emergency Contact Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={profileForm.emergencyContact.name}
                      onChange={(e) => setProfileForm(p => ({
                        ...p,
                        emergencyContact: { ...p.emergencyContact, name: e.target.value }
                      }))}
                      placeholder="e.g. Jaswinder Singh"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={profileForm.emergencyContact.relation}
                      onChange={(e) => setProfileForm(p => ({
                        ...p,
                        emergencyContact: { ...p.emergencyContact, relation: e.target.value }
                      }))}
                      placeholder="e.g. Spouse / Parent"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.emergencyContact.phone}
                    onChange={(e) => setProfileForm(p => ({
                      ...p,
                      emergencyContact: { ...p.emergencyContact, phone: e.target.value }
                    }))}
                    placeholder="e.g. +91 98765-43210"
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {/* Documented Allergies */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                  Documented Drug Hypersensitivities &amp; Allergies
                </span>

                {profileForm.allergies.length > 0 ? (
                  <div className="space-y-2">
                    {profileForm.allergies.map((alg, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-white border border-rose-200 text-xs">
                        <div>
                          <span className="font-bold text-rose-950">{alg.substance}</span>
                          <span className="text-slate-500 ml-1.5">({alg.reaction})</span>
                          <span className="text-[10px] font-bold uppercase ml-2 px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">
                            {alg.severity}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveAllergy(index)}
                          className="p-1 rounded text-rose-600 hover:bg-rose-50"
                          title="Remove allergy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 italic">No drug allergies listed (NKDA).</div>
                )}

                {/* Add Allergy Inline */}
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <span className="text-[11px] font-semibold text-slate-700 block">Add New Drug Allergy</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Substance (e.g. Penicillin)"
                      value={newAllergySubstance}
                      onChange={(e) => setNewAllergySubstance(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Reaction (e.g. Anaphylaxis)"
                      value={newAllergyReaction}
                      onChange={(e) => setNewAllergyReaction(e.target.value)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    />
                    <select
                      value={newAllergySeverity}
                      onChange={(e) => setNewAllergySeverity(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                    >
                      <option value="High">High</option>
                      <option value="Moderate">Moderate</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddAllergy}
                    disabled={!newAllergySubstance.trim()}
                    className="dash-btn-secondary text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Allergy to List</span>
                  </button>
                </div>
              </div>

              {/* Directives & Organ Donor */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clinical Directives / Special Instructions
                </label>
                <textarea
                  value={profileForm.medicalDirectives || ""}
                  onChange={(e) => setProfileForm(p => ({ ...p, medicalDirectives: e.target.value }))}
                  placeholder="e.g. Full resuscitation code. Avoid beta-lactams and NSAIDs. Patient has cardiac pacemaker."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="organDonor"
                  checked={profileForm.organDonor}
                  onChange={(e) => setProfileForm(p => ({ ...p, organDonor: e.target.checked }))}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <label htmlFor="organDonor" className="text-xs font-semibold text-slate-800">
                  Registered Organ Donor
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="dash-btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn-primary px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                >
                  Save Emergency Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
