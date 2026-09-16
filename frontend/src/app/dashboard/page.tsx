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
  UserCheck,
  FileText
} from "lucide-react";
import { assetPath } from "@/lib/utils";
import { 
  getPatientPrescriptions, 
  getPatientDailyDoses, 
  togglePatientDailyDose, 
  getActivePatientEmail,
  getPatientAppointments,
  AppointmentItem,
  DailyDoseItem,
  StoredPrescription
} from "@/lib/patientData";

export default function DashboardOverview() {
  const [userName, setUserName] = useState("Patient");
  const [currentDate, setCurrentDate] = useState("");
  const [patientEmail, setPatientEmail] = useState("");
  const [doses, setDoses] = useState<DailyDoseItem[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<StoredPrescription[]>([]);
  const [nextAppointment, setNextAppointment] = useState<AppointmentItem | null>(null);

  useEffect(() => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    setCurrentDate(date.toLocaleDateString('en-US', options));

    // Load user's scoped data
    const activeEmail = getActivePatientEmail();
    setPatientEmail(activeEmail);

    const userRx = getPatientPrescriptions(activeEmail);
    setRecentPrescriptions(userRx.slice(0, 5));

    const userDoses = getPatientDailyDoses(activeEmail);
    setDoses(userDoses);

    const userAppointments = getPatientAppointments(activeEmail);
    const nextApp = userAppointments.find((a) => a.status === "upcoming");
    setNextAppointment(nextApp || null);
  }, []);

  const [greeting, setGreeting] = useState("");
  const [displayedGreeting, setDisplayedGreeting] = useState("");

  // Indian Time Zone Greeting Resolver (Asia/Kolkata)
  const getIndianGreeting = () => {
    try {
      const now = new Date();
      const istHourStr = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        hour12: false
      }).format(now);
      const hour = parseInt(istHourStr, 10);
      
      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      if (hour >= 17 && hour < 21) return "Good evening";
      return "Good night";
    } catch {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "Good morning";
      if (hour >= 12 && hour < 17) return "Good afternoon";
      if (hour >= 17 && hour < 21) return "Good evening";
      return "Good night";
    }
  };

  // Keep greeting synced live with Indian Time Zone
  useEffect(() => {
    const update = () => {
      const next = getIndianGreeting();
      setGreeting((prev) => (prev !== next ? next : prev));
    };
    update();
    const timer = setInterval(update, 10000);
    return () => clearInterval(timer);
  }, []);

  // Typewriter motion animation ("like we typed it")
  useEffect(() => {
    if (!greeting) return;
    let index = 0;
    setDisplayedGreeting("");
    const interval = setInterval(() => {
      index++;
      setDisplayedGreeting(greeting.slice(0, index));
      if (index >= greeting.length) {
        clearInterval(interval);
      }
    }, 75);

    return () => clearInterval(interval);
  }, [greeting]);

  const toggleDose = (id: string) => {
    const updated = togglePatientDailyDose(id, patientEmail);
    setDoses(updated);
  };

  const completedDoses = doses.filter((d) => d.taken).length;
  const adherenceRate = doses.length > 0 ? Math.round((completedDoses / doses.length) * 100) : 0;

  return (
    <div className="space-y-12 animate-in fade-in duration-500 relative">
      {/* =========================================================================
          HERO SECTION — MedMatch Reassuring Botanical Consultation Banner
          ========================================================================= */}
      <section className="relative pt-0 pb-4 sm:pb-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
        {/* Left Headline & Editorial Reassurance — positioned lower down with generous breathing space */}
        <div className="max-w-xl z-10 space-y-3 pt-14 sm:pt-16 md:pt-20 lg:pt-24 xl:pt-28">
          <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-slate-900 dark:text-slate-100 font-editorial-serif min-h-[1.25em] flex items-baseline">
            <span>{displayedGreeting || greeting || "Good morning"}</span>
            <span className="inline-block w-0.5 h-[0.8em] bg-teal-700/60 dark:bg-teal-400/60 animate-pulse ml-1 rounded-full" />
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

        {/* Right Doctor Consultation Visual — Reaches all the way UP to the very start of the page */}
        <div className="relative flex items-start justify-end shrink-0 md:w-[540px] lg:w-[620px] xl:w-[720px] pt-0 -mt-3 sm:-mt-5 md:-mt-7 lg:-mt-9">
          {/* Dedicated Wave Contour Layer locked to the Doctor Illustration */}
          <div className="absolute -inset-x-12 -top-10 bottom-0 pointer-events-none select-none z-0">
            <svg 
              className="w-full h-full" 
              viewBox="0 0 800 420" 
              fill="none" 
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="docWaveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#d5eee4" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#e8f7f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#f8fbf9" stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="docWaveGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#bee8da" stopOpacity="0.55" />
                  <stop offset="60%" stopColor="#dcf4eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#f8fbf9" stopOpacity="0.02" />
                </linearGradient>
              </defs>
              {/* Sweeps smoothly under the doctor desk and curves up behind the patient */}
              <path 
                d="M 0 40 C 130 160, 240 340, 440 345 C 590 350, 690 270, 800 110 L 800 0 L 0 0 Z" 
                fill="url(#docWaveGrad1)" 
              />
              <path 
                d="M 80 0 C 200 150, 310 310, 470 315 C 610 320, 720 240, 800 50 L 800 0 Z" 
                fill="url(#docWaveGrad2)" 
              />
            </svg>
          </div>

          {/* Editorial Side Caption — placed safely to the left of the artwork, completely clear of the topbar account profile */}
          <div className="hidden xl:flex flex-col justify-center text-slate-500 dark:text-slate-400 font-editorial-serif italic text-xs tracking-wider space-y-1 pr-6 pt-24 select-none shrink-0 z-10">
            <p>People.</p>
            <p>Care.</p>
            <p>Better together.</p>
            <div className="w-5 h-px bg-slate-400/50 dark:bg-slate-600 mt-2"></div>
          </div>

          {/* Doctor consultation artwork with seamless radial alpha blend reaching the very top */}
          <div 
            className="relative w-full max-w-[520px] lg:max-w-[600px] xl:max-w-[680px] pointer-events-none select-none z-10"
            style={{
              maskImage: "radial-gradient(ellipse 86% 86% at 50% 46%, black 62%, transparent 98%)",
              WebkitMaskImage: "radial-gradient(ellipse 86% 86% at 50% 46%, black 62%, transparent 98%)"
            }}
          >
            <img 
              src={assetPath("/hero-doctor.png")} 
              alt="Physician consultation" 
              className="w-full h-auto object-contain mix-blend-multiply opacity-88 dark:opacity-75 dark:mix-blend-screen transition-opacity"
            />
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

          {/* Clean Editorial List or Empty State */}
          {recentPrescriptions.length > 0 ? (
            <div className="divide-y divide-slate-200/50 dark:divide-slate-800/50">
              {recentPrescriptions.map((item, i) => (
                <Link
                  key={item.id || i}
                  href={`/dashboard/prescriptions/view?id=${item.id || 1}`}
                  className="group editorial-row py-3.5 px-2 flex items-center justify-between block -mx-2 rounded-lg transition-all"
                >
                  <div className="space-y-0.5 min-w-0 pr-4">
                    <h4 className="font-semibold text-sm text-slate-900 dark:text-slate-100 group-hover:text-teal-800 dark:group-hover:text-teal-300 transition-colors">
                      {item.diag || "Prescription record"}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {item.doc ? `By ${item.doc}` : "Clinical record"}
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
          ) : (
            <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Prescriptions Yet</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Scan or upload your doctor&apos;s prescription slip to automatically track your health record.
              </p>
              <Link 
                href="/dashboard/scan" 
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Scan Prescription
              </Link>
            </div>
          )}
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

          {/* Clean Editorial List or Empty State */}
          {doses.length > 0 ? (
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
          ) : (
            <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
              <Layers className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">No Active Treatment Regimens</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                Create treatment groups or scan prescriptions to build your daily dosage schedule.
              </p>
              <Link 
                href="/dashboard/treatments" 
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white text-xs font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Manage Treatments
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          NEXT SCHEDULED CONSULTATION (Real-time Appointment Sync)
          ========================================================================= */}
      {nextAppointment && (
        <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-50/90 via-emerald-50/40 to-white dark:from-teal-950/40 dark:via-emerald-950/20 dark:to-slate-900 border border-teal-200/80 dark:border-teal-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200">
                  Next Scheduled Consultation
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  • {nextAppointment.specialty || "Clinical Review"}
                </span>
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 mt-1">
                {nextAppointment.title} with {nextAppointment.doc}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                {nextAppointment.date} at {nextAppointment.time} • {nextAppointment.location}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Link
              href="/dashboard/appointments"
              className="w-full sm:w-auto text-xs font-semibold px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white transition-colors text-center shadow-xs inline-flex items-center justify-center gap-1.5"
            >
              <span>Manage Appointments</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>
      )}

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
            {doses.length > 0 ? (
              <>
                <span>Daily Adherence: {adherenceRate}%</span>
                <span>({completedDoses} of {doses.length} logged)</span>
              </>
            ) : (
              <span>No scheduled doses for today</span>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          FLOATING ACTION BUTTON — PRESCRIPTION UPLOAD (Grounded, Balanced & Elegant)
          ========================================================================= */}
      <div className="fixed bottom-7 right-7 sm:bottom-9 sm:right-9 z-40 flex items-center gap-3 pointer-events-auto select-none group">
        {/* Cohesive Callout: Sprout + Text + Swoop Arrow */}
        <div className="flex items-center gap-2 pointer-events-none">
          {/* Soft Botanical Sprout */}
          <div className="w-9 h-11 shrink-0 opacity-70 dark:opacity-55 mix-blend-multiply">
            <img src={assetPath("/bottom-leaf.png")} alt="" className="w-full h-full object-contain" />
          </div>

          {/* Crisp Serif Callout */}
          <div className="flex items-center gap-1.5">
            <span className="font-editorial-serif italic text-[13px] sm:text-sm text-slate-600 dark:text-teal-300 font-medium tracking-tight whitespace-nowrap">
              Upload prescription
            </span>

            {/* Elegant Curved Swoop Arrow pointing directly to the FAB */}
            <svg 
              className="w-5 h-4 text-slate-400 dark:text-teal-400 shrink-0 transform translate-y-0.5 group-hover:translate-x-1 transition-transform duration-300" 
              viewBox="0 0 24 16" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.8" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            >
              <path d="M 2 12 C 8 14, 15 13, 20 5" />
              <path d="M 15 4 L 21 4 L 21 10" />
            </svg>
          </div>
        </div>

        {/* Circular Dark Teal FAB */}
        <Link 
          href="/dashboard/scan"
          className="fab-upload-btn group shadow-lg shrink-0"
          title="Upload prescription"
        >
          <Plus className="w-6 h-6 stroke-[2.5] text-white group-hover:rotate-90 transition-transform duration-300" />
        </Link>
      </div>
    </div>
  );
}

