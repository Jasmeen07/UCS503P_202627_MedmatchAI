"use client";

import React from "react";
import { UserCheck, Shield, Clock, XCircle, Link as LinkIcon, Plus } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

export default function SharingPage() {
  const activeShares = [
    { id: 1, email: "dr.patel@hospital.com", scope: "All Records", date: "Sep 1, 2026", expires: "5 days", type: "full" },
    { id: 2, email: "dr.sharma@clinic.com", scope: "Diabetes Management Group", date: "Sep 10, 2026", expires: "12 days", type: "partial" },
  ];

  const history = [
    { id: 3, email: "dr.mehta@apollo.com", action: "Access Expired", date: "Sep 8, 2026" },
    { id: 4, email: "dr.patel@hospital.com", action: "Viewed Prescription #1042", date: "Sep 5, 2026" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1000px] mx-auto">
      <PageHeader 
        title="Doctor Access" 
        subtitle="Securely manage who can view your medical records"
        action={
          <button className="dash-btn-primary">
            <Plus className="w-4 h-4" />
            Grant New Access
          </button>
        }
      />

      <div className="dash-card bg-gradient-to-r from-[var(--dash-surface)] to-[var(--dash-amber-bg)] p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-center sm:items-start border-[var(--dash-amber)]/30">
        <div className="w-16 h-16 rounded-2xl bg-[var(--dash-amber)]/20 text-[var(--dash-amber)] flex items-center justify-center shrink-0">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-[var(--dash-text)] mb-2">You are in control</h2>
          <p className="text-[var(--dash-text-secondary)] leading-relaxed mb-4">
            Share temporary, view-only access to your prescriptions with healthcare providers. 
            Links automatically expire, and you can revoke access at any time.
          </p>
          <button className="text-sm font-semibold text-[var(--dash-amber)] hover:text-[var(--dash-amber)]/80 flex items-center gap-1.5 transition-colors">
            Learn more about security <LinkIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--dash-text)]">Active Grants</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {activeShares.map((share) => (
            <div key={share.id} className="dash-card card-interactive p-5 flex flex-col h-full border-t-4 border-[var(--dash-sage)]">
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
                <button className="text-sm font-medium text-[var(--dash-coral)] hover:bg-[var(--dash-coral-bg)] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5">
                  <XCircle className="w-4 h-4" /> Revoke
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[var(--dash-text)]">Access History</h3>
        <div className="dash-card overflow-hidden">
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
    </div>
  );
}
