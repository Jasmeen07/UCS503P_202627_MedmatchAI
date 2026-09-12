"use client";

import React from "react";
import { Layers, Plus, ChevronRight, Activity, Calendar } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import Link from "next/link";

export default function TreatmentsPage() {
  const groups = [
    { id: 1, name: "Diabetes Management", count: 2, color: "var(--dash-sage)", bg: "var(--dash-sage-bg)", dates: "Aug 2026 to Present", meds: ["Metformin", "Glimepiride", "+2 more"] },
    { id: 2, name: "Allergy Treatment", count: 1, color: "var(--dash-amber)", bg: "var(--dash-amber-bg)", dates: "Jul 2026 to Present", meds: ["Cetirizine", "Fluticasone"] },
    { id: 3, name: "Heart & BP", count: 2, color: "var(--dash-terracotta)", bg: "var(--dash-terracotta-bg)", dates: "Jun 2026 to Present", meds: ["Amlodipine", "Atorvastatin"] },
    { id: 4, name: "General Check-ups", count: 3, color: "var(--dash-text-tertiary)", bg: "var(--dash-bg)", dates: "Jan 2026 to Present", meds: ["Multivitamins", "Vitamin D"] },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Treatment Groups" 
        subtitle="Organize prescriptions by condition or health goal"
        action={
          <button className="dash-btn-primary">
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => (
          <div key={group.id} className="dash-card card-interactive flex flex-col hover:border-[var(--dash-border)]/80 transition-all overflow-hidden border-l-[6px]" style={{ borderLeftColor: group.color }}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: group.bg, color: group.color }}
                >
                  <Layers className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 bg-[var(--dash-bg)] px-3 py-1 rounded-md text-xs font-medium text-[var(--dash-text-secondary)] border border-[var(--dash-border)]">
                  <Activity className="w-3.5 h-3.5" /> {group.count} Prescriptions
                </div>
              </div>
              
              <h3 className="text-xl font-semibold text-[var(--dash-text)] mb-2">{group.name}</h3>
              
              <div className="flex items-center gap-2 text-sm text-[var(--dash-text-secondary)] mb-6">
                <Calendar className="w-4 h-4 opacity-70" />
                {group.dates}
              </div>

              <div className="space-y-2 mb-6">
                <p className="text-xs uppercase tracking-wider font-semibold text-[var(--dash-text-tertiary)]">Active Medications</p>
                <div className="flex flex-wrap gap-2">
                  {group.meds.map((med, i) => (
                    <span key={i} className="dash-pill bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] border border-[var(--dash-border)]">
                      {med}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-auto border-t border-[var(--dash-border)] bg-[var(--dash-bg)]/50 p-4 flex justify-end">
              <button className="text-sm font-medium text-[var(--dash-text)] hover:text-[var(--dash-sage)] flex items-center gap-1 transition-colors">
                View Details <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        <div className="dash-card card-interactive border-dashed bg-[var(--dash-surface-warm)]/50 hover:bg-[var(--dash-surface-warm)] transition-colors flex flex-col items-center justify-center p-8 min-h-[300px] text-center cursor-pointer group">
          <div className="w-14 h-14 rounded-xl bg-[var(--dash-surface)] shadow-sm flex items-center justify-center text-[var(--dash-sage)] mb-4 group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--dash-text)] mb-1">Create New Group</h3>
          <p className="text-sm text-[var(--dash-text-secondary)] max-w-[200px]">Combine related prescriptions to track progress over time.</p>
        </div>
      </div>
    </div>
  );
}
