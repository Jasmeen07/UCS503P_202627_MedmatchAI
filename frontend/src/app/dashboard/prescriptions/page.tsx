"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Filter, LayoutGrid, List as ListIcon, FileText, CheckCircle2, AlertCircle, ScanLine } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

export interface StoredPrescription {
  id: string | number;
  doc: string;
  hospital: string;
  diag: string;
  date: string;
  meds: number;
  status: string;
  source: string;
  conf: string | null;
  overview?: string;
  review_warning?: string;
}

const initialMockPrescriptions: StoredPrescription[] = [
  { id: "1", doc: "Dr. Sharma", hospital: "City Hospital", diag: "Upper Respiratory Infection", date: "2026-09-01", meds: 3, status: "active", source: "manual", conf: null },
  { id: "2", doc: "Dr. Patel", hospital: "Lifeline Clinic", diag: "Type 2 Diabetes", date: "2026-08-15", meds: 4, status: "active", source: "ocr_scan", conf: "high" },
  { id: "3", doc: "Dr. Mehta", hospital: "Apollo Hospital", diag: "Seasonal Allergies", date: "2026-07-20", meds: 2, status: "completed", source: "manual", conf: null },
  { id: "4", doc: "Dr. Singh", hospital: "Max Healthcare", diag: "Hypertension", date: "2026-06-10", meds: 3, status: "active", source: "manual", conf: null },
  { id: "5", doc: "Dr. Kumar", hospital: "Fortis Hospital", diag: "Gastric Reflux", date: "2026-05-05", meds: 2, status: "completed", source: "manual", conf: null },
  { id: "6", doc: "Dr. Rao", hospital: "AIIMS", diag: "Post-Surgery Recovery", date: "2026-04-12", meds: 5, status: "discontinued", source: "ocr_scan", conf: "medium" },
];

export default function PrescriptionsPage() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");
  const [prescriptions, setPrescriptions] = useState<StoredPrescription[]>(initialMockPrescriptions);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("medmatch_prescriptions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Put user's scanned prescriptions first
          setPrescriptions([...parsed, ...initialMockPrescriptions]);
        }
      }
    } catch (e) {
      console.warn("Error loading stored prescriptions:", e);
    }
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

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredMocks.map(p => (
            <Link href={`/dashboard/prescriptions/${p.id}`} key={p.id} className="dash-card card-interactive flex flex-col h-full group hover:border-[var(--dash-sage-light)] transition-all">
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
                      <Link href={`/dashboard/prescriptions/${p.id}`} className="text-[var(--dash-sage)] font-medium hover:underline">
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
    </div>
  );
}
