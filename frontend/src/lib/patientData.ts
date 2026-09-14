/**
 * MedMatch AI - Centralized Patient Data Layer & Tenant Isolation Guard
 * 
 * Provides complete data isolation between patients.
 * Every patient's records (prescriptions, treatment dossiers, appointments,
 * doctor access shares, and daily doses) are partitioned by their unique user email.
 * 
 * Clinical demo data is allocated EXCLUSIVELY to jk0822123@gmail.com (and patient@medmatch.com).
 * All other patients start with clean, empty records and manage their own data.
 */

import { getUserSession } from "./auth";

// ============================================================================
// Types
// ============================================================================

export interface MedicineDetail {
  medicine_name?: string;
  name?: string;
  dosage?: string;
  dose?: string;
  frequency?: string;
  freq?: string;
  duration?: string;
  dur?: string;
  instructions?: string;
  instr?: string;
  intended_use?: string;
  confidence?: "high" | "medium" | "low" | string;
  conf?: "high" | "medium" | "low" | string;
  needs_review?: boolean;
  candidate_suggestions?: string[];
  verified_source?: "prescription_slip" | "pharmacy_bill" | "medicine_strip" | "manual" | string;
}

export interface StoredPrescription {
  id: string | number;
  doc: string;
  hospital: string;
  diag: string;
  date: string;
  meds: number;
  status: "active" | "completed" | "discontinued" | string;
  source: string;
  conf: string | null;
  overview?: string;
  review_warning?: string;
  clinical_context?: string;
  notes?: string;
  imageDataUrl?: string | null;
  verificationImageDataUrl?: string | null;
  medicines?: MedicineDetail[];
  created_at?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  instructions?: string;
  takenToday: boolean;
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

export interface AppointmentItem {
  id: number | string;
  title: string;
  doc: string;
  date: string;
  time: string;
  location: string;
  status: "upcoming" | "past";
  type: string;
}

export interface DoctorShareItem {
  id: number | string;
  email: string;
  scope: string;
  date: string;
  expires: string;
  type: "full" | "partial";
  status?: "active" | "revoked" | "expired";
}

export interface DailyDoseItem {
  id: string;
  name: string;
  dosage: string;
  timeSlot: "morning" | "afternoon" | "night";
  instructions: string;
  taken: boolean;
  purpose: string;
}

// ============================================================================
// Designated Demo Account Constants
// ============================================================================

export const DEMO_ACCOUNTS = [
  "jk0822123@gmail.com",
  "patient@medmatch.com"
];

/**
 * Checks whether an email belongs to the designated demo account.
 */
export function isDemoPatient(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return DEMO_ACCOUNTS.includes(clean);
}

/**
 * Gets the current authenticated patient's email.
 */
export function getActivePatientEmail(): string {
  if (typeof window === "undefined") return "anonymous";
  const session = getUserSession();
  return (session?.email || "anonymous").trim().toLowerCase();
}

/**
 * Computes the scoped storage key for a specific patient module.
 */
export function getPatientStorageKey(module: string, email?: string | null): string {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  return `medmatch_${user}_${module}`;
}

// ============================================================================
// Clinical Demo Data Sets (Reserved for jk0822123@gmail.com)
// ============================================================================

export const DEMO_PRESCRIPTIONS: StoredPrescription[] = [
  {
    id: "1",
    doc: "Dr. Sharma",
    hospital: "City Hospital",
    diag: "Upper Respiratory Infection",
    date: "2026-09-01",
    meds: 3,
    status: "active",
    source: "manual",
    conf: null,
    clinical_context: "Chest Congestion & Cough",
    notes: "Rest and warm fluids. Return if fever persists beyond 3 days.",
    overview: "Treatment regimen for acute upper respiratory infection focusing on symptom relief and infection control.",
    medicines: [
      { medicine_name: "Amoxicillin", dosage: "500mg", frequency: "Three times daily", duration: "5 days", instructions: "After food", intended_use: "Bacterial infection control", confidence: "high", needs_review: false },
      { medicine_name: "Paracetamol", dosage: "650mg", frequency: "As needed (max 3/day)", duration: "3 days", instructions: "Take for fever or body ache", intended_use: "Fever and headache relief", confidence: "high", needs_review: false },
      { medicine_name: "Cetirizine", dosage: "10mg", frequency: "Once daily at night", duration: "5 days", instructions: "May cause slight drowsiness", intended_use: "Runny nose and allergic rhinitis", confidence: "high", needs_review: false }
    ]
  },
  {
    id: "2",
    doc: "Dr. Patel",
    hospital: "Lifeline Clinic",
    diag: "Type 2 Diabetes",
    date: "2026-08-15",
    meds: 4,
    status: "active",
    source: "ocr_scan",
    conf: "high",
    clinical_context: "Diabetes / High Sugar",
    notes: "Follow up in 3 months with fasting blood sugar and HbA1c results.",
    overview: "Glycemic management regimen combining biguanides, sulfonylureas, and cardiovascular lipid protection.",
    medicines: [
      { medicine_name: "Metformin", dosage: "500mg", frequency: "Twice daily", duration: "90 days", instructions: "Take with meals", intended_use: "Insulin sensitization and blood glucose reduction", confidence: "high", needs_review: false },
      { medicine_name: "Glimepiride", dosage: "2mg", frequency: "Once daily", duration: "90 days", instructions: "Take before breakfast", intended_use: "Stimulates pancreatic insulin secretion", confidence: "high", needs_review: false },
      { medicine_name: "Atorvastatin", dosage: "10mg", frequency: "Once daily", duration: "90 days", instructions: "Take at bedtime", intended_use: "Lowers LDL cholesterol and prevents cardiovascular events", confidence: "medium", needs_review: false },
      { medicine_name: "Pregabalin", dosage: "50mg", frequency: "Once daily", duration: "30 days", instructions: "For neuropathic tingling", intended_use: "Diabetic peripheral neuropathy relief", confidence: "low", needs_review: true, candidate_suggestions: ["Pregabalin 50", "Gabapentin 100"] }
    ]
  },
  {
    id: "3",
    doc: "Dr. Mehta",
    hospital: "Apollo Hospital",
    diag: "Seasonal Allergies",
    date: "2026-07-20",
    meds: 2,
    status: "completed",
    source: "manual",
    conf: null,
    clinical_context: "Skin Allergy / Rash",
    notes: "Avoid pollen exposure during early morning hours.",
    overview: "Short course therapy for seasonal allergic rhinitis.",
    medicines: [
      { medicine_name: "Montelukast", dosage: "10mg", frequency: "Once daily at bedtime", duration: "14 days", instructions: "Take with water", intended_use: "Leukotriene receptor blocker", confidence: "high", needs_review: false },
      { medicine_name: "Fexofenadine", dosage: "120mg", frequency: "Once daily in the morning", duration: "7 days", instructions: "Non-sedating antihistamine", intended_use: "Histamine H1-receptor antagonist", confidence: "high", needs_review: false }
    ]
  },
  {
    id: "4",
    doc: "Dr. Singh",
    hospital: "Max Healthcare",
    diag: "Hypertension",
    date: "2026-06-10",
    meds: 3,
    status: "active",
    source: "manual",
    conf: null,
    clinical_context: "Hypertension / High BP",
    notes: "Monitor morning and evening blood pressure daily for 2 weeks.",
    overview: "Cardiovascular arterial pressure management regimen.",
    medicines: [
      { medicine_name: "Telmisartan", dosage: "40mg", frequency: "Once daily in the morning", duration: "90 days", instructions: "Empty stomach or with light breakfast", intended_use: "Angiotensin II receptor blocker", confidence: "high", needs_review: false },
      { medicine_name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "90 days", instructions: "Take at night", intended_use: "Calcium channel blocker for peripheral vasodilation", confidence: "high", needs_review: false },
      { medicine_name: "Hydrochlorothiazide", dosage: "12.5mg", frequency: "Once daily", duration: "30 days", instructions: "Take early in the morning", intended_use: "Thiazide diuretic for fluid regulation", confidence: "high", needs_review: false }
    ]
  },
  {
    id: "5",
    doc: "Dr. Kumar",
    hospital: "Fortis Hospital",
    diag: "Gastric Reflux",
    date: "2026-05-05",
    meds: 2,
    status: "completed",
    source: "manual",
    conf: null,
    clinical_context: "Acidity & Gastric Reflux",
    notes: "Avoid spicy and oily meals, particularly within 2 hours of sleep.",
    overview: "Acid secretion suppression and prokinetic stomach relief regimen.",
    medicines: [
      { medicine_name: "Pantoprazole", dosage: "40mg", frequency: "Once daily before breakfast", duration: "14 days", instructions: "Take 30 mins before first meal", intended_use: "Proton pump inhibitor", confidence: "high", needs_review: false },
      { medicine_name: "Domperidone", dosage: "10mg", frequency: "Twice daily before meals", duration: "7 days", instructions: "Anti-nausea and motility agent", intended_use: "Gastric motility promoter", confidence: "high", needs_review: false }
    ]
  },
  {
    id: "6",
    doc: "Dr. Rao",
    hospital: "AIIMS",
    diag: "Post-Surgery Recovery",
    date: "2026-04-12",
    meds: 5,
    status: "discontinued",
    source: "ocr_scan",
    conf: "medium",
    clinical_context: "Post-Surgery Care",
    notes: "Post-op wound healing regimen completed successfully.",
    overview: "Antibiotic prophylaxis and analgesic protocol following minor procedure.",
    medicines: [
      { medicine_name: "Cefuroxime Axetil", dosage: "500mg", frequency: "Twice daily", duration: "7 days", instructions: "After meals", intended_use: "Second-generation cephalosporin antibiotic", confidence: "high", needs_review: false },
      { medicine_name: "Tramadol", dosage: "50mg", frequency: "As needed for acute pain", duration: "3 days", instructions: "Take only when required", intended_use: "Opioid analgesic", confidence: "high", needs_review: false },
      { medicine_name: "Chymoral Forte", dosage: "2 tablets", frequency: "Three times daily", duration: "5 days", instructions: "Empty stomach with water", intended_use: "Enzymatic reduction of post-traumatic edema", confidence: "medium", needs_review: false }
    ]
  }
];

export const DEMO_TREATMENT_GROUPS: TreatmentGroup[] = [
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
        name: "Voglibose",
        dosage: "0.2mg",
        frequency: "With lunch",
        timing: "First bite of meal",
        instructions: "Prevents postprandial glucose surges",
        takenToday: false,
      },
    ],
  },
  {
    id: "tg-2",
    name: "Cardiovascular & Lipid Protection",
    category: "cardiovascular",
    conditionGoal: "Target BP < 125/80 mmHg and maintain LDL cholesterol below 70 mg/dL",
    physician: "Dr. Patel",
    hospital: "Lifeline Clinic (Cardiology)",
    startDate: "Jun 2026 to Present",
    status: "active",
    theme: "amber",
    adherenceRate: 92,
    nextMilestone: "Lipid Profile & Echo review in 45 days",
    clinicalNotes: "Blood pressure reading on Sep 10 was 122/78 mmHg. Tolerating Telmisartan without peripheral edema.",
    linkedPrescriptionIds: ["4"],
    medications: [
      {
        id: "m-4",
        name: "Telmisartan",
        dosage: "40mg",
        frequency: "Once daily",
        timing: "Morning at 8:00 AM",
        instructions: "Maintain consistent hydration throughout day",
        takenToday: true,
      },
      {
        id: "m-5",
        name: "Atorvastatin",
        dosage: "10mg",
        frequency: "Once daily",
        timing: "Night before bed",
        instructions: "Take at bedtime for optimal hepatic lipid synthesis inhibition",
        takenToday: false,
      },
      {
        id: "m-6",
        name: "Aspirin (Ecosprin)",
        dosage: "75mg",
        frequency: "Once daily",
        timing: "After lunch",
        instructions: "Enteric coated. Swallow whole with water",
        takenToday: true,
      },
    ],
  },
  {
    id: "tg-3",
    name: "Respiratory Relief & Allergy Control",
    category: "respiratory",
    conditionGoal: "Eliminate nocturnal coughing bouts and suppress seasonal bronchial hyperreactivity",
    physician: "Dr. Mehta",
    hospital: "Apollo Hospital (Pulmonology)",
    startDate: "May 2026 to Present",
    status: "monitoring",
    theme: "terracotta",
    adherenceRate: 88,
    nextMilestone: "Peak Expiratory Flow spirometry in 30 days",
    clinicalNotes: "Allergic rhinitis exacerbation under control. Inhaler technique verified during clinic visit.",
    linkedPrescriptionIds: ["3"],
    medications: [
      {
        id: "m-7",
        name: "Budesonide + Formoterol Inhaler",
        dosage: "200/6 mcg",
        frequency: "Twice daily",
        timing: "Morning & Night (2 puffs)",
        instructions: "Rinse mouth thoroughly with water post inhalation",
        takenToday: true,
      },
      {
        id: "m-8",
        name: "Montelukast",
        dosage: "10mg",
        frequency: "Once daily",
        timing: "Night before bed",
        instructions: "Helps prevent exercise-induced or cold weather wheezing",
        takenToday: false,
      },
    ],
  },
  {
    id: "tg-4",
    name: "Preventative Micronutrient & Bone Health",
    category: "preventative",
    conditionGoal: "Normalize 25-OH Vitamin D (> 40 ng/mL) and support active nerve conduction",
    physician: "Dr. Sharma",
    hospital: "City Hospital (General Medicine)",
    startDate: "Jul 2026 to Present",
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
  }
];

export const DEMO_APPOINTMENTS: AppointmentItem[] = [
  { id: 1, title: "Follow-up: Diabetes", doc: "Dr. Patel", date: "Sept 15, 2026", time: "10:00 AM", location: "Lifeline Clinic", status: "upcoming", type: "var(--dash-terracotta)" },
  { id: 2, title: "Annual Check-up", doc: "Dr. Sharma", date: "Sept 22, 2026", time: "2:30 PM", location: "City Hospital", status: "upcoming", type: "var(--dash-sage)" },
  { id: 3, title: "Eye Examination", doc: "Dr. Gupta", date: "Oct 1, 2026", time: "11:00 AM", location: "Vision Care Center", status: "upcoming", type: "var(--dash-amber)" },
  { id: 4, title: "Blood Work Review", doc: "Dr. Mehta", date: "Aug 28, 2026", time: "9:15 AM", location: "Apollo Lab", status: "past", type: "var(--dash-text-tertiary)" }
];

export const DEMO_SHARES: DoctorShareItem[] = [
  { id: 1, email: "dr.patel@hospital.com", scope: "All Records", date: "Sep 1, 2026", expires: "5 days", type: "full", status: "active" },
  { id: 2, email: "dr.sharma@clinic.com", scope: "Diabetes Management Group", date: "Sep 10, 2026", expires: "12 days", type: "partial", status: "active" }
];

export const DEMO_DAILY_DOSES: DailyDoseItem[] = [
  { id: "1", name: "Lisinopril", dosage: "10mg", timeSlot: "morning", instructions: "Once daily", taken: true, purpose: "Blood pressure regulation" },
  { id: "2", name: "Metformin", dosage: "500mg", timeSlot: "morning", instructions: "Twice daily", taken: true, purpose: "Glycemic balance" },
  { id: "3", name: "Atorvastatin", dosage: "20mg", timeSlot: "night", instructions: "Once daily", taken: false, purpose: "Arterial health & lipid regulation" },
  { id: "4", name: "Tab Thyrox", dosage: "75mcg", timeSlot: "morning", instructions: "Empty stomach", taken: true, purpose: "Thyroid hormone support" }
];

// ============================================================================
// Scoped Prescriptions API
// ============================================================================

export function getPatientPrescriptions(email?: string | null): StoredPrescription[] {
  if (typeof window === "undefined") return [];
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("prescriptions", user);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // If designated demo account and no stored items yet, seed demo dataset
    if (isDemoPatient(user)) {
      localStorage.setItem(key, JSON.stringify(DEMO_PRESCRIPTIONS));
      return [...DEMO_PRESCRIPTIONS];
    }

    // Other patients start with clean empty list
    return [];
  } catch (e) {
    console.warn("Error reading patient prescriptions:", e);
    return isDemoPatient(user) ? [...DEMO_PRESCRIPTIONS] : [];
  }
}

export function savePatientPrescriptions(prescriptions: StoredPrescription[], email?: string | null): void {
  if (typeof window === "undefined") return;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("prescriptions", user);
  try {
    localStorage.setItem(key, JSON.stringify(prescriptions));
  } catch (e) {
    console.error("Failed to save patient prescriptions:", e);
  }
}

export function addPatientPrescription(prescription: StoredPrescription, email?: string | null): void {
  const current = getPatientPrescriptions(email);
  const updated = [prescription, ...current.filter(p => String(p.id) !== String(prescription.id))];
  savePatientPrescriptions(updated, email);
}

export function getPatientPrescriptionById(id: string | number, email?: string | null): StoredPrescription | null {
  const all = getPatientPrescriptions(email);
  const found = all.find(p => String(p.id).toLowerCase() === String(id).toLowerCase());
  return found || null;
}

// ============================================================================
// Scoped Treatment Groups API
// ============================================================================

export function getPatientTreatmentGroups(email?: string | null): TreatmentGroup[] {
  if (typeof window === "undefined") return [];
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("treatments", user);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // Seed demo groups exclusively for jk0822123@gmail.com
    if (isDemoPatient(user)) {
      localStorage.setItem(key, JSON.stringify(DEMO_TREATMENT_GROUPS));
      return [...DEMO_TREATMENT_GROUPS];
    }

    return [];
  } catch (e) {
    console.warn("Error reading treatment groups:", e);
    return isDemoPatient(user) ? [...DEMO_TREATMENT_GROUPS] : [];
  }
}

export function savePatientTreatmentGroups(groups: TreatmentGroup[], email?: string | null): void {
  if (typeof window === "undefined") return;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("treatments", user);
  try {
    localStorage.setItem(key, JSON.stringify(groups));
  } catch (e) {
    console.error("Failed to save treatment groups:", e);
  }
}

export function addPatientTreatmentGroup(group: TreatmentGroup, email?: string | null): void {
  const current = getPatientTreatmentGroups(email);
  const updated = [group, ...current.filter(g => g.id !== group.id)];
  savePatientTreatmentGroups(updated, email);
}

// ============================================================================
// Scoped Appointments API
// ============================================================================

export function getPatientAppointments(email?: string | null): AppointmentItem[] {
  if (typeof window === "undefined") return [];
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("appointments", user);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    if (isDemoPatient(user)) {
      localStorage.setItem(key, JSON.stringify(DEMO_APPOINTMENTS));
      return [...DEMO_APPOINTMENTS];
    }

    return [];
  } catch (e) {
    console.warn("Error reading appointments:", e);
    return isDemoPatient(user) ? [...DEMO_APPOINTMENTS] : [];
  }
}

export function savePatientAppointments(appointments: AppointmentItem[], email?: string | null): void {
  if (typeof window === "undefined") return;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("appointments", user);
  try {
    localStorage.setItem(key, JSON.stringify(appointments));
  } catch (e) {
    console.error("Failed to save appointments:", e);
  }
}

export function addPatientAppointment(apt: Omit<AppointmentItem, "id">, email?: string | null): AppointmentItem {
  const current = getPatientAppointments(email);
  const newApt: AppointmentItem = {
    ...apt,
    id: Date.now()
  };
  const updated = [newApt, ...current];
  savePatientAppointments(updated, email);
  return newApt;
}

// ============================================================================
// Scoped Doctor Sharing API
// ============================================================================

export function getPatientShares(email?: string | null): DoctorShareItem[] {
  if (typeof window === "undefined") return [];
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("shares", user);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    if (isDemoPatient(user)) {
      localStorage.setItem(key, JSON.stringify(DEMO_SHARES));
      return [...DEMO_SHARES];
    }

    return [];
  } catch (e) {
    console.warn("Error reading doctor shares:", e);
    return isDemoPatient(user) ? [...DEMO_SHARES] : [];
  }
}

export function savePatientShares(shares: DoctorShareItem[], email?: string | null): void {
  if (typeof window === "undefined") return;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("shares", user);
  try {
    localStorage.setItem(key, JSON.stringify(shares));
  } catch (e) {
    console.error("Failed to save doctor shares:", e);
  }
}

export function addPatientShare(share: Omit<DoctorShareItem, "id">, email?: string | null): DoctorShareItem {
  const current = getPatientShares(email);
  const newShare: DoctorShareItem = {
    ...share,
    id: Date.now(),
    status: "active"
  };
  const updated = [newShare, ...current];
  savePatientShares(updated, email);
  return newShare;
}

export function revokePatientShare(id: number | string, email?: string | null): void {
  const current = getPatientShares(email);
  const updated = current.filter(s => String(s.id) !== String(id));
  savePatientShares(updated, email);
}

// ============================================================================
// Scoped Daily Doses API
// ============================================================================

export function getPatientDailyDoses(email?: string | null): DailyDoseItem[] {
  if (typeof window === "undefined") return [];
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("daily_doses", user);

  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    if (isDemoPatient(user)) {
      localStorage.setItem(key, JSON.stringify(DEMO_DAILY_DOSES));
      return [...DEMO_DAILY_DOSES];
    }

    // For other patients: dynamically construct daily doses from active treatment groups if any
    const groups = getPatientTreatmentGroups(user);
    const activeDoses: DailyDoseItem[] = [];
    for (const g of groups) {
      if (g.status === "active") {
        for (const m of g.medications) {
          activeDoses.push({
            id: m.id,
            name: m.name,
            dosage: m.dosage,
            timeSlot: m.timing.toLowerCase().includes("night") || m.timing.toLowerCase().includes("bed") ? "night" : "morning",
            instructions: m.instructions || m.frequency,
            taken: m.takenToday,
            purpose: g.name
          });
        }
      }
    }

    if (activeDoses.length > 0) {
      localStorage.setItem(key, JSON.stringify(activeDoses));
      return activeDoses;
    }

    return [];
  } catch (e) {
    console.warn("Error reading daily doses:", e);
    return isDemoPatient(user) ? [...DEMO_DAILY_DOSES] : [];
  }
}

export function savePatientDailyDoses(doses: DailyDoseItem[], email?: string | null): void {
  if (typeof window === "undefined") return;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("daily_doses", user);
  try {
    localStorage.setItem(key, JSON.stringify(doses));
  } catch (e) {
    console.error("Failed to save daily doses:", e);
  }
}

export function togglePatientDailyDose(id: string, email?: string | null): DailyDoseItem[] {
  const current = getPatientDailyDoses(email);
  const updated = current.map(d => d.id === id ? { ...d, taken: !d.taken } : d);
  savePatientDailyDoses(updated, email);
  return updated;
}
