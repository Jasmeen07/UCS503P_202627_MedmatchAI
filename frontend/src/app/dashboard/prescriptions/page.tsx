"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Filter, LayoutGrid, List as ListIcon, FileText, CheckCircle2, AlertCircle, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { 
  getPatientPrescriptions, 
  getActivePatientEmail,
  StoredPrescription 
} from "@/lib/patientData";

export type { StoredPrescription };

export default function PrescriptionsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");
  const [prescriptions, setPrescriptions] = useState<StoredPrescription[]>([]);

  useEffect(() => {
    const activeEmail = getActivePatientEmail();
    const userRx = getPatientPrescriptions(activeEmail);
    setPrescriptions(userRx);
  }, []);

  const filteredMocks = prescriptions.filter(p => filter === "all" || p.status === filter);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="My Prescriptions" 
        subtitle="Manage and track all your medical records"
        action={
          <Link href="/dashboard/scan" className="dash-btn-primary">
            <Plus className="w-4 h-4" />
            Add Prescription
          </Link>
        }
      />

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[var(--dash-surface)] p-3 rounded-xl border border-[var(--dash-border)] shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[var(--dash-text-tertiary)] ml-2" />
          <select 
            className="dash-input py-1.5 text-sm border-transparent bg-transparent hover:bg-[var(--dash-surface-warm)] cursor-pointer"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="discontinued">Discontinued</option>
          </select>
        </div>

        <div className="flex items-center gap-1 bg-[var(--dash-surface-warm)] p-1 rounded-lg">
          <button 
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-[var(--dash-surface)] shadow-sm text-[var(--dash-text)]' : 'text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)]'}`}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button 
            className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-[var(--dash-surface)] shadow-sm text-[var(--dash-text)]' : 'text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)]'}`}
            onClick={() => setViewMode('list')}
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content: Empty State or Grid/List */}
      {filteredMocks.length === 0 ? (
        <div className="dash-card p-12 text-center max-w-md mx-auto my-8">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200/80 dark:border-teal-800 text-teal-600 dark:text-teal-400 flex items-center justify-center mx-auto mb-4 shadow-sm">
            <FileText className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--dash-text)] mb-1">No Prescriptions Recorded</h3>
          <p className="text-sm text-[var(--dash-text-secondary)] mb-6 leading-relaxed">
            {filter !== "all" 
              ? `You do not have any prescriptions matching "${filter}".`
              : "Upload or scan your doctor's prescription slip to securely track your medical history and medication schedule."}
          </p>
          <Link href="/dashboard/scan" className="dash-btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Prescription
          </Link>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === "grid" && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredMocks.map(p => (
                <Link href={`/dashboard/prescriptions/view?id=${p.id}`} key={p.id} className="dash-card card-interactive flex flex-col h-full group hover:border-[var(--dash-sage-light)] transition-all">
                  <div 
                    className="h-1.5 w-full"
                    style={{ 
                      backgroundColor: p.status === 'active' ? 'var(--dash-sage)' : 
                                       p.status === 'completed' ? 'var(--dash-amber)' : 'var(--dash-coral)' 
                    }}
                  />
                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`dash-pill ${
                        p.status === 'active' ? 'bg-[var(--dash-sage-bg)] text-[var(--dash-sage)]' : 
                        p.status === 'completed' ? 'bg-[var(--dash-amber-bg)] text-[var(--dash-amber)]' : 
                        'bg-[var(--dash-coral-bg)] text-[var(--dash-coral)]'
                      }`}>
                        {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                      </span>
                      {p.source === 'ocr_scan' && (
                        <span className="text-xs font-medium flex items-center gap-1 text-[var(--dash-text-tertiary)] bg-[var(--dash-bg)] px-2 py-1 rounded">
                          <ScanLine className="w-3 h-3" /> Scanned
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-semibold text-[var(--dash-text)] mb-1 group-hover:text-[var(--dash-sage)] transition-colors">{p.diag}</h3>
                    <p className="text-sm font-medium text-[var(--dash-text-secondary)]">{p.doc}</p>
                    <p className="text-xs text-[var(--dash-text-tertiary)] mb-4">{p.hospital}</p>
                    
                    <div className="mt-auto pt-4 border-t border-[var(--dash-border)] flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5 text-[var(--dash-text-secondary)] font-medium">
                        <FileText className="w-4 h-4 text-[var(--dash-sage)]" />
                        {p.meds} medicines
                      </span>
                      <span className="text-[var(--dash-text-tertiary)]">{p.date}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="dash-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)]">
                    <tr>
                      <th className="p-4 font-medium">Diagnosis & Doctor</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Medicines</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--dash-border)]">
                    {filteredMocks.map(p => (
                      <tr key={p.id} className="hover:bg-[var(--dash-surface-warm)]/50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-[var(--dash-text)]">{p.diag}</div>
                          <div className="text-xs text-[var(--dash-text-secondary)] mt-0.5">{p.doc} • {p.hospital}</div>
                        </td>
                        <td className="p-4 text-[var(--dash-text-secondary)]">{p.date}</td>
                        <td className="p-4">
                          <span className="font-medium bg-[var(--dash-bg)] px-2 py-1 rounded text-[var(--dash-text-secondary)]">
                            {p.meds} items
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`dash-pill ${
                            p.status === 'active' ? 'bg-[var(--dash-sage-bg)] text-[var(--dash-sage)]' : 
                            p.status === 'completed' ? 'bg-[var(--dash-amber-bg)] text-[var(--dash-amber)]' : 
                            'bg-[var(--dash-coral-bg)] text-[var(--dash-coral)]'
                          }`}>
                            {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <Link href={`/dashboard/prescriptions/view?id=${p.id}`} className="text-[var(--dash-sage)] font-medium hover:underline">
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
