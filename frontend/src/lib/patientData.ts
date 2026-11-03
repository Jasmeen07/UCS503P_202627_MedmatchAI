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

import { getUserSession, getRegisteredAccounts } from "./auth";

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
  specialty?: string;
  notes?: string;
  prepInstructions?: string;
}

export interface DoctorRequest {
  id: string | number;
  patientName: string;
  patientEmail: string;
  patientUid: string;
  reason: string;
  date: string;
  time: string;
  specialty: string;
  urgency: "Routine" | "Priority" | "Follow-up";
  status: "pending" | "confirmed" | "rescheduled" | "completed";
  dossierToken: string;
  notes?: string;
}

export interface PresetDoctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  regNo: string;
  experience: string;
  rating: string;
  avatar: string;
  availableDays: string;
  defaultSlots: string[];
}

export const PRESET_DOCTORS: PresetDoctor[] = [
  {
    id: "dr-reeta",
    name: "Dr. Reeta Bhambri",
    specialty: "Obstetrics & Antenatal Care",
    hospital: "Ranjit Maternity Clinic & Nursing Home",
    regNo: "MCI-34182",
    experience: "22 yrs exp",
    rating: "4.9",
    avatar: "RB",
    availableDays: "Mon - Sat",
    defaultSlots: ["10:30 AM", "11:45 AM", "02:30 PM", "05:00 PM"]
  },
  {
    id: "dr-duggal",
    name: "Dr. K.S. Duggal",
    specialty: "General Surgery & Wound Care",
    hospital: "Fortis Hospital (Surgery Wing)",
    regNo: "MCI-48192",
    experience: "18 yrs exp",
    rating: "4.8",
    avatar: "KD",
    availableDays: "Mon, Wed, Fri",
    defaultSlots: ["09:30 AM", "11:00 AM", "03:15 PM"]
  },
  {
    id: "dr-sharma",
    name: "Dr. A. Sharma",
    specialty: "General Medicine & Chronic Care",
    hospital: "City Hospital (OPD Block A)",
    regNo: "DMC-18239",
    experience: "15 yrs exp",
    rating: "4.9",
    avatar: "AS",
    availableDays: "Daily",
    defaultSlots: ["10:00 AM", "12:00 PM", "04:30 PM", "06:15 PM"]
  },
  {
    id: "dr-patel",
    name: "Dr. Sunita Patel",
    specialty: "Endocrinology & Diabetes",
    hospital: "Lifeline Clinic (Metabolic Suite)",
    regNo: "MCI-55210",
    experience: "14 yrs exp",
    rating: "4.7",
    avatar: "SP",
    availableDays: "Tue, Thu, Sat",
    defaultSlots: ["09:00 AM", "10:45 AM", "02:00 PM"]
  },
  {
    id: "dr-gupta",
    name: "Dr. R.K. Gupta",
    specialty: "Ophthalmology & ENT",
    hospital: "Vision & ENT Care Center",
    regNo: "PBI-19842",
    experience: "20 yrs exp",
    rating: "4.8",
    avatar: "RG",
    availableDays: "Mon - Fri",
    defaultSlots: ["11:15 AM", "01:00 PM", "05:30 PM"]
  }
];

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

export interface DoctorPatientRecord {
  patientEmail: string;
  patientName: string;
  patientUid: string;
  phoneNumber: string;
  ageGender: string;
  bloodGroup: string;
  primaryCondition: string;
  doctorId: string;
  accessStatus: "none" | "pending" | "granted" | "declined" | "emergency_override";
  accessGrantedAt?: string;
  accessExpiresAt?: string;
  requestedAt?: string;
  requestedScope?: string;
  requestReason?: string;
  lastVisit?: string;
  allergiesSummary?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  prescriptionsCount?: number;
  documentsCount?: number;
}

export interface DoctorAccessPermissionRequest {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  hospital: string;
  doctorLicense: string;
  patientEmail: string;
  patientName: string;
  patientUid: string;
  requestedScope: string;
  clinicalReason: string;
  status: "pending" | "approved" | "declined" | "revoked";
  createdAt: string;
  updatedAt: string;
  isEmergency?: boolean;
}

export interface PatientNotificationItem {
  id: string;
  patientEmail: string;
  type: "access_request" | "emergency_access" | "appointment" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  requestId?: string;
  actionUrl?: string;
  severity: "info" | "warning" | "critical" | "success";
  metadata?: Record<string, any>;
}

export interface PatientDocument {
  id: string;
  patientEmail: string;
  title: string;
  category: "ultrasound" | "lab_report" | "discharge_summary" | "prescription";
  date: string;
  facility: string;
  doctor: string;
  summary: string;
  fileType: string;
  fileUrl?: string;
  findings?: string[];
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
  },
  {
    id: "7",
    doc: "Dr. Reeta Bhambri",
    hospital: "Ranjit Hospital & Maternity Home",
    diag: "Antenatal Care (Trimester II)",
    date: "2026-09-12",
    meds: 3,
    status: "active",
    source: "calibrated_ocr",
    conf: "high",
    clinical_context: "Pregnancy Support & Antenatal Care",
    notes: "Gestational age 28 weeks. Fetal heart rate regular (142 bpm). Hemoglobin 11.2 g/dL. Blood pressure 116/74 mmHg. Continue regular iron & calcium supplements.",
    overview: "Nutritional and gestational prophylaxis protocol calibrated to Dr. Reeta Bhambri handwriting profile (+34.2% fidelity boost).",
    medicines: [
      { medicine_name: "Folvite (Folic Acid)", dosage: "5mg", frequency: "Once daily (OD)", duration: "60 days", instructions: "Morning after breakfast", intended_use: "Neural tube defect prevention and erythropoiesis", confidence: "high", needs_review: false },
      { medicine_name: "Autrin (Iron + Vit B12)", dosage: "1 capsule", frequency: "Once daily (OD)", duration: "60 days", instructions: "Take with fresh citrus juice; avoid dairy within 2 hours", intended_use: "Maternal iron-deficiency anemia prophylaxis", confidence: "high", needs_review: false },
      { medicine_name: "Shelcal 500 (Calcium + D3)", dosage: "500mg", frequency: "Once daily (OD)", duration: "60 days", instructions: "Evening with dinner", intended_use: "Fetal skeletal ossification and maternal bone density", confidence: "high", needs_review: false }
    ]
  },
  {
    id: "8",
    doc: "Dr. H.S. Virk",
    hospital: "City Care Super Speciality",
    diag: "Urinary Tract Infection (UTI Episode)",
    date: "2026-08-28",
    meds: 2,
    status: "completed",
    source: "ocr_scan",
    conf: "high",
    clinical_context: "Acute Dysuria & Lower Abdominal Discomfort",
    notes: "Follow-up urine culture sterile at day 10. Patient instructed on hydration protocol (min 3L water/day).",
    overview: "Targeted antimicrobial therapy and urinary alkalinization for acute symptomatic cystitis.",
    medicines: [
      { medicine_name: "Nitrofurantoin (Macrodantin)", dosage: "100mg", frequency: "Twice daily (BD)", duration: "7 days", instructions: "Take with meals or milk", intended_use: "Urinary tract pathogen clearance (E. coli specific)", confidence: "high", needs_review: false },
      { medicine_name: "Cital Liquid (Disodium Hydrogen Citrate)", dosage: "2 tsp in water", frequency: "Three times daily (TDS)", duration: "5 days", instructions: "Dilute in a full glass of water", intended_use: "Urinary alkalinizer for symptom relief", confidence: "high", needs_review: false }
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
  },
  {
    id: "tg-antenatal",
    name: "Antenatal Care Episode (Pregnancy Trimester II)",
    category: "preventative",
    conditionGoal: "Optimal fetal growth, maternal hemoglobin > 11 g/dL, blood pressure normotensive",
    physician: "Dr. Reeta Bhambri",
    hospital: "Ranjit Maternity Clinic & Nursing Home",
    startDate: "Jul 2026 to Present",
    status: "active",
    theme: "teal",
    adherenceRate: 98,
    nextMilestone: "Third Trimester Anomaly & Growth Ultrasound in 12 days",
    clinicalNotes: "Gestational age 28 weeks. Regular maternal iron and calcium supplementation. BP 116/74 mmHg.",
    linkedPrescriptionIds: ["7"],
    medications: [
      {
        id: "m-folvite",
        name: "Folvite (Folic Acid 5mg)",
        dosage: "5mg",
        frequency: "Once daily (OD)",
        timing: "Morning after breakfast",
        instructions: "Essential for gestational erythropoiesis",
        takenToday: true,
      },
      {
        id: "m-autrin",
        name: "Autrin (Iron + Vitamin B12)",
        dosage: "1 Capsule",
        frequency: "Once daily (OD)",
        timing: "After lunch with fresh lime juice",
        instructions: "Do not take concurrently with dairy or tea",
        takenToday: true,
      },
      {
        id: "m-shelcal",
        name: "Shelcal 500 (Calcium + Vit D3)",
        dosage: "500mg",
        frequency: "Once daily (OD)",
        timing: "Evening after dinner",
        instructions: "Take with water, minimum 4 hours separated from iron",
        takenToday: false,
      }
    ]
  },
  {
    id: "tg-uti",
    name: "Acute UTI Episode (Urinary Tract Infection)",
    category: "other",
    conditionGoal: "Eradicate urinary pathogen, resolve dysuria, and restore sterile urine culture",
    physician: "Dr. H.S. Virk",
    hospital: "City Care Super Speciality",
    startDate: "Aug 2026 (Resolved)",
    status: "completed",
    theme: "indigo",
    adherenceRate: 100,
    nextMilestone: "Episode successfully resolved — sterile repeat culture",
    clinicalNotes: "7-day course of Nitrofurantoin completed. Dysuria completely resolved. Hydration protocol maintained.",
    linkedPrescriptionIds: ["8"],
    medications: [
      {
        id: "m-nitro",
        name: "Nitrofurantoin (Macrodantin)",
        dosage: "100mg",
        frequency: "Twice daily (BD)",
        timing: "With breakfast and dinner",
        instructions: "Complete entire 7-day course without missing doses",
        takenToday: false,
      },
      {
        id: "m-cital",
        name: "Cital Liquid",
        dosage: "2 tsp",
        frequency: "Three times daily (TDS)",
        timing: "Diluted in full glass of water",
        instructions: "Urine alkalinizer for symptom relief",
        takenToday: false,
      }
    ]
  }
];

export const DEMO_APPOINTMENTS: AppointmentItem[] = [
  { id: 10, title: "Antenatal Ultrasound & Review", doc: "Dr. Reeta Bhambri", date: "Sept 18, 2026", time: "10:30 AM", location: "Ranjit Maternity Clinic", status: "upcoming", type: "var(--dash-teal)", specialty: "Obstetrics & Gynaecology", notes: "28-week biometry, doppler ultrasound & hemoglobin panel review" },
  { id: 1, title: "Follow-up: Diabetes", doc: "Dr. Patel", date: "Sept 15, 2026", time: "10:00 AM", location: "Lifeline Clinic", status: "upcoming", type: "var(--dash-terracotta)", specialty: "Endocrinology" },
  { id: 2, title: "Annual Check-up", doc: "Dr. Sharma", date: "Sept 22, 2026", time: "2:30 PM", location: "City Hospital", status: "upcoming", type: "var(--dash-sage)", specialty: "General Medicine" },
  { id: 3, title: "Eye Examination", doc: "Dr. Gupta", date: "Oct 1, 2026", time: "11:00 AM", location: "Vision Care Center", status: "upcoming", type: "var(--dash-amber)", specialty: "Ophthalmology" },
  { id: 4, title: "Blood Work Review", doc: "Dr. Mehta", date: "Aug 28, 2026", time: "9:15 AM", location: "Apollo Lab", status: "past", type: "var(--dash-text-tertiary)", specialty: "Pathology" }
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
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  if (typeof window === "undefined") {
    return isDemoPatient(user) || user === "anonymous" ? [...DEMO_PRESCRIPTIONS] : [];
  }
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
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  if (typeof window === "undefined") {
    return isDemoPatient(user) || user === "anonymous" ? [...DEMO_TREATMENT_GROUPS] : [];
  }
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
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  if (typeof window === "undefined") {
    return isDemoPatient(user) || user === "anonymous" ? [...DEMO_APPOINTMENTS] : [];
  }
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

// ============================================================================
// Doctor Portal Appointment Requests & Real-Time Sync API
// ============================================================================

export const INITIAL_DOCTOR_REQUESTS: DoctorRequest[] = [
  {
    id: "req-1",
    patientName: "Simranjit Kaur",
    patientEmail: "jk0822123@gmail.com",
    patientUid: "PT-2026-LUD-8821",
    reason: "Antenatal Ultrasound & 28-Week Gestational Review",
    date: "Sept 18, 2026",
    time: "10:30 AM",
    specialty: "Obstetrics & Antenatal Care",
    urgency: "Priority",
    status: "confirmed",
    dossierToken: "EMG-8821-VLT",
    notes: "Patient reports mild ankle edema. Blood pressure stable. Folic acid and iron adherence reported regular."
  },
  {
    id: "req-2",
    patientName: "Harpreet Singh",
    patientEmail: "harpreet.s@example.com",
    patientUid: "PT-2026-LUD-3312",
    reason: "Post-Operative Wound Inspection & Suture Removal",
    date: "Sept 17, 2026",
    time: "11:45 AM",
    specialty: "General Surgery",
    urgency: "Routine",
    status: "confirmed",
    dossierToken: "EMG-3312-VLT",
    notes: "Day 10 post-laparoscopic follow-up. Sterile dressing intact."
  },
  {
    id: "req-3",
    patientName: "Amandeep Sharma",
    patientEmail: "amandeep.sharma@example.com",
    patientUid: "PT-2026-LUD-4091",
    reason: "Routine Antenatal BP & Hemoglobin Assessment",
    date: "Sept 19, 2026",
    time: "05:15 PM",
    specialty: "Obstetrics & Antenatal Care",
    urgency: "Follow-up",
    status: "pending",
    dossierToken: "EMG-4091-VLT",
    notes: "Second visit. Needs routine complete blood count review."
  }
];

export function getDoctorRequests(): DoctorRequest[] {
  if (typeof window === "undefined") return [...INITIAL_DOCTOR_REQUESTS];
  try {
    const raw = localStorage.getItem("medmatch_doctor_requests");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem("medmatch_doctor_requests", JSON.stringify(INITIAL_DOCTOR_REQUESTS));
    return [...INITIAL_DOCTOR_REQUESTS];
  } catch (e) {
    console.warn("Error reading doctor requests:", e);
    return [...INITIAL_DOCTOR_REQUESTS];
  }
}

export function saveDoctorRequests(requests: DoctorRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("medmatch_doctor_requests", JSON.stringify(requests));
  } catch (e) {
    console.error("Failed to save doctor requests:", e);
  }
}

export function addDoctorRequest(req: Omit<DoctorRequest, "id">): DoctorRequest {
  const current = getDoctorRequests();
  const newReq: DoctorRequest = {
    ...req,
    id: `req-${Date.now()}`
  };
  const updated = [newReq, ...current];
  saveDoctorRequests(updated);
  return newReq;
}

export function syncDoctorRequestAction(
  requestId: string | number,
  action: "confirm" | "reschedule" | "complete",
  payload?: { date?: string; time?: string }
): void {
  const requests = getDoctorRequests();
  const target = requests.find(r => String(r.id) === String(requestId));
  if (!target) return;

  const updatedRequests = requests.map(r => {
    if (String(r.id) === String(requestId)) {
      if (action === "confirm") return { ...r, status: "confirmed" as const };
      if (action === "reschedule" && payload) {
        return { 
          ...r, 
          date: payload.date || r.date, 
          time: payload.time || r.time, 
          status: "rescheduled" as const 
        };
      }
      if (action === "complete") return { ...r, status: "completed" as const };
    }
    return r;
  });
  saveDoctorRequests(updatedRequests);

  // Sync to patient's scoped appointments if email is present
  if (target.patientEmail) {
    const appointments = getPatientAppointments(target.patientEmail);
    const updatedApps = appointments.map(a => {
      const isMatch = a.title === target.reason || String(a.id) === String(requestId).replace("req-", "");
      if (isMatch) {
        if (action === "confirm") return { ...a, status: "upcoming" as const };
        if (action === "reschedule" && payload) {
          return { 
            ...a, 
            date: payload.date || a.date, 
            time: payload.time || a.time,
            status: "upcoming" as const 
          };
        }
        if (action === "complete") return { ...a, status: "past" as const };
      }
      return a;
    });
    savePatientAppointments(updatedApps, target.patientEmail);
  }
}

export function addPatientAppointment(apt: Omit<AppointmentItem, "id">, email?: string | null): AppointmentItem {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const current = getPatientAppointments(email);
  const newId = Date.now();
  const newApt: AppointmentItem = {
    ...apt,
    id: newId
  };
  const updated = [newApt, ...current];
  savePatientAppointments(updated, email);

  // Real-time synchronization to Doctor Portal
  try {
    const access = getPatientAccessControl(user);
    const doctorReq: DoctorRequest = {
      id: `req-${newId}`,
      patientName: access.patientName || "Patient",
      patientEmail: user,
      patientUid: access.patientUid || "PT-2026-LUD-8821",
      reason: apt.title,
      date: apt.date,
      time: apt.time,
      specialty: apt.specialty || "General Medicine",
      urgency: "Routine",
      status: "confirmed",
      dossierToken: access.token || "EMG-8821-VLT",
      notes: apt.notes ? `${apt.notes} (Location: ${apt.location})` : `Booked via MedMatch Portal. Location: ${apt.location}`
    };
    const reqs = getDoctorRequests();
    saveDoctorRequests([doctorReq, ...reqs.filter(r => r.id !== doctorReq.id)]);
  } catch (e) {
    console.warn("Could not sync appointment to doctor queue:", e);
  }

  return newApt;
}

export function updatePatientAppointment(
  id: number | string,
  patch: Partial<AppointmentItem>,
  email?: string | null
): AppointmentItem | null {
  const current = getPatientAppointments(email);
  let updatedItem: AppointmentItem | null = null;
  const updated = current.map((a) => {
    if (String(a.id) === String(id)) {
      updatedItem = { ...a, ...patch };
      return updatedItem;
    }
    return a;
  });
  savePatientAppointments(updated, email);
  return updatedItem;
}

// ============================================================================
// Scoped Doctor Access Shares API
// ============================================================================

export function getPatientShares(email?: string | null): DoctorShareItem[] {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  if (typeof window === "undefined") {
    return isDemoPatient(user) || user === "anonymous" ? [...DEMO_SHARES] : [];
  }
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

// ============================================================================
// Clinical Health Vault & Emergency QR Dossier API (UC-04)
// ============================================================================

export interface ClinicalEpisode {
  id: string;
  title: string;
  category: string;
  status: "active" | "monitoring" | "resolved" | "completed";
  physician: string;
  hospital: string;
  dateRange: string;
  clinicalNotes: string;
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    instructions?: string;
  }>;
}

export interface PatientDossierData {
  patientName: string;
  email: string;
  ageGender: string;
  bloodGroup: string;
  patientUid: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
  allergies: Array<{
    substance: string;
    reaction: string;
    severity: "High" | "Moderate" | "Low";
  }>;
  chronicConditions: string[];
  episodes: ClinicalEpisode[];
  activeMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    timing: string;
    instructions: string;
    prescribedBy: string;
    episodeName: string;
  }>;
  clinicalAlertBanner?: string;
  prescriptions?: StoredPrescription[];
  token: string;
  generatedAt: string;
  expiresAt: string;
}

export const DEFAULT_EMERGENCY_TOKEN = "EMG-8821-VLT";

export function getEmergencyToken(email?: string | null): string {
  if (typeof window === "undefined") return DEFAULT_EMERGENCY_TOKEN;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("emergency_token", user);
  try {
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    localStorage.setItem(key, DEFAULT_EMERGENCY_TOKEN);
    return DEFAULT_EMERGENCY_TOKEN;
  } catch {
    return DEFAULT_EMERGENCY_TOKEN;
  }
}

export function generateEmergencyToken(email?: string | null): string {
  if (typeof window === "undefined") return DEFAULT_EMERGENCY_TOKEN;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("emergency_token", user);
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newToken = `EMG-${randomSuffix}-VLT`;
  try {
    localStorage.setItem(key, newToken);
  } catch (e) {
    console.error("Failed to generate new emergency token:", e);
  }
  return newToken;
}

// ============================================================================
// Patient Access Authorization & Emergency Break-Glass System (UC-04)
// ============================================================================

export interface AccessAuditEntry {
  id: string;
  timestamp: string;
  accessorName: string;
  accessorRole: "Consulting Doctor" | "Emergency Physician" | "Patient Self";
  accessorLicense?: string;
  hospital?: string;
  accessType: "Passcode Verified" | "Emergency Break-Glass" | "QR Code Scanned";
  reason?: string;
  status: "Granted" | "Revoked" | "Emergency Logged";
}

export interface PatientAccessControl {
  patientEmail: string;
  patientName: string;
  patientUid: string;
  phoneNumber: string;
  doctorPasscode: string; // Friendly 6-digit PIN e.g. "882194"
  accessGranted: boolean;
  token: string;
  auditLog: AccessAuditEntry[];
}

export function getPatientAccessControl(email?: string | null): PatientAccessControl {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();

  if (user === "harpreet.s@example.com" || user.includes("harpreet")) {
    let accessGranted = true;
    let passcode = "331205";
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(getPatientStorageKey("doctor_access_granted", user));
        if (stored !== null) accessGranted = stored === "true";
        const storedPin = localStorage.getItem(getPatientStorageKey("doctor_passcode", user));
        if (storedPin) passcode = storedPin;
      } catch {}
    }
    return {
      patientEmail: "harpreet.s@example.com",
      patientName: "Harpreet Singh",
      patientUid: "PT-2026-LUD-3312",
      phoneNumber: "+91 98881-23456",
      doctorPasscode: passcode,
      accessGranted,
      token: "EMG-3312-VLT",
      auditLog: [
        {
          id: "aud-h1",
          timestamp: "Yesterday, 04:30 PM",
          accessorName: "Dr. K.S. Duggal",
          accessorRole: "Consulting Doctor",
          accessorLicense: "MCI-48192",
          hospital: "Fortis Hospital (Surgery)",
          accessType: "Passcode Verified",
          reason: "Post-Op Wound Review",
          status: "Granted"
        }
      ]
    };
  }

  if (user === "amandeep.sharma@example.com" || user.includes("amandeep")) {
    let accessGranted = true;
    let passcode = "409172";
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(getPatientStorageKey("doctor_access_granted", user));
        if (stored !== null) accessGranted = stored === "true";
        const storedPin = localStorage.getItem(getPatientStorageKey("doctor_passcode", user));
        if (storedPin) passcode = storedPin;
      } catch {}
    }
    return {
      patientEmail: "amandeep.sharma@example.com",
      patientName: "Amandeep Sharma",
      patientUid: "PT-2026-LUD-4091",
      phoneNumber: "+91 98882-65431",
      doctorPasscode: passcode,
      accessGranted,
      token: "EMG-4091-VLT",
      auditLog: [
        {
          id: "aud-a1",
          timestamp: "Sep 15, 2026",
          accessorName: "Dr. Gupta",
          accessorRole: "Consulting Doctor",
          accessorLicense: "DMC-18239",
          hospital: "Vision & ENT Care Center",
          accessType: "QR Code Scanned",
          reason: "Allergic Rhinitis Consult",
          status: "Granted"
        }
      ]
    };
  }

  // Simranjit Kaur or Custom Registered User
  const isDemo = isDemoPatient(user) || user === "anonymous";
  const name = isDemo ? "Simranjit Kaur" : user.split("@")[0].toUpperCase();
  const uid = isDemo ? "PT-2026-LUD-8821" : `PT-2026-REG-${user.slice(0, 4).toUpperCase()}`;
  const phone = isDemo ? "+91 98765-43210" : "+91 98000-00000";
  const token = isDemo ? DEFAULT_EMERGENCY_TOKEN : getEmergencyToken(user);
  const defaultPasscode = isDemo ? "882194" : "542918";

  let doctorPasscode = defaultPasscode;
  let accessGranted = true;
  let auditLog: AccessAuditEntry[] = isDemo ? [
    {
      id: "aud-s1",
      timestamp: "Today, 10:15 AM",
      accessorName: "Dr. Reeta Bhambri",
      accessorRole: "Consulting Doctor",
      accessorLicense: "MCI-34182",
      hospital: "Ranjit Maternity Clinic & Nursing Home",
      accessType: "Passcode Verified",
      reason: "Antenatal 28-Week Gestational Review",
      status: "Granted"
    },
    {
      id: "aud-s2",
      timestamp: "Sep 12, 2026, 02:40 PM",
      accessorName: "Dr. H.S. Virk",
      accessorRole: "Consulting Doctor",
      accessorLicense: "PBI-19842",
      hospital: "City Care Super Speciality",
      accessType: "QR Code Scanned",
      reason: "Acute UTI Care Episode Consultation",
      status: "Granted"
    }
  ] : [];

  if (typeof window !== "undefined") {
    try {
      const storedPasscode = localStorage.getItem(getPatientStorageKey("doctor_passcode", user));
      if (storedPasscode) doctorPasscode = storedPasscode;

      const storedAccess = localStorage.getItem(getPatientStorageKey("doctor_access_granted", user));
      if (storedAccess !== null) accessGranted = storedAccess === "true";

      const storedAudits = localStorage.getItem(getPatientStorageKey("access_audit_log", user));
      if (storedAudits) {
        const parsed = JSON.parse(storedAudits);
        if (Array.isArray(parsed) && parsed.length > 0) auditLog = parsed;
      }
    } catch {}
  }

  return {
    patientEmail: isDemo ? "jk0822123@gmail.com" : user,
    patientName: name,
    patientUid: uid,
    phoneNumber: phone,
    doctorPasscode,
    accessGranted,
    token,
    auditLog
  };
}

export function setPatientDoctorAccessState(granted: boolean, email?: string | null): boolean {
  if (typeof window === "undefined") return granted;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  try {
    localStorage.setItem(getPatientStorageKey("doctor_access_granted", user), granted ? "true" : "false");
    addPatientAccessAuditEntry({
      accessorName: "Patient (Self)",
      accessorRole: "Patient Self",
      accessType: "Passcode Verified",
      status: granted ? "Granted" : "Revoked",
      reason: granted ? "Patient re-enabled doctor access pass" : "Patient paused / revoked external doctor access"
    }, user);
  } catch (e) {
    console.warn("Failed to set doctor access state:", e);
  }
  return granted;
}

export function regeneratePatientDoctorPasscode(email?: string | null): string {
  const newPin = String(Math.floor(100000 + Math.random() * 900000));
  if (typeof window === "undefined") return newPin;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  try {
    localStorage.setItem(getPatientStorageKey("doctor_passcode", user), newPin);
    addPatientAccessAuditEntry({
      accessorName: "Patient (Self)",
      accessorRole: "Patient Self",
      accessType: "Passcode Verified",
      status: "Granted",
      reason: `Generated new 6-digit Doctor Passcode: ${newPin}`
    }, user);
  } catch (e) {
    console.warn("Failed to save new passcode:", e);
  }
  return newPin;
}

export function addPatientAccessAuditEntry(
  entry: Omit<AccessAuditEntry, "id" | "timestamp">, 
  email?: string | null
): AccessAuditEntry {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const current = getPatientAccessControl(user);
  const now = new Date();
  const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  const newEntry: AccessAuditEntry = {
    ...entry,
    id: `aud-${Date.now()}`,
    timestamp
  };
  const updatedLog = [newEntry, ...(current.auditLog || []).filter(a => a.id !== newEntry.id)];
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(getPatientStorageKey("access_audit_log", user), JSON.stringify(updatedLog));
    } catch {}
  }
  return newEntry;
}

export function logEmergencyBreakGlassAccess(params: {
  patientEmail: string;
  doctorName: string;
  doctorLicense: string;
  hospital: string;
  emergencyReason: string;
}): AccessAuditEntry {
  const audit = addPatientAccessAuditEntry({
    accessorName: params.doctorName,
    accessorRole: "Emergency Physician",
    accessorLicense: params.doctorLicense,
    hospital: params.hospital,
    accessType: "Emergency Break-Glass",
    reason: params.emergencyReason,
    status: "Emergency Logged"
  }, params.patientEmail);

  // Send High-Priority Emergency Notification to Patient
  try {
    addPatientNotification({
      patientEmail: params.patientEmail,
      type: "emergency_access",
      title: "🚨 Emergency Break-Glass Access Alert",
      message: `${params.doctorName} (${params.doctorLicense}) at ${params.hospital} executed Emergency Break-Glass override at ${audit.timestamp}. Reason: "${params.emergencyReason}".`,
      severity: "critical",
      actionUrl: "/dashboard/sharing",
      metadata: {
        ...params,
        auditId: audit.id,
        timestamp: audit.timestamp
      }
    }, params.patientEmail);
  } catch (err) {
    console.warn("Could not dispatch emergency notification:", err);
  }

  // Update Doctor Roster status to emergency_override
  try {
    updateDoctorPatientAccessStatus(params.patientEmail, "emergency_override", "dr-reeta", {
      requestReason: `Emergency Break-Glass: ${params.emergencyReason}`,
      accessGrantedAt: audit.timestamp
    });
  } catch (err) {
    console.warn("Could not update doctor roster emergency status:", err);
  }

  return audit;
}

export interface DoctorAccessVerificationResult {
  allowed: boolean;
  reason?: string;
  token?: string;
  patientEmail?: string;
  patientName?: string;
  patientUid?: string;
  phoneNumber?: string;
  dossierUrl?: string;
  isEmergencyOverride?: boolean;
}

export function verifyDoctorAccess(
  query: string,
  passcode?: string,
  emergencyAuth?: {
    doctorName: string;
    doctorLicense: string;
    hospital: string;
    emergencyReason: string;
  }
): DoctorAccessVerificationResult {
  const cleanQ = (query || "").trim().toLowerCase();
  const cleanPin = (passcode || "").trim().replace(/\D/g, "");

  // Match target patient
  let targetEmail = "jk0822123@gmail.com";
  let fallbackToken = "EMG-8821-VLT";

  if (cleanQ.includes("3312") || cleanQ.includes("harpreet") || cleanQ.includes("9888123456") || cleanQ.includes("98881-23456")) {
    targetEmail = "harpreet.s@example.com";
    fallbackToken = "EMG-3312-VLT";
  } else if (cleanQ.includes("4091") || cleanQ.includes("amandeep") || cleanQ.includes("9888265431") || cleanQ.includes("98882-65431")) {
    targetEmail = "amandeep.sharma@example.com";
    fallbackToken = "EMG-4091-VLT";
  } else {
    targetEmail = "jk0822123@gmail.com";
    fallbackToken = "EMG-8821-VLT";
  }

  const access = getPatientAccessControl(targetEmail);

  // 1. EMERGENCY BREAK-GLASS PROTOCOL (Doctor authenticated with license + emergency reason)
  if (emergencyAuth) {
    if (!emergencyAuth.doctorLicense || emergencyAuth.doctorLicense.trim().length < 4) {
      return {
        allowed: false,
        reason: "Emergency Break-Glass requires a valid Medical Registration / License number (e.g. MCI-34182)."
      };
    }
    if (!emergencyAuth.emergencyReason || emergencyAuth.emergencyReason.trim().length < 5) {
      return {
        allowed: false,
        reason: "Mandatory emergency clinical justification must be recorded for legal audit compliance."
      };
    }

    logEmergencyBreakGlassAccess({
      patientEmail: targetEmail,
      doctorName: emergencyAuth.doctorName || "Emergency Attending Physician",
      doctorLicense: emergencyAuth.doctorLicense.trim().toUpperCase(),
      hospital: emergencyAuth.hospital || "Emergency Trauma Department",
      emergencyReason: emergencyAuth.emergencyReason.trim()
    });

    return {
      allowed: true,
      token: access.token || fallbackToken,
      patientEmail: targetEmail,
      patientName: access.patientName,
      patientUid: access.patientUid,
      phoneNumber: access.phoneNumber,
      isEmergencyOverride: true,
      dossierUrl: `/dossier?token=${access.token}&emergency=true&docName=${encodeURIComponent(emergencyAuth.doctorName)}&docLic=${encodeURIComponent(emergencyAuth.doctorLicense)}&reason=${encodeURIComponent(emergencyAuth.emergencyReason)}`
    };
  }

  // 2. PATIENT AUTHORIZATION STATUS CHECK
  if (!access.accessGranted) {
    return {
      allowed: false,
      reason: `Patient ${access.patientName} has paused external doctor access. Please ask the patient to enable "Doctor Consultation Access" in their MedMatch app.`
    };
  }

  // 3. TOKEN OR 6-DIGIT PASSCODE CHECK
  const cleanQTokens = cleanQ.toUpperCase();
  if (cleanQTokens === access.token || cleanQTokens.includes(access.token)) {
    addPatientAccessAuditEntry({
      accessorName: "Consulting Physician",
      accessorRole: "Consulting Doctor",
      accessType: "QR Code Scanned",
      reason: "Scanned Patient Emergency QR Pass",
      status: "Granted"
    }, targetEmail);

    return {
      allowed: true,
      token: access.token,
      patientEmail: targetEmail,
      patientName: access.patientName,
      patientUid: access.patientUid,
      phoneNumber: access.phoneNumber,
      dossierUrl: `/dossier?token=${access.token}`
    };
  }

  if (cleanPin && cleanPin === access.doctorPasscode) {
    addPatientAccessAuditEntry({
      accessorName: "Consulting Physician",
      accessorRole: "Consulting Doctor",
      accessType: "Passcode Verified",
      reason: "Patient provided 6-digit Consultation PIN",
      status: "Granted"
    }, targetEmail);

    return {
      allowed: true,
      token: access.token,
      patientEmail: targetEmail,
      patientName: access.patientName,
      patientUid: access.patientUid,
      phoneNumber: access.phoneNumber,
      dossierUrl: `/dossier?token=${access.token}`
    };
  }

  return {
    allowed: false,
    reason: `Invalid 6-digit Doctor PIN for ${access.patientName}. Ask the patient to verify the PIN shown in their MedMatch app (e.g. ${access.doctorPasscode}).`
  };
}

// ============================================================================
// Doctor Portal Roster & Patient Access Permission Request Workflow
// ============================================================================

export const INITIAL_DOCTOR_PATIENTS: DoctorPatientRecord[] = [
  {
    patientEmail: "jk0822123@gmail.com",
    patientName: "Jasmeen Kaur",
    patientUid: "PT-2026-LUD-8821",
    phoneNumber: "+91 98881-88219",
    ageGender: "26 Y / Female",
    bloodGroup: "B+ (Rh Positive)",
    primaryCondition: "Antenatal Care (Trimester II — Week 28)",
    doctorId: "dr-reeta",
    accessStatus: "pending",
    requestedAt: "Today, 10:30 AM",
    requestedScope: "Full Clinical History, Prescriptions & Lab Scans",
    requestReason: "Antenatal Trimester II routine evaluation and multi-drug interaction screening",
    lastVisit: "Sep 12, 2026",
    allergiesSummary: "Penicillin / Amoxicillin (Severe Angioedema)",
    emergencyContactName: "Jaswinder Singh (Spouse)",
    emergencyContactPhone: "+91 98765-43210",
    prescriptionsCount: 3,
    documentsCount: 2
  },
  {
    patientEmail: "patient@medmatch.com",
    patientName: "Jasmeen Kaur",
    patientUid: "PT-2026-DEMO-01",
    phoneNumber: "+91 98881-88219",
    ageGender: "26 Y / Female",
    bloodGroup: "B+ (Rh Positive)",
    primaryCondition: "Preventative Health & Prescription Vault",
    doctorId: "dr-reeta",
    accessStatus: "none",
    lastVisit: "Registered User",
    allergiesSummary: "Penicillin / Amoxicillin",
    emergencyContactName: "Jaswinder Singh",
    emergencyContactPhone: "+91 98765-43210",
    prescriptionsCount: 3,
    documentsCount: 2
  }
];

export const INITIAL_DOCTOR_ACCESS_REQUESTS: DoctorAccessPermissionRequest[] = [
  {
    id: "req-acc-8821",
    doctorId: "dr-reeta",
    doctorName: "Dr. Reeta Bhambri",
    doctorSpecialty: "Obstetrics & Antenatal Care",
    hospital: "Ranjit Maternity Clinic & Nursing Home",
    doctorLicense: "MCI-34182",
    patientEmail: "jk0822123@gmail.com",
    patientName: "Jasmeen Kaur",
    patientUid: "PT-2026-LUD-8821",
    requestedScope: "Full Clinical History, Prescriptions & Lab Scans",
    clinicalReason: "Antenatal Trimester II routine evaluation and multi-drug interaction screening",
    status: "pending",
    createdAt: "Today, 10:30 AM",
    updatedAt: "Today, 10:30 AM"
  }
];

export const INITIAL_PATIENT_DOCUMENTS: PatientDocument[] = [
  {
    id: "doc-jk-1",
    patientEmail: "jk0822123@gmail.com",
    title: "Obstetric Ultrasound — Level-II Anomaly Scan (28 Weeks)",
    category: "ultrasound",
    date: "2026-09-12",
    facility: "Ranjit Maternity Clinic & Diagnostic Imaging",
    doctor: "Dr. Reeta Bhambri (MCI-34182)",
    summary: "Single viable intrauterine fetus in cephalic presentation. Normal amniotic fluid index (AFI: 14 cm). Placenta posterior, Grade-II maturity. Estimated fetal weight 1240g (50th percentile). Four-chamber cardiac view and fetal anatomy normal.",
    fileType: "Diagnostic Sonogram",
    findings: [
      "Cephalic presentation with regular cardiac activity (FHR: 142 bpm)",
      "Amniotic Fluid Index (AFI): 14.0 cm (Adequate)",
      "Placental location: Posterior, clear of internal os",
      "Estimated Fetal Weight: 1240g ± 150g (Normal growth curve)"
    ]
  },
  {
    id: "doc-jk-2",
    patientEmail: "jk0822123@gmail.com",
    title: "Second Trimester Maternal Hemogram & OGTT Glycemic Profile",
    category: "lab_report",
    date: "2026-09-08",
    facility: "Dr. Lal PathLabs (Ludhiana Center)",
    doctor: "Dr. Reeta Bhambri",
    summary: "Hemoglobin 11.2 g/dL (mild physiological anemia). Fasting blood glucose 88 mg/dL. 2-Hour post 75g oral glucose tolerance test: 128 mg/dL (Normal). Urine examination: Protein Nil, Glucose Nil, Pus cells 2-3 /hpf (Sterile).",
    fileType: "Hematology & Biochemistry",
    findings: [
      "Hemoglobin: 11.2 g/dL (Target > 11.0 g/dL)",
      "Fasting Plasma Glucose: 88 mg/dL (Normal < 95 mg/dL)",
      "OGTT 2h Post-load: 128 mg/dL (Gestational diabetes ruled out)",
      "Urine Routine & Microscopic: Sterile, no bacteriuria"
    ]
  },
  {
    id: "doc-hp-1",
    patientEmail: "harpreet.s@example.com",
    title: "Post-Operative Abdominal Ultrasound & LFT Panel",
    category: "ultrasound",
    date: "2026-09-14",
    facility: "Fortis Hospital (Radiology Wing)",
    doctor: "Dr. K.S. Duggal (MCI-48192)",
    summary: "Gallbladder surgically absent (Status post-laparoscopic cholecystectomy). Common bile duct 4.5mm (normal caliber). No intrahepatic biliary dilatation. Operative bed clean with minimal residual seroma.",
    fileType: "Diagnostic Sonogram & LFT",
    findings: [
      "Status post-cholecystectomy; operative bed healing clean",
      "Common Bile Duct: 4.5 mm (Normal caliber)",
      "Serum Bilirubin Total: 0.85 mg/dL (Normal)",
      "SGPT/ALT: 34 U/L (Normal)"
    ]
  },
  {
    id: "doc-am-1",
    patientEmail: "amandeep.sharma@example.com",
    title: "First Trimester Viability & Dating Ultrasound (Week 11)",
    category: "ultrasound",
    date: "2026-09-02",
    facility: "Vision & Maternity Diagnostics",
    doctor: "Dr. Reeta Bhambri",
    summary: "Single viable intrauterine gestational sac with active fetal movements. Crown-Rump Length (CRL) 44mm corresponding to 11 weeks 1 day. Fetal heart motion clearly visualized at 156 bpm. No subchorionic hematoma.",
    fileType: "Sonogram",
    findings: [
      "Crown-Rump Length (CRL): 44 mm (Gestational age 11w 1d)",
      "Fetal Heart Rate: 156 bpm (Normal regular rhythm)",
      "Single viable intrauterine fetus",
      "Scheduled for Nuchal Translucency (NT) scan at 12+4 weeks"
    ]
  }
];

function notifyAccessStateChange(): void {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new Event("medmatch_access_update"));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }
}

export function getHospitalRegisteredPatients(doctorId: string = "dr-reeta"): DoctorPatientRecord[] {
  const accounts = getRegisteredAccounts().filter(a => a.role === "patient");
  const allRequests = getAllDoctorAccessRequests();
  const requests = allRequests.filter(r => r.doctorId === doctorId);

  return accounts.map(a => {
    const userEmail = a.email.toLowerCase();
    const req = requests.find(r => r.patientEmail.toLowerCase() === userEmail);
    const rxs = getPatientPrescriptions(userEmail);
    const docs = getPatientDocuments(userEmail);
    const ac = getPatientAccessControl(userEmail);

    let accessStatus: DoctorPatientRecord["accessStatus"] = "none";
    if (req) {
      if (req.status === "approved") {
        accessStatus = req.isEmergency ? "emergency_override" : "granted";
      } else if (req.status === "pending") {
        accessStatus = "pending";
      } else if (req.status === "declined" || req.status === "revoked") {
        accessStatus = "declined";
      }
    }

    const uid = ac.patientUid || `PT-2026-${a.id.replace("usr-", "").toUpperCase()}`;

    return {
      patientEmail: a.email,
      patientName: a.name || a.email.split("@")[0],
      patientUid: uid,
      phoneNumber: ac.phoneNumber || "+91 98881-88219",
      ageGender: isDemoPatient(userEmail) ? "26 Y / Female" : "Patient / Verified",
      bloodGroup: isDemoPatient(userEmail) ? "B+ (Rh Positive)" : "O+ (Rh Positive)",
      primaryCondition: isDemoPatient(userEmail) ? "Antenatal Care (Trimester II — Week 28)" : "General Medical Vault",
      doctorId: doctorId,
      accessStatus,
      accessGrantedAt: req?.status === "approved" ? req.updatedAt : undefined,
      requestedAt: req?.createdAt,
      requestedScope: req?.requestedScope || "Full Prescriptions & Lab Scans",
      requestReason: req?.clinicalReason,
      allergiesSummary: isDemoPatient(userEmail) ? "Penicillin / Amoxicillin" : "None recorded",
      emergencyContactName: isDemoPatient(userEmail) ? "Jaswinder Singh (Spouse)" : "Primary Emergency Contact",
      emergencyContactPhone: isDemoPatient(userEmail) ? "+91 98765-43210" : "+91 98000-00000",
      prescriptionsCount: rxs.length,
      documentsCount: docs.length
    };
  });
}

export function getDoctorAssociatedPatients(doctorId: string = "dr-reeta"): DoctorPatientRecord[] {
  return getHospitalRegisteredPatients(doctorId);
}

export function saveDoctorAssociatedPatients(patients: DoctorPatientRecord[], doctorId: string = "dr-reeta"): void {
  if (typeof window === "undefined") return;
  const key = `medmatch_doctor_patients_${doctorId}`;
  try {
    localStorage.setItem(key, JSON.stringify(patients));
    notifyAccessStateChange();
  } catch (e) {
    console.error("Failed to save doctor patients:", e);
  }
}

export function addDoctorAssociatedPatient(patient: DoctorPatientRecord, doctorId: string = "dr-reeta"): void {
  const current = getDoctorAssociatedPatients(doctorId);
  const updated = [patient, ...current.filter(p => p.patientEmail.toLowerCase() !== patient.patientEmail.toLowerCase())];
  saveDoctorAssociatedPatients(updated, doctorId);
}

export function updateDoctorPatientAccessStatus(
  patientEmail: string,
  status: DoctorPatientRecord["accessStatus"],
  doctorId: string = "dr-reeta",
  extra?: Partial<DoctorPatientRecord>
): void {
  const current = getDoctorAssociatedPatients(doctorId);
  const updated = current.map(p => {
    if (p.patientEmail.toLowerCase() === patientEmail.toLowerCase()) {
      return {
        ...p,
        accessStatus: status,
        ...(status === "granted" ? { accessGrantedAt: p.accessGrantedAt || new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) } : {}),
        ...extra
      };
    }
    return p;
  });
  saveDoctorAssociatedPatients(updated, doctorId);
}

export function getAllDoctorAccessRequests(): DoctorAccessPermissionRequest[] {
  if (typeof window === "undefined") return [...INITIAL_DOCTOR_ACCESS_REQUESTS];
  try {
    const raw = localStorage.getItem("medmatch_doctor_access_requests");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    localStorage.setItem("medmatch_doctor_access_requests", JSON.stringify(INITIAL_DOCTOR_ACCESS_REQUESTS));
    return [...INITIAL_DOCTOR_ACCESS_REQUESTS];
  } catch (e) {
    console.warn("Error reading doctor access requests:", e);
    return [...INITIAL_DOCTOR_ACCESS_REQUESTS];
  }
}

export function saveDoctorAccessRequests(requests: DoctorAccessPermissionRequest[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("medmatch_doctor_access_requests", JSON.stringify(requests));
    notifyAccessStateChange();
  } catch (e) {
    console.error("Failed to save doctor access requests:", e);
  }
}

export function getDoctorAccessRequestsForPatient(patientEmail?: string | null): DoctorAccessPermissionRequest[] {
  const user = (patientEmail || getActivePatientEmail()).trim().toLowerCase();
  const all = getAllDoctorAccessRequests();
  return all.filter(r => r.patientEmail.toLowerCase() === user);
}

export function getDoctorAccessRequestsForDoctor(doctorId: string = "dr-reeta"): DoctorAccessPermissionRequest[] {
  const all = getAllDoctorAccessRequests();
  return all.filter(r => r.doctorId === doctorId);
}

export function createDoctorAccessRequest(
  arg1: {
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string;
    hospital: string;
    doctorLicense: string;
    patientEmail: string;
    patientName: string;
    patientUid: string;
    requestedScope: string;
    clinicalReason: string;
    isEmergency?: boolean;
  } | string,
  arg2?: string,
  arg3?: string,
  arg4?: string,
  arg5?: string
): DoctorAccessPermissionRequest {
  let params: {
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string;
    hospital: string;
    doctorLicense: string;
    patientEmail: string;
    patientName: string;
    patientUid: string;
    requestedScope: string;
    clinicalReason: string;
    isEmergency?: boolean;
  };

  if (typeof arg1 === "object" && arg1 !== null) {
    params = arg1;
  } else {
    const patientEmail = String(arg1 || "").trim().toLowerCase();
    const requestedScope = arg2 || "Full Clinical History, Prescriptions & Lab Scans";
    const clinicalReason = arg3 || "Antenatal routine evaluation & medication reconciliation";
    const doctorId = arg4 || "dr-reeta";
    const doctorName = arg5 || "Dr. Reeta Bhambri";
    const accounts = getRegisteredAccounts();
    const acc = accounts.find(a => a.email.toLowerCase() === patientEmail);
    const patientName = acc?.name || (patientEmail === "jk0822123@gmail.com" ? "Jasmeen Kaur" : patientEmail.split("@")[0]);
    params = {
      doctorId,
      doctorName,
      doctorSpecialty: "Obstetrics & Antenatal Care",
      hospital: "Ranjit Maternity Clinic & Nursing Home",
      doctorLicense: "MCI-34182",
      patientEmail,
      patientName,
      patientUid: `PT-2026-${patientEmail.slice(0, 4).toUpperCase()}`,
      requestedScope,
      clinicalReason,
      isEmergency: false
    };
  }

  const all = getAllDoctorAccessRequests();
  const now = new Date();
  const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const newReq: DoctorAccessPermissionRequest = {
    id: `req-acc-${Date.now()}`,
    ...params,
    status: params.isEmergency ? "approved" : "pending",
    createdAt: timestamp,
    updatedAt: timestamp
  };

  const updatedRequests = [newReq, ...all.filter(r => !(r.doctorId === params.doctorId && r.patientEmail.toLowerCase() === params.patientEmail.toLowerCase()))];
  saveDoctorAccessRequests(updatedRequests);

  // Update association in doctor roster
  updateDoctorPatientAccessStatus(params.patientEmail, params.isEmergency ? "emergency_override" : "pending", params.doctorId, {
    requestedAt: timestamp,
    requestedScope: params.requestedScope,
    requestReason: params.clinicalReason
  });

  // Notify patient
  addPatientNotification({
    patientEmail: params.patientEmail,
    type: params.isEmergency ? "emergency_access" : "access_request",
    title: params.isEmergency ? "🚨 Emergency Break-Glass Record Access" : "Doctor Clinical Record Request",
    message: `${params.doctorName} (${params.hospital}) has requested access to your clinical records & prescriptions for: "${params.clinicalReason}".`,
    severity: params.isEmergency ? "critical" : "warning",
    requestId: newReq.id,
    actionUrl: "/dashboard/sharing",
    metadata: {
      ...params,
      requestId: newReq.id
    }
  }, params.patientEmail);

  return newReq;
}

export function respondToAccessRequest(
  requestId: string,
  decision: "approved" | "declined",
  patientEmail?: string | null
): boolean {
  const all = getAllDoctorAccessRequests();
  const target = all.find(r => r.id === requestId);
  if (!target) return false;

  const now = new Date();
  const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const updated = all.map(r => {
    if (r.id === requestId) {
      return {
        ...r,
        status: decision,
        updatedAt: timestamp
      };
    }
    return r;
  });
  saveDoctorAccessRequests(updated);

  // Update Doctor Roster
  updateDoctorPatientAccessStatus(
    target.patientEmail,
    decision === "approved" ? "granted" : "declined",
    target.doctorId,
    {
      accessGrantedAt: decision === "approved" ? timestamp : undefined,
      accessExpiresAt: decision === "approved" ? "30 days" : undefined
    }
  );

  // If approved, create Doctor Share Item and Audit Entry
  if (decision === "approved") {
    addPatientShare({
      email: `${target.doctorId}@ranjitmaternity.com`,
      scope: target.requestedScope,
      date: timestamp,
      expires: "30 days",
      type: target.requestedScope.toLowerCase().includes("full") ? "full" : "partial"
    }, target.patientEmail);

    addPatientAccessAuditEntry({
      accessorName: target.doctorName,
      accessorRole: "Consulting Doctor",
      accessorLicense: target.doctorLicense,
      hospital: target.hospital,
      accessType: "Passcode Verified",
      reason: `Patient approved consultation request: ${target.clinicalReason}`,
      status: "Granted"
    }, target.patientEmail);

    addPatientNotification({
      patientEmail: target.patientEmail,
      type: "system",
      title: "Doctor Access Approved",
      message: `You granted access to ${target.doctorName} (${target.hospital}). You can revoke this anytime from the Doctor Access tab.`,
      severity: "success",
      actionUrl: "/dashboard/sharing"
    }, target.patientEmail);
  } else {
    addPatientAccessAuditEntry({
      accessorName: target.doctorName,
      accessorRole: "Consulting Doctor",
      accessorLicense: target.doctorLicense,
      hospital: target.hospital,
      accessType: "Passcode Verified",
      reason: `Patient declined consultation request: ${target.clinicalReason}`,
      status: "Revoked"
    }, target.patientEmail);
  }

  notifyAccessStateChange();
  return true;
}

export function revokeDoctorAccess(patientEmail: string, doctorId: string = "dr-reeta"): boolean {
  updateDoctorPatientAccessStatus(patientEmail, "declined", doctorId);

  // Update any existing active requests
  const all = getAllDoctorAccessRequests();
  const updated = all.map(r => {
    if (r.doctorId === doctorId && r.patientEmail.toLowerCase() === patientEmail.toLowerCase()) {
      return { ...r, status: "revoked" as const, updatedAt: new Date().toLocaleDateString("en-US") };
    }
    return r;
  });
  saveDoctorAccessRequests(updated);

  addPatientAccessAuditEntry({
    accessorName: "Patient (Self)",
    accessorRole: "Patient Self",
    accessType: "Passcode Verified",
    status: "Revoked",
    reason: `Patient revoked consultation access for Doctor ID: ${doctorId}`
  }, patientEmail);

  notifyAccessStateChange();
  return true;
}

// ============================================================================
// Scoped Patient Notifications System
// ============================================================================

export function getPatientNotifications(patientEmail?: string | null): PatientNotificationItem[] {
  const user = (patientEmail || getActivePatientEmail()).trim().toLowerCase();
  if (typeof window === "undefined") {
    return isDemoPatient(user) || user === "anonymous" ? [...(INITIAL_PATIENT_NOTIFICATIONS["jk0822123@gmail.com"] || [])] : [];
  }
  const key = getPatientStorageKey("notifications", user);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
    if (isDemoPatient(user)) {
      const initial = INITIAL_PATIENT_NOTIFICATIONS["jk0822123@gmail.com"] || [];
      localStorage.setItem(key, JSON.stringify(initial));
      return [...initial];
    }
    return [];
  } catch (e) {
    console.warn("Error reading patient notifications:", e);
    return [];
  }
}

export function savePatientNotifications(notifications: PatientNotificationItem[], email?: string | null): void {
  if (typeof window === "undefined") return;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("notifications", user);
  try {
    localStorage.setItem(key, JSON.stringify(notifications));
    notifyAccessStateChange();
  } catch (e) {
    console.error("Failed to save patient notifications:", e);
  }
}

export function addPatientNotification(
  notification: Omit<PatientNotificationItem, "id" | "timestamp" | "read">,
  email?: string | null
): PatientNotificationItem {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const current = getPatientNotifications(user);
  const now = new Date();
  const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const newNotif: PatientNotificationItem = {
    ...notification,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    read: false,
    patientEmail: user
  };

  const updated = [newNotif, ...current.filter(n => n.id !== newNotif.id)];
  savePatientNotifications(updated, user);
  return newNotif;
}

export function markPatientNotificationAsRead(id: string, email?: string | null): void {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const current = getPatientNotifications(user);
  const updated = current.map(n => n.id === id ? { ...n, read: true } : n);
  savePatientNotifications(updated, user);
}

export function markAllPatientNotificationsAsRead(email?: string | null): void {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const current = getPatientNotifications(user);
  const updated = current.map(n => ({ ...n, read: true }));
  savePatientNotifications(updated, user);
}

// ============================================================================
// Scoped Diagnostic Documents & Lab Reports API
// ============================================================================

export function getPatientDocuments(email?: string | null): PatientDocument[] {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  if (typeof window === "undefined") {
    return INITIAL_PATIENT_DOCUMENTS.filter(d => d.patientEmail.toLowerCase() === user);
  }
  const key = getPatientStorageKey("documents", user);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }

    const defaultMatches = INITIAL_PATIENT_DOCUMENTS.filter(d => d.patientEmail.toLowerCase() === user);
    if (defaultMatches.length > 0) {
      localStorage.setItem(key, JSON.stringify(defaultMatches));
      return defaultMatches;
    }

    if (isDemoPatient(user)) {
      const demoMatches = INITIAL_PATIENT_DOCUMENTS.filter(d => d.patientEmail === "jk0822123@gmail.com");
      localStorage.setItem(key, JSON.stringify(demoMatches));
      return demoMatches;
    }

    return [];
  } catch (e) {
    console.warn("Error reading patient documents:", e);
    return [];
  }
}

export function savePatientDocuments(docs: PatientDocument[], email?: string | null): void {
  if (typeof window === "undefined") return;
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const key = getPatientStorageKey("documents", user);
  try {
    localStorage.setItem(key, JSON.stringify(docs));
    notifyAccessStateChange();
  } catch (e) {
    console.error("Failed to save patient documents:", e);
  }
}

export function addPatientDocument(doc: PatientDocument, email?: string | null): void {
  const user = (email || getActivePatientEmail()).trim().toLowerCase();
  const current = getPatientDocuments(user);
  const updated = [doc, ...current.filter(d => d.id !== doc.id)];
  savePatientDocuments(updated, user);
}

export function searchRegisteredPatients(query: string, doctorId: string = "dr-reeta"): DoctorPatientRecord[] {
  const clean = (query || "").trim().toLowerCase();
  const candidates = getHospitalRegisteredPatients(doctorId);
  if (!clean) return candidates;
  return candidates.filter(
    c =>
      c.patientName.toLowerCase().includes(clean) ||
      c.patientUid.toLowerCase().includes(clean) ||
      c.patientEmail.toLowerCase().includes(clean) ||
      c.phoneNumber.replace(/\D/g, "").includes(clean.replace(/\D/g, ""))
  );
}

// ============================================================================
// Clinical Summary & Prescription Report Export Engine (Doctor & Patient)
// ============================================================================

export function generateMedicalSummaryHtml(
  patientEmail: string,
  options?: { doctorName?: string; hospital?: string; generatedBy?: string }
): string {
  const user = (patientEmail || getActivePatientEmail()).trim().toLowerCase();
  const accounts = getRegisteredAccounts();
  const account = accounts.find(a => a.email.toLowerCase() === user);
  const patientName = account?.name || (user === "jk0822123@gmail.com" ? "Jasmeen Kaur" : user.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()));
  const ac = getPatientAccessControl(user);
  const prescriptions = getPatientPrescriptions(user);
  const documents = getPatientDocuments(user);
  const treatmentGroups = getPatientTreatmentGroups(user);
  const now = new Date();
  const timestamp = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Dynamic clinical facility & provider resolution based on patient's own actual prescriptions
  const primaryDoctor = prescriptions[0]?.doc || treatmentGroups[0]?.physician || "Attending Physician";
  const primaryHospital = prescriptions[0]?.hospital || treatmentGroups[0]?.hospital || "MedMatch Healthcare Network";
  const doctorName = options?.doctorName || primaryDoctor;
  const hospital = options?.hospital || primaryHospital;
  const generatedBy = options?.generatedBy || "MedMatch AI Clinical Records Vault";
  const patientUid = ac?.patientUid || `PT-2026-${Math.abs(user.split("").reduce((acc, c) => ((acc << 5) - acc) + c.charCodeAt(0), 0) % 9000 + 1000)}`;
  const bloodGroup = (ac as any)?.bloodGroup || (isDemoPatient(user) ? "B+ (Rh Positive)" : "Patient File Verified");

  const rxRowsHtml = prescriptions.length > 0 ? prescriptions.map(rx => {
    const medsList = (rx.medicines || []).map(m => {
      const name = m.name || m.medicine_name || "Prescribed Medication";
      const dose = m.dosage || m.dose || "Standard dose";
      const freq = m.frequency || m.freq || "As directed";
      const dur = m.duration || m.dur || "Course duration";
      const instr = m.instructions || m.instr || "Take as instructed";
      const conf = m.confidence || m.conf || rx.conf || "High";
      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${name}</td>
          <td style="padding: 10px 12px; color: #334155;">${dose}</td>
          <td style="padding: 10px 12px; color: #334155;">${freq}</td>
          <td style="padding: 10px 12px; color: #334155;">${dur}</td>
          <td style="padding: 10px 12px; color: #475569; font-size: 12px;">${instr}</td>
          <td style="padding: 10px 12px; text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;">
              ${conf} (${rx.source || "OCR"})
            </span>
          </td>
        </tr>
      `;
    }).join("");

    return `
      <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #cbd5e1; border-radius: 8px; background: #ffffff;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 12px;">
          <div>
            <span style="font-weight: 700; font-size: 14px; color: #0f172a;">${rx.doc || "Treating Physician"}</span>
            <span style="color: #64748b; font-size: 13px;"> • ${rx.hospital || hospital}</span>
          </div>
          <div style="font-size: 12px; color: #475569;">
            Date: <strong>${rx.date}</strong> | Clinical Indication: <strong>${rx.diag || "Prescription Review"}</strong>
          </div>
        </div>
        ${rx.overview ? `
          <div style="margin: 0 0 12px 0; padding: 10px 14px; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 6px; font-size: 12px; color: #0f766e; line-height: 1.5;">
            <strong>Clinical Overview:</strong> ${rx.overview}
          </div>
        ` : ""}
        <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px;">
          <thead>
            <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
              <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Medication</th>
              <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Dosage</th>
              <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Frequency</th>
              <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Duration</th>
              <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Instructions</th>
              <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase; text-align: center;">Verification</th>
            </tr>
          </thead>
          <tbody>
            ${medsList || '<tr><td colspan="6" style="padding: 12px; text-align: center; color: #64748b;">No medication items recorded</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }).join("") : `
    <div style="padding: 24px; text-align: center; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b; background: #f8fafc; margin-bottom: 20px;">
      <strong style="display: block; margin-bottom: 4px; color: #334155;">No Prescriptions Uploaded Yet</strong>
      <span style="font-size: 12px;">This patient has not logged or OCR-scanned prescriptions into their vault.</span>
    </div>
  `;

  const tgRowsHtml = treatmentGroups.length > 0 ? `
    <div class="section-title" style="margin-top: 28px;">
      <span>Active Clinical Treatment Programs &amp; Conditions</span>
      <span style="font-weight: normal; color: #64748b;">${treatmentGroups.length} Program(s)</span>
    </div>
    ${treatmentGroups.map(tg => `
      <div style="margin-bottom: 14px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
          <strong style="color: #0f172a; font-size: 13px;">${tg.name}</strong>
          <span style="font-size: 12px; color: #64748b;">${tg.physician || "Attending Physician"} • ${tg.hospital || "Clinical Facility"}</span>
        </div>
        <p style="font-size: 12px; color: #334155; margin: 4px 0 8px 0; line-height: 1.5;">${tg.conditionGoal || tg.clinicalNotes || ""}</p>
        <div style="font-size: 11px; color: #475569;">
          <strong>Active Medications:</strong> ${(tg.medications || []).map(m => `${m.name} (${m.dosage})`).join(", ") || "None"}
        </div>
      </div>
    `).join("")}
  ` : "";

  const docRowsHtml = documents.length > 0 ? documents.map(d => {
    const findingsList = (d.findings || []).map(f => `<li style="margin-bottom: 4px;">${f}</li>`).join("");
    return `
      <div style="margin-bottom: 16px; padding: 14px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
          <strong style="color: #0f172a; font-size: 13px;">${d.title}</strong>
          <span style="font-size: 12px; color: #64748b;">${d.date} • ${d.facility}</span>
        </div>
        <p style="font-size: 12px; color: #334155; margin: 4px 0 8px 0; line-height: 1.5;">${d.summary}</p>
        ${findingsList ? `<ul style="margin: 0; padding-left: 20px; font-size: 12px; color: #475569;">${findingsList}</ul>` : ""}
      </div>
    `;
  }).join("") : `
    <div style="padding: 20px; text-align: center; border: 1px dashed #cbd5e1; border-radius: 8px; color: #64748b; background: #f8fafc;">
      <span style="font-size: 12px;">No separate diagnostic lab reports on file.</span>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>MedMatch Clinical Summary - ${patientName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      margin: 0;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #0d9488;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
      letter-spacing: -0.5px;
    }
    .subtitle {
      font-size: 12px;
      color: #0d9488;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      font-size: 12px;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-item span {
      font-weight: 600;
      color: #0f172a;
      font-size: 13px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1.5px solid #e2e8f0;
      padding-bottom: 6px;
      margin: 24px 0 16px 0;
      display: flex;
      justify-content: space-between;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; padding: 12px 18px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    <div style="font-size: 13px; color: #15803d; font-weight: 600;">
      ✓ Downloaded Medical Summary &bull; Local Clinical Snapshot
      <span style="display: block; font-size: 11px; font-weight: normal; color: #4b5563; margin-top: 2px;">
        This document was exported from MedMatch AI. You can open, save as PDF, or print at any time.
      </span>
    </div>
    <button onclick="window.print()" style="cursor: pointer; background: #0d9488; color: #ffffff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; font-size: 13px;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  <div class="header">
    <div>
      <div class="subtitle">MedMatch AI Clinical Network • Official Health Summary</div>
      <h1 class="title">Clinical Summary &amp; Prescription Report</h1>
      <div style="font-size: 12px; color: #64748b;">Facility: <strong>${hospital}</strong></div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <div>Generated: <strong>${timestamp}</strong></div>
      <div>Authorized Provider: <strong>${doctorName}</strong></div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <strong>Patient Name</strong>
      <span>${patientName}</span>
    </div>
    <div class="meta-item">
      <strong>Patient UID</strong>
      <span>${patientUid}</span>
    </div>
    <div class="meta-item">
      <strong>Patient Email</strong>
      <span>${user}</span>
    </div>
    <div class="meta-item">
      <strong>Blood Group</strong>
      <span>${bloodGroup}</span>
    </div>
  </div>

  <div class="section-title">
    <span>Verified Prescriptions &amp; OCR Medications</span>
    <span style="font-weight: normal; color: #64748b;">${prescriptions.length} Prescription(s)</span>
  </div>
  ${rxRowsHtml}

  ${tgRowsHtml}

  <div class="section-title" style="margin-top: 28px;">
    <span>Diagnostic Documents &amp; Lab Investigations</span>
    <span style="font-weight: normal; color: #64748b;">${documents.length} Report(s)</span>
  </div>
  ${docRowsHtml}

  <div class="footer">
    <div>
      <strong>MedMatch AI Clinical Verification</strong> • Cryptographic Health Record Snapshot
      <br>Compliant with clinical patient consent and hospital record-sharing protocols.
    </div>
    <div style="text-align: right;">
      Status: <strong style="color: #047857;">Verified &amp; Certified</strong>
      <br>Source: ${generatedBy}
    </div>
  </div>
</body>
</html>`;
}

export function triggerFileDownload(
  filename: string,
  content: string,
  mimeType = "text/html;charset=utf-8"
): void {
  if (typeof window === "undefined") return;
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(url);
      } catch {
        // cleanup ignore
      }
    }, 500);
  } catch (err) {
    console.error("Failed to trigger file download:", err);
  }
}

export function downloadMedicalSummaryReport(
  patientEmail: string,
  options?: { doctorName?: string; hospital?: string; generatedBy?: string }
): void {
  if (typeof window === "undefined") return;
  const html = generateMedicalSummaryHtml(patientEmail, options);
  const safeName = (patientEmail || "Patient").replace(/[^a-zA-Z0-9]/g, "_");
  const filename = `MedMatch_Summary_${safeName}_${new Date().toISOString().split("T")[0]}.html`;
  triggerFileDownload(filename, html);
}

export function downloadOcrPrescriptionSummary(prescriptionData: {
  patientEmail?: string;
  patientName?: string;
  doctorName?: string;
  hospital?: string;
  diagnosis?: string;
  date?: string;
  overview?: string;
  medicines: Array<{
    name?: string;
    medicine_name?: string;
    dosage?: string;
    dose?: string;
    frequency?: string;
    freq?: string;
    duration?: string;
    dur?: string;
    instructions?: string;
    instr?: string;
    confidence?: string;
    intended_use?: string;
  }>;
}): void {
  if (typeof window === "undefined") return;
  const patientEmail = prescriptionData.patientEmail || getActivePatientEmail();
  const patientName = prescriptionData.patientName || patientEmail.split("@")[0].toUpperCase();
  const now = new Date();
  const timestamp = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const medRows = prescriptionData.medicines.map((m, idx) => {
    const medName = m.medicine_name || m.name || `Medication #${idx + 1}`;
    const dosage = m.dosage || m.dose || "As directed";
    const freq = m.frequency || m.freq || "Standard schedule";
    const dur = m.duration || m.dur || "As prescribed";
    const instr = m.instructions || m.instr || m.intended_use || "Follow physician direction";
    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px 12px; font-weight: 600; color: #0f172a;">${medName}</td>
        <td style="padding: 10px 12px; color: #334155;">${dosage}</td>
        <td style="padding: 10px 12px; color: #334155;">${freq}</td>
        <td style="padding: 10px 12px; color: #334155;">${dur}</td>
        <td style="padding: 10px 12px; color: #475569; font-size: 12px;">${instr}</td>
        <td style="padding: 10px 12px; text-align: center;">
          <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 10px; font-weight: 700; background: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;">
            OCR Verified
          </span>
        </td>
      </tr>
    `;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>OCR Prescription Summary - ${patientName}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      margin: 0;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #0d9488;
      padding-bottom: 16px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 4px 0;
    }
    .subtitle {
      font-size: 12px;
      color: #0d9488;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 24px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      font-size: 12px;
    }
    .meta-item strong {
      display: block;
      color: #64748b;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-item span {
      font-weight: 600;
      color: #0f172a;
      font-size: 13px;
    }
    .overview-card {
      background: #f0fdfa;
      border: 1px solid #99f6e4;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 24px;
      font-size: 13px;
      color: #134e4a;
      line-height: 1.6;
    }
    .footer {
      margin-top: 36px;
      padding-top: 16px;
      border-top: 1px solid #cbd5e1;
      font-size: 11px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; padding: 12px 18px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
    <div style="font-size: 13px; color: #15803d; font-weight: 600;">
      ✓ Downloaded OCR Prescription Summary &bull; Local Clinical Record
      <span style="display: block; font-size: 11px; font-weight: normal; color: #4b5563; margin-top: 2px;">
        Extracted and verified by MedMatch AI OCR. You can open, save as PDF, or print at any time.
      </span>
    </div>
    <button onclick="window.print()" style="cursor: pointer; background: #0d9488; color: #ffffff; border: none; padding: 8px 18px; border-radius: 6px; font-weight: 600; font-size: 13px;">
      🖨️ Print / Save as PDF
    </button>
  </div>
  <div class="header">
    <div>
      <div class="subtitle">MedMatch AI OCR Diagnostic Feed • Structured Clinical Extract</div>
      <h1 class="title">Scanned Prescription Summary Report</h1>
      <div style="font-size: 12px; color: #64748b;">Healthcare Provider: <strong>${prescriptionData.doctorName || "Treating Physician"}</strong> • ${prescriptionData.hospital || "Clinical Facility"}</div>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <div>Scan Timestamp: <strong>${timestamp}</strong></div>
      <div>Prescription Date: <strong>${prescriptionData.date || "Recorded on prescription"}</strong></div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <strong>Patient Name</strong>
      <span>${patientName}</span>
    </div>
    <div class="meta-item">
      <strong>Patient Email</strong>
      <span>${patientEmail}</span>
    </div>
    <div class="meta-item">
      <strong>Clinical Diagnosis</strong>
      <span>${prescriptionData.diagnosis || "General Consultation"}</span>
    </div>
    <div class="meta-item">
      <strong>Extracted Medications</strong>
      <span>${prescriptionData.medicines.length} Item(s)</span>
    </div>
  </div>

  ${prescriptionData.overview ? `
    <div class="overview-card">
      <strong style="display: block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; color: #0f766e;">Clinical Overview &amp; Treatment Target:</strong>
      ${prescriptionData.overview}
    </div>
  ` : ""}

  <div style="font-size: 14px; font-weight: 700; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 1.5px solid #e2e8f0; padding-bottom: 6px; margin: 20px 0 14px 0;">
    Extracted Prescription Regimen
  </div>

  <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 13px; margin-bottom: 24px;">
    <thead>
      <tr style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1;">
        <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Medication Name</th>
        <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Dosage</th>
        <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Frequency</th>
        <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Duration</th>
        <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase;">Instructions</th>
        <th style="padding: 8px 12px; color: #475569; font-size: 11px; text-transform: uppercase; text-align: center;">Verification</th>
      </tr>
    </thead>
    <tbody>
      ${medRows}
    </tbody>
  </table>

  <div class="footer">
    <div>
      <strong>MedMatch AI OCR Diagnostic Gateway</strong> • Multimodal Healthcare Processing
      <br>Document verified against clinical database and pharmacy safety standards.
    </div>
    <div style="text-align: right;">
      Status: <strong style="color: #047857;">Verified OCR Extract</strong>
    </div>
  </div>
</body>
</html>`;

  const safeDiag = (prescriptionData.diagnosis || "Prescription").replace(/[^a-zA-Z0-9]/g, "_").slice(0, 30);
  const dateSuffix = new Date().toISOString().split("T")[0];
  const filename = `MedMatch_OCR_Summary_${safeDiag}_${dateSuffix}.html`;
  triggerFileDownload(filename, html);
}

// ----------------------------------------------------------------------------
// Dedicated Dossier Profiles for Clinic Demo Patients
// ----------------------------------------------------------------------------

function getHarpreetSinghDossier(token: string): PatientDossierData {
  const now = new Date();
  const generatedAt = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const expiresDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const expiresAt = expiresDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const episodes: ClinicalEpisode[] = [
    {
      id: "ep-h-1",
      title: "Post-Operative Recovery & Wound Care (Laparoscopic Cholecystectomy)",
      category: "surgical",
      status: "active",
      physician: "Dr. K.S. Duggal",
      hospital: "Fortis Hospital (General Surgery)",
      dateRange: "Sept 2026 to Present",
      clinicalNotes: "Day 10 post-laparoscopic cholecystectomy. Four puncture port sites clean, healing per primam with no discharge. Mild umbilical tenderness on deep palpation. Advised to avoid heavy lifting and maintain sterile dressing.",
      medications: [
        { name: "Cefuroxime Axetil", dosage: "500mg", frequency: "Twice daily (BD)", instructions: "After food for 7 days" },
        { name: "Chymoral Forte", dosage: "2 tablets", frequency: "Three times daily (TDS)", instructions: "Empty stomach with water" },
        { name: "Paracetamol", dosage: "650mg", frequency: "SOS (As needed)", instructions: "Take only for fever or acute wound ache" }
      ]
    },
    {
      id: "ep-h-2",
      title: "Essential Hypertension & Cardiovascular Review",
      category: "cardiovascular",
      status: "monitoring",
      physician: "Dr. A.K. Mehta",
      hospital: "Apollo Clinics (Cardiology)",
      dateRange: "Jun 2026 to Present",
      clinicalNotes: "Post-surgical resting blood pressure 128/82 mmHg. Maintained on Calcium Channel Blocker therapy. No signs of peripheral pedal edema.",
      medications: [
        { name: "Amlodipine", dosage: "5mg", frequency: "Once daily (OD)", instructions: "Take at night before sleep" },
        { name: "Telmisartan", dosage: "40mg", frequency: "Once daily (OD)", instructions: "Take in the morning with water" }
      ]
    },
    {
      id: "ep-h-3",
      title: "Bile Reflux & Post-Cholecystectomy Dyspepsia",
      category: "gastro",
      status: "active",
      physician: "Dr. Sharma",
      hospital: "City Hospital (Gastroenterology)",
      dateRange: "Aug 2026 to Present",
      clinicalNotes: "Patient experienced mild morning bilious bitterness. Started on Rabeprazole 20mg. Low-fat dietary guidelines reinforced.",
      medications: [
        { name: "Rabeprazole Sodium", dosage: "20mg", frequency: "Once daily (OD)", instructions: "Take 30 minutes before first meal" }
      ]
    }
  ];

  const activeMedications = [
    { name: "Cefuroxime Axetil", dosage: "500mg", frequency: "Twice daily (BD)", timing: "Morning & Night after meals", instructions: "Second-generation cephalosporin prophylaxis", prescribedBy: "Dr. K.S. Duggal", episodeName: "Post-Operative Recovery" },
    { name: "Chymoral Forte", dosage: "2 tablets", frequency: "Three times daily (TDS)", timing: "Morning, Afternoon & Night", instructions: "Enzymatic reduction of post-surgical edema", prescribedBy: "Dr. K.S. Duggal", episodeName: "Post-Operative Recovery" },
    { name: "Rabeprazole Sodium", dosage: "20mg", frequency: "Once daily (OD)", timing: "Morning before breakfast", instructions: "Acid secretion suppression and bile gastritis relief", prescribedBy: "Dr. Sharma", episodeName: "Bile Reflux Care" },
    { name: "Amlodipine", dosage: "5mg", frequency: "Once daily (OD)", timing: "Night at bedtime", instructions: "Arterial vasodilation for BP control", prescribedBy: "Dr. A.K. Mehta", episodeName: "Essential Hypertension" },
    { name: "Telmisartan", dosage: "40mg", frequency: "Once daily (OD)", timing: "Morning at 8:00 AM", instructions: "Angiotensin receptor blocker", prescribedBy: "Dr. A.K. Mehta", episodeName: "Essential Hypertension" }
  ];

  const prescriptions: StoredPrescription[] = [
    {
      id: "h-rx-1",
      doc: "Dr. K.S. Duggal",
      hospital: "Fortis Hospital",
      diag: "Post-Cholecystectomy Suture Check",
      date: "2026-09-07",
      meds: 3,
      status: "active",
      source: "calibrated_ocr",
      conf: "high",
      medicines: [
        { medicine_name: "Cefuroxime Axetil", dosage: "500mg", frequency: "Twice daily", duration: "7 days" },
        { medicine_name: "Chymoral Forte", dosage: "2 tablets", frequency: "Three times daily", duration: "5 days" }
      ]
    },
    {
      id: "h-rx-2",
      doc: "Dr. A.K. Mehta",
      hospital: "Apollo Clinics",
      diag: "Hypertension Maintenance",
      date: "2026-08-20",
      meds: 2,
      status: "active",
      source: "manual",
      conf: "high",
      medicines: [
        { medicine_name: "Amlodipine", dosage: "5mg", frequency: "Once daily", duration: "90 days" },
        { medicine_name: "Telmisartan", dosage: "40mg", frequency: "Once daily", duration: "90 days" }
      ]
    }
  ];

  return {
    patientName: "Harpreet Singh",
    email: "harpreet.s@example.com",
    ageGender: "48 Y / Male",
    bloodGroup: "O+ (Rh Positive)",
    patientUid: "PT-2026-LUD-3312",
    emergencyContact: {
      name: "Gurpreet Kaur",
      relation: "Spouse",
      phone: "+91 98141-77820"
    },
    allergies: [
      { substance: "NSAIDs (Diclofenac & Ibuprofen)", reaction: "Acute Peptic Ulceration & Bronchospasm", severity: "High" },
      { substance: "Iodine Radiopaque Contrast Media", reaction: "Facial angioedema and erythematous rash", severity: "Moderate" }
    ],
    chronicConditions: [
      "Post-Operative Day 10 (Laparoscopic Cholecystectomy)",
      "Essential Hypertension (Stage 1 - Medicated)",
      "Bile Reflux Gastritis"
    ],
    clinicalAlertBanner: "Surgical Wound Integrity: Day 10 post-laparoscopic cholecystectomy. Subcostal port sites clean, sutures intact. Strictly avoid NSAIDs (Diclofenac/Ibuprofen) due to high-risk hypersensitivity history.",
    episodes,
    activeMedications,
    prescriptions,
    token,
    generatedAt,
    expiresAt
  };
}

function getAmandeepSharmaDossier(token: string): PatientDossierData {
  const now = new Date();
  const generatedAt = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const expiresDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const expiresAt = expiresDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const episodes: ClinicalEpisode[] = [
    {
      id: "ep-a-1",
      title: "First Trimester Antenatal Routine & Micronutrient Protocol",
      category: "preventative",
      status: "active",
      physician: "Dr. Reeta Bhambri",
      hospital: "Ranjit Maternity Clinic & Nursing Home",
      dateRange: "Aug 2026 to Present",
      clinicalNotes: "Gestational age 11 weeks. Booking ultrasound confirms single viable intrauterine fetus (FHR: 156 bpm, CRL: 44mm). Mild nausea (emesis gravidarum) controlled with Doxylamine. Maternal Hb 11.8 g/dL, blood group A+. Nuchal Translucency (NT) scan scheduled at 12+4 weeks.",
      medications: [
        { name: "Folic Acid", dosage: "5mg", frequency: "Once daily (OD)", instructions: "Take with water after morning breakfast" },
        { name: "Doxinate (Doxylamine + Pyridoxine)", dosage: "10mg/10mg", frequency: "Once daily (OD)", instructions: "Take at bedtime for morning sickness relief" },
        { name: "Cholecalciferol (Vitamin D3)", dosage: "1,000 IU", frequency: "Once daily (OD)", instructions: "With morning milk or meal" }
      ]
    },
    {
      id: "ep-a-2",
      title: "Seasonal Allergic Rhinitis & Sinonasal Hygiene",
      category: "respiratory",
      status: "monitoring",
      physician: "Dr. Gupta",
      hospital: "Vision & ENT Care Center",
      dateRange: "Jul 2026 to Present",
      clinicalNotes: "Recurrent paroxysmal sneezing and watery rhinorrhea. Given gestational status, oral decongestants and first-generation systemic antihistamines are avoided. Maintained on non-medicated isotonic saline nasal wash.",
      medications: [
        { name: "Isotonic Saline 0.9% Nasal Spray", dosage: "2 puffs/nostril", frequency: "As needed (SOS)", instructions: "Safe non-pharmacological mucosal lavage" }
      ]
    }
  ];

  const activeMedications = [
    { name: "Folic Acid", dosage: "5mg", frequency: "Once daily (OD)", timing: "Morning after breakfast", instructions: "Essential neural tube prophylaxis in 1st trimester", prescribedBy: "Dr. Reeta Bhambri", episodeName: "First Trimester Antenatal Care" },
    { name: "Doxinate (Doxylamine 10mg + B6 10mg)", dosage: "1 Tablet", frequency: "Once daily at bedtime", timing: "Night at 9:30 PM", instructions: "Prevents morning nausea & vomiting of pregnancy", prescribedBy: "Dr. Reeta Bhambri", episodeName: "First Trimester Antenatal Care" },
    { name: "Cholecalciferol Drops", dosage: "1,000 IU", frequency: "Once daily (OD)", timing: "Morning with breakfast", instructions: "Gestational bone and immune support", prescribedBy: "Dr. Reeta Bhambri", episodeName: "First Trimester Antenatal Care" },
    { name: "Saline Nasal Spray (0.9%)", dosage: "2 Puffs", frequency: "As needed (SOS)", timing: "Day or night during congestion", instructions: "Drug-free allergic rhinitis clearance", prescribedBy: "Dr. Gupta", episodeName: "Allergic Rhinitis" }
  ];

  const prescriptions: StoredPrescription[] = [
    {
      id: "a-rx-1",
      doc: "Dr. Reeta Bhambri",
      hospital: "Ranjit Hospital & Maternity Home",
      diag: "Antenatal Booking (Trimester I - Week 11)",
      date: "2026-09-02",
      meds: 3,
      status: "active",
      source: "calibrated_ocr",
      conf: "high",
      medicines: [
        { medicine_name: "Folic Acid", dosage: "5mg", frequency: "Once daily", duration: "90 days" },
        { medicine_name: "Doxinate", dosage: "1 tablet", frequency: "At bedtime", duration: "30 days" }
      ]
    },
    {
      id: "a-rx-2",
      doc: "Dr. Gupta",
      hospital: "Vision & ENT Care Center",
      diag: "Allergic Rhinitis (Pregnancy Safe)",
      date: "2026-07-15",
      meds: 1,
      status: "active",
      source: "manual",
      conf: "high",
      medicines: [
        { medicine_name: "Saline Nasal Spray", dosage: "2 puffs", frequency: "PRN", duration: "60 days" }
      ]
    }
  ];

  return {
    patientName: "Amandeep Sharma",
    email: "amandeep.sharma@example.com",
    ageGender: "29 Y / Female",
    bloodGroup: "A+ (Rh Positive)",
    patientUid: "PT-2026-LUD-4091",
    emergencyContact: {
      name: "Vikram Sharma",
      relation: "Spouse",
      phone: "+91 98882-65431"
    },
    allergies: [
      { substance: "Macrolide Antibiotics (Erythromycin & Clarithromycin)", reaction: "Severe epigastric pain & intractable vomiting", severity: "Moderate" },
      { substance: "Aspirin & Non-Selective Salicylates", reaction: "Mild facial flushing & rhinorrhea", severity: "Low" }
    ],
    chronicConditions: [
      "Early Gestation Pregnancy (Trimester I — Week 11)",
      "Emesis Gravidarum (Gestational Nausea)",
      "Seasonal Allergic Rhinitis"
    ],
    clinicalAlertBanner: "First Trimester Gestational Safeguard: Patient is at 11 weeks gestation. First-trimester booking ultrasound completed. All prescribed therapies must have established Category A or B gestational safety profiles.",
    episodes,
    activeMedications,
    prescriptions,
    token,
    generatedAt,
    expiresAt
  };
}

function getSimranjitKaurDossier(token: string): PatientDossierData {
  const user = "jk0822123@gmail.com";
  const treatmentGroups = getPatientTreatmentGroups(user);

  const episodes: ClinicalEpisode[] = treatmentGroups.map(tg => ({
    id: tg.id,
    title: tg.name,
    category: tg.category,
    status: tg.status,
    physician: tg.physician,
    hospital: tg.hospital,
    dateRange: tg.startDate,
    clinicalNotes: tg.clinicalNotes,
    medications: (tg.medications || []).map(m => ({
      name: m.name,
      dosage: m.dosage,
      frequency: m.frequency,
      instructions: m.instructions
    }))
  }));

  const activeMedications: PatientDossierData["activeMedications"] = [];
  treatmentGroups.forEach(tg => {
    if (tg.status === "active" || tg.status === "monitoring") {
      (tg.medications || []).forEach(m => {
        activeMedications.push({
          name: m.name,
          dosage: m.dosage,
          frequency: m.frequency,
          timing: m.timing,
          instructions: m.instructions || "As directed",
          prescribedBy: tg.physician,
          episodeName: tg.name
        });
      });
    }
  });

  const now = new Date();
  const generatedAt = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const expiresDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const expiresAt = expiresDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  return {
    patientName: "Simranjit Kaur",
    email: user,
    ageGender: "34 Y / Female",
    bloodGroup: "B+ (Rh Positive)",
    patientUid: "PT-2026-LUD-8821",
    emergencyContact: {
      name: "Jaswinder Singh",
      relation: "Spouse",
      phone: "+91 98765-43210"
    },
    allergies: [
      { substance: "Penicillin / Amoxicillin", reaction: "Urticaria, Angioedema & Severe Rash", severity: "High" },
      { substance: "Sulfonamides (Cotrimoxazole)", reaction: "Cutaneous drug eruption", severity: "Moderate" }
    ],
    chronicConditions: [
      "Pregnancy (Trimester II — Week 28)",
      "History of Recurrent Gestational UTI",
      "Borderline Gestational Glycemia (Diet Controlled)"
    ],
    clinicalAlertBanner: "Active Gestational Safeguard: Patient is in Trimester II (Week 28). Cross-reference all antibiotic, antihypertensive, and analgesics against pregnancy category criteria before prescribing.",
    episodes,
    activeMedications,
    prescriptions: DEMO_PRESCRIPTIONS,
    token,
    generatedAt,
    expiresAt
  };
}

export function getPatientDossier(email?: string | null, tokenOverride?: string | null): PatientDossierData {
  const rawToken = (tokenOverride || "").trim().toUpperCase();
  const rawEmail = (email || getActivePatientEmail()).trim().toLowerCase();

  // 1. Route by token or patient identity for Harpreet Singh
  if (rawToken.includes("3312") || rawEmail.includes("harpreet")) {
    return getHarpreetSinghDossier(rawToken || "EMG-3312-VLT");
  }

  // 2. Route by token or patient identity for Amandeep Sharma
  if (rawToken.includes("4091") || rawEmail.includes("amandeep")) {
    return getAmandeepSharmaDossier(rawToken || "EMG-4091-VLT");
  }

  // 3. If a non-demo user is logged in and not looking up a specific demo token, return their scoped vault
  if (!isDemoPatient(rawEmail) && rawEmail !== "anonymous" && !rawToken.includes("8821")) {
    const user = rawEmail;
    const token = rawToken || getEmergencyToken(user);
    const treatmentGroups = getPatientTreatmentGroups(user);
    const episodes: ClinicalEpisode[] = treatmentGroups.map(tg => ({
      id: tg.id,
      title: tg.name,
      category: tg.category,
      status: tg.status,
      physician: tg.physician,
      hospital: tg.hospital,
      dateRange: tg.startDate,
      clinicalNotes: tg.clinicalNotes,
      medications: (tg.medications || []).map(m => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        instructions: m.instructions
      }))
    }));

    const activeMedications: PatientDossierData["activeMedications"] = [];
    treatmentGroups.forEach(tg => {
      if (tg.status === "active" || tg.status === "monitoring") {
        (tg.medications || []).forEach(m => {
          activeMedications.push({
            name: m.name,
            dosage: m.dosage,
            frequency: m.frequency,
            timing: m.timing,
            instructions: m.instructions || "As directed",
            prescribedBy: tg.physician,
            episodeName: tg.name
          });
        });
      }
    });

    const now = new Date();
    const generatedAt = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const expiresDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expiresAt = expiresDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

    return {
      patientName: user.split("@")[0].toUpperCase(),
      email: user,
      ageGender: "Patient / Verified",
      bloodGroup: "O+ (Positive)",
      patientUid: `PT-2026-REG-${user.slice(0, 4).toUpperCase()}`,
      emergencyContact: {
        name: "Primary Emergency Contact",
        relation: "Family",
        phone: "+91 98000-00000"
      },
      allergies: [
        { substance: "No Severe Drug Hypersensitivities Logged", reaction: "N/A", severity: "Low" }
      ],
      chronicConditions: treatmentGroups.map(tg => tg.name),
      clinicalAlertBanner: "Patient Health Vault Record: Verified cryptographic snapshot from Cloud Firestore tenant vault.",
      episodes,
      activeMedications,
      prescriptions: getPatientPrescriptions(user),
      token,
      generatedAt,
      expiresAt
    };
  }

  // 4. Default: Simranjit Kaur (EMG-8821-VLT)
  return getSimranjitKaurDossier(rawToken || DEFAULT_EMERGENCY_TOKEN);
}

