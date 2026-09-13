"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Layers,
  Plus,
  ChevronRight,
  Activity,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  User,
  Building2,
  FileText,
  X,
  Trash2,
  Pill,
  Sparkles,
  ArrowUpRight,
  AlertCircle,
  Stethoscope,
  HeartPulse,
  Share2,
  ShieldCheck,
  Check,
  RotateCcw
} from "lucide-react";

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  instructions?: string;
  takenToday: boolean;
}

export interface LinkedPrescription {
  id: string | number;
  doc: string;
  hospital: string;
  date: string;
  diag?: string;
}

export interface TreatmentGroup {
  id: string;
  name: string;
  category: "metabolic" | "cardiovascular" | "respiratory" | "preventative" | "other";
  conditionGoal: string;
  physician: string;
  hospital: string;
  startDate: string;
  status: "active" | "monitoring" | "completed";
  theme: "emerald" | "amber" | "terracotta" | "indigo" | "teal";
  medications: MedicationItem[];
  adherenceRate: number;
  clinicalNotes: string;
  nextMilestone: string;
  linkedPrescriptionIds: (string | number)[];
}

const initialTreatmentGroups: TreatmentGroup[] = [
  {
    id: "tg-1",
    name: "Type 2 Diabetes Glycemic Care",
    category: "metabolic",
    conditionGoal: "Maintain HbA1c < 6.5% and stabilize fasting blood glucose under 110 mg/dL",
    physician: "Dr. Sharma",
    hospital: "City Hospital (Endocrinology)",
    startDate: "Aug 2026 to Present",
    status: "active",
    theme: "emerald",
    adherenceRate: 95,
    nextMilestone: "Fasting Glucose & HbA1c in 18 days",
    clinicalNotes: "Metformin ER dosage stabilized. Patient advised 30-min brisk walk post meals. Fasting levels trending favorably.",
    linkedPrescriptionIds: ["1", "2"],
    medications: [
      {
        id: "m-1",
        name: "Metformin ER",
        dosage: "500mg",
        frequency: "Twice daily",
        timing: "With breakfast & dinner",
        instructions: "Take with food to minimize gastrointestinal discomfort",
        takenToday: true,
      },
      {
        id: "m-2",
        name: "Glimepiride",
        dosage: "1mg",
        frequency: "Once daily",
        timing: "Morning before meals",
        instructions: "Do not skip breakfast after taking",
        takenToday: true,
      },
      {
        id: "m-3",
        name: "Empagliflozin",
        dosage: "10mg",
        frequency: "Once daily",
        timing: "Morning",
        instructions: "Stay adequately hydrated throughout the day",
        takenToday: false,
      },
    ],
  },
  {
    id: "tg-2",
    name: "Cardiovascular & Lipid Protocol",
    category: "cardiovascular",
    conditionGoal: "Target systolic BP < 130 mmHg and maintain LDL cholesterol < 70 mg/dL",
    physician: "Dr. Singh",
    hospital: "Max Healthcare (Cardiology)",
    startDate: "Jun 2026 to Present",
    status: "active",
    theme: "terracotta",
    adherenceRate: 92,
    nextMilestone: "Lipid Panel & Renal Review in 24 days",
    clinicalNotes: "Total cholesterol reduced from 220 mg/dL to 154 mg/dL. Morning blood pressure readings consistent at 122/78 mmHg.",
    linkedPrescriptionIds: ["4"],
    medications: [
      {
        id: "m-4",
        name: "Atorvastatin",
        dosage: "20mg",
        frequency: "Once daily",
        timing: "Bedtime",
        instructions: "Avoid grapefruit or related citrus juices",
        takenToday: true,
      },
      {
        id: "m-5",
        name: "Amlodipine",
        dosage: "5mg",
        frequency: "Once daily",
        timing: "Morning",
        instructions: "Take consistently at the same time each morning",
        takenToday: true,
      },
      {
        id: "m-6",
        name: "Telmisartan",
        dosage: "40mg",
        frequency: "Once daily",
        timing: "Morning",
        instructions: "Monitor for occasional lightheadedness",
        takenToday: true,
      },
    ],
  },
  {
    id: "tg-3",
    name: "Respiratory & Seasonal Allergy Defense",
    category: "respiratory",
    conditionGoal: "Prevent acute allergic rhinitis flares and suppress nocturnal airway hypersensitivity",
    physician: "Dr. Mehta",
    hospital: "Apollo Hospital (Pulmonology)",
    startDate: "Jul 2026 to Present",
    status: "monitoring",
    theme: "amber",
    adherenceRate: 88,
    nextMilestone: "Peak Flow & Spirometry in 40 days",
    clinicalNotes: "Pre-monsoon allergen protection protocol. Fluticasone spray for nasal mucosa, Cetirizine as PRN when symptomatic.",
    linkedPrescriptionIds: ["3"],
    medications: [
      {
        id: "m-7",
        name: "Fluticasone Propionate",
        dosage: "50mcg",
        frequency: "Once daily",
        timing: "Morning",
        instructions: "2 sprays in each nostril; prime device before initial use",
        takenToday: true,
      },
      {
        id: "m-8",
        name: "Cetirizine HCl",
        dosage: "10mg",
        frequency: "Once daily PRN",
        timing: "Night when needed",
        instructions: "May induce slight drowsiness; take before sleep",
        takenToday: false,
      },
    ],
  },
  {
    id: "tg-4",
    name: "Metabolic Vitality & Micronutrient Care",
    category: "preventative",
    conditionGoal: "Replenish serum 25-OH Vitamin D deficiency and enhance cellular energy pathways",
    physician: "Dr. Patel",
    hospital: "Lifeline Clinic (Internal Medicine)",
    startDate: "Jan 2026 to Present",
    status: "active",
    theme: "indigo",
    adherenceRate: 98,
    nextMilestone: "Vitamin D & B12 check in 60 days",
    clinicalNotes: "Serum 25-OH Vitamin D restored from 14 ng/mL to 44 ng/mL. Weekly maintenance dosing working optimally.",
    linkedPrescriptionIds: ["5"],
    medications: [
      {
        id: "m-9",
        name: "Cholecalciferol (D3)",
        dosage: "60,000 IU",
        frequency: "Once weekly",
        timing: "Sunday with lunch",
        instructions: "Consume with dietary fats or a glass of milk for absorption",
        takenToday: true,
      },
      {
        id: "m-10",
        name: "Methylcobalamin & B-Complex",
        dosage: "1500mcg",
        frequency: "Once daily",
        timing: "With breakfast",
        instructions: "Take with water during morning meals",
        takenToday: true,
      },
    ],
  },
];

export default function TreatmentsPage() {
  const [groups, setGroups] = useState<TreatmentGroup[]>(initialTreatmentGroups);
  const [selectedGroup, setSelectedGroup] = useState<TreatmentGroup | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [storedPrescriptions, setStoredPrescriptions] = useState<any[]>([]);

  // New Group Form State
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<TreatmentGroup["category"]>("metabolic");
  const [formGoal, setFormGoal] = useState("");
  const [formPhysician, setFormPhysician] = useState("");
  const [formHospital, setFormHospital] = useState("");
  const [formTheme, setFormTheme] = useState<TreatmentGroup["theme"]>("emerald");
  const [formNotes, setFormNotes] = useState("");
  const [formMilestone, setFormMilestone] = useState("");
  const [formMeds, setFormMeds] = useState<Array<{ name: string; dosage: string; frequency: string; timing: string; instructions: string }>>([
    { name: "", dosage: "", frequency: "Once daily", timing: "Morning", instructions: "" }
  ]);

  // Inline Add Medication State (Inside Dossier)
  const [newMedName, setNewMedName] = useState("");
  const [newMedDosage, setNewMedDosage] = useState("");
  const [newMedFrequency, setNewMedFrequency] = useState("Once daily");
  const [newMedTiming, setNewMedTiming] = useState("Morning");
  const [showAddMedForm, setShowAddMedForm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedGroups = localStorage.getItem("medmatch_treatment_groups");
      if (savedGroups) {
        const parsed = JSON.parse(savedGroups);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setGroups(parsed);
        }
      }

      const savedRx = localStorage.getItem("medmatch_prescriptions");
      if (savedRx) {
        const parsedRx = JSON.parse(savedRx);
        if (Array.isArray(parsedRx)) {
          setStoredPrescriptions(parsedRx);
        }
      }
    } catch (err) {
      console.warn("Error reading localStorage:", err);
    }
  }, []);

  // Save to localStorage
  const saveGroups = (updated: TreatmentGroup[]) => {
    setGroups(updated);
    try {
      localStorage.setItem("medmatch_treatment_groups", JSON.stringify(updated));
    } catch (err) {
      console.error("Failed to save treatment groups:", err);
    }
  };

  // Toggle dose adherence
  const toggleMedicationDose = (groupId: string, medId: string) => {
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      const updatedMeds = g.medications.map((m) =>
        m.id === medId ? { ...m, takenToday: !m.takenToday } : m
      );
      const takenCount = updatedMeds.filter((m) => m.takenToday).length;
      const adherence = Math.round((takenCount / updatedMeds.length) * 100);
      return {
        ...g,
        medications: updatedMeds,
        adherenceRate: adherence,
      };
    });

    saveGroups(updated);
    if (selectedGroup && selectedGroup.id === groupId) {
      const current = updated.find((g) => g.id === groupId);
      if (current) setSelectedGroup(current);
    }
  };

  // Quick Log All for a Group
  const quickLogGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = groups.map((g) => {
      if (g.id !== groupId) return g;
      const allTaken = g.medications.every((m) => m.takenToday);
      const updatedMeds = g.medications.map((m) => ({
        ...m,
        takenToday: !allTaken,
      }));
      const takenCount = updatedMeds.filter((m) => m.takenToday).length;
      const adherence = Math.round((takenCount / updatedMeds.length) * 100);
      return {
        ...g,
        medications: updatedMeds,
        adherenceRate: adherence,
      };
    });

    saveGroups(updated);
  };

  // Add Medication to Group (inside Dossier)
  const handleAddMedicationToGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !newMedName.trim()) return;

    const newMed: MedicationItem = {
      id: `m-${Date.now()}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || "Standard dose",
      frequency: newMedFrequency,
      timing: newMedTiming,
      takenToday: true,
    };

    const updated = groups.map((g) => {
      if (g.id !== selectedGroup.id) return g;
      const updatedMeds = [...g.medications, newMed];
      const takenCount = updatedMeds.filter((m) => m.takenToday).length;
      const adherence = Math.round((takenCount / updatedMeds.length) * 100);
      return {
        ...g,
        medications: updatedMeds,
        adherenceRate: adherence,
      };
    });

    saveGroups(updated);
    const updatedSelected = updated.find((g) => g.id === selectedGroup.id);
    if (updatedSelected) setSelectedGroup(updatedSelected);

    setNewMedName("");
    setNewMedDosage("");
    setShowAddMedForm(false);
  };

  // Delete / Archive Group
  const handleDeleteGroup = (groupId: string) => {
    if (window.confirm("Are you sure you want to remove this treatment pathway?")) {
      const updated = groups.filter((g) => g.id !== groupId);
      saveGroups(updated);
      setSelectedGroup(null);
    }
  };

  // Create New Group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formPhysician.trim()) return;

    const validMeds: MedicationItem[] = formMeds
      .filter((m) => m.name.trim().length > 0)
      .map((m, idx) => ({
        id: `m-${Date.now()}-${idx}`,
        name: m.name.trim(),
        dosage: m.dosage.trim() || "As directed",
        frequency: m.frequency,
        timing: m.timing,
        instructions: m.instructions.trim() || undefined,
        takenToday: false,
      }));

    const newGroup: TreatmentGroup = {
      id: `tg-${Date.now()}`,
      name: formName.trim(),
      category: formCategory,
      conditionGoal: formGoal.trim() || "Clinical disease monitoring & therapeutic symptom control",
      physician: formPhysician.trim(),
      hospital: formHospital.trim() || "Specialty Clinic",
      startDate: `${new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(new Date())} to Present`,
      status: "active",
      theme: formTheme,
      adherenceRate: 100,
      nextMilestone: formMilestone.trim() || "Routine clinical follow-up in 30 days",
      clinicalNotes: formNotes.trim() || "Initiated customized patient care regimen. Adhere to daily dosage schedule.",
      linkedPrescriptionIds: [],
      medications: validMeds.length > 0 ? validMeds : [
        {
          id: `m-${Date.now()}-0`,
          name: "Standard Prescribed Regimen",
          dosage: "Daily",
          frequency: "Once daily",
          timing: "Morning",
          takenToday: true,
        }
      ],
    };

    const updated = [newGroup, ...groups];
    saveGroups(updated);

    // Reset form & close
    setFormName("");
    setFormGoal("");
    setFormPhysician("");
    setFormHospital("");
    setFormNotes("");
    setFormMilestone("");
    setFormMeds([{ name: "", dosage: "", frequency: "Once daily", timing: "Morning", instructions: "" }]);
    setIsCreateModalOpen(false);
  };

  // Add Medication Row to Form
  const addFormMedRow = () => {
    setFormMeds([...formMeds, { name: "", dosage: "", frequency: "Once daily", timing: "Morning", instructions: "" }]);
  };

  const removeFormMedRow = (idx: number) => {
    if (formMeds.length <= 1) return;
    setFormMeds(formMeds.filter((_, i) => i !== idx));
  };

  // Filter groups
  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.physician.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.conditionGoal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.medications.some((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = categoryFilter === "all" || g.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Calculate executive metrics
  const totalFormulations = groups.reduce((acc, g) => acc + g.medications.length, 0);
  const avgAdherence = groups.length > 0
    ? Math.round(groups.reduce((acc, g) => acc + g.adherenceRate, 0) / groups.length)
    : 0;

  // Theme styling helpers
  const getThemeStyles = (theme: TreatmentGroup["theme"]) => {
    switch (theme) {
      case "emerald":
        return {
          badge: "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60",
          accentDot: "bg-emerald-500",
          borderHover: "hover:border-emerald-400/60",
          streamGlow: "from-emerald-50/40 to-transparent dark:from-emerald-950/20",
          ringColor: "ring-emerald-500",
          btnColor: "bg-emerald-700 hover:bg-emerald-800 text-white",
          watermark: "#059669",
        };
      case "amber":
        return {
          badge: "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60",
          accentDot: "bg-amber-500",
          borderHover: "hover:border-amber-400/60",
          streamGlow: "from-amber-50/40 to-transparent dark:from-amber-950/20",
          ringColor: "ring-amber-500",
          btnColor: "bg-amber-700 hover:bg-amber-800 text-white",
          watermark: "#d97706",
        };
      case "terracotta":
        return {
          badge: "bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60",
          accentDot: "bg-rose-500",
          borderHover: "hover:border-rose-400/60",
          streamGlow: "from-rose-50/40 to-transparent dark:from-rose-950/20",
          ringColor: "ring-rose-500",
          btnColor: "bg-rose-700 hover:bg-rose-800 text-white",
          watermark: "#e11d48",
        };
      case "indigo":
        return {
          badge: "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60",
          accentDot: "bg-indigo-500",
          borderHover: "hover:border-indigo-400/60",
          streamGlow: "from-indigo-50/40 to-transparent dark:from-indigo-950/20",
          ringColor: "ring-indigo-500",
          btnColor: "bg-indigo-700 hover:bg-indigo-800 text-white",
          watermark: "#4f46e5",
        };
      case "teal":
      default:
        return {
          badge: "bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border-teal-200/80 dark:border-teal-800/60",
          accentDot: "bg-teal-500",
          borderHover: "hover:border-teal-400/60",
          streamGlow: "from-teal-50/40 to-transparent dark:from-teal-950/20",
          ringColor: "ring-teal-500",
          btnColor: "bg-teal-700 hover:bg-teal-800 text-white",
          watermark: "#0f766e",
        };
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-16">
      {/* =========================================================================
          EDITORIAL HEADER & EXECUTIVE SUMMARY RIBBON
          ========================================================================= */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2 border-b border-slate-200/70 dark:border-slate-800/70">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/70 dark:border-teal-800/60">
                <Sparkles className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                Continuous Care Journeys
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-slate-900 dark:text-slate-100 font-editorial-serif">
              Treatment Pathways & Clinical Groups
            </h1>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mt-1 max-w-2xl font-editorial-serif italic">
              Holistic management of chronic regimens, therapeutic goals, and cross-verified prescription history.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-[#0d5c56] hover:bg-[#094843] text-white text-xs sm:text-sm font-medium transition-all shadow-sm hover:shadow flex items-center gap-2 shrink-0 group cursor-pointer"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Treatment Pathway</span>
          </button>
        </div>

        {/* Executive Metrics Ribbon */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-xs backdrop-blur-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Active Pathways</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-editorial-serif">
                {groups.length} Conditions
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-xs backdrop-blur-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Formulations</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-editorial-serif">
                {totalFormulations} Active Meds
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-xs backdrop-blur-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
              <HeartPulse className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Regimen Adherence</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 font-editorial-serif">
                {avgAdherence}% Logged
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800/70 shadow-xs backdrop-blur-xs flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Next Review</p>
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-editorial-serif truncate max-w-[140px]" title="Upcoming clinical milestone">
                18 Days (HbA1c)
              </p>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Pathways" },
              { id: "metabolic", label: "Metabolic & Glycemic" },
              { id: "cardiovascular", label: "Cardiovascular" },
              { id: "respiratory", label: "Respiratory" },
              { id: "preventative", label: "Preventative" },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                  categoryFilter === cat.id
                    ? "bg-[#0d5c56] text-white shadow-xs"
                    : "bg-white/60 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/60 dark:border-slate-800/60"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search pathways or medications..."
              className="w-full pl-8 pr-3 py-1.5 rounded-full text-xs bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all shadow-xs"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          ORGANIC CLINICAL CARE PATHWAY STREAMS (No Generic Box Grid!)
          ========================================================================= */}
      <section className="space-y-4">
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
            <Layers className="w-10 h-10 text-slate-400 mx-auto opacity-70" />
            <h3 className="text-lg font-editorial-serif text-slate-800 dark:text-slate-200">
              No treatment pathways match your filter
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Try adjusting your search criteria or create a new dedicated treatment group for your health condition.
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setCategoryFilter("all");
              }}
              className="mt-2 text-xs font-medium text-teal-700 dark:text-teal-400 underline underline-offset-4 cursor-pointer"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const styles = getThemeStyles(group.theme);
            const allTaken = group.medications.every((m) => m.takenToday);

            return (
              <div
                key={group.id}
                onClick={() => setSelectedGroup(group)}
                className={`relative p-5 sm:p-7 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800/70 shadow-xs hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden group ${styles.borderHover}`}
              >
                {/* Subtle Botanical Gradient Backing */}
                <div
                  className={`absolute inset-0 bg-gradient-to-r ${styles.streamGlow} opacity-60 pointer-events-none transition-opacity group-hover:opacity-100`}
                />

                {/* Decorative Wave Accent in top right */}
                <svg
                  className="absolute -top-12 -right-12 w-48 h-48 opacity-[0.06] dark:opacity-[0.04] pointer-events-none select-none transition-transform group-hover:scale-105 duration-500"
                  viewBox="0 0 200 200"
                  fill={styles.watermark}
                >
                  <path d="M40,-58C53.7,-51.2,67.1,-41.8,72.4,-28.9C77.7,-16,74.9,0.4,70.1,16.5C65.2,32.6,58.3,48.5,46.1,57.7C33.9,67,16.9,69.7,0.3,69.3C-16.3,68.9,-32.7,65.3,-46.3,56.4C-59.9,47.5,-70.7,33.3,-74.6,17.4C-78.5,1.5,-75.4,-16.1,-67.2,-29.9C-59,-43.8,-45.6,-53.8,-32,-60.8C-18.4,-67.7,-4.6,-71.5,4.7,-64.8C14,-58,26.3,-64.8,40,-58Z" transform="translate(100 100)" />
                </svg>

                <div className="relative z-10 space-y-4">
                  {/* Top Meta: Category Badge, Duration, Adherence Pill */}
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${styles.badge}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${styles.accentDot}`} />
                        {group.category.toUpperCase()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-editorial-serif italic">
                        {group.startDate}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Adherence indicator */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <span className="text-slate-400 dark:text-slate-500">Adherence:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {group.adherenceRate}%
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden ml-0.5">
                          <div
                            className="h-full rounded-full bg-teal-600 dark:bg-teal-400 transition-all duration-500"
                            style={{ width: `${group.adherenceRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Status Tag */}
                      <span className="hidden sm:inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                        {group.status}
                      </span>
                    </div>
                  </div>

                  {/* Main Title & Clinical Target */}
                  <div className="space-y-1.5">
                    <h3 className="text-2xl sm:text-2xl font-normal text-slate-900 dark:text-slate-100 font-editorial-serif tracking-tight group-hover:text-teal-900 dark:group-hover:text-teal-200 transition-colors">
                      {group.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      <strong className="text-slate-700 dark:text-slate-300 font-medium">Therapeutic Target:</strong>{" "}
                      {group.conditionGoal}
                    </p>
                  </div>

                  {/* Physician Attribution & Facility */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Stethoscope className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                      <span>{group.physician}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{group.hospital}</span>
                    </div>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Next: {group.nextMilestone}</span>
                    </div>
                  </div>

                  {/* Bottom: Active Formulations Capsules & Actions */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Medication pills */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 mr-1">
                        Formulations:
                      </span>
                      {group.medications.map((med) => (
                        <span
                          key={med.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                            med.takenToday
                              ? "bg-teal-50/90 dark:bg-teal-950/60 text-teal-900 dark:text-teal-200 border border-teal-200/80 dark:border-teal-800/60"
                              : "bg-slate-100/90 dark:bg-slate-800/90 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80"
                          }`}
                        >
                          <Pill className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span>{med.name} {med.dosage}</span>
                          {med.takenToday && (
                            <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400 ml-0.5" />
                          )}
                        </span>
                      ))}
                    </div>

                    {/* Interactive Action Buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        onClick={(e) => quickLogGroup(group.id, e)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
                          allTaken
                            ? "bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800"
                            : "bg-slate-100 dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-slate-700 dark:text-slate-300 hover:text-teal-800"
                        }`}
                        title="Toggle all medications in this pathway for today"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{allTaken ? "Logged Today" : "Quick Log"}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedGroup(group);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-teal-900 text-white dark:text-slate-900 text-xs font-medium transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* =========================================================================
          INTERACTIVE CLINICAL TREATMENT DOSSIER MODAL ("VIEW DETAILS")
          ========================================================================= */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-3xl max-h-[90vh] bg-[#fbfdfc] dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dossier Header */}
            <div className="p-6 sm:p-7 border-b border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4 bg-gradient-to-r from-teal-50/50 to-transparent dark:from-teal-950/20">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100/70 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300">
                    Clinical Dossier #{selectedGroup.id}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                    • {selectedGroup.category} Pathway
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-normal text-slate-900 dark:text-slate-100 font-editorial-serif tracking-tight">
                  {selectedGroup.name}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-400 mt-2">
                  <span className="font-medium text-slate-800 dark:text-slate-200">
                    {selectedGroup.physician}
                  </span>
                  <span>({selectedGroup.hospital})</span>
                  <span>•</span>
                  <span>Initiated: {selectedGroup.startDate}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedGroup(null);
                  setShowAddMedForm(false);
                }}
                className="p-2 rounded-full hover:bg-slate-200/60 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                title="Close dossier"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dossier Body (Scrollable) */}
            <div className="p-6 sm:p-7 overflow-y-auto space-y-6 flex-1">
              {/* Therapeutic Objective Banner */}
              <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/60 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-700 dark:text-teal-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-xs font-semibold text-teal-950 dark:text-teal-200 uppercase tracking-wider">
                    Primary Therapeutic Objective
                  </h4>
                  <p className="text-xs sm:text-sm text-teal-900 dark:text-teal-300 leading-relaxed font-editorial-serif">
                    {selectedGroup.conditionGoal}
                  </p>
                </div>
              </div>

              {/* Medication Protocol & Interactive Adherence Tracking */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-editorial-serif">
                      Active Medication Protocol
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Click any checkbox to log today's dose compliance
                    </p>
                  </div>

                  <button
                    onClick={() => setShowAddMedForm(!showAddMedForm)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-900 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{showAddMedForm ? "Cancel" : "Add Medication"}</span>
                  </button>
                </div>

                {/* Inline Add Medication Form */}
                {showAddMedForm && (
                  <form
                    onSubmit={handleAddMedicationToGroup}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in duration-200"
                  >
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Prescribe New Formulation to this Group:
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Medication Name</label>
                        <input
                          type="text"
                          required
                          value={newMedName}
                          onChange={(e) => setNewMedName(e.target.value)}
                          placeholder="e.g. Lisinopril"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Strength / Dosage</label>
                        <input
                          type="text"
                          required
                          value={newMedDosage}
                          onChange={(e) => setNewMedDosage(e.target.value)}
                          placeholder="e.g. 10mg"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Frequency</label>
                        <select
                          value={newMedFrequency}
                          onChange={(e) => setNewMedFrequency(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        >
                          <option>Once daily</option>
                          <option>Twice daily</option>
                          <option>Three times daily</option>
                          <option>Once weekly</option>
                          <option>As needed (PRN)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-500 mb-1">Timing Directive</label>
                        <input
                          type="text"
                          value={newMedTiming}
                          onChange={(e) => setNewMedTiming(e.target.value)}
                          placeholder="e.g. Morning with breakfast"
                          className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddMedForm(false)}
                        className="px-3 py-1 text-xs text-slate-500 hover:text-slate-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 rounded-lg text-xs font-medium bg-[#0d5c56] text-white hover:bg-[#094843] cursor-pointer"
                      >
                        Add to Regimen
                      </button>
                    </div>
                  </form>
                )}

                {/* Medication Items List */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/60 overflow-hidden">
                  {selectedGroup.medications.map((med) => (
                    <div
                      key={med.id}
                      className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => toggleMedicationDose(selectedGroup.id, med.id)}
                          className={`w-5 h-5 mt-0.5 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                            med.takenToday
                              ? "bg-teal-600 text-white shadow-xs"
                              : "border border-slate-300 dark:border-slate-600 hover:border-teal-500 text-transparent"
                          }`}
                          title={med.takenToday ? "Dose taken today" : "Mark dose taken"}
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </button>

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                              {med.name}
                            </span>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              {med.dosage}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-400">
                            {med.frequency} • {med.timing}
                          </p>
                          {med.instructions && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-500 italic">
                              Note: {med.instructions}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            med.takenToday
                              ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {med.takenToday ? "Completed Today" : "Pending Dose"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Physician Directives & Clinical Notes */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <FileText className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Clinical Observations & Directives</span>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-editorial-serif">
                  {selectedGroup.clinicalNotes}
                </p>
                <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Next Clinical Review Target: <strong>{selectedGroup.nextMilestone}</strong></span>
                </div>
              </div>

              {/* Cross-Referenced Prescriptions */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Linked Prescription Records
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {selectedGroup.linkedPrescriptionIds.length > 0 ? (
                    selectedGroup.linkedPrescriptionIds.map((rxId) => {
                      return (
                        <Link
                          key={rxId}
                          href={`/dashboard/prescriptions/view?id=${rxId}`}
                          className="p-3 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/70 dark:border-slate-800 hover:border-teal-400/80 transition-all flex items-center justify-between group"
                        >
                          <div className="space-y-0.5">
                            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-300">
                              Prescription #{rxId}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">
                              Issued by {selectedGroup.physician}
                            </p>
                          </div>
                          <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-2 p-3 text-center text-xs text-slate-400 border border-dashed rounded-xl">
                      No external digitized prescription slips directly tied to this custom group.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dossier Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteGroup(selectedGroup.id)}
                className="px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Archive Pathway</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allTaken = selectedGroup.medications.every((m) => m.takenToday);
                    const updatedMeds = selectedGroup.medications.map((m) => ({
                      ...m,
                      takenToday: !allTaken,
                    }));
                    const takenCount = updatedMeds.filter((m) => m.takenToday).length;
                    const adherence = Math.round((takenCount / updatedMeds.length) * 100);

                    const updated = groups.map((g) =>
                      g.id === selectedGroup.id
                        ? { ...g, medications: updatedMeds, adherenceRate: adherence }
                        : g
                    );
                    saveGroups(updated);
                    const curr = updated.find((g) => g.id === selectedGroup.id);
                    if (curr) setSelectedGroup(curr);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-medium bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 hover:bg-teal-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Toggle All Today</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setShowAddMedForm(false);
                  }}
                  className="px-5 py-2 rounded-xl text-xs font-medium bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-teal-900 transition-colors cursor-pointer shadow-xs"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          CREATE NEW TREATMENT GROUP MODAL
          ========================================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-2xl max-h-[90vh] bg-[#fbfdfc] dark:bg-[#0f172a] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-normal text-slate-900 dark:text-slate-100 font-editorial-serif tracking-tight">
                  Initialize Treatment Pathway
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Organize related prescriptions and active regimens under a unified health condition.
                </p>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateGroup} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Pathway / Condition Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Thyroid Hormone Balance, Hypertension Management"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Clinical Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as TreatmentGroup["category"])}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                      <option value="metabolic">Metabolic & Glycemic</option>
                      <option value="cardiovascular">Cardiovascular & BP</option>
                      <option value="respiratory">Respiratory & Allergy</option>
                      <option value="preventative">Preventative & Micronutrient</option>
                      <option value="other">Other Chronic Condition</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Botanical Accent Palette
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[
                        { id: "emerald", label: "Emerald", color: "bg-emerald-600" },
                        { id: "teal", label: "Teal", color: "bg-teal-600" },
                        { id: "amber", label: "Amber", color: "bg-amber-600" },
                        { id: "terracotta", label: "Rose", color: "bg-rose-600" },
                        { id: "indigo", label: "Indigo", color: "bg-indigo-600" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setFormTheme(item.id as TreatmentGroup["theme"])}
                          className={`w-6 h-6 rounded-full ${item.color} transition-all cursor-pointer ${
                            formTheme === item.id ? "ring-2 ring-offset-2 ring-slate-800 dark:ring-slate-200 scale-110" : "opacity-60 hover:opacity-100"
                          }`}
                          title={item.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Therapeutic Objective & Clinical Target
                  </label>
                  <input
                    type="text"
                    value={formGoal}
                    onChange={(e) => setFormGoal(e.target.value)}
                    placeholder="e.g. Maintain systolic BP < 130 mmHg, normalize TSH"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Primary Attending Physician *
                    </label>
                    <input
                      type="text"
                      required
                      value={formPhysician}
                      onChange={(e) => setFormPhysician(e.target.value)}
                      placeholder="e.g. Dr. Ananya Roy"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Hospital / Clinic Facility
                    </label>
                    <input
                      type="text"
                      value={formHospital}
                      onChange={(e) => setFormHospital(e.target.value)}
                      placeholder="e.g. Apollo Hospital"
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                    />
                  </div>
                </div>

                {/* Form Medications Builder */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Prescribed Formulations in this Pathway
                    </label>
                    <button
                      type="button"
                      onClick={addFormMedRow}
                      className="text-xs font-medium text-teal-700 dark:text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Another Formulation</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {formMeds.map((med, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-medium text-slate-500">
                            Medication #{idx + 1}
                          </span>
                          {formMeds.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFormMedRow(idx)}
                              className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={med.name}
                            onChange={(e) => {
                              const updated = [...formMeds];
                              updated[idx].name = e.target.value;
                              setFormMeds(updated);
                            }}
                            placeholder="Medicine Name (e.g. Thyroxine)"
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />

                          <input
                            type="text"
                            value={med.dosage}
                            onChange={(e) => {
                              const updated = [...formMeds];
                              updated[idx].dosage = e.target.value;
                              setFormMeds(updated);
                            }}
                            placeholder="Strength (e.g. 50mcg)"
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          />

                          <select
                            value={med.frequency}
                            onChange={(e) => {
                              const updated = [...formMeds];
                              updated[idx].frequency = e.target.value;
                              setFormMeds(updated);
                            }}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                          >
                            <option>Once daily</option>
                            <option>Twice daily</option>
                            <option>Three times daily</option>
                            <option>Once weekly</option>
                            <option>As needed (PRN)</option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Next Review / Milestone Target
                  </label>
                  <input
                    type="text"
                    value={formMilestone}
                    onChange={(e) => setFormMilestone(e.target.value)}
                    placeholder="e.g. Serum TSH blood test in 4 weeks"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Physician Directives & Dietary Guidance
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. Take 30 minutes before breakfast with full glass of water. Avoid calcium or iron supplements for 4 hours."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-teal-600"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0d5c56] hover:bg-[#094843] text-white text-xs sm:text-sm font-medium transition-all shadow-sm cursor-pointer"
                >
                  Initialize Pathway
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
