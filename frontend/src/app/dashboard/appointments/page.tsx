"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  MapPin, 
  Plus, 
  User, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Search,
  ExternalLink,
  Download,
  CalendarPlus,
  RefreshCw,
  FileText,
  Stethoscope,
  ChevronRight,
  Info,
  CalendarCheck
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { 
  AppointmentItem, 
  getPatientAppointments, 
  savePatientAppointments, 
  addPatientAppointment, 
  updatePatientAppointment,
  getPatientPrescriptions,
  getActivePatientEmail 
} from "@/lib/patientData";

const SPECIALTIES = [
  "General Medicine",
  "Cardiology",
  "Endocrinology & Diabetes",
  "Ophthalmology",
  "Pulmonology",
  "Neurology",
  "Orthopedics",
  "Dermatology"
];

export default function AppointmentsPage() {
  const [view, setView] = useState<"upcoming" | "past" | "all">("upcoming");
  const [activeEmail, setActiveEmail] = useState<string>("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<AppointmentItem | null>(null);
  const [detailItem, setDetailItem] = useState<AppointmentItem | null>(null);

  // Create Form State
  const [newTitle, setNewTitle] = useState("");
  const [newDoc, setNewDoc] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("General Medicine");
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Reschedule Form State
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleLocation, setRescheduleLocation] = useState("");

  // Treating Doctors derived from patient prescriptions
  const [treatingDoctors, setTreatingDoctors] = useState<Array<{ name: string; hospital: string }>>([]);

  useEffect(() => {
    const email = getActivePatientEmail();
    setActiveEmail(email);
    const data = getPatientAppointments(email);
    setAppointments(data);

    // Extract doctors from prescriptions
    const rxs = getPatientPrescriptions(email);
    const docsMap = new Map<string, string>();
    for (const rx of rxs) {
      if (rx.doc && rx.doc !== "Unknown Doctor") {
        if (!docsMap.has(rx.doc)) {
          docsMap.set(rx.doc, rx.hospital || "Clinical Consultation Center");
        }
      }
    }
    const docs = Array.from(docsMap.entries()).map(([name, hospital]) => ({ name, hospital }));
    setTreatingDoctors(docs);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((current) => (current === msg ? null : current));
    }, 3500);
  };

  // Filtered Appointments
  const filteredApps = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesView = view === "all" ? true : apt.status === view;
      if (!matchesView) return false;
      if (!searchFilter.trim()) return true;

      const q = searchFilter.toLowerCase();
      const titleMatch = apt.title.toLowerCase().includes(q);
      const docMatch = apt.doc.toLowerCase().includes(q);
      const locMatch = apt.location.toLowerCase().includes(q);
      const notesMatch = (apt.notes || "").toLowerCase().includes(q);
      return titleMatch || docMatch || locMatch || notesMatch;
    });
  }, [appointments, view, searchFilter]);

  // Handle Quick Date Selection
  const setQuickDate = (offsetDays: number, isReschedule = false) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const isoDate = d.toISOString().split("T")[0];
    if (isReschedule) {
      setRescheduleDate(isoDate);
    } else {
      setNewDate(isoDate);
    }
  };

  // Create Appointment
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

    let formattedDate = newDate;
    if (newDate) {
      try {
        const parts = newDate.split("-");
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      } catch {}
    } else {
      formattedDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    const created = addPatientAppointment({
      title: newTitle.trim(),
      doc: newDoc.trim(),
      date: formattedDate,
      time: newTime || "10:00 AM",
      location: newLocation.trim() || "Main Consultation Suite",
      status: "upcoming",
      type: pickedColor,
      specialty: newSpecialty,
      notes: newNotes.trim()
    }, activeEmail);

    setAppointments((prev) => [created, ...prev]);
    setIsCreateOpen(false);
    showToast(`Appointment scheduled with ${created.doc} for ${created.date}!`);

    // Reset fields
    setNewTitle("");
    setNewDoc("");
    setNewSpecialty("General Medicine");
    setNewDate("");
    setNewTime("");
    setNewLocation("");
    setNewNotes("");
  };

  // Open Reschedule Modal
  const openRescheduleModal = (apt: AppointmentItem) => {
    setRescheduleItem(apt);
    setRescheduleDate("");
    setRescheduleTime(apt.time);
    setRescheduleLocation(apt.location);
  };

  // Save Reschedule
  const handleSaveReschedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleItem) return;

    let formattedDate = rescheduleDate || rescheduleItem.date;
    if (rescheduleDate && rescheduleDate.includes("-")) {
      try {
        const parts = rescheduleDate.split("-");
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      } catch {}
    }

    const updated = updatePatientAppointment(
      rescheduleItem.id,
      {
        date: formattedDate,
        time: rescheduleTime || rescheduleItem.time,
        location: rescheduleLocation.trim() || rescheduleItem.location,
        status: "upcoming"
      },
      activeEmail
    );

    if (updated) {
      setAppointments((prev) =>
        prev.map((a) => (String(a.id) === String(rescheduleItem.id) ? updated : a))
      );
      showToast(`Rescheduled to ${updated.date} at ${updated.time}`);
    }

    setRescheduleItem(null);
  };

  // Book Again (Prefill Create Modal)
  const handleBookAgain = (apt: AppointmentItem) => {
    setNewTitle(`Follow-up: ${apt.title}`);
    setNewDoc(apt.doc);
    setNewLocation(apt.location);
    setNewSpecialty(apt.specialty || "General Medicine");
    setIsCreateOpen(true);
  };

  // Toggle Past / Completed
  const handleToggleCompleted = (apt: AppointmentItem) => {
    const newStatus = apt.status === "upcoming" ? ("past" as const) : ("upcoming" as const);
    const updated = updatePatientAppointment(apt.id, { status: newStatus }, activeEmail);
    if (updated) {
      setAppointments((prev) =>
        prev.map((a) => (String(a.id) === String(apt.id) ? updated : a))
      );
      showToast(
        newStatus === "past"
          ? `Marked "${apt.title}" as completed!`
          : `Moved "${apt.title}" back to Upcoming appointments.`
      );
    }
  };

  // Cancel Appointment
  const handleCancelAppointment = (id: string | number, title: string) => {
    const updated = appointments.filter((a) => String(a.id) !== String(id));
    setAppointments(updated);
    savePatientAppointments(updated, activeEmail);
    showToast(`Cancelled appointment "${title}".`);
    if (detailItem && String(detailItem.id) === String(id)) {
      setDetailItem(null);
    }
  };

  // Add to Google Calendar
  const openGoogleCalendar = (apt: AppointmentItem) => {
    const text = encodeURIComponent(`Consultation: ${apt.title} - ${apt.doc}`);
    const details = encodeURIComponent(
      `Medical Visit: ${apt.title}\nPhysician: ${apt.doc}\nLocation: ${apt.location}\nSpecialty: ${apt.specialty || "General"}\nNotes: ${apt.notes || "None"}\n\nManaged via MedMatch AI`
    );
    const location = encodeURIComponent(apt.location);
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&details=${details}&location=${location}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Download .ics Calendar File
  const downloadIcsFile = (apt: AppointmentItem) => {
    const now = new Date();
    const dtStamp = now.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    
    // Parse appointment date or fallback
    let dtStart = dtStamp;
    try {
      const d = new Date(apt.date + " " + apt.time);
      if (!isNaN(d.getTime())) {
        dtStart = d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
      }
    } catch {}

    const icsContent = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//MedMatch AI//Medical Appointments//EN",
      "BEGIN:VEVENT",
      `UID:medmatch-apt-${apt.id}@medmatch.ai`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `SUMMARY:Medical Consultation: ${apt.title} with ${apt.doc}`,
      `DESCRIPTION:Physician: ${apt.doc}\\nLocation: ${apt.location}\\nSpecialty: ${apt.specialty || "General"}\\nNotes: ${apt.notes || "Routine follow-up"}`,
      `LOCATION:${apt.location}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
      "END:VCALENDAR"
    ].join("\r\n");

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute("download", `appointment-${apt.doc.toLowerCase().replace(/[^a-z0-9]/g, "_")}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded calendar (.ics) file!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      <PageHeader 
        title="Appointments & Consultations" 
        subtitle="Schedule visits, track medical consultations, and sync follow-ups"
        action={
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="dash-btn-primary flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Appointment
          </button>
        }
      />

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-teal-800 text-white text-xs font-semibold shadow-2xl flex items-center gap-2.5 animate-in slide-in-from-bottom-3 border border-teal-600">
          <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SEARCH & FILTER CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="inline-flex p-1 rounded-xl bg-[var(--dash-surface-warm)] border border-[var(--dash-border)]">
          <button 
            onClick={() => setView("upcoming")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === "upcoming" 
                ? "bg-[var(--dash-surface)] text-[var(--dash-text)] shadow-xs" 
                : "text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
            }`}
          >
            Upcoming ({appointments.filter(a => a.status === "upcoming").length})
          </button>
          <button 
            onClick={() => setView("past")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === "past" 
                ? "bg-[var(--dash-surface)] text-[var(--dash-text)] shadow-xs" 
                : "text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
            }`}
          >
            Past ({appointments.filter(a => a.status === "past").length})
          </button>
          <button 
            onClick={() => setView("all")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              view === "all" 
                ? "bg-[var(--dash-surface)] text-[var(--dash-text)] shadow-xs" 
                : "text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
            }`}
          >
            All ({appointments.length})
          </button>
        </div>

        {/* Search Input within Appointments */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--dash-text-tertiary)]" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search doctor, clinic, or condition..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-[var(--dash-surface)] border border-[var(--dash-border)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)] transition-all"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)] p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* APPOINTMENT CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredApps.map((apt) => {
          const isUpcoming = apt.status === "upcoming";

          return (
            <div 
              key={apt.id} 
              className="dash-card card-interactive flex flex-col h-full border-t-[4px] rounded-2xl bg-[var(--dash-surface)] border border-[var(--dash-border)] transition-all hover:shadow-md"
              style={{ borderTopColor: apt.type || "var(--dash-sage)" }}
            >
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <div className="min-w-0 pr-2">
                    <h3 
                      onClick={() => setDetailItem(apt)}
                      className="font-bold text-base text-[var(--dash-text)] hover:text-[var(--dash-sage)] transition-colors cursor-pointer truncate"
                      title="Click to view consultation details"
                    >
                      {apt.title}
                    </h3>
                    {apt.specialty && (
                      <span className="inline-block text-[10px] font-semibold text-[var(--dash-text-tertiary)] uppercase tracking-wider mt-0.5">
                        {apt.specialty}
                      </span>
                    )}
                  </div>

                  <span className={`dash-pill shrink-0 ${
                    isUpcoming 
                      ? "bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] font-semibold" 
                      : "bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)]"
                  }`}>
                    {isUpcoming ? "Upcoming" : "Completed"}
                  </span>
                </div>
                
                {/* Meta details */}
                <div className="space-y-2.5 my-3 flex-1">
                  <div className="flex items-center gap-2.5 text-[var(--dash-text-secondary)] text-xs">
                    <div className="w-6 h-6 rounded-md bg-[var(--dash-surface-warm)] flex items-center justify-center text-[var(--dash-text)]">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold text-[var(--dash-text)]">{apt.doc}</span>
                  </div>

                  <div className="flex items-center gap-2 text-xs bg-[var(--dash-bg)] p-2 rounded-xl border border-[var(--dash-border)]">
                    <div className="flex items-center gap-1.5 w-1/2">
                      <CalendarIcon className="w-3.5 h-3.5 text-[var(--dash-sage)] shrink-0" />
                      <span className="truncate font-medium">{apt.date}</span>
                    </div>
                    <div className="w-px h-4 bg-[var(--dash-border)]" />
                    <div className="flex items-center gap-1.5 w-1/2">
                      <Clock className="w-3.5 h-3.5 text-[var(--dash-amber)] shrink-0" />
                      <span className="truncate font-medium">{apt.time}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-[var(--dash-text-secondary)] text-xs">
                    <MapPin className="w-3.5 h-3.5 text-[var(--dash-text-tertiary)] mt-0.5 shrink-0" />
                    <span className="line-clamp-1">{apt.location}</span>
                  </div>

                  {apt.notes && (
                    <div className="p-2 rounded-lg bg-[var(--dash-surface-warm)]/70 text-[11px] text-[var(--dash-text-secondary)] border border-[var(--dash-border)]/50 line-clamp-2">
                      <strong>Prep:</strong> {apt.notes}
                    </div>
                  )}
                </div>

                {/* Calendar Sync row for Upcoming */}
                {isUpcoming && (
                  <div className="pt-3 border-t border-[var(--dash-border)]/60 flex items-center justify-between text-[11px]">
                    <span className="text-[var(--dash-text-tertiary)] font-medium">Calendar:</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openGoogleCalendar(apt)}
                        className="text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 hover:underline"
                        title="Add to Google Calendar"
                      >
                        Google <ExternalLink className="w-3 h-3" />
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={() => downloadIcsFile(apt)}
                        className="text-slate-600 hover:text-slate-800 font-semibold inline-flex items-center gap-1 hover:underline"
                        title="Download .ics event file"
                      >
                        .ICS <Download className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Card Footer Actions */}
              <div className="p-3 border-t border-[var(--dash-border)] bg-[var(--dash-bg)]/40 flex items-center gap-2">
                {isUpcoming ? (
                  <>
                    <button 
                      onClick={() => openRescheduleModal(apt)}
                      className="dash-btn-secondary flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Reschedule
                    </button>
                    <button 
                      onClick={() => handleToggleCompleted(apt)}
                      className="dash-btn-secondary flex-1 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-500/10 border-emerald-500/30 flex items-center justify-center gap-1"
                      title="Mark consultation as completed"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Done
                    </button>
                    <button 
                      onClick={() => handleCancelAppointment(apt.id, apt.title)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                      title="Cancel appointment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleBookAgain(apt)}
                      className="dash-btn-primary flex-1 py-1.5 text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <CalendarPlus className="w-3.5 h-3.5" /> Book Again
                    </button>
                    <button 
                      onClick={() => handleToggleCompleted(apt)}
                      className="dash-btn-secondary py-1.5 px-3 text-xs font-semibold"
                      title="Move back to upcoming"
                    >
                      Undo
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {filteredApps.length === 0 && (
          <div className="col-span-full py-16 text-center dash-card bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl p-8 shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-[var(--dash-text)] mb-1">
              {searchFilter 
                ? "No Appointments Matching Filter"
                : view === "upcoming" 
                ? "No Upcoming Appointments" 
                : view === "past"
                ? "No Past Appointments Recorded"
                : "No Appointments Found"}
            </h3>
            <p className="text-sm text-[var(--dash-text-secondary)] max-w-md mx-auto mb-6">
              {searchFilter 
                ? `No visits match "${searchFilter}". Try clearing your filter or searching for another doctor or clinic.`
                : view === "upcoming" 
                ? "You don't have any upcoming doctor consultations scheduled. Keep track of medical visits and specialist follow-ups here."
                : "No past medical visit history recorded yet."}
            </p>
            {searchFilter ? (
              <button 
                onClick={() => setSearchFilter("")}
                className="dash-btn-secondary inline-flex items-center gap-2 text-xs px-4 py-2 rounded-xl"
              >
                Clear Search Filter
              </button>
            ) : (
              <button 
                onClick={() => setIsCreateOpen(true)}
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
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="dash-card bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--dash-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--dash-text)]">Schedule Medical Visit</h3>
                  <p className="text-xs text-[var(--dash-text-secondary)]">Create a new consultation or routine check-up</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--dash-surface-warm)] flex items-center justify-center text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-4">
              {/* Doctor Auto-suggestions from prescriptions */}
              {treatingDoctors.length > 0 && (
                <div className="p-3 rounded-xl bg-[var(--dash-surface-warm)]/60 border border-[var(--dash-border)]">
                  <div className="text-[11px] font-semibold text-[var(--dash-text-secondary)] mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-[var(--dash-sage)]" />
                    Select from Your Treating Doctors:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {treatingDoctors.map((td) => (
                      <button
                        key={td.name}
                        type="button"
                        onClick={() => {
                          setNewDoc(td.name);
                          if (!newLocation) setNewLocation(td.hospital);
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          newDoc === td.name
                            ? "bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] border-[var(--dash-sage)] font-semibold"
                            : "bg-[var(--dash-surface)] text-[var(--dash-text)] border-[var(--dash-border)] hover:bg-[var(--dash-surface-warm)]"
                        }`}
                      >
                        {td.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Consultation Reason / Title *
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Quarterly Diabetes Review, ECG Evaluation" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                    Clinical Department / Specialty
                  </label>
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Time with Quick Picker Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider">
                    Consultation Date & Time
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
                    >
                      +Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(7)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
                    >
                      +1 Week
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(30)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
                    >
                      +1 Month
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                  />
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
                  placeholder="e.g. Apollo Hospital, Cardiology Block Room 302" 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Preparation Checklist / Clinical Notes
                </label>
                <textarea 
                  rows={2}
                  placeholder="e.g. Fasting blood test required 8 hours prior, bring old ECG charts..." 
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] placeholder-[var(--dash-text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--dash-border)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="dash-btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn-primary px-5 py-2 text-sm font-semibold"
                >
                  Schedule Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="dash-card bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--dash-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--dash-text)]">Reschedule Visit</h3>
                  <p className="text-xs text-[var(--dash-text-secondary)]">{rescheduleItem.title} • {rescheduleItem.doc}</p>
                </div>
              </div>
              <button 
                onClick={() => setRescheduleItem(null)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--dash-surface-warm)] flex items-center justify-center text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="space-y-4">
              <div className="p-3 rounded-xl bg-[var(--dash-bg)] border border-[var(--dash-border)] text-xs text-[var(--dash-text-secondary)]">
                Current: <strong>{rescheduleItem.date}</strong> at <strong>{rescheduleItem.time}</strong> ({rescheduleItem.location})
              </div>

              {/* Quick Date Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider">
                    New Date & Time
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickDate(1, true)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(3, true)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(7, true)}
                      className="text-[10px] px-2 py-0.5 rounded bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)]"
                    >
                      +1 Week
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="date" 
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                  />
                  <input 
                    type="time" 
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--dash-text-secondary)] uppercase tracking-wider mb-1.5">
                  Consultation Location
                </label>
                <input 
                  type="text" 
                  value={rescheduleLocation}
                  onChange={(e) => setRescheduleLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--dash-sage)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--dash-border)]">
                <button
                  type="button"
                  onClick={() => setRescheduleItem(null)}
                  className="dash-btn-secondary px-4 py-2 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn-primary px-5 py-2 text-sm font-semibold"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="dash-card bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--dash-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--dash-sage-bg)] text-[var(--dash-sage)] flex items-center justify-center">
                  <CalendarCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[var(--dash-text)]">{detailItem.title}</h3>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    detailItem.status === "upcoming" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                  }`}>
                    {detailItem.status}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setDetailItem(null)}
                className="w-8 h-8 rounded-lg hover:bg-[var(--dash-surface-warm)] flex items-center justify-center text-[var(--dash-text-tertiary)] hover:text-[var(--dash-text)]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-[var(--dash-bg)] border border-[var(--dash-border)] text-xs">
                <div>
                  <span className="text-[var(--dash-text-tertiary)] block text-[10px] uppercase font-semibold">Attending Doctor</span>
                  <strong className="text-[var(--dash-text)] text-sm">{detailItem.doc}</strong>
                </div>
                <div>
                  <span className="text-[var(--dash-text-tertiary)] block text-[10px] uppercase font-semibold">Department</span>
                  <span className="text-[var(--dash-text)]">{detailItem.specialty || "General Medicine"}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[var(--dash-text-tertiary)] block text-[10px] uppercase font-semibold">Date & Time</span>
                  <span className="text-[var(--dash-text)] font-semibold">{detailItem.date} at {detailItem.time}</span>
                </div>
                <div className="mt-2">
                  <span className="text-[var(--dash-text-tertiary)] block text-[10px] uppercase font-semibold">Location</span>
                  <span className="text-[var(--dash-text)]">{detailItem.location}</span>
                </div>
              </div>

              {detailItem.notes && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--dash-text)]">
                  <span className="font-bold block text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
                    <Info className="w-4 h-4" /> Preparation Instructions:
                  </span>
                  <p className="leading-relaxed">{detailItem.notes}</p>
                </div>
              )}

              {/* Sync to Calendar */}
              {detailItem.status === "upcoming" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => openGoogleCalendar(detailItem)}
                    className="dash-btn-secondary flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-teal-600" />
                    Google Calendar
                  </button>
                  <button
                    onClick={() => downloadIcsFile(detailItem)}
                    className="dash-btn-secondary flex-1 py-2 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-600" />
                    Export (.ICS)
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-[var(--dash-border)]">
              <button
                onClick={() => handleCancelAppointment(detailItem.id, detailItem.title)}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Cancel Visit
              </button>
              <div className="flex gap-2">
                {detailItem.status === "upcoming" ? (
                  <button
                    onClick={() => {
                      const item = detailItem;
                      setDetailItem(null);
                      openRescheduleModal(item);
                    }}
                    className="dash-btn-secondary px-3 py-1.5 text-xs font-semibold"
                  >
                    Reschedule
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const item = detailItem;
                      setDetailItem(null);
                      handleBookAgain(item);
                    }}
                    className="dash-btn-primary px-3 py-1.5 text-xs font-semibold"
                  >
                    Book Again
                  </button>
                )}
                <button
                  onClick={() => setDetailItem(null)}
                  className="dash-btn-secondary px-4 py-1.5 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
