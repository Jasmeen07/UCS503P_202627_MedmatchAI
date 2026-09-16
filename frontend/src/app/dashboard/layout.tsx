"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import "./dashboard.css";
import {
  PanelLeftClose,
  PanelLeftOpen,
  LayoutDashboard,
  FileText,
  Layers,
  ScanLine,
  Activity,
  Calendar,
  UserCheck,
  Settings,
  LogOut,
  Bell,
  Search,
  ChevronDown,
  HelpCircle,
  HeartPulse,
  ShieldCheck,
  User,
  Pill,
  ArrowRight,
  X,
  Sparkles,
  Stethoscope,
  QrCode
} from "lucide-react";
import { createClient } from "@/lib/client";
import { assetPath } from "@/lib/utils";
import { verifyActiveSession, clearUserSession, UserSession } from "@/lib/auth";
import { 
  getPatientPrescriptions, 
  getPatientTreatmentGroups, 
  getPatientAppointments, 
  StoredPrescription,
  TreatmentGroup,
  AppointmentItem
} from "@/lib/patientData";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [greeting, setGreeting] = useState("Good morning");
  const [isVerifying, setIsVerifying] = useState(true);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Patient scoped search cache
  const [patientPrescriptions, setPatientPrescriptions] = useState<StoredPrescription[]>([]);
  const [patientTreatments, setPatientTreatments] = useState<TreatmentGroup[]>([]);
  const [patientAppointments, setPatientAppointments] = useState<AppointmentItem[]>([]);

  // Authentication Gatekeeper
  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      try {
        const session = await verifyActiveSession();
        if (!isMounted) return;

        if (!session) {
          // Capture target destination including search query parameters
          const destination = pathname + (typeof window !== "undefined" ? window.location.search : "");

          router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
          return;
        }

        setUserSession(session);
        setIsVerifying(false);

        // Fetch patient records for quick search
        if (session.email) {
          setPatientPrescriptions(getPatientPrescriptions(session.email));
          setPatientTreatments(getPatientTreatmentGroups(session.email));
          setPatientAppointments(getPatientAppointments(session.email));
        }
      } catch (err) {
        console.warn("Auth check error:", err);
        router.replace("/login");
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, [router, pathname]);

  useEffect(() => {
    // Open sidebar by default only on large screens
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }

    // Force Light Mode - Disable Dark Mode
    document.documentElement.classList.remove("dark");
    try {
      localStorage.removeItem("theme");
    } catch {}

    // Indian Time Zone Greeting (Asia/Kolkata)
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

    const updateGreeting = () => setGreeting(getIndianGreeting());
    updateGreeting();
    const interval = setInterval(updateGreeting, 10000);
    return () => clearInterval(interval);
  }, []);

  // Click outside to close search popover
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Multi-category search engine computed over patient records
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;

    // Prescriptions & Medications
    const matchedRxs: Array<{ id: string | number; title: string; subtitle: string; matchReason: string; href: string }> = [];
    for (const rx of patientPrescriptions) {
      const diagMatch = (rx.diag || "").toLowerCase().includes(q);
      const docMatch = (rx.doc || "").toLowerCase().includes(q);
      const hospMatch = (rx.hospital || "").toLowerCase().includes(q);
      const matchedMeds: string[] = [];
      if (Array.isArray(rx.medicines)) {
        for (const m of rx.medicines) {
          const mName = (m.name || m.medicine_name || "").toLowerCase();
          if (mName.includes(q)) {
            matchedMeds.push(m.name || m.medicine_name || "");
          }
        }
      }

      if (diagMatch || docMatch || hospMatch || matchedMeds.length > 0) {
        let reason = "";
        if (matchedMeds.length > 0) {
          reason = `Contains: ${matchedMeds.join(", ")}`;
        } else if (docMatch) {
          reason = `Prescribed by ${rx.doc}`;
        } else if (diagMatch) {
          reason = `Diagnosis: ${rx.diag}`;
        } else {
          reason = `${rx.hospital}`;
        }

        matchedRxs.push({
          id: rx.id,
          title: rx.diag || "Prescription Record",
          subtitle: `${rx.doc || "Doctor"} • ${rx.date || "Active"}`,
          matchReason: reason,
          href: `/dashboard/prescriptions/view?id=${rx.id}`
        });
      }
    }

    // Treatment Pathways
    const matchedTreatments: Array<{ id: string; title: string; subtitle: string; href: string }> = [];
    for (const tg of patientTreatments) {
      const nameMatch = (tg.name || "").toLowerCase().includes(q);
      const condMatch = (tg.conditionGoal || "").toLowerCase().includes(q);
      const docMatch = (tg.physician || "").toLowerCase().includes(q);
      const medMatch = (tg.medications || []).some(m => (m.name || "").toLowerCase().includes(q));

      if (nameMatch || condMatch || docMatch || medMatch) {
        matchedTreatments.push({
          id: tg.id,
          title: tg.name,
          subtitle: `${tg.conditionGoal} • ${tg.medications?.length || 0} meds`,
          href: `/dashboard/treatments`
        });
      }
    }

    // Appointments
    const matchedAppointments: Array<{ id: string | number; title: string; subtitle: string; status: string; href: string }> = [];
    for (const apt of patientAppointments) {
      const titleMatch = (apt.title || "").toLowerCase().includes(q);
      const docMatch = (apt.doc || "").toLowerCase().includes(q);
      const locMatch = (apt.location || "").toLowerCase().includes(q);

      if (titleMatch || docMatch || locMatch) {
        matchedAppointments.push({
          id: apt.id,
          title: apt.title,
          subtitle: `${apt.doc} • ${apt.date} at ${apt.time}`,
          status: apt.status,
          href: `/dashboard/appointments`
        });
      }
    }

    // Quick navigation shortcuts
    const shortcuts: Array<{ title: string; subtitle: string; href: string }> = [];
    if ("scan prescription upload ocr camera bill".includes(q) || q.includes("scan") || q.includes("upload")) {
      shortcuts.push({
        title: "Scan & Upload Prescription",
        subtitle: "Analyze handwritten slips, digital PDFs, or medicine strips",
        href: "/dashboard/scan"
      });
    }
    if ("treatment group pathway condition regimen".includes(q) || q.includes("treat")) {
      shortcuts.push({
        title: "Treatment Pathways",
        subtitle: "Group prescriptions by health conditions and care goals",
        href: "/dashboard/treatments"
      });
    }
    if ("appointment schedule visit doctor booking clinic".includes(q) || q.includes("app")) {
      shortcuts.push({
        title: "Consultation Appointments",
        subtitle: "Manage doctor visits, follow-ups, and calendar schedules",
        href: "/dashboard/appointments"
      });
    }
    if ("interactions health insights food timing pharmacology warnings contraindicated".includes(q) || q.includes("interact") || q.includes("insight")) {
      shortcuts.push({
        title: "Clinical Health Insights",
        subtitle: "Cross-reactivity screening, food warnings, and chronotherapy",
        href: "/dashboard/insights"
      });
    }
    if ("share doctor provider access permission privacy revoke".includes(q) || q.includes("share")) {
      shortcuts.push({
        title: "Doctor Access Sharing",
        subtitle: "Manage view-only provider links and access permissions",
        href: "/dashboard/sharing"
      });
    }
    if ("doctor clinic portal physician schedule slot bhambri reeta".includes(q) || q.includes("doc")) {
      shortcuts.push({
        title: "Doctor Clinical Portal (UC-04)",
        subtitle: "Manage doctor schedule, accept slots, and inspect patient dossiers",
        href: "/doctor"
      });
    }
    if ("dossier emergency qr export pdf health history".includes(q) || q.includes("dossier") || q.includes("pdf")) {
      shortcuts.push({
        title: "Read-Only Patient Clinical Dossier",
        subtitle: "Emergency QR dossier snapshot and complete health history PDF",
        href: "/dossier"
      });
    }

    const totalCount = matchedRxs.length + matchedTreatments.length + matchedAppointments.length + shortcuts.length;

    return {
      prescriptions: matchedRxs.slice(0, 4),
      treatments: matchedTreatments.slice(0, 3),
      appointments: matchedAppointments.slice(0, 3),
      shortcuts: shortcuts.slice(0, 2),
      insightAction: {
        title: `Screen "${searchQuery.trim()}" in Health Insights`,
        subtitle: "Evaluate potential drug interactions and food-drug contraindications",
        href: "/dashboard/insights"
      },
      totalCount
    };
  }, [searchQuery, patientPrescriptions, patientTreatments, patientAppointments]);

  const handleSelectSearchResult = (href: string) => {
    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    await clearUserSession();
    router.replace("/login");
  };

  const navLinks = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Prescriptions", href: "/dashboard/prescriptions", icon: FileText },
    { name: "Treatment Groups", href: "/dashboard/treatments", icon: Layers },
    { name: "Scan Prescription", href: "/dashboard/scan", icon: ScanLine },
    { name: "Health Insights", href: "/dashboard/insights", icon: Activity },
    { name: "Appointments", href: "/dashboard/appointments", icon: Calendar },
    { name: "Doctor Access", href: "/dashboard/sharing", icon: UserCheck },
  ];

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Authentication Loading Screen: Prevents medical data flash for unauthenticated visitors
  if (isVerifying) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#fbfdfc] dark:bg-[#0b1115] text-slate-800 dark:text-slate-100 select-none">
        <div className="flex flex-col items-center gap-4 max-w-sm px-6 text-center animate-in fade-in duration-300">
          <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/80 border border-teal-200/80 dark:border-teal-800 flex items-center justify-center text-teal-700 dark:text-teal-300 shadow-md animate-pulse">
            <HeartPulse className="w-8 h-8 text-teal-700 dark:text-teal-400" />
          </div>
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Med<span className="text-teal-700 dark:text-teal-400">Match</span> AI
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verifying clinical authentication credentials...
            </p>
          </div>
          <div className="w-48 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
            <div className="h-full bg-teal-600 rounded-full w-2/3 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  const userInitials = userSession?.name
    ? userSession.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()
    : "PT";

  return (
    <div className="relative flex h-screen w-full text-[var(--dash-text)] overflow-hidden bg-[#fbfdfc] dark:bg-[#0b1115]">
      {/* GENUINE FLOWING ORGANIC SVG WAVES */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
        <svg 
          className="absolute top-0 right-0 w-[65vw] max-w-[950px] h-[58vh] max-h-[520px]" 
          viewBox="0 0 850 480" 
          fill="none" 
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveTopGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" className="editorial-wave-top1" />
              <stop offset="45%" stopColor="#edf7f3" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#f8fbf9" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="waveTopGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" className="editorial-wave-top2" />
              <stop offset="60%" stopColor="#edf8f4" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f8fbf9" stopOpacity="0.02" />
            </linearGradient>
            <linearGradient id="waveTopGrad3" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#bee8da" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#edf8f4" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d="M 0 0 C 140 180, 240 320, 420 330 C 580 340, 700 290, 850 140 L 850 0 Z" fill="url(#waveTopGrad1)" fillOpacity="0.5" />
          <path d="M 80 0 C 220 180, 320 300, 480 310 C 620 320, 740 250, 850 80 L 850 0 Z" fill="url(#waveTopGrad2)" fillOpacity="0.35" />
          <path d="M 240 0 C 340 180, 440 280, 580 270 C 700 260, 780 190, 850 100 L 850 0 Z" fill="url(#waveTopGrad3)" fillOpacity="0.2" />
        </svg>

        <svg 
          className="absolute bottom-0 right-0 w-[58vw] max-w-[850px] h-[38vh] max-h-[340px]" 
          viewBox="0 0 750 320" 
          fill="none" 
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="waveBottomGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f8fbf9" stopOpacity="0.1" />
              <stop offset="50%" className="editorial-wave-bottom" />
              <stop offset="100%" stopColor="#cbeee0" stopOpacity="0.65" />
            </linearGradient>
            <linearGradient id="waveBottomGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f0faf5" stopOpacity="0.2" />
              <stop offset="60%" stopColor="#d4f1e5" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#c5ecdc" stopOpacity="0.55" />
            </linearGradient>
          </defs>
          <path d="M 0 320 C 190 300, 360 225, 530 190 C 640 170, 700 200, 750 230 L 750 320 Z" fill="url(#waveBottomGrad1)" fillOpacity="0.6" />
          <path d="M 200 320 C 340 280, 470 185, 620 160 C 690 150, 730 170, 750 190 L 750 320 Z" fill="url(#waveBottomGrad2)" fillOpacity="0.4" />
        </svg>

        <svg 
          className="absolute bottom-0 left-0 w-[320px] h-[260px]" 
          viewBox="0 0 320 260" 
          fill="none" 
        >
          <path d="M 0 110 C 90 130, 160 190, 240 260 L 0 260 Z" fill="#dcf4eb" fillOpacity="0.5" />
          <path d="M 0 170 C 50 180, 110 210, 160 260 L 0 260 Z" fill="#cbeee1" fillOpacity="0.35" />
        </svg>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed lg:relative inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out shrink-0 bg-white/95 dark:bg-[#0c151c]/95 lg:bg-transparent shadow-2xl lg:shadow-none border-r border-slate-200/60 dark:border-slate-800 lg:border-none ${
          sidebarOpen 
            ? "w-[260px] opacity-100 translate-x-0" 
            : "w-0 opacity-0 -translate-x-full lg:translate-x-0 overflow-hidden pointer-events-none"
        }`}
      >
        <div className="w-[260px] h-full flex flex-col justify-between select-none relative z-10">
          <div>
            {/* Brand Header with Close Button */}
            <div className="p-6 pb-4 flex items-center justify-between">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-lg bg-teal-50/80 dark:bg-teal-950/80 flex items-center justify-center text-teal-700 dark:text-teal-300 shadow-xs">
                  <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" fill="#14b8a6" fillOpacity="0.3" stroke="#0f766e" />
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" stroke="#0f766e" />
                  </svg>
                </div>
                <div>
                  <span className="font-semibold text-lg tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-0.5">
                    Med<span className="text-teal-700 dark:text-teal-400">Match</span>
                  </span>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 -mt-0.5 font-normal">Care that fits you</p>
                </div>
              </Link>

              <button 
                onClick={toggleSidebar}
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-800 hover:bg-teal-50/60 dark:hover:bg-slate-800 transition-colors"
                title="Collapse sidebar"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="px-3 space-y-1 mt-2">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const Icon = link.icon;
                
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-r-xl rounded-l-md text-xs font-medium transition-all ${
                      isActive 
                        ? "bg-[#e2f3ec] dark:bg-teal-950/70 text-teal-900 dark:text-teal-200 border-l-[3.5px] border-teal-700 font-semibold shadow-xs" 
                        : "text-slate-600 dark:text-slate-400 hover:bg-teal-50/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 border-l-[3.5px] border-transparent"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-teal-700 dark:text-teal-300" : "text-slate-400"}`} />
                    {link.name}
                  </Link>
                );
              })}

              <div className="pt-4 mt-4 border-t border-slate-200/40 dark:border-slate-800/40 px-1 space-y-1">
                <Link
                  href="/terms"
                  className="flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-slate-500 dark:text-slate-400 hover:bg-teal-50/40 dark:hover:bg-slate-800/40 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                  Help & Support
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  Sign Out
                </button>
              </div>
            </nav>
          </div>

          {/* User Session Profile in Sidebar Bottom */}
          <div className="p-4 border-t border-slate-200/40 dark:border-slate-800/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-200 flex items-center justify-center text-xs font-bold shrink-0">
                  {userInitials}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {userSession?.name || "Patient User"}
                  </p>
                  <p className="text-[10px] text-teal-700 dark:text-teal-400 capitalize flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3" />
                    {userSession?.role || "Patient"}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 relative flex flex-col h-screen min-w-0 bg-transparent z-10 overflow-hidden">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 sm:px-8 bg-transparent absolute top-0 left-0 right-0 z-30 pointer-events-none">
          <div className="flex items-center gap-3 flex-1 max-w-xl pointer-events-auto">
            {!sidebarOpen && (
              <button 
                onClick={toggleSidebar}
                className="p-2 -ml-2 mr-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-teal-800 hover:bg-white/70 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5 shadow-xs"
                title="Open sidebar"
                aria-label="Open sidebar"
              >
                <PanelLeftOpen className="w-5 h-5 text-teal-700 dark:text-teal-400" />
              </button>
            )}

            {/* SEARCH CONTAINER */}
            <div ref={searchContainerRef} className="relative w-full max-w-md hidden sm:block">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  value={searchQuery}
                  onFocus={() => setSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSearchFocused(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchFocused(false);
                    }
                  }}
                  placeholder="Search medications, prescriptions, appointments..." 
                  className="w-full pl-9 pr-8 py-2 rounded-full text-xs bg-white/90 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/30 focus:border-teal-600 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchFocused(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* SEARCH RESULTS DROPDOWN POPOVER */}
              {searchFocused && searchQuery.trim().length > 0 && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 max-h-[420px] overflow-y-auto">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>Search results for <strong>&ldquo;{searchQuery}&rdquo;</strong></span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 font-semibold text-[10px]">
                      {searchResults.totalCount} found
                    </span>
                  </div>

                  {searchResults.totalCount === 0 ? (
                    <div className="p-6 text-center">
                      <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-700">No matching records found</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Try searching by medication name, doctor, diagnosis, or condition.
                      </p>
                      <button
                        onClick={() => handleSelectSearchResult("/dashboard/insights")}
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 text-teal-700 hover:bg-teal-100 text-xs font-semibold transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        Check &ldquo;{searchQuery.trim()}&rdquo; in Health Insights
                      </button>
                    </div>
                  ) : (
                    <div className="p-2 space-y-3">
                      {/* Prescriptions */}
                      {searchResults.prescriptions.length > 0 && (
                        <div>
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Pill className="w-3 h-3 text-teal-600" /> Prescriptions & Medications
                          </div>
                          <div className="mt-1 space-y-1">
                            {searchResults.prescriptions.map((rx) => (
                              <button
                                key={rx.id}
                                onClick={() => handleSelectSearchResult(rx.href)}
                                className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 transition-colors flex items-center justify-between group"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-teal-700">
                                    {rx.title}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {rx.subtitle}
                                  </div>
                                  {rx.matchReason && (
                                    <div className="text-[10px] text-teal-600 font-medium truncate mt-0.5">
                                      {rx.matchReason}
                                    </div>
                                  )}
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Treatment Pathways */}
                      {searchResults.treatments.length > 0 && (
                        <div>
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Layers className="w-3 h-3 text-amber-600" /> Treatment Pathways
                          </div>
                          <div className="mt-1 space-y-1">
                            {searchResults.treatments.map((tg) => (
                              <button
                                key={tg.id}
                                onClick={() => handleSelectSearchResult(tg.href)}
                                className="w-full text-left p-2 rounded-xl hover:bg-amber-50/60 transition-colors flex items-center justify-between group"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-amber-800">
                                    {tg.title}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {tg.subtitle}
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Appointments */}
                      {searchResults.appointments.length > 0 && (
                        <div>
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-emerald-600" /> Consultations & Appointments
                          </div>
                          <div className="mt-1 space-y-1">
                            {searchResults.appointments.map((apt) => (
                              <button
                                key={apt.id}
                                onClick={() => handleSelectSearchResult(apt.href)}
                                className="w-full text-left p-2 rounded-xl hover:bg-emerald-50/60 transition-colors flex items-center justify-between group"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-emerald-700">
                                    {apt.title}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {apt.subtitle}
                                  </div>
                                </div>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-semibold uppercase mr-2 ${
                                  apt.status === "upcoming" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                }`}>
                                  {apt.status}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Shortcuts */}
                      {searchResults.shortcuts.length > 0 && (
                        <div>
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                            <Activity className="w-3 h-3 text-indigo-600" /> Actions & Modules
                          </div>
                          <div className="mt-1 space-y-1">
                            {searchResults.shortcuts.map((sc, idx) => (
                              <button
                                key={idx}
                                onClick={() => handleSelectSearchResult(sc.href)}
                                className="w-full text-left p-2 rounded-xl hover:bg-indigo-50/60 transition-colors flex items-center justify-between group"
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-700">
                                    {sc.title}
                                  </div>
                                  <div className="text-[11px] text-slate-400 truncate">
                                    {sc.subtitle}
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Health Insights Quick Action */}
                      <div className="pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleSelectSearchResult(searchResults.insightAction.href)}
                          className="w-full text-left p-2 rounded-xl bg-teal-50/50 hover:bg-teal-50 transition-colors flex items-center justify-between group border border-teal-100/70"
                        >
                          <div className="min-w-0 flex-1 pr-2 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-teal-800 truncate">
                                {searchResults.insightAction.title}
                              </div>
                              <div className="text-[10px] text-teal-600 truncate">
                                {searchResults.insightAction.subtitle}
                              </div>
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-teal-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto relative">
            {/* Doctor Clinical Portal Quick Switch (UC-04) */}
            <Link
              href="/doctor"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 text-xs font-bold shadow-xs transition-colors"
              title="Doctor Clinical Portal (UC-04)"
            >
              <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
              <span>Doctor Portal</span>
            </Link>

            {/* Mobile Search Button */}
            <button 
              onClick={() => setMobileSearchOpen(true)}
              className="sm:hidden p-2 rounded-lg hover:bg-white/60 text-slate-600 transition-colors"
              title="Search records"
              aria-label="Search records"
            >
              <Search className="w-5 h-5 text-teal-700" />
            </button>

            <button 
              className="p-2 rounded-lg hover:bg-white/60 text-slate-600 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
            </button>

            {/* Profile Dropdown Indicator */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 pl-2 border-l border-slate-200/50 dark:border-slate-800/50 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-semibold shadow-xs">
                  {userInitials}
                </div>
                <span className="hidden md:inline text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[140px] truncate">
                  {userSession?.name || greeting}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-2 z-50 animate-in fade-in">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {userSession?.name || "Patient"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {userSession?.email}
                    </p>
                  </div>
                  <div className="py-1 border-b border-slate-100 dark:border-slate-800">
                    <Link
                      href="/doctor"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-teal-700 hover:bg-teal-50 rounded-lg transition-colors text-left font-medium"
                    >
                      <Stethoscope className="w-4 h-4 text-teal-600" />
                      Doctor Clinical Portal
                    </Link>
                    <Link
                      href="/dossier"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors text-left font-medium"
                    >
                      <FileText className="w-4 h-4 text-slate-500" />
                      Emergency Dossier &amp; PDF
                    </Link>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full mt-1 flex items-center gap-2 px-3 py-2 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={`flex-1 h-full overflow-y-auto px-6 sm:px-10 lg:px-12 ${pathname === "/dashboard" ? "pt-0 pb-20" : "pt-20 pb-20"}`}>
          <div className="max-w-[1280px] mx-auto w-full h-full">
            {children}
          </div>
        </div>
      </main>

      {/* MOBILE SEARCH MODAL OVERLAY */}
      {mobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex flex-col p-4 sm:hidden animate-in fade-in">
          <div className="bg-white rounded-2xl p-4 shadow-2xl flex flex-col max-h-[85vh] border border-slate-200">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Search className="w-4 h-4 text-teal-700 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicines, prescriptions, visits..."
                className="w-full text-sm bg-transparent focus:outline-none text-slate-800"
              />
              <button
                onClick={() => {
                  setMobileSearchOpen(false);
                  setSearchQuery("");
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-2 space-y-2">
              {searchQuery.trim().length > 0 && searchResults && (
                <>
                  {searchResults.totalCount === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">
                      No matching records found for &ldquo;{searchQuery}&rdquo;.
                    </div>
                  ) : (
                    <>
                      {searchResults.prescriptions.map((rx) => (
                        <button
                          key={rx.id}
                          onClick={() => handleSelectSearchResult(rx.href)}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-teal-50 text-xs text-slate-800"
                        >
                          <div className="font-semibold">{rx.title}</div>
                          <div className="text-[11px] text-slate-500">{rx.subtitle}</div>
                        </button>
                      ))}
                      {searchResults.treatments.map((tg) => (
                        <button
                          key={tg.id}
                          onClick={() => handleSelectSearchResult(tg.href)}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-amber-50 text-xs text-slate-800"
                        >
                          <div className="font-semibold">{tg.title}</div>
                          <div className="text-[11px] text-slate-500">{tg.subtitle}</div>
                        </button>
                      ))}
                      {searchResults.appointments.map((apt) => (
                        <button
                          key={apt.id}
                          onClick={() => handleSelectSearchResult(apt.href)}
                          className="w-full text-left p-2.5 rounded-xl bg-slate-50 hover:bg-emerald-50 text-xs text-slate-800"
                        >
                          <div className="font-semibold">{apt.title}</div>
                          <div className="text-[11px] text-slate-500">{apt.subtitle}</div>
                        </button>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
