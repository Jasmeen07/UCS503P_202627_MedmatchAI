"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
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
  CalendarCheck,
  Check,
  ShieldCheck,
  Star,
  Sparkles,
  Building2,
  CheckCircle
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { 
  AppointmentItem, 
  getPatientAppointments, 
  savePatientAppointments, 
  addPatientAppointment, 
  updatePatientAppointment,
  getPatientPrescriptions,
  getActivePatientEmail,
  PRESET_DOCTORS,
  PresetDoctor
} from "@/lib/patientData";

const SPECIALTIES = [
  "General Medicine",
  "Obstetrics & Antenatal Care",
  "Cardiology",
  "Endocrinology & Diabetes",
  "General Surgery & Wound Care",
  "Ophthalmology & ENT",
  "Pulmonology",
  "Neurology",
  "Orthopedics",
  "Dermatology"
];

const QUICK_REASONS = [
  "Routine Antenatal Ultrasound & Review",
  "Post-Operative Wound Inspection",
  "Blood Pressure & Diabetes Follow-up",
  "Prescription Refill & Dosage Adjustment",
  "Comprehensive Annual Health Check",
  "Emergency Symptoms Follow-up"
];

const AVAILABLE_SLOTS = [
  "09:30 AM",
  "10:30 AM",
  "11:45 AM",
  "02:30 PM",
  "04:00 PM",
  "05:15 PM"
];

export default function AppointmentsPage() {
  const [view, setView] = useState<"upcoming" | "past" | "all" | "book">("upcoming");
  const [activeEmail, setActiveEmail] = useState<string>("");
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [searchFilter, setSearchFilter] = useState("");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [rescheduleItem, setRescheduleItem] = useState<AppointmentItem | null>(null);
  const [detailItem, setDetailItem] = useState<AppointmentItem | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<AppointmentItem | null>(null);

  // Selected Preset Doctor State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>("dr-reeta");

  // Create Form State with reliable defaults
  const [newTitle, setNewTitle] = useState("Antenatal Ultrasound & Review");
  const [newDoc, setNewDoc] = useState("Dr. Reeta Bhambri");
  const [newSpecialty, setNewSpecialty] = useState("Obstetrics & Antenatal Care");
  const [newDate, setNewDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [newTime, setNewTime] = useState("10:30 AM");
  const [newLocation, setNewLocation] = useState("Ranjit Maternity Clinic & Nursing Home");
  const [newNotes, setNewNotes] = useState("Bring past scan reports and blood panel sheets.");

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
    }, 4000);
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

  // Handle Selecting a Verified Doctor
  const handleSelectDoctor = (doc: PresetDoctor) => {
    setSelectedDoctorId(doc.id);
    setNewDoc(doc.name);
    setNewSpecialty(doc.specialty);
    setNewLocation(doc.hospital);
    if (doc.defaultSlots.length > 0) {
      setNewTime(doc.defaultSlots[0]);
    }
    if (doc.id === "dr-reeta") {
      setNewTitle("Antenatal Ultrasound & Review");
      setNewNotes("Bring prior ultrasound records and hemoglobin panel.");
    } else if (doc.id === "dr-duggal") {
      setNewTitle("Post-Operative Wound Inspection & Suture Check");
      setNewNotes("Wound inspection. Dressing replacement required.");
    } else if (doc.id === "dr-sharma") {
      setNewTitle("Comprehensive General Health & BP Review");
      setNewNotes("Bring daily blood pressure log.");
    } else if (doc.id === "dr-patel") {
      setNewTitle("Diabetes & Metabolic Profile Review");
      setNewNotes("Fasting 8 hours prior required for fasting blood sugar.");
    } else if (doc.id === "dr-gupta") {
      setNewTitle("Comprehensive Eye & Vision Exam");
      setNewNotes("Wear corrective glasses if currently prescribed.");
    }
  };

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

  // Create & Confirm Appointment
  const handleCreateAppointment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalDoc = newDoc.trim() || "Dr. Reeta Bhambri";
    const finalTitle = newTitle.trim() || "General Consultation Review";

    const colors = [
      "var(--dash-teal)", 
      "var(--dash-sage)", 
      "var(--dash-terracotta)", 
      "var(--dash-amber)", 
      "var(--dash-indigo)"
    ];
    const pickedColor = colors[appointments.length % colors.length];

    let formattedDate = newDate;
    if (newDate && newDate.includes("-")) {
      try {
        const parts = newDate.split("-");
        if (parts.length === 3) {
          const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
          formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
        }
      } catch {}
    } else if (!newDate) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      formattedDate = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    }

    const created = addPatientAppointment({
      title: finalTitle,
      doc: finalDoc,
      date: formattedDate,
      time: newTime || "10:30 AM",
      location: newLocation.trim() || "Main Consultation Suite",
      status: "upcoming",
      type: pickedColor,
      specialty: newSpecialty,
      notes: newNotes.trim()
    }, activeEmail);

    setAppointments((prev) => [created, ...prev]);
    setIsCreateOpen(false);
    setConfirmedBooking(created);
    setView("upcoming");
    showToast(`Appointment confirmed with ${created.doc} for ${created.date} at ${created.time}!`);
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
    const cleanTitle = apt.title.replace(/^(Follow-up:\s*)+/i, "").trim();
    setNewTitle(`Follow-up: ${cleanTitle}`);
    setNewDoc(apt.doc);
    setNewLocation(apt.location);
    setNewSpecialty(apt.specialty || "General Medicine");
    const matchedPreset = PRESET_DOCTORS.find(
      (d) =>
        d.name.toLowerCase().includes(apt.doc.toLowerCase()) ||
        apt.doc.toLowerCase().includes(d.name.toLowerCase())
    );
    if (matchedPreset) {
      setSelectedDoctorId(matchedPreset.id);
      if (matchedPreset.defaultSlots.length > 0) {
        setNewTime(matchedPreset.defaultSlots[0]);
      }
    }
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
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setView("book");
                setIsCreateOpen(false);
              }}
              className={`dash-btn-primary flex items-center gap-2 shadow-sm ${
                view === "book" ? "ring-2 ring-teal-400" : ""
              }`}
            >
              <CalendarPlus className="w-4 h-4" />
              Book Consultation
            </button>
            <button 
              onClick={() => setIsCreateOpen(true)}
              className="dash-btn-secondary flex items-center gap-2 text-xs font-semibold py-2 px-3"
            >
              <Plus className="w-3.5 h-3.5" />
              Quick Form
            </button>
          </div>
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
          <button 
            onClick={() => setView("book")}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              view === "book" 
                ? "bg-teal-700 text-white shadow-xs" 
                : "text-teal-700 dark:text-teal-400 hover:text-teal-800 font-bold"
            }`}
          >
            <CalendarPlus className="w-3.5 h-3.5" />
            <span>Book Consultation</span>
            <span className="text-[10px] bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200 px-1.5 py-0.2 rounded-full font-bold">New</span>
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

      {/* BOOK CONSULTATION TAB CONTENT */}
      {view === "book" ? (
        <div className="space-y-8 bg-[var(--dash-surface)] border border-[var(--dash-border)] rounded-2xl p-6 sm:p-8 shadow-xs animate-in fade-in duration-300">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Direct Clinic Consultation &amp; Slot Locking</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--dash-text)]">
              Book Medical Consultation
            </h2>
            <p className="text-xs sm:text-sm text-[var(--dash-text-secondary)] mt-1">
              Select an accredited physician, pick a convenient time slot, and lock your visit. Your appointment will sync directly to the doctor’s portal and your personal health dashboard.
            </p>
          </div>

          <form onSubmit={handleCreateAppointment} className="space-y-8">
            {/* STEP 1: SELECT SPECIALIST */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[var(--dash-text)] uppercase tracking-wider">
                  Step 1: Select Verified Specialist Doctor
                </label>
                <span className="text-[11px] text-teal-700 dark:text-teal-400 font-medium">
                  {PRESET_DOCTORS.length} Specialists Available
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PRESET_DOCTORS.map((doc) => {
                  const isSelected = selectedDoctorId === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => handleSelectDoctor(doc)}
                      className={`cursor-pointer rounded-2xl p-4 border transition-all relative flex flex-col justify-between ${
                        isSelected
                          ? "bg-teal-50/80 dark:bg-teal-950/30 border-teal-600 dark:border-teal-500 shadow-sm ring-2 ring-teal-500/30"
                          : "bg-[var(--dash-surface-warm)]/40 border-[var(--dash-border)] hover:border-teal-400 dark:hover:border-teal-600"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-200 flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                            {doc.avatar}
                          </div>
                          <div className="min-w-0 pr-5">
                            <h4 className="font-bold text-sm text-[var(--dash-text)] flex items-center gap-1.5">
                              <span className="truncate">{doc.name}</span>
                              <ShieldCheck className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                            </h4>
                            <p className="text-xs text-teal-700 dark:text-teal-400 font-medium line-clamp-1">
                              {doc.specialty}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 space-y-1 text-xs text-[var(--dash-text-secondary)]">
                          <div className="flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-[var(--dash-text-tertiary)] shrink-0" />
                            <span className="truncate">{doc.hospital}</span>
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> {doc.rating}
                            </span>
                            <span>•</span>
                            <span>{doc.experience}</span>
                            <span>•</span>
                            <span className="font-mono text-[11px]">{doc.regNo}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-[var(--dash-border)] flex items-center justify-between text-[11px]">
                        <span className="text-[var(--dash-text-tertiary)]">Slots: {doc.availableDays}</span>
                        <span className={`font-semibold ${isSelected ? "text-teal-700 dark:text-teal-300" : "text-[var(--dash-text-secondary)]"}`}>
                          {isSelected ? "Selected ✓" : "Select Doctor →"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: CONSULTATION REASON */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-[var(--dash-text)] uppercase tracking-wider">
                Step 2: Consultation Reason or Health Concern
              </label>
              <div className="flex flex-wrap gap-2">
                {QUICK_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setNewTitle(reason)}
                    className={`text-xs px-3 py-1.5 rounded-xl border transition-all ${
                      newTitle === reason
                        ? "bg-teal-700 text-white border-teal-700 font-semibold shadow-xs"
                        : "bg-[var(--dash-surface-warm)] text-[var(--dash-text)] border-[var(--dash-border)] hover:bg-[var(--dash-border)]/40"
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Or type custom reason (e.g., Post-Operative Wound Inspection, ECG review)"
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
            </div>

            {/* STEP 3: PREFERRED DATE & AVAILABLE TIME SLOT */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[var(--dash-text)] uppercase tracking-wider">
                  Step 3: Select Date &amp; Available Time Slot
                </label>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickDate(1)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] font-medium"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(3)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] font-medium"
                  >
                    +3 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickDate(7)}
                    className="text-xs px-2.5 py-1 rounded-lg bg-[var(--dash-surface-warm)] text-[var(--dash-text-secondary)] hover:text-[var(--dash-text)] font-medium"
                  >
                    +1 Week
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <span className="block text-[11px] text-[var(--dash-text-tertiary)] mb-1">Appointment Date:</span>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                <div className="sm:col-span-2">
                  <span className="block text-[11px] text-[var(--dash-text-tertiary)] mb-1">Available Clinic Slots:</span>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setNewTime(slot)}
                        className={`text-xs px-3.5 py-2 rounded-xl border font-semibold transition-all flex items-center gap-1.5 ${
                          newTime === slot
                            ? "bg-teal-700 text-white border-teal-700 shadow-xs"
                            : "bg-[var(--dash-surface-warm)] text-[var(--dash-text)] border-[var(--dash-border)] hover:bg-[var(--dash-border)]/50"
                        }`}
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 4: CLINIC LOCATION & PREPARATION CHECKLIST */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--dash-text)] uppercase tracking-wider mb-1.5">
                  Clinic / Hospital Location
                </label>
                <input
                  type="text"
                  required
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--dash-text)] uppercase tracking-wider mb-1.5">
                  Preparation Instructions / Checklist
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Fasting 8 hrs, bring past scan reports"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[var(--dash-border)] bg-[var(--dash-bg)] text-[var(--dash-text)] text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* BOOKING SUMMARY & SUBMIT */}
            <div className="pt-6 border-t border-[var(--dash-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[var(--dash-surface-warm)]/40 -mx-6 sm:-mx-8 -mb-6 sm:-mb-8 p-6 sm:p-8 rounded-b-2xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Consultation with <strong>{newDoc}</strong> • {newTime} on {newDate}
                  </span>
                </div>
                <p className="text-[11px] text-[var(--dash-text-tertiary)]">
                  Locks slot automatically with double-booking prevention in Doctor Portal.
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setView("upcoming")}
                  className="dash-btn-secondary px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="dash-btn-primary px-6 py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <CalendarCheck className="w-4 h-4" />
                  Confirm &amp; Book Consultation
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        /* APPOINTMENT CARDS GRID */
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
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <RefreshCw className="w-3 h-3 text-slate-500" /> Reschedule
                      </button>
                      <button 
                        onClick={() => handleToggleCompleted(apt)}
                        className="flex-1 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition-colors flex items-center justify-center gap-1.5"
                        title="Mark consultation as completed"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Done
                      </button>
                      <button 
                        onClick={() => handleCancelAppointment(apt.id, apt.title)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Cancel appointment"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleBookAgain(apt)}
                        className="flex-1 py-2 px-3 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CalendarPlus className="w-3.5 h-3.5" /> Book Again
                      </button>
                      <button 
                        onClick={() => handleToggleCompleted(apt)}
                        className="py-2 px-3 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors"
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
                  onClick={() => setView("book")}
                  className="dash-btn-primary inline-flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl shadow-sm"
                >
                  <CalendarPlus className="w-4 h-4" />
                  Book a Consultation
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* SCHEDULE APPOINTMENT MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
            {/* STICKY HEADER */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shadow-xs">
                  <CalendarPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Schedule Medical Visit</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Lock an appointment with a verified specialist</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCreateOpen(false)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* SCROLLABLE FORM BODY */}
            <form onSubmit={handleCreateAppointment} id="schedule-apt-form" className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Verified Specialist Doctor Selection */}
              <div className="p-3 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 space-y-2">
                <div className="text-[11px] font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-teal-800 dark:text-teal-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                    Verified Clinic Specialists:
                  </span>
                  <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold">Instant Slot Lock</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_DOCTORS.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => handleSelectDoctor(doc)}
                      className={`text-xs px-2.5 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 ${
                        selectedDoctorId === doc.id
                          ? "bg-teal-700 text-white border-teal-700 font-semibold shadow-xs"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700"
                      }`}
                    >
                      <span>{doc.name}</span>
                      <span className="text-[10px] opacity-75">({doc.specialty.split(" ")[0]})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Doctor Auto-suggestions from past prescriptions */}
              {treatingDoctors.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
                    <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                    From Your Past Prescriptions:
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
                            ? "bg-teal-100 text-teal-800 border-teal-300 font-semibold"
                            : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {td.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Reason */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Consultation Reason / Concern *
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {QUICK_REASONS.slice(0, 3).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setNewTitle(r)}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                      >
                        {r.split(" ")[0]} {r.split(" ")[1]}
                      </button>
                    ))}
                  </div>
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Antenatal Ultrasound & Review, BP Evaluation" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Physician & Specialty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Physician Name *
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Dr. Reeta Bhambri" 
                    value={newDoc}
                    onChange={(e) => setNewDoc(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Department / Specialty
                  </label>
                  <select
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  >
                    {SPECIALTIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date & Slot */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Consultation Date &amp; Time Slot
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickDate(1)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
                    >
                      +Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(7)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
                    >
                      +1 Week
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <input 
                    type="date" 
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <input 
                    type="text" 
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    placeholder="Time slot"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setNewTime(slot)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        newTime === slot
                          ? "bg-teal-700 text-white border-teal-700 shadow-xs font-semibold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Clinic / Hospital Location
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. Ranjit Maternity Clinic & Nursing Home" 
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Preparation Checklist / Notes
                </label>
                <input 
                  type="text"
                  placeholder="e.g. Bring past ultrasound scan reports and blood panel sheets" 
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </form>

            {/* STICKY FOOTER - ALWAYS 100% VISIBLE AT ALL TIMES! */}
            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate pr-3">
                Slot: <strong className="text-teal-700 dark:text-teal-300">{newDoc}</strong> ({newTime})
              </div>
              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateAppointment()}
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Confirm &amp; Book Appointment</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE APPOINTMENT MODAL */}
      {rescheduleItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl sm:rounded-3xl max-w-lg w-full shadow-2xl flex flex-col max-h-[88vh] overflow-hidden">
            {/* Sticky Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center shadow-xs">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">Reschedule Visit</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{rescheduleItem.title} • {rescheduleItem.doc}</p>
                </div>
              </div>
              <button 
                onClick={() => setRescheduleItem(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReschedule} className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400">
                Current: <strong>{rescheduleItem.date}</strong> at <strong>{rescheduleItem.time}</strong> ({rescheduleItem.location})
              </div>

              {/* Quick Date Chips */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    New Date &amp; Time
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setQuickDate(1, true)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
                    >
                      Tomorrow
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(3, true)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickDate(7, true)}
                      className="text-[10px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 font-medium"
                    >
                      +1 Week
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <input 
                    type="date" 
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                  <input 
                    type="text" 
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    placeholder="Time slot"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {AVAILABLE_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setRescheduleTime(slot)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all ${
                        rescheduleTime === slot
                          ? "bg-teal-700 text-white border-teal-700 shadow-xs font-semibold"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Consultation Location
                </label>
                <input 
                  type="text" 
                  value={rescheduleLocation}
                  onChange={(e) => setRescheduleLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {/* Sticky Footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setRescheduleItem(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-2"
                >
                  <CalendarCheck className="w-4 h-4" />
                  <span>Confirm Reschedule</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="dash-card bg-[var(--dash-surface)] border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6">
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
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Close"
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

      {/* BOOKING CONFIRMED VOUCHER MODAL */}
      {confirmedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="dash-card bg-[var(--dash-surface)] border border-emerald-500/40 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative overflow-hidden">
            {/* Top decorative stripe */}
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-700" />

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-200">
                    Booking Confirmed
                  </span>
                  <h3 className="text-xl font-bold text-[var(--dash-text)] mt-1">
                    Consultation Scheduled!
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setConfirmedBooking(null)}
                className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Booking Reference Box */}
            <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Booking Reference:</span>
                <span className="font-mono font-bold text-teal-800 dark:text-teal-200 text-sm">
                  APT-2026-LUD-{confirmedBooking.id.toString().slice(-4)}
                </span>
              </div>
              <div className="h-px bg-teal-200/60 dark:bg-teal-800/40" />
              <div className="space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Consultation:</span>
                  <strong className="text-slate-900 dark:text-slate-100 text-right">{confirmedBooking.title}</strong>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Physician:</span>
                  <strong className="text-teal-700 dark:text-teal-300 text-right">{confirmedBooking.doc}</strong>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Specialty:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right">{confirmedBooking.specialty || "General Medicine"}</span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Date &amp; Time:</span>
                  <strong className="text-slate-900 dark:text-slate-100 text-right">{confirmedBooking.date} at {confirmedBooking.time}</strong>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Clinic Location:</span>
                  <span className="text-slate-700 dark:text-slate-300 text-right max-w-[240px]">{confirmedBooking.location}</span>
                </div>
              </div>
            </div>

            {confirmedBooking.notes && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-[var(--dash-text)]">
                <span className="font-bold text-amber-800 dark:text-amber-300 block mb-0.5">
                  Preparation Instructions:
                </span>
                <p className="text-[11px] text-[var(--dash-text-secondary)]">{confirmedBooking.notes}</p>
              </div>
            )}

            {/* Calendar & Sync Actions */}
            <div className="space-y-2 pt-1">
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => openGoogleCalendar(confirmedBooking)}
                  className="dash-btn-secondary py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-teal-700" />
                  Google Calendar
                </button>
                <button
                  onClick={() => downloadIcsFile(confirmedBooking)}
                  className="dash-btn-secondary py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-slate-700" />
                  Download (.ICS)
                </button>
              </div>

              <Link
                href="/doctor"
                className="w-full text-xs font-semibold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 p-2.5 rounded-xl hover:bg-teal-100/60 transition-colors flex items-center justify-between"
              >
                <span className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  View in Doctor Portal Queue (/doctor)
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">
                  Slot Locked ✓
                </span>
              </Link>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                onClick={() => setConfirmedBooking(null)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all text-xs"
              >
                Done &amp; View Upcoming
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
