"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ScanLine, 
  Calendar, 
  UserCheck, 
  Activity, 
  FileText, 
  Layers, 
  ChevronRight, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Sun,
  Sunset,
  Moon,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/dashboard/page-header";

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
  { id: "1", name: "Tab Thyrox", dosage: "75mcg", timeSlot: "morning", instructions: "Empty stomach", taken: true, purpose: "Thyroid hormone support" },
  { id: "2", name: "Tab Stamlo", dosage: "5mg", timeSlot: "morning", instructions: "After breakfast", taken: true, purpose: "Blood pressure regulation" },
  { id: "3", name: "Tab Rigler Forte", dosage: "1 tab", timeSlot: "afternoon", instructions: "After lunch", taken: false, purpose: "Digestive enzyme supplement" },
  { id: "4", name: "Tab Avas", dosage: "10mg", timeSlot: "night", instructions: "Before bedtime", taken: false, purpose: "Cholesterol lowering & arterial health" },
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
          setRecentPrescriptions(parsed.slice(0, 3));
          return;
        }
      }
    } catch {
      // ignore
    }

    // Default fallbacks
    setRecentPrescriptions([
      { id: "1", doc: "Dr. Sharma", diag: "Upper Respiratory Infection", date: "Sep 1, 2026", meds: 3, status: "active" },
      { id: "2", doc: "Dr. Patel", diag: "Type 2 Diabetes", date: "Aug 15, 2026", meds: 4, status: "active" },
      { id: "3", doc: "Dr. Mehta", diag: "Seasonal Allergies", date: "Jul 20, 2026", meds: 2, status: "completed" }
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
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Section */}
      <PageHeader 
        title={`${getGreeting()}, ${userName}`} 
        subtitle={currentDate}
      />

      {/* Quick Actions (Tactile Interactive Cards with Login-Inspired Physics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link 
          href="/dashboard/scan" 
          className="group card-interactive dash-card p-5 flex items-center gap-4 border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition-all bg-white dark:bg-slate-900"
        >
          <div className="w-12 h-12 rounded-lg bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <ScanLine className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Scan Prescription</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Upload new record</p>
          </div>
        </Link>

        <Link 
          href="/dashboard/treatments" 
          className="group card-interactive dash-card p-5 flex items-center gap-4 border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition-all bg-white dark:bg-slate-900"
        >
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Treatment Groups</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Organize by disease</p>
          </div>
        </Link>

        <Link 
          href="/dashboard/insights" 
          className="group card-interactive dash-card p-5 flex items-center gap-4 border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition-all bg-white dark:bg-slate-900"
        >
          <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Drug Interactions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Automated safety check</p>
          </div>
        </Link>

        <Link 
          href="/dashboard/sharing" 
          className="group card-interactive dash-card p-5 flex items-center gap-4 border-slate-200 dark:border-slate-800 hover:border-teal-500/60 transition-all bg-white dark:bg-slate-900"
        >
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Doctor Access</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Grant temporary view</p>
          </div>
        </Link>
      </div>

      {/* Creative Interactive Daily Medication Rhythm Widget */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-white dark:bg-slate-900 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Daily Medication Rhythm & Schedule
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Click a medication dose to mark it as taken. Keeps an adherence record for your doctor.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {completedDoses} of {doses.length} Doses Logged
              </p>
              <p className="text-[11px] text-teal-600 dark:text-teal-400 font-medium">
                {adherenceRate}% Daily Adherence
              </p>
            </div>
            {/* Adherence Progress Bar */}
            <div className="w-24 h-2 rounded bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700">
              <div 
                className="h-full bg-teal-600 dark:bg-teal-400 transition-all duration-500 ease-out rounded"
                style={{ width: `${adherenceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* 3 Dosage Rhythm Columns: Morning, Afternoon, Night */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Morning */}
          <div className="border border-slate-100 dark:border-slate-800/80 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-500" />
                Morning (08:00 AM)
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Slot 1</span>
            </div>

            <div className="space-y-2">
              {doses
                .filter((d) => d.timeSlot === "morning")
                .map((dose) => (
                  <div
                    key={dose.id}
                    onClick={() => toggleDose(dose.id)}
                    className={`rhythm-pill-box p-3 rounded-lg border text-xs transition-all ${
                      dose.taken
                        ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-semibold ${dose.taken ? "line-through text-slate-500" : ""}`}>
                          {dose.name} <span className="font-normal text-slate-500">({dose.dosage})</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{dose.instructions}</p>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        dose.taken
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      }`}>
                        {dose.taken && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Afternoon */}
          <div className="border border-slate-100 dark:border-slate-800/80 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Sunset className="w-4 h-4 text-orange-500" />
                Afternoon (01:30 PM)
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Slot 2</span>
            </div>

            <div className="space-y-2">
              {doses
                .filter((d) => d.timeSlot === "afternoon")
                .map((dose) => (
                  <div
                    key={dose.id}
                    onClick={() => toggleDose(dose.id)}
                    className={`rhythm-pill-box p-3 rounded-lg border text-xs transition-all ${
                      dose.taken
                        ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-semibold ${dose.taken ? "line-through text-slate-500" : ""}`}>
                          {dose.name} <span className="font-normal text-slate-500">({dose.dosage})</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{dose.instructions}</p>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        dose.taken
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      }`}>
                        {dose.taken && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Night */}
          <div className="border border-slate-100 dark:border-slate-800/80 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 pb-2">
              <span className="flex items-center gap-1.5">
                <Moon className="w-4 h-4 text-indigo-400" />
                Night (09:00 PM)
              </span>
              <span className="text-[10px] text-slate-400 uppercase font-mono">Slot 3</span>
            </div>

            <div className="space-y-2">
              {doses
                .filter((d) => d.timeSlot === "night")
                .map((dose) => (
                  <div
                    key={dose.id}
                    onClick={() => toggleDose(dose.id)}
                    className={`rhythm-pill-box p-3 rounded-lg border text-xs transition-all ${
                      dose.taken
                        ? "border-emerald-300 bg-emerald-50/40 dark:border-emerald-800 dark:bg-emerald-950/30 text-slate-900 dark:text-slate-100"
                        : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-semibold ${dose.taken ? "line-through text-slate-500" : ""}`}>
                          {dose.name} <span className="font-normal text-slate-500">({dose.dosage})</span>
                        </p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{dose.instructions}</p>
                      </div>
                      <div className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                        dose.taken
                          ? "bg-emerald-600 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                      }`}>
                        {dose.taken && <CheckCircle2 className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FileText} label="Total Prescriptions" value="12" accentColor="var(--dash-sage)" trend="+2 this month" />
        <StatCard icon={Layers} label="Active Treatments" value="3" accentColor="var(--dash-amber)" />
        <StatCard icon={Calendar} label="Upcoming Appointments" value="2" accentColor="var(--dash-terracotta)" />
        <StatCard icon={UserCheck} label="Active Doctor Shares" value="1" accentColor="var(--dash-coral)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Recent Prescriptions
            </h2>
            <Link href="/dashboard/prescriptions" className="text-sm font-medium text-teal-700 dark:text-teal-400 hover:underline flex items-center">
              View all <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
          
          <div className="dash-card overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentPrescriptions.map((item, i) => (
                <Link
                  href={`/dashboard/prescriptions/${item.id}`}
                  key={i}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between block"
                >
                  <div className="flex items-start gap-4">
                    <div className="mt-1 w-9 h-9 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.diag}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">{item.doc} • {item.hospital || "Clinical Visit"}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                          {item.meds || item.medicines?.length || 3} medicines
                        </span>
                        <span className="text-xs text-slate-400">{item.date}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Appointments */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Upcoming Visits</h2>
            <Link href="/dashboard/appointments" className="text-xs text-teal-700 dark:text-teal-400 hover:underline">
              Manage
            </Link>
          </div>
          
          <div className="space-y-3">
            {[
              { title: "Follow-up: Diabetes", doc: "Dr. Patel", date: "Sept 15", time: "10:00 AM", in: "4 days" },
              { title: "Annual Check-up", doc: "Dr. Sharma", date: "Sept 22", time: "2:30 PM", in: "11 days" }
            ].map((visit, i) => (
              <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-lg p-4 bg-white dark:bg-slate-900 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-xs text-slate-900 dark:text-slate-100">{visit.title}</p>
                  <span className="text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">In {visit.in}</span>
                </div>
                <p className="text-xs text-slate-500">{visit.doc}</p>
                <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{visit.date} at {visit.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
