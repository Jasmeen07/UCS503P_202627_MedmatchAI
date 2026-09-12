"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  ChevronRight, 
  Check, 
  Calendar,
  Layers,
  Activity,
  UserCheck
} from "lucide-react";

interface DailyDoseItem {
  id: string;
  name: string;
  dosage: string;
  timeSlot: "morning" | "afternoon" | "night";
  instructions: string;
  taken: boolean;
  purpose: string;
}

const initialDoses: DailyDoseItem[] = [
  { id: "1", name: "Lisinopril", dosage: "10mg", timeSlot: "morning", instructions: "Once daily", taken: true, purpose: "Blood pressure regulation" },
  { id: "2", name: "Metformin", dosage: "500mg", timeSlot: "morning", instructions: "Twice daily", taken: true, purpose: "Glycemic balance" },
  { id: "3", name: "Atorvastatin", dosage: "20mg", timeSlot: "night", instructions: "Once daily", taken: false, purpose: "Arterial health & lipid regulation" },
  { id: "4", name: "Tab Thyrox", dosage: "75mcg", timeSlot: "morning", instructions: "Empty stomach", taken: true, purpose: "Thyroid hormone support" },
];

export default function DashboardOverview() {
  const [userName, setUserName] = useState("Patient");
  const [currentDate, setCurrentDate] = useState("");
  const [doses, setDoses] = useState<DailyDoseItem[]>(initialDoses);
  const [recentPrescriptions, setRecentPrescriptions] = useState<any[]>([]);

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    // Load recent scanned prescriptions from localStorage
    try {
      const stored = localStorage.getItem("medmatch_prescriptions");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentPrescriptions(parsed.slice(0, 5));
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default fallbacks matching real care updates
    setRecentPrescriptions([
      { id: "1", doc: "Dr. Sharma", diag: "Prescription renewed", subtitle: "By Dr. Sharma", date: "Sep 12, 2026", meds: 3, status: "active" },
      { id: "2", doc: "General Check-up", diag: "Appointment scheduled", subtitle: "General Check-up", date: "Sep 10, 2026", meds: 4, status: "active" },
      { id: "3", doc: "Apollo Lab", diag: "Lab results available", subtitle: "Blood work", date: "Sep 8, 2026", meds: 2, status: "completed" },
      { id: "4", doc: "Clinical Visit", diag: "Clinical note updated", subtitle: "Visit summary", date: "Sep 5, 2026", meds: 3, status: "active" },
      { id: "5", doc: "Dr. Patel", diag: "Medication added", subtitle: "By Dr. Patel", date: "Sep 1, 2026", meds: 1, status: "active" }
    ]);
  }, []);

  const toggleDose = (id: string) => {
    setDoses((prev) =>
      prev.map((d) => (d.id === id ? { ...d, taken: !d.taken } : d))
    );
  };

  const completedDoses = doses.filter((d) => d.taken).length;
  const adherenceRate = Math.round((completedDoses / doses.length) * 100);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500 relative">
      {/* =========================================================================
          HERO SECTION — MedMatch Reassuring Botanical Consultation Banner
          ========================================================================= */}
      <section className="relative pt-2 pb-6 sm:pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 overflow-hidden">
        {/* Left Headline & Editorial Reassurance */}
        <div className="max-w-xl z-10 space-y-3">
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-slate-900 dark:text-slate-100 font-editorial-serif">
            {getGreeting()}
          </h1>
          <p className="text-lg sm:text-xl text-slate-700 dark:text-slate-300 font-editorial-serif leading-relaxed">
            Your health matters. We&apos;re here for you.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <span className="w-8 h-px bg-slate-400/60 dark:bg-slate-600"></span>
            <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic font-editorial-serif tracking-wide">
              Personalized care. A healthier you.
            </span>
          </div>
        </div>

        {/* Right Doctor Consultation Visual with Soft Feathered Waves */}
        <div className="relative flex items-center justify-end shrink-0 md:w-[460px] lg:w-[500px]">
          {/* Doctor consultation artwork with soft alpha feathered edges */}
          <div className="relative w-full max-w-[420px] pointer-events-none select-none">
            <img 
              src="/hero-doctor.png" 
              alt="Physician consultation" 
              className="w-full h-auto object-contain"
            />
          </div>

          {/* Editorial Side Caption */}
          <div className="hidden xl:flex flex-col justify-center text-slate-500 dark:text-slate-400 font-editorial-serif italic text-xs tracking-wider space-y-1 pl-4 select-none shrink-0">
            <p>People.</p>
            <p>Care.</p>
            <p>Better together.</p>
            <div className="w-5 h-px bg-slate-400/50 dark:bg-slate-600 mt-2"></div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          EDITORIAL TWO-COLUMN LAYOUT — NO CARD GRID
          ========================================================================= */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 pt-2">
        {/* -----------------------------------------------------------------------
            COLUMN 1: RECENT ACTIVITY
            ----------------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-3">
            <div>
              <h2 className="text-2xl font-normal text-slate-900 dark:text-slate-100 font-editorial-serif tracking-tight">
                Recent Activity
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your latest updates across your care.
              </p>
            </div>
            <Link 
              href="/dashboard/prescriptions" 
              className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
            >
              View all <span>→</span>
            </Link>
          </div>

          {/* Clean Editorial List with Hairline Dividers */}
          <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {recentPrescriptions.map((item, i) => (
              <Link
                key={item.id || i}
                href={`/dashboard/prescriptions/${item.id || 1}`}
                className="group editorial-row py-3.5 px-2 flex items-center justify-between block -mx-2 rounded-lg transition-all"
              >
                <div className="space-y-0.5 min-w-0 pr-4">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors">
                    {item.diag || "Prescription record"}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {item.subtitle || (item.doc ? `By ${item.doc}` : "Clinical record")}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
                    {item.date}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-700 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* -----------------------------------------------------------------------
            COLUMN 2: ACTIVE TREATMENTS
            ----------------------------------------------------------------------- */}
        <div className="space-y-4">
          <div className="flex items-baseline justify-between border-b border-slate-200/70 dark:border-slate-800/70 pb-3">
            <div>
              <h2 className="text-2xl font-normal text-slate-900 dark:text-slate-100 font-editorial-serif tracking-tight">
                Active Treatments
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Your current medications and treatment plans.
              </p>
            </div>
            <Link 
              href="/dashboard/treatments" 
              className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 flex items-center gap-1 transition-colors"
            >
              Manage <span>→</span>
            </Link>
          </div>

          {/* Clean Editorial List with Hairline Dividers */}
          <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
            {doses.map((dose) => (
              <div
                key={dose.id}
                className="group editorial-row py-3.5 px-2 flex items-center justify-between -mx-2 rounded-lg transition-all"
              >
                <div className="space-y-0.5 min-w-0 pr-4">
                  <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    {dose.name}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {dose.dosage} · {dose.instructions}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {/* Discreet interactive adherence checkmark */}
                  <button
                    onClick={() => toggleDose(dose.id)}
                    title={dose.taken ? "Completed dose (click to undo)" : "Mark as taken"}
                    className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                      dose.taken
                        ? "bg-teal-700 dark:bg-teal-600 text-white"
                        : "border border-slate-300 dark:border-slate-700 hover:border-teal-600 bg-white/50 dark:bg-slate-800/50 text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>

                  <Link href="/dashboard/treatments" title="View treatment details">
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-teal-700 dark:group-hover:text-teal-400 group-hover:translate-x-0.5 transition-all" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          DISCREET QUICK-ACCESS LINKS (Zero Functionality Lost)
          ========================================================================= */}
      <section className="pt-6 border-t border-slate-200/40 dark:border-slate-800/40">
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700 dark:text-slate-300">Quick access:</span>
            <Link href="/dashboard/appointments" className="hover:text-teal-700 dark:hover:text-teal-300 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700">
              Upcoming Appointments
            </Link>
            <span>•</span>
            <Link href="/dashboard/insights" className="hover:text-teal-700 dark:hover:text-teal-300 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700">
              Drug Safety & Interactions
            </Link>
            <span>•</span>
            <Link href="/dashboard/sharing" className="hover:text-teal-700 dark:hover:text-teal-300 underline underline-offset-4 decoration-slate-300 dark:decoration-slate-700">
              Doctor Access
            </Link>
          </div>

          <div className="flex items-center gap-2 font-editorial-serif italic text-[11px]">
            <span>Daily Adherence: {adherenceRate}%</span>
            <span>({completedDoses} of {doses.length} logged)</span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FLOATING ACTION BUTTON — PRESCRIPTION UPLOAD (Matches Reference)
          ========================================================================= */}
      <div className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-40 flex items-end gap-2.5 pointer-events-auto select-none">
        <div className="w-28 h-28 shrink-0 -mb-2 pointer-events-none">
          <img src="/bottom-leaf.png" alt="Upload prescription" className="w-full h-full object-contain" />
        </div>

        <Link 
          href="/dashboard/scan"
          className="fab-upload-btn group mb-3 shrink-0"
          title="Upload prescription"
        >
          <Plus className="w-6 h-6 stroke-[2.5] text-white group-hover:rotate-90 transition-transform duration-300" />
        </Link>
      </div>
    </div>
  );
}

