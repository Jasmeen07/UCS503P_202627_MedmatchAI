"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import "./dashboard.css";
import {
  LayoutDashboard,
  FileText,
  Layers,
  ScanLine,
  Activity,
  Calendar,
  UserCheck,
  Menu,
  X,
  Settings,
  LogOut,
  Bell,
  Moon,
  Sun
} from "lucide-react";
import { createClient } from "@/lib/client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("light");
  const supabase = createClient();

  useEffect(() => {
    // Check theme
    if (document.documentElement.classList.contains("dark")) {
      setTheme("dark");
    }
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

  return (
    <div className="flex h-screen w-full dash-bg-pattern text-[var(--dash-text)] overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[260px] dash-sidebar flex flex-col lg:relative transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-xl text-[var(--dash-sage)]">
            <Activity className="w-6 h-6" />
            <span>MedMatch AI</span>
          </div>
          <button className="lg:hidden" onClick={toggleSidebar}>
            <X className="w-5 h-5 text-[var(--dash-text-tertiary)]" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            const Icon = link.icon;
            
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? "bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] font-medium border-l-4 border-[var(--dash-sage)]" 
                    : "text-[var(--dash-text-secondary)] hover:bg-[var(--dash-surface)] hover:text-[var(--dash-text)] border-l-4 border-transparent"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[var(--dash-sage)]" : ""}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--dash-border)]">
          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-[var(--dash-text-secondary)] hover:bg-[var(--dash-surface)] transition-all mb-4"
          >
            <Settings className="w-5 h-5" />
            Settings
          </Link>
          
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-9 h-9 rounded bg-[var(--dash-sand)] flex items-center justify-center text-[var(--dash-terracotta)] font-semibold text-xs border border-[var(--dash-border)]">
              JK
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--dash-text)] truncate">Jane K.</p>
              <p className="text-xs text-[var(--dash-text-tertiary)] truncate">jane@example.com</p>
            </div>
            <button className="text-[var(--dash-text-tertiary)] hover:text-[var(--dash-coral)] transition-colors">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen min-w-0 bg-[var(--dash-bg)] relative">
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-[var(--dash-border)] bg-[var(--dash-surface)] sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 rounded hover:bg-[var(--dash-surface-warm)]" onClick={toggleSidebar}>
              <Menu className="w-5 h-5 text-[var(--dash-text)]" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded border border-[var(--dash-border)] hover:bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] transition-colors"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button className="p-2 rounded border border-[var(--dash-border)] hover:bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] transition-colors relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--dash-terracotta)] rounded-sm border border-[var(--dash-surface)]"></span>
            </button>
            <div className="hidden sm:block w-8 h-8 rounded bg-[var(--dash-sand)] border border-[var(--dash-border)]"></div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1200px] mx-auto w-full h-full pb-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
