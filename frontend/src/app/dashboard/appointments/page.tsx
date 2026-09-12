"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, MapPin, Plus, User } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";

export default function AppointmentsPage() {
  const [view, setView] = useState<"upcoming" | "past">("upcoming");

  const appointments = [
    { id: 1, title: "Follow-up: Diabetes", doc: "Dr. Patel", date: "Sept 15, 2026", time: "10:00 AM", location: "Lifeline Clinic", status: "upcoming", type: "var(--dash-terracotta)" },
    { id: 2, title: "Annual Check-up", doc: "Dr. Sharma", date: "Sept 22, 2026", time: "2:30 PM", location: "City Hospital", status: "upcoming", type: "var(--dash-sage)" },
    { id: 3, title: "Eye Examination", doc: "Dr. Gupta", date: "Oct 1, 2026", time: "11:00 AM", location: "Vision Care Center", status: "upcoming", type: "var(--dash-amber)" },
    { id: 4, title: "Blood Work Review", doc: "Dr. Mehta", date: "Aug 28, 2026", time: "9:15 AM", location: "Apollo Lab", status: "past", type: "var(--dash-text-tertiary)" },
  ];

  const filteredApps = appointments.filter(a => a.status === view);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <PageHeader 
        title="Appointments" 
        subtitle="Manage your medical visits and schedules"
        action={
          <button className="dash-btn-primary">
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        }
      />

      <div className="relative inline-flex p-1 rounded-lg bg-[var(--dash-surface-warm)] border border-[var(--dash-border)] mb-6">
        <div 
          className="absolute top-1 bottom-1 rounded-md bg-[var(--dash-surface)] shadow-sm border border-[var(--dash-border)] transition-all duration-300 ease-out"
          style={{
            left: view === "upcoming" ? "4px" : "calc(50% + 2px)",
            width: "calc(50% - 6px)"
          }}
        />
        <button 
          onClick={() => setView("upcoming")}
          className={`relative z-10 px-5 py-2 rounded-md text-sm font-medium transition-colors ${view === 'upcoming' ? 'text-[var(--dash-text)]' : 'text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]'}`}
        >
          Upcoming
        </button>
        <button 
          onClick={() => setView("past")}
          className={`relative z-10 px-5 py-2 rounded-md text-sm font-medium transition-colors ${view === 'past' ? 'text-[var(--dash-text)]' : 'text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]'}`}
        >
          Past
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredApps.map((apt) => (
          <div key={apt.id} className="dash-card card-interactive flex flex-col h-full border-t-[4px]" style={{ borderTopColor: apt.type }}>
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-[var(--dash-text)]">{apt.title}</h3>
                {apt.status === 'upcoming' && (
                  <span className="dash-pill bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)]">Upcoming</span>
                )}
              </div>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 text-[var(--dash-text-secondary)] text-sm">
                  <User className="w-4 h-4 text-[var(--dash-text-tertiary)]" />
                  <span className="font-medium">{apt.doc}</span>
                </div>
                <div className="flex items-center gap-3 text-[var(--dash-text-secondary)] text-sm bg-[var(--dash-bg)] p-2 rounded-lg border border-[var(--dash-border)]">
                  <div className="flex items-center gap-1.5 w-1/2">
                    <CalendarIcon className="w-4 h-4 text-[var(--dash-sage)]" />
                    <span>{apt.date.split(',')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1.5 w-1/2">
                    <Clock className="w-4 h-4 text-[var(--dash-amber)]" />
                    <span>{apt.time}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[var(--dash-text-secondary)] text-sm">
                  <MapPin className="w-4 h-4 text-[var(--dash-text-tertiary)]" />
                  <span>{apt.location}</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 border-t border-[var(--dash-border)] bg-[var(--dash-bg)]/50 flex gap-3">
              {apt.status === 'upcoming' ? (
                <>
                  <button className="dash-btn-secondary flex-1 py-1.5 text-sm">Reschedule</button>
                  <button className="dash-btn-secondary flex-1 py-1.5 text-sm text-[var(--dash-coral)] border-[var(--dash-coral)]/30 hover:bg-[var(--dash-coral-bg)] hover:border-[var(--dash-coral)]">Cancel</button>
                </>
              ) : (
                <button className="dash-btn-secondary w-full py-1.5 text-sm">Book Again</button>
              )}
            </div>
          </div>
        ))}

        {filteredApps.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--dash-text-tertiary)]">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No {view} appointments found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
