"use client";

import React, { useState, useEffect } from "react";
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
  Moon,
  Sun,
  Search,
  ChevronDown,
  HelpCircle,
  HeartPulse,
  ShieldCheck,
  User
} from "lucide-react";
import { createClient } from "@/lib/client";
import { assetPath } from "@/lib/utils";
import { verifyActiveSession, clearUserSession, UserSession } from "@/lib/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const [searchQuery, setSearchQuery] = useState("");
  const [greeting, setGreeting] = useState("Good morning");
  const [isVerifying, setIsVerifying] = useState(true);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  // Authentication Gatekeeper
  useEffect(() => {
    let isMounted = true;

    const checkAuthentication = async () => {
      try {
        const session = await verifyActiveSession();
        if (!isMounted) return;

        if (!session) {
          // Capture target destination including search query parameters
          const destination = typeof window !== "undefined"
            ? window.location.pathname + window.location.search
            : "/dashboard";

          router.replace(`/login?redirect=${encodeURIComponent(destination)}`);
          return;
        }

        setUserSession(session);
        setIsVerifying(false);
      } catch (err) {
        console.warn("Auth check error:", err);
        router.replace("/login");
      }
    };

    checkAuthentication();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    // Open sidebar by default only on large screens
    if (window.innerWidth >= 1024) {
      setSidebarOpen(true);
    }

    // Check theme
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    }

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

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
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

            <div className="relative w-full max-w-md hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medications, appointments, or providers..." 
                className="w-full pl-9 pr-4 py-2 rounded-full text-xs bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto relative">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
              title="Toggle theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <button 
              className="p-2 rounded-lg hover:bg-white/60 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
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
    </div>
  );
}
