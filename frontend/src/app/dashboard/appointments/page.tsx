"use client";

import React, { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { 
  AppointmentItem, 
  getPatientAppointments, 
  savePatientAppointments, 
  addPatientAppointment, 
  getActivePatientEmail 
} from "@/lib/patientData";

export default function AppointmentsPage() {
  const [view, setView] = useState<"upcoming" | "past">("upcoming");
  const [activeEmail, setActiveEmail] = useState<string>("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDoc, setNewDoc] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");

  useEffect(() => {
    const email = getActivePatientEmail();
    setActiveEmail(email);
    const data = getPatientAppointments(email);
    setAppointments(data);
  }, []);

  const filteredApps = appointments.filter(a => a.status === view);

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDoc.trim()) return;

    const colors = [
      "var(--dash-terracotta)", 
      "var(--dash-sage)", 
      "var(--dash-amber)", 
      "var(--dash-teal)",
      "var(--dash-indigo)"
    ];
    const pickedColor = colors[appointments.length % colors.length];

    const formattedDate = newDate || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    const formattedTime = newTime || "10:00 AM";

    const created = addPatientAppointment({
      title: newTitle.trim(),
      doc: newDoc.trim(),
      date: formattedDate,
      time: formattedTime,
      location: newLocation.trim() || "Main Consultation Suite",
      status: "upcoming",
      type: pickedColor
    }, activeEmail);

    setAppointments(prev => [created, ...prev]);
    setIsModalOpen(false);
    setNewTitle("");
    setNewDoc("");
    setNewDate("");
    setNewTime("");
    setNewLocation("");
  };

  const handleCancelAppointment = (id: string | number) => {
    const updated = appointments.filter(a => String(a.id) !== String(id));
    setAppointments(updated);
    savePatientAppointments(updated, activeEmail);
  };

  const handleTogglePast = (id: string | number) => {
    const updated = appointments.map(a => {
      if (String(a.id) === String(id)) {
        return {
          ...a,
          status: (a.status === "upcoming" ? "past" : "upcoming") as "upcoming" | "past"
        };
      }
      return a;
    });
    setAppointments(updated);
    savePatientAppointments(updated, activeEmail);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <PageHeader 
        title="Appointments" 
        subtitle="Manage your medical visits and scheduled consultations"
        action={
          <button 
            onClick={() => setIsModalOpen(true)}
            className="dash-btn-primary flex items-center gap-2"
          >
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
          Upcoming ({appointments.filter(a => a.status === "upcoming").length})
        </button>
        <button 
          onClick={() => setView("past")}
          className={`relative z-10 px-5 py-2 rounded-md text-sm font-medium transition-colors ${view === 'past' ? 'text-[var(--dash-text)]' : 'text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]'}`}
        >
          Past ({appointments.filter(a => a.status === "past").length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredApps.map((apt) => (
          <div key={apt.id} className="dash-card card-interactive flex flex-col h-full border-t-[4px]" style={{ borderTopColor: apt.type || "var(--dash-sage)" }}>
            <div className="p-5 flex-1">
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-[var(--dash-text)]">{apt.title}</h3>
                <span className={`dash-pill ${
                  apt.status === 'upcoming' 
                    ? 'bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] font-semibold' 
                    : 'bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)]'
                }`}>
                  {apt.status === 'upcoming' ? 'Upcoming' : 'Completed'}
                </span>
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
                  <button 
                    onClick={() => handleTogglePast(apt.id)}
                    className="dash-btn-secondary flex-1 py-1.5 text-xs font-semibold"
                    title="Mark consultation as completed"
                  >
                    Mark Done
                  </button>
                  <button 
                    onClick={() => handleCancelAppointment(apt.id)}
                    className="dash-btn-secondary flex-1 py-1.5 text-xs text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/10 hover:border-rose-500/50"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => handleTogglePast(apt.id)}
                  className="dash-btn-secondary w-full py-1.5 text-xs font-semibold"
                >
                  Move to Upcoming
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredApps.length === 0 && (
          <div className="col-span-full py-16 text-center dash-card bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl p-8">
            <div className="w-14 h-14 rounded-2xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[var(--dash-text)] mb-1">
              {view === "upcoming" ? "No Upcoming Appointments" : "No Past Appointments"}
            </h3>
            <p className="text-sm text-[var(--dash-text-secondary)] max-w-md mx-auto mb-6">
              {view === "upcoming" 
                ? "You don't have any upcoming doctor consultations scheduled. Keep track of medical visits and specialist reviews here."
                : "You have no past medical visit history recorded in your profile."}
            </p>
            {view === "upcoming" && (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="dash-btn-primary inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Schedule Appointment
              </button>
            )}
          </div>
        )}
      </div>

      {/* SCHEDULE APPOINTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="dash-card bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--dash-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--dash-text)]">Schedule Medical Visit</h3>
                  <p className="text-xs text-[var(--dash-text-secondary)]">Add a new clinical consultation to your schedule</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--dash-surface-warm)] flex items-center justify-center text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Consultation Reason / Title *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cardiology Checkup, Diabetes Review" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Physician / Specialist Name *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Dr. A. Sharma" 
                  value={newDoc}
                  onChange={(e) => setNewDoc(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                    Date
                  </label>
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                    Time
                  </label>
                  <input 
                    type="time" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Clinic / Hospital Location
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Apollo Medical Center, Room 204" 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--dash-border)]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="dash-btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn-primary px-5 py-2 text-sm font-semibold"
                >
                  Save Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
