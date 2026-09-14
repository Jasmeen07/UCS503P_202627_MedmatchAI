"use client";

import React, { useState, useEffect } from "react";
import { 
  UserCheck, 
  Shield, 
  Clock, 
  XCircle, 
  Link as LinkIcon, 
  Plus, 
  X, 
  CheckCircle2, 
  FileText 
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { 
  DoctorShareItem, 
  getPatientShares, 
  savePatientShares, 
  addPatientShare, 
  revokePatientShare, 
  getActivePatientEmail 
} from "@/lib/patientData";

export default function SharingPage() {
  const [activeEmail, setActiveEmail] = useState<string>("");
  const [activeShares, setActiveShares] = useState<DoctorShareItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [doctorEmail, setDoctorEmail] = useState("");
  const [scope, setScope] = useState("All Records");
  const [durationDays, setDurationDays] = useState("14 days");
  const [history, setHistory] = useState([
    { id: 101, email: "dr.mehta@apollo.com", action: "Access Expired", date: "Sep 8, 2026" },
    { id: 102, email: "dr.patel@hospital.com", action: "Viewed Prescription History", date: "Sep 5, 2026" },
  ]);

  useEffect(() => {
    const email = getActivePatientEmail();
    setActiveEmail(email);
    const shares = getPatientShares(email);
    setActiveShares(shares);
  }, []);

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
  };

  const handleRevoke = (id: number | string, emailToRevoke: string) => {
    revokePatientShare(id, activeEmail);
    setActiveShares(prev => prev.filter(s => String(s.id) !== String(id)));
    setHistory(prev => [
      { id: Date.now(), email: emailToRevoke, action: "Access Revoked by Patient", date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) },
      ...prev
    ]);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1000px] mx-auto pb-12">
      <PageHeader 
        title="Doctor Access" 
        subtitle="Securely manage who can view your medical records"
        action={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="dash-btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Grant New Access
          </button>
        }
      />

      <div className="dash-card bg-gradient-to-r from-[var(--dash-surface)] to-[var(--dash-amber-bg)] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start border-[var(--dash-amber)]/30 rounded-2xl">
        <div className="w-16 h-16 rounded-2xl bg-[var(--dash-amber)]/20 text-[var(--dash-amber)] flex items-center justify-center shrink-0">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[var(--dash-text)] mb-2">You are in control</h2>
          <p className="text-[var(--dash-text-secondary)] leading-relaxed mb-4">
            Share temporary, view-only access to your prescriptions with healthcare providers. 
            Links automatically expire, and you can revoke access at any time.
          </p>
          <div className="text-sm font-semibold text-[var(--dash-amber)] flex items-center gap-1.5">
            Encrypted with clinical patient-provider isolation guard <Shield className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* ACTIVE ACCESS GRANTS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--dash-text)]">Active Grants ({activeShares.length})</h3>
        </div>

        {activeShares.length === 0 ? (
          <div className="dash-card p-12 text-center border border-[var(--dash-border)] rounded-2xl bg-[var(--dash-surface)]">
            <div className="w-14 h-14 rounded-2xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center mx-auto mb-4">
              <UserCheck className="w-7 h-7" />
            </div>
            <h4 className="text-lg font-bold text-[var(--dash-text)] mb-1">No Active Doctor Shares</h4>
            <p className="text-sm text-[var(--dash-text-secondary)] max-w-md mx-auto mb-6">
              You have not granted access to any healthcare providers yet. When consulting a doctor or clinic, you can generate temporary access links here.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="dash-btn-primary inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Grant New Access
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
                    className="text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <XCircle className="w-4 h-4" /> Revoke
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ACCESS AUDIT HISTORY */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--dash-text)]">Access History & Security Audit</h3>
        <div className="dash-card overflow-hidden rounded-2xl border border-[var(--dash-border)]">
          <div className="divide-y divide-[var(--dash-border)]">
            {history.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-[var(--dash-surface-warm)]/50 transition-colors">
                <div>
                  <p className="font-medium text-[var(--dash-text)]">{item.action}</p>
                  <p className="text-sm text-[var(--dash-text-secondary)] mt-0.5">{item.email}</p>
                </div>
                <span className="text-sm text-[var(--dash-text-tertiary)]">{item.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRANT ACCESS MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="dash-card bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
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
                  placeholder="e.g. dr.patel@hospital.org" 
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
                  <option value="All Records">All Records (Prescriptions, Regimens & Dosing)</option>
                  <option value="Prescription History Only">Prescription History Only</option>
                  <option value="Cardiovascular & Metabolic Dossier">Cardiovascular & Metabolic Dossier</option>
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
                <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
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
                  Generate & Grant Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
