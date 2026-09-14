/**
 * Clinical Drug Interaction Engine & Knowledge Model
 * 
 * Supports:
 * 1. Curated high-impact clinical pairwise interaction database.
 * 2. Extensive brand name & combination medicine alias mapping.
 * 3. Generalized Drug Class Taxonomy & Mechanism Knowledge Graph.
 * 4. Predictive WHO INN (International Nonproprietary Name) Stem Extractor
 *    to automatically classify and predict interactions for novel/unseen medicines.
 * 5. Pharmacokinetic & Pharmacodynamic interaction inference.
 * 6. Food, beverage, and lifestyle interaction screening.
 * 7. Comprehensive safety score calculation and clinical summary generation.
 * 
 * 100% Client-side, self-contained, zero-network, zero-secrets.
 */

export type SeverityLevel = "critical" | "moderate" | "minor" | "safe";

export type DrugClass =
  | "ace_inhibitor"
  | "arb"
  | "beta_blocker"
  | "calcium_channel_blocker"
  | "statin"
  | "nsaid"
  | "anticoagulant"
  | "antiplatelet"
  | "ssri"
  | "snri"
  | "benzodiazepine"
  | "opioid"
  | "fluoroquinolone"
  | "macrolide"
  | "penicillin"
  | "cephalosporin"
  | "tetracycline"
  | "proton_pump_inhibitor"
  | "h2_blocker"
  | "sulfonylurea"
  | "biguanide"
  | "sglt2_inhibitor"
  | "dpp4_inhibitor"
  | "potassium_sparing_diuretic"
  | "loop_diuretic"
  | "thiazide_diuretic"
  | "corticosteroid"
  | "pde5_inhibitor"
  | "nitrate"
  | "antifungal_azole"
  | "antiepileptic"
  | "triptan"
  | "thyroid_hormone"
  | "antihistamine"
  | "antacid"
  | "gabapentinoid"
  | "cardiac_glycoside"
  | "antiarrhythmic"
  | "immunosuppressant"
  | "xanthine_oxidase_inhibitor"
  | "muscle_relaxant"
  | "paracetamol_analgesic"
  | "unknown";

export interface FoodInteraction {
  food: string;
  severity: SeverityLevel;
  effect: string;
  recommendation: string;
}

export interface DrugProfile {
  name: string;
  genericName: string;
  drugClass: DrugClass;
  categoryLabel: string;
  cypMetabolism?: string[];
  keyRisks?: string[];
  foodInteractions?: FoodInteraction[];
  optimalTiming?: string;
  confidence: number;
  detectionSource: "database" | "brand_map" | "inn_stem_model" | "heuristic";
}

export interface InteractionResult {
  id: string;
  drug1: string;
  drug2: string;
  drug1Class: string;
  drug2Class: string;
  severity: SeverityLevel;
  title: string;
  mechanism: string;
  clinicalEffect: string;
  management: string;
  evidenceLevel: "Established" | "Probable" | "Theoretical";
  source: "direct_pair" | "class_rule" | "cyp_interaction" | "predicted_novel_stem";
}

export interface InteractionAnalysisSummary {
  safetyScore: number;
  safetyRating: "Safe" | "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk";
  totalMeds: number;
  pairsChecked: number;
  criticalCount: number;
  moderateCount: number;
  minorCount: number;
  interactions: InteractionResult[];
  foodWarnings: { drug: string; warning: FoodInteraction }[];
  timingRecommendations: { drug: string; timing: string }[];
  actionableSummary: string[];
  analyzedProfiles: DrugProfile[];
}

// ----------------------------------------------------------------------
// 1. BRAND & ALIAS MAP (Indian & International Commercial Names)
// ----------------------------------------------------------------------
export const BRAND_TO_GENERIC_MAP: Record<string, { generic: string; classHint?: DrugClass }> = {
  // Analgesics & Antipyretics
  "dolo": { generic: "paracetamol", classHint: "paracetamol_analgesic" },
  "dolo 650": { generic: "paracetamol", classHint: "paracetamol_analgesic" },
  "calpol": { generic: "paracetamol", classHint: "paracetamol_analgesic" },
  "crocin": { generic: "paracetamol", classHint: "paracetamol_analgesic" },
  "tylenol": { generic: "paracetamol", classHint: "paracetamol_analgesic" },
  "combiflam": { generic: "ibuprofen + paracetamol", classHint: "nsaid" },
  "voveran": { generic: "diclofenac", classHint: "nsaid" },
  "brufen": { generic: "ibuprofen", classHint: "nsaid" },
  "advil": { generic: "ibuprofen", classHint: "nsaid" },
  "motrin": { generic: "ibuprofen", classHint: "nsaid" },
  "aleve": { generic: "naproxen", classHint: "nsaid" },
  "naprosyn": { generic: "naproxen", classHint: "nsaid" },
  "disprin": { generic: "aspirin", classHint: "antiplatelet" },
  "ecosprin": { generic: "aspirin", classHint: "antiplatelet" },
  "aspirin 75": { generic: "aspirin", classHint: "antiplatelet" },
  "aspirin 150": { generic: "aspirin", classHint: "antiplatelet" },
  "ultram": { generic: "tramadol", classHint: "opioid" },
  "tramazac": { generic: "tramadol", classHint: "opioid" },

  // Cardiovascular & Antihypertensives
  "lipitor": { generic: "atorvastatin", classHint: "statin" },
  "atorlip": { generic: "atorvastatin", classHint: "statin" },
  "atorva": { generic: "atorvastatin", classHint: "statin" },
  "avas": { generic: "atorvastatin", classHint: "statin" },
  "crestor": { generic: "rosuvastatin", classHint: "statin" },
  "rosuvas": { generic: "rosuvastatin", classHint: "statin" },
  "rozavel": { generic: "rosuvastatin", classHint: "statin" },
  "zocor": { generic: "simvastatin", classHint: "statin" },
  "simvotin": { generic: "simvastatin", classHint: "statin" },
  "amlong": { generic: "amlodipine", classHint: "calcium_channel_blocker" },
  "stamlo": { generic: "amlodipine", classHint: "calcium_channel_blocker" },
  "norvasc": { generic: "amlodipine", classHint: "calcium_channel_blocker" },
  "telma": { generic: "telmisartan", classHint: "arb" },
  "telpres": { generic: "telmisartan", classHint: "arb" },
  "telsartan": { generic: "telmisartan", classHint: "arb" },
  "cozaar": { generic: "losartan", classHint: "arb" },
  "losar": { generic: "losartan", classHint: "arb" },
  "cardace": { generic: "ramipril", classHint: "ace_inhibitor" },
  "zestril": { generic: "lisinopril", classHint: "ace_inhibitor" },
  "betaloc": { generic: "metoprolol", classHint: "beta_blocker" },
  "metolar": { generic: "metoprolol", classHint: "beta_blocker" },
  "lopressor": { generic: "metoprolol", classHint: "beta_blocker" },
  "tenormin": { generic: "atenolol", classHint: "beta_blocker" },
  "aten": { generic: "atenolol", classHint: "beta_blocker" },
  "concor": { generic: "bisoprolol", classHint: "beta_blocker" },
  "aldactone": { generic: "spironolactone", classHint: "potassium_sparing_diuretic" },
  "lasix": { generic: "furosemide", classHint: "loop_diuretic" },
  "dytor": { generic: "torsemide", classHint: "loop_diuretic" },
  "lanoxin": { generic: "digoxin", classHint: "cardiac_glycoside" },
  "cordarone": { generic: "amiodarone", classHint: "antiarrhythmic" },
  "sorbitrate": { generic: "isosorbide dinitrate", classHint: "nitrate" },
  "nitrolingual": { generic: "nitroglycerin", classHint: "nitrate" },

  // Antidiabetics
  "glycomet": { generic: "metformin", classHint: "biguanide" },
  "cetapin": { generic: "metformin", classHint: "biguanide" },
  "glucophage": { generic: "metformin", classHint: "biguanide" },
  "amaryl": { generic: "glimepiride", classHint: "sulfonylurea" },
  "glimy": { generic: "glimepiride", classHint: "sulfonylurea" },
  "daonil": { generic: "glibenclamide", classHint: "sulfonylurea" },
  "januvia": { generic: "sitagliptin", classHint: "dpp4_inhibitor" },
  "janumet": { generic: "sitagliptin + metformin", classHint: "dpp4_inhibitor" },
  "galvus": { generic: "vildagliptin", classHint: "dpp4_inhibitor" },
  "trajenta": { generic: "linagliptin", classHint: "dpp4_inhibitor" },
  "forxiga": { generic: "dapagliflozin", classHint: "sglt2_inhibitor" },
  "jardiance": { generic: "empagliflozin", classHint: "sglt2_inhibitor" },
  "invokana": { generic: "canagliflozin", classHint: "sglt2_inhibitor" },
  "ozempic": { generic: "semaglutide", classHint: "unknown" },
  "rybelsus": { generic: "semaglutide", classHint: "unknown" },

  // Gastrointestinal & Antacids
  "pan": { generic: "pantoprazole", classHint: "proton_pump_inhibitor" },
  "pan 40": { generic: "pantoprazole", classHint: "proton_pump_inhibitor" },
  "pantocid": { generic: "pantoprazole", classHint: "proton_pump_inhibitor" },
  "pantop": { generic: "pantoprazole", classHint: "proton_pump_inhibitor" },
  "omeez": { generic: "omeprazole", classHint: "proton_pump_inhibitor" },
  "ocid": { generic: "omeprazole", classHint: "proton_pump_inhibitor" },
  "prilosec": { generic: "omeprazole", classHint: "proton_pump_inhibitor" },
  "nexpro": { generic: "esomeprazole", classHint: "proton_pump_inhibitor" },
  "nexium": { generic: "esomeprazole", classHint: "proton_pump_inhibitor" },
  "rabicip": { generic: "rabeprazole", classHint: "proton_pump_inhibitor" },
  "rantac": { generic: "ranitidine", classHint: "h2_blocker" },
  "zantac": { generic: "ranitidine", classHint: "h2_blocker" },
  "gelusil": { generic: "aluminum magnesium hydroxide", classHint: "antacid" },
  "digene": { generic: "aluminum magnesium hydroxide", classHint: "antacid" },

  // Antibiotics & Anti-infectives
  "augmentin": { generic: "amoxicillin + clavulanate", classHint: "penicillin" },
  "moxikind": { generic: "amoxicillin", classHint: "penicillin" },
  "mox": { generic: "amoxicillin", classHint: "penicillin" },
  "zifi": { generic: "cefixime", classHint: "cephalosporin" },
  "taxim-o": { generic: "cefixime", classHint: "cephalosporin" },
  "monocef": { generic: "ceftriaxone", classHint: "cephalosporin" },
  "azithral": { generic: "azithromycin", classHint: "macrolide" },
  "zithrox": { generic: "azithromycin", classHint: "macrolide" },
  "zithromax": { generic: "azithromycin", classHint: "macrolide" },
  "claribid": { generic: "clarithromycin", classHint: "macrolide" },
  "biaxin": { generic: "clarithromycin", classHint: "macrolide" },
  "cifran": { generic: "ciprofloxacin", classHint: "fluoroquinolone" },
  "ciplox": { generic: "ciprofloxacin", classHint: "fluoroquinolone" },
  "cipro": { generic: "ciprofloxacin", classHint: "fluoroquinolone" },
  "levomac": { generic: "levofloxacin", classHint: "fluoroquinolone" },
  "levaquin": { generic: "levofloxacin", classHint: "fluoroquinolone" },
  "avelox": { generic: "moxifloxacin", classHint: "fluoroquinolone" },
  "doxy-1": { generic: "doxycycline", classHint: "tetracycline" },
  "flagyl": { generic: "metronidazole", classHint: "unknown" },
  "metrogyl": { generic: "metronidazole", classHint: "unknown" },
  "diflucan": { generic: "fluconazole", classHint: "antifungal_azole" },
  "zocon": { generic: "fluconazole", classHint: "antifungal_azole" },

  // Anticoagulants & Antiplatelets
  "plavix": { generic: "clopidogrel", classHint: "antiplatelet" },
  "clopilet": { generic: "clopidogrel", classHint: "antiplatelet" },
  "deplatt": { generic: "clopidogrel", classHint: "antiplatelet" },
  "brilinta": { generic: "ticagrelor", classHint: "antiplatelet" },
  "coumadin": { generic: "warfarin", classHint: "anticoagulant" },
  "acitrom": { generic: "nicoumalone / acenocoumarol", classHint: "anticoagulant" },
  "eliquis": { generic: "apixaban", classHint: "anticoagulant" },
  "xarelto": { generic: "rivaroxaban", classHint: "anticoagulant" },
  "pradaxa": { generic: "dabigatran", classHint: "anticoagulant" },

  // Neuropsychiatric & Neuropathic
  "pregeb": { generic: "pregabalin", classHint: "gabapentinoid" },
  "lyrica": { generic: "pregabalin", classHint: "gabapentinoid" },
  "gabapin": { generic: "gabapentin", classHint: "gabapentinoid" },
  "neurontin": { generic: "gabapentin", classHint: "gabapentinoid" },
  "valium": { generic: "diazepam", classHint: "benzodiazepine" },
  "calmpose": { generic: "diazepam", classHint: "benzodiazepine" },
  "ativan": { generic: "lorazepam", classHint: "benzodiazepine" },
  "alprax": { generic: "alprazolam", classHint: "benzodiazepine" },
  "xanax": { generic: "alprazolam", classHint: "benzodiazepine" },
  "restyl": { generic: "alprazolam", classHint: "benzodiazepine" },
  "prozac": { generic: "fluoxetine", classHint: "ssri" },
  "flunil": { generic: "fluoxetine", classHint: "ssri" },
  "zoloft": { generic: "sertraline", classHint: "ssri" },
  "daxid": { generic: "sertraline", classHint: "ssri" },
  "lexapro": { generic: "escitalopram", classHint: "ssri" },
  "nexito": { generic: "escitalopram", classHint: "ssri" },

  // Allergy & Respiratory
  "allegra": { generic: "fexofenadine", classHint: "antihistamine" },
  "cetzine": { generic: "cetirizine", classHint: "antihistamine" },
  "okacet": { generic: "cetirizine", classHint: "antihistamine" },
  "zyrtec": { generic: "cetirizine", classHint: "antihistamine" },
  "claritin": { generic: "loratadine", classHint: "antihistamine" },
  "levocet": { generic: "levocetirizine", classHint: "antihistamine" },
  "montair": { generic: "montelukast", classHint: "unknown" },
  "singulair": { generic: "montelukast", classHint: "unknown" },
  "asthalin": { generic: "salbutamol", classHint: "unknown" },
  "ventolin": { generic: "salbutamol", classHint: "unknown" },
  "foracort": { generic: "budesonide + formoterol", classHint: "corticosteroid" },
  "seroflo": { generic: "fluticasone + salmeterol", classHint: "corticosteroid" },
  "flonase": { generic: "fluticasone", classHint: "corticosteroid" },

  // Endocrine & Thyroid
  "thyronorm": { generic: "levothyroxine", classHint: "thyroid_hormone" },
  "eltroxin": { generic: "levothyroxine", classHint: "thyroid_hormone" },
  "synthroid": { generic: "levothyroxine", classHint: "thyroid_hormone" },

  // Erectile Dysfunction & Pulmonary Arterial Hypertension
  "viagra": { generic: "sildenafil", classHint: "pde5_inhibitor" },
  "manforce": { generic: "sildenafil", classHint: "pde5_inhibitor" },
  "silagra": { generic: "sildenafil", classHint: "pde5_inhibitor" },
  "revatio": { generic: "sildenafil", classHint: "pde5_inhibitor" },
  "cialis": { generic: "tadalafil", classHint: "pde5_inhibitor" },
  "megalis": { generic: "tadalafil", classHint: "pde5_inhibitor" }
};

// ----------------------------------------------------------------------
// 2. WHO INN STEM TAXONOMY PATTERNS (Predicts class for NOVEL medicines)
// ----------------------------------------------------------------------
interface StemDefinition {
  pattern: RegExp;
  drugClass: DrugClass;
  categoryLabel: string;
  keyRisks: string[];
  cypProfile?: string[];
  optimalTiming?: string;
  foodWarnings?: FoodInteraction[];
}

export const INN_STEM_DEFINITIONS: StemDefinition[] = [
  {
    pattern: /pril$/i,
    drugClass: "ace_inhibitor",
    categoryLabel: "ACE Inhibitor (Antihypertensive)",
    keyRisks: ["Hyperkalemia", "Cough", "Angioedema", "Hypotension"],
    optimalTiming: "Take at the same time each day; evening dosing often optimizes 24-hour BP control.",
    foodWarnings: [
      {
        food: "High-Potassium Foods & Salt Substitutes",
        severity: "moderate",
        effect: "Additive potassium retention risking hyperkalemia and cardiac conduction abnormalities.",
        recommendation: "Avoid potassium-based salt substitutes; consult doctor before using potassium supplements."
      }
    ]
  },
  {
    pattern: /sartan$/i,
    drugClass: "arb",
    categoryLabel: "Angiotensin II Receptor Blocker (ARB)",
    keyRisks: ["Hyperkalemia", "Renal impairment", "Hypotension"],
    optimalTiming: "Take once daily, with or without food, consistently.",
    foodWarnings: [
      {
        food: "High-Potassium Foods & Salt Substitutes",
        severity: "moderate",
        effect: "Risk of potassium accumulation (hyperkalemia).",
        recommendation: "Moderate potassium intake and avoid potassium chloride salt substitutes."
      }
    ]
  },
  {
    pattern: /olol$/i,
    drugClass: "beta_blocker",
    categoryLabel: "Beta-Adrenergic Blocker",
    keyRisks: ["Bradycardia", "Masked hypoglycemia", "Bronchospasm", "Fatigue"],
    optimalTiming: "Take with or immediately after meals (especially carvedilol/metoprolol) to reduce peak hypotensive effect.",
    foodWarnings: [
      {
        food: "Alcohol",
        severity: "moderate",
        effect: "Can cause additive blood pressure reduction, resulting in dizziness, syncope, or orthostasis.",
        recommendation: "Limit or avoid alcohol consumption while on beta blockers."
      }
    ]
  },
  {
    pattern: /dipine$/i,
    drugClass: "calcium_channel_blocker",
    categoryLabel: "Dihydropyridine Calcium Channel Blocker",
    keyRisks: ["Peripheral edema", "Reflex tachycardia", "Flushing"],
    cypProfile: ["CYP3A4 substrate"],
    optimalTiming: "Take in the morning or evening as prescribed; do not crush extended-release formulations.",
    foodWarnings: [
      {
        food: "Grapefruit / Grapefruit Juice",
        severity: "moderate",
        effect: "Inhibits intestinal CYP3A4, causing increased drug bioavailability and excessive hypotension.",
        recommendation: "Avoid consuming grapefruit or its juice while taking dihydropyridine calcium channel blockers."
      }
    ]
  },
  {
    pattern: /statin$/i,
    drugClass: "statin",
    categoryLabel: "HMG-CoA Reductase Inhibitor (Statin)",
    keyRisks: ["Myopathy", "Rhabdomyolysis", "Elevated hepatic transaminases"],
    cypProfile: ["CYP3A4 substrate (atorvastatin, simvastatin)"],
    optimalTiming: "Take in the evening or before bedtime, as physiological hepatic cholesterol synthesis peaks overnight.",
    foodWarnings: [
      {
        food: "Grapefruit & Seville Oranges",
        severity: "critical",
        effect: "Inhibits intestinal CYP3A4 degradation, causing up to 5-fold rise in statin blood levels, drastically increasing rhabdomyolysis risk.",
        recommendation: "Do not consume grapefruit juice with atorvastatin, simvastatin, or lovastatin."
      }
    ]
  },
  {
    pattern: /prazole$/i,
    drugClass: "proton_pump_inhibitor",
    categoryLabel: "Proton Pump Inhibitor (PPI)",
    keyRisks: ["Hypomagnesemia", "Decreased calcium/B12 absorption", "C. difficile risk"],
    cypProfile: ["CYP2C19 substrate/inhibitor", "CYP3A4 substrate"],
    optimalTiming: "Take 30 to 60 minutes before the first meal of the day on an empty stomach for maximum acid pump inhibition."
  },
  {
    pattern: /oxacin$/i,
    drugClass: "fluoroquinolone",
    categoryLabel: "Fluoroquinolone Antibiotic",
    keyRisks: ["QTc prolongation", "Tendonitis / Tendon rupture", "Dysglycemia", "CNS toxicity"],
    optimalTiming: "Take with a full glass of water. Space apart from mineral-containing products.",
    foodWarnings: [
      {
        food: "Dairy, Calcium, Iron, Antacids",
        severity: "moderate",
        effect: "Polyvalent cations form insoluble chelates, reducing antibiotic absorption by over 60%.",
        recommendation: "Take fluoroquinolones at least 2 hours before or 4 hours after dairy products or calcium-fortified juices."
      }
    ]
  },
  {
    pattern: /thromycin$|mycin$/i,
    drugClass: "macrolide",
    categoryLabel: "Macrolide Antibacterial",
    keyRisks: ["QTc prolongation", "Potent CYP3A4 inhibition", "Hepatotoxicity"],
    cypProfile: ["Potent CYP3A4 inhibitor (clarithromycin, erythromycin)"]
  },
  {
    pattern: /cillin$/i,
    drugClass: "penicillin",
    categoryLabel: "Beta-Lactam Antibiotic (Penicillin)",
    keyRisks: ["Hypersensitivity", "Diarrhea", "Methotrexate clearance competition"],
    optimalTiming: "Take at evenly spaced intervals throughout the day with full glass of water."
  },
  {
    pattern: /ceph|cef/i,
    drugClass: "cephalosporin",
    categoryLabel: "Cephalosporin Antibiotic",
    keyRisks: ["Cross-allergenicity with penicillin", "GI distress"]
  },
  {
    pattern: /cycline$/i,
    drugClass: "tetracycline",
    categoryLabel: "Tetracycline Antibiotic",
    keyRisks: ["Photosensitivity", "Esophagitis", "Chelation with cations"],
    foodWarnings: [
      {
        food: "Milk & Dairy Products",
        severity: "moderate",
        effect: "Calcium chelates tetracycline molecules, severely impairing GI absorption.",
        recommendation: "Separate intake by at least 2 to 3 hours from dairy products."
      }
    ]
  },
  {
    pattern: /gliptin$/i,
    drugClass: "dpp4_inhibitor",
    categoryLabel: "DPP-4 Inhibitor (Incretin Enhancer)",
    keyRisks: ["Pancreatitis", "Joint pain", "Hypoglycemia when combined with sulfonylurea"],
    optimalTiming: "Take once daily with or without food."
  },
  {
    pattern: /gliflozin$/i,
    drugClass: "sglt2_inhibitor",
    categoryLabel: "SGLT2 Inhibitor (Glucuretic)",
    keyRisks: ["Euglycemic DKA", "Genital mycotic infections", "Dehydration / Hypotension"],
    optimalTiming: "Take in the morning with or without food; maintain adequate daily hydration."
  },
  {
    pattern: /glitazone$/i,
    drugClass: "unknown",
    categoryLabel: "Thiazolidinedione Antidiabetic",
    keyRisks: ["Fluid retention / Heart failure exacerbation", "Weight gain"]
  },
  {
    pattern: /coxib$/i,
    drugClass: "nsaid",
    categoryLabel: "Selective COX-2 Inhibitor NSAID",
    keyRisks: ["Thrombotic cardiovascular events", "Renal impairment", "GI ulceration"],
    optimalTiming: "Take with food to minimize dyspepsia."
  },
  {
    pattern: /profen$|fenac$|oxicam$/i,
    drugClass: "nsaid",
    categoryLabel: "Non-Steroidal Anti-Inflammatory Drug (NSAID)",
    keyRisks: ["GI ulceration / bleeding", "Renal impairment", "Fluid retention", "Platelet dysfunction"],
    optimalTiming: "Always take with food or milk to protect stomach lining.",
    foodWarnings: [
      {
        food: "Alcohol",
        severity: "moderate",
        effect: "Significantly potentiates gastric mucosal damage and increases gastrointestinal bleeding risk.",
        recommendation: "Avoid or strictly limit alcohol consumption while taking NSAIDs."
      }
    ]
  },
  {
    pattern: /xaban$|gatran$/i,
    drugClass: "anticoagulant",
    categoryLabel: "Direct Oral Anticoagulant (DOAC)",
    keyRisks: ["Major bleeding", "Spinal/epidural hematoma risk"],
    optimalTiming: "Rivaroxaban 15mg/20mg MUST be taken with food for optimal absorption. Take doses at strictly consistent intervals.",
    foodWarnings: [
      {
        food: "Alcohol",
        severity: "critical",
        effect: "Increases bleeding risk and causes unpredictable coagulation dynamics.",
        recommendation: "Avoid heavy alcohol consumption on anticoagulants."
      }
    ]
  },
  {
    pattern: /parin$/i,
    drugClass: "anticoagulant",
    categoryLabel: "Low Molecular Weight Heparin",
    keyRisks: ["Bleeding", "Heparin-induced thrombocytopenia"]
  },
  {
    pattern: /triptan$/i,
    drugClass: "triptan",
    categoryLabel: "5-HT1 Receptor Agonist (Triptan)",
    keyRisks: ["Vasospasm", "Serotonin syndrome when combined with SSRI/SNRI/MAOI", "Hypertension"],
    optimalTiming: "Take at first sign of migraine onset."
  },
  {
    pattern: /afil$/i,
    drugClass: "pde5_inhibitor",
    categoryLabel: "Phosphodiesterase-5 (PDE5) Inhibitor",
    keyRisks: ["Profound hypotension with nitrates", "Priapism", "Vision changes"],
    optimalTiming: "Take 30-60 minutes before planned activity; avoid high-fat meals prior to sildenafil.",
    foodWarnings: [
      {
        food: "Grapefruit & Excessive Alcohol",
        severity: "moderate",
        effect: "Grapefruit increases drug exposure; alcohol exacerbates orthostatic hypotension.",
        recommendation: "Avoid grapefruit juice and excessive alcohol with PDE5 inhibitors."
      }
    ]
  },
  {
    pattern: /pam$|lam$/i,
    drugClass: "benzodiazepine",
    categoryLabel: "Benzodiazepine (Anxiolytic / Sedative)",
    keyRisks: ["Severe CNS depression", "Respiratory arrest with opioids/alcohol", "Dependence"],
    optimalTiming: "Take shortly before bedtime if prescribed for sleep; avoid operating machinery.",
    foodWarnings: [
      {
        food: "Alcohol",
        severity: "critical",
        effect: "Potent synergistic GABA-ergic central nervous system depression leading to coma or respiratory arrest.",
        recommendation: "Never consume alcohol while taking benzodiazepines."
      }
    ]
  },
  {
    pattern: /asone$|olone$|onide$/i,
    drugClass: "corticosteroid",
    categoryLabel: "Corticosteroid",
    keyRisks: ["Hyperglycemia", "Immunosuppression", "Adrenal suppression", "GI ulceration"],
    optimalTiming: "Take oral steroids in the morning with breakfast to mimic physiological diurnal cortisol peak and minimize insomnia."
  },
  {
    pattern: /tidine$/i,
    drugClass: "h2_blocker",
    categoryLabel: "H2 Receptor Antagonist",
    keyRisks: ["Altered absorption of pH-dependent medications"],
    optimalTiming: "Take at bedtime or 30-60 minutes before meals provoking heartburn."
  },
  {
    pattern: /zosin$/i,
    drugClass: "unknown",
    categoryLabel: "Alpha-1 Adrenergic Receptor Blocker",
    keyRisks: ["First-dose syncope", "Orthostatic hypotension"],
    optimalTiming: "Take initial dose at bedtime to minimize symptomatic orthostasis."
  },
  {
    pattern: /conazole$/i,
    drugClass: "antifungal_azole",
    categoryLabel: "Azole Antifungal",
    keyRisks: ["Potent CYP3A4 & CYP2C9 inhibition", "Hepatotoxicity", "QTc prolongation"],
    cypProfile: ["Potent CYP3A4 inhibitor", "CYP2C9 inhibitor"]
  },
  {
    pattern: /mab$/i,
    drugClass: "immunosuppressant",
    categoryLabel: "Monoclonal Antibody",
    keyRisks: ["Infection risk", "Infusion reactions", "Immune modulation"]
  },
  {
    pattern: /nib$/i,
    drugClass: "unknown",
    categoryLabel: "Targeted Kinase Inhibitor",
    keyRisks: ["CYP3A4 interactions", "Hypertension", "QTc prolongation"]
  },
  {
    pattern: /vir$|civir$|buvir$/i,
    drugClass: "unknown",
    categoryLabel: "Antiviral Agent",
    keyRisks: ["Renal tubular secretion competition", "Drug-drug interactions"]
  },
  {
    pattern: /dronate$/i,
    drugClass: "unknown",
    categoryLabel: "Bisphosphonate",
    keyRisks: ["Severe chemical esophagitis", "Osteonecrosis of jaw"],
    optimalTiming: "Take first thing in the morning with 8 oz of plain water; remain strictly upright for 30 minutes.",
    foodWarnings: [
      {
        food: "Any Food, Coffee, or Juice",
        severity: "moderate",
        effect: "Presence of any food or non-water beverage reduces oral bioavailability to virtually zero.",
        recommendation: "Take only with plain tap water on a completely empty stomach."
      }
    ]
  }
];

// ----------------------------------------------------------------------
// 3. KNOWN DIRECT GENERIC PHARMACOLOGICAL PROFILES
// ----------------------------------------------------------------------
export const KNOWN_GENERIC_PROFILES: Record<string, Partial<DrugProfile>> = {
  "metformin": {
    genericName: "metformin",
    drugClass: "biguanide",
    categoryLabel: "Biguanide Antidiabetic",
    keyRisks: ["Lactic acidosis", "Gastrointestinal distress", "Vitamin B12 deficiency"],
    optimalTiming: "Take with or immediately after meals to minimize abdominal cramping and diarrhea.",
    foodInteractions: [
      {
        food: "Alcohol",
        severity: "moderate",
        effect: "Potentiates Metformin's effect on lactate metabolism, elevating the risk of rare but life-threatening lactic acidosis.",
        recommendation: "Avoid heavy alcohol consumption or binge drinking while taking Metformin."
      }
    ]
  },
  "glimepiride": {
    genericName: "glimepiride",
    drugClass: "sulfonylurea",
    categoryLabel: "Second-Generation Sulfonylurea",
    keyRisks: ["Hypoglycemia", "Weight gain"],
    optimalTiming: "Take shortly before or with the first main meal of the day (usually breakfast)."
  },
  "glipizide": {
    genericName: "glipizide",
    drugClass: "sulfonylurea",
    categoryLabel: "Sulfonylurea Antidiabetic",
    keyRisks: ["Hypoglycemia"],
    optimalTiming: "Take 30 minutes before meals."
  },
  "atorvastatin": {
    genericName: "atorvastatin",
    drugClass: "statin",
    categoryLabel: "HMG-CoA Reductase Inhibitor",
    keyRisks: ["Myopathy", "Rhabdomyolysis", "Hepatotoxicity"],
    optimalTiming: "Take once daily in the evening or at bedtime.",
    cypMetabolism: ["CYP3A4 substrate"],
    foodInteractions: [
      {
        food: "Grapefruit / Grapefruit Juice",
        severity: "critical",
        effect: "Blocks intestinal CYP3A4 enzymes, causing toxic accumulation of atorvastatin and triggering muscle necrosis.",
        recommendation: "Avoid drinking grapefruit juice or eating grapefruit."
      }
    ]
  },
  "rosuvastatin": {
    genericName: "rosuvastatin",
    drugClass: "statin",
    categoryLabel: "HMG-CoA Reductase Inhibitor",
    keyRisks: ["Myopathy", "Proteinuria"],
    optimalTiming: "Can be taken at any time of day, with or without food, but keep timing consistent."
  },
  "pregabalin": {
    genericName: "pregabalin",
    drugClass: "gabapentinoid",
    categoryLabel: "GABA Analogue / Anticonvulsant",
    keyRisks: ["CNS depression", "Peripheral edema", "Dizziness / Somnolence"],
    optimalTiming: "Take at bedtime if single daily dose, or divided with/without food.",
    foodInteractions: [
      {
        food: "Alcohol",
        severity: "moderate",
        effect: "Additive central nervous system depression leading to profound drowsiness, motor impairment, and falls.",
        recommendation: "Refrain from alcohol while taking Pregabalin."
      }
    ]
  },
  "gabapentin": {
    genericName: "gabapentin",
    drugClass: "gabapentinoid",
    categoryLabel: "Gabapentinoid Anticonvulsant",
    keyRisks: ["Drowsiness", "Ataxia", "Respiratory depression with CNS depressants"],
    optimalTiming: "Take first dose on day 1 at bedtime to minimize daytime somnolence."
  },
  "cetirizine": {
    genericName: "cetirizine",
    drugClass: "antihistamine",
    categoryLabel: "Second-Generation Antihistamine",
    keyRisks: ["Mild sedation", "Dry mouth"],
    optimalTiming: "Take in the evening as it may cause slight drowsiness.",
    foodInteractions: [
      {
        food: "Alcohol",
        severity: "minor",
        effect: "Increased sedation and slower reaction times.",
        recommendation: "Avoid alcohol if planning to drive or operate equipment."
      }
    ]
  },
  "levocetirizine": {
    genericName: "levocetirizine",
    drugClass: "antihistamine",
    categoryLabel: "Antihistamine",
    optimalTiming: "Take in the evening."
  },
  "fexofenadine": {
    genericName: "fexofenadine",
    drugClass: "antihistamine",
    categoryLabel: "Non-Sedating Antihistamine",
    optimalTiming: "Take with water; avoid taking with fruit juices (apple, orange, grapefruit) which inhibit OATP1A2 transporters."
  },
  "amoxicillin": {
    genericName: "amoxicillin",
    drugClass: "penicillin",
    categoryLabel: "Aminopenicillin Antibiotic",
    optimalTiming: "Take every 8 or 12 hours with or without food; finish the full prescribed course."
  },
  "paracetamol": {
    genericName: "paracetamol",
    drugClass: "paracetamol_analgesic",
    categoryLabel: "Analgesic & Antipyretic",
    keyRisks: ["Hepatotoxicity at doses exceeding 4g/day"],
    optimalTiming: "Take as needed with a minimum 4 to 6-hour interval between doses. Do not exceed 4,000 mg in 24 hours.",
    foodInteractions: [
      {
        food: "Chronic Alcohol Use",
        severity: "moderate",
        effect: "Induces CYP2E1, converting paracetamol into toxic metabolite NAPQI, drastically lowering threshold for fatal liver toxicity.",
        recommendation: "Limit paracetamol to under 2g/day or avoid if consuming 3+ alcoholic beverages daily."
      }
    ]
  },
  "aspirin": {
    genericName: "aspirin",
    drugClass: "antiplatelet",
    categoryLabel: "Antiplatelet / Salicylate",
    keyRisks: ["GI hemorrhage", "Gastric erosion", "Bleeding diathesis"],
    optimalTiming: "Take with food or a large glass of water to reduce stomach irritation."
  },
  "clopidogrel": {
    genericName: "clopidogrel",
    drugClass: "antiplatelet",
    categoryLabel: "P2Y12 Platelet Inhibitor",
    cypMetabolism: ["CYP2C19 bioactivation substrate"],
    keyRisks: ["Bleeding", "Bruising"],
    optimalTiming: "Take once daily with or without food at the same time each day."
  },
  "warfarin": {
    genericName: "warfarin",
    drugClass: "anticoagulant",
    categoryLabel: "Vitamin K Antagonist Anticoagulant",
    keyRisks: ["Major fatal hemorrhage", "Narrow therapeutic index (INR 2.0-3.0)"],
    cypMetabolism: ["CYP2C9 substrate"],
    optimalTiming: "Take once daily in the evening at 6:00 PM for consistent INR monitoring.",
    foodInteractions: [
      {
        food: "Vitamin K Rich Foods (Spinach, Kale, Broccoli, Green Tea)",
        severity: "critical",
        effect: "Directly antagonizes Warfarin's mechanism, causing precipitous drop in INR and heightened stroke/thromboembolism risk.",
        recommendation: "Keep dietary vitamin K intake strictly consistent day-to-day; avoid abrupt diet swings."
      },
      {
        food: "Cranberry Juice & Alcohol",
        severity: "moderate",
        effect: "Can dangerously increase INR and induce spontaneous bleeding.",
        recommendation: "Avoid cranberry juice and alcohol while taking Warfarin."
      }
    ]
  },
  "apixaban": {
    genericName: "apixaban",
    drugClass: "anticoagulant",
    categoryLabel: "Factor Xa Inhibitor (DOAC)",
    keyRisks: ["Bleeding"],
    optimalTiming: "Take twice daily, approximately 12 hours apart, with or without food."
  },
  "rivaroxaban": {
    genericName: "rivaroxaban",
    drugClass: "anticoagulant",
    categoryLabel: "Factor Xa Inhibitor (DOAC)",
    keyRisks: ["Bleeding"],
    optimalTiming: "Doses of 15 mg and 20 mg must be taken WITH the evening meal to guarantee bioavailability."
  },
  "pantoprazole": {
    genericName: "pantoprazole",
    drugClass: "proton_pump_inhibitor",
    categoryLabel: "Proton Pump Inhibitor",
    optimalTiming: "Take 30 to 60 minutes before morning breakfast."
  },
  "omeprazole": {
    genericName: "omeprazole",
    drugClass: "proton_pump_inhibitor",
    categoryLabel: "Proton Pump Inhibitor",
    cypMetabolism: ["CYP2C19 potent competitive inhibitor"],
    optimalTiming: "Take 30 to 60 minutes before morning breakfast."
  },
  "ciprofloxacin": {
    genericName: "ciprofloxacin",
    drugClass: "fluoroquinolone",
    categoryLabel: "Fluoroquinolone Antibiotic",
    keyRisks: ["QTc prolongation", "Tendon rupture", "Photosensitivity"],
    optimalTiming: "Take twice daily; drink plenty of fluids to prevent crystalluria."
  },
  "azithromycin": {
    genericName: "azithromycin",
    drugClass: "macrolide",
    categoryLabel: "Azalide / Macrolide Antibiotic",
    keyRisks: ["QTc prolongation", "Cardiac arrhythmia"],
    optimalTiming: "Take once daily for 3-5 days. Can be taken with food if stomach upset occurs."
  },
  "clarithromycin": {
    genericName: "clarithromycin",
    drugClass: "macrolide",
    categoryLabel: "Macrolide Antibiotic",
    cypMetabolism: ["Potent CYP3A4 inhibitor"],
    keyRisks: ["QTc prolongation", "Severe drug interactions"],
    optimalTiming: "Take with or without food every 12 hours."
  },
  "levothyroxine": {
    genericName: "levothyroxine",
    drugClass: "thyroid_hormone",
    categoryLabel: "Synthetic Thyroid Hormone (T4)",
    keyRisks: ["Cardiac palpitations / arrhythmias if overdosed"],
    optimalTiming: "Must take first thing in the morning with a full glass of water, on an empty stomach, at least 30 to 60 minutes before any food, coffee, or other medicines.",
    foodInteractions: [
      {
        food: "Coffee, Espresso, Calcium, Iron, Soy",
        severity: "moderate",
        effect: "Significantly binds levothyroxine in the intestinal lumen, cutting therapeutic absorption by up to 55%.",
        recommendation: "Wait at least 60 minutes before drinking morning coffee; separate calcium/iron supplements by 4 hours."
      }
    ]
  },
  "tramadol": {
    genericName: "tramadol",
    drugClass: "opioid",
    categoryLabel: "Centrally Acting Opioid & SNRI",
    keyRisks: ["Seizures", "Serotonin syndrome", "Respiratory depression", "Addiction"],
    optimalTiming: "Take as prescribed with or without food. Never exceed maximum daily limit (400mg)."
  },
  "sildenafil": {
    genericName: "sildenafil",
    drugClass: "pde5_inhibitor",
    categoryLabel: "PDE5 Inhibitor",
    keyRisks: ["Fatal hypotension with nitrates", "Priapism"],
    optimalTiming: "Take approximately 60 minutes before sexual activity."
  },
  "tadalafil": {
    genericName: "tadalafil",
    drugClass: "pde5_inhibitor",
    categoryLabel: "Long-Acting PDE5 Inhibitor",
    keyRisks: ["Fatal hypotension with nitrates"],
    optimalTiming: "Take at least 30 minutes prior to anticipated activity, or once daily at the same time."
  },
  "spironolactone": {
    genericName: "spironolactone",
    drugClass: "potassium_sparing_diuretic",
    categoryLabel: "Aldosterone Antagonist Diuretic",
    keyRisks: ["Severe hyperkalemia", "Gynecomastia", "Dehydration"],
    optimalTiming: "Take in the morning with food to enhance absorption and prevent nocturia."
  },
  "furosemide": {
    genericName: "furosemide",
    drugClass: "loop_diuretic",
    categoryLabel: "Loop Diuretic",
    keyRisks: ["Hypokalemia", "Hypomagnesemia", "Dehydration", "Ototoxicity"],
    optimalTiming: "Take in the morning (before 2 PM) to avoid disruptive nighttime urination."
  },
  "digoxin": {
    genericName: "digoxin",
    drugClass: "cardiac_glycoside",
    categoryLabel: "Cardiac Glycoside",
    keyRisks: ["Fatal cardiac arrhythmias", "Narrow therapeutic window (0.5-0.9 ng/mL)"],
    optimalTiming: "Take at the exact same time every day. Never double up doses."
  },
  "amiodarone": {
    genericName: "amiodarone",
    drugClass: "antiarrhythmic",
    categoryLabel: "Class III Antiarrhythmic",
    keyRisks: ["Pulmonary fibrosis", "Thyroid dysfunction", "Extensive CYP inhibition"],
    cypMetabolism: ["CYP3A4 inhibitor", "CYP2C9 inhibitor", "P-gp inhibitor"]
  },
  "allopurinol": {
    genericName: "allopurinol",
    drugClass: "xanthine_oxidase_inhibitor",
    categoryLabel: "Xanthine Oxidase Inhibitor",
    keyRisks: ["Severe cutaneous adverse reactions (SCAR/Stevens-Johnson)", "Azathioprine toxicity"],
    optimalTiming: "Take after meals with abundant fluid intake (at least 2 liters of water daily)."
  },
  "fluconazole": {
    genericName: "fluconazole",
    drugClass: "antifungal_azole",
    categoryLabel: "Triazole Antifungal",
    cypMetabolism: ["Potent CYP2C9 inhibitor", "Moderate CYP3A4 inhibitor"],
    keyRisks: ["QTc prolongation", "Massive elevation of warfarin, statin, or phenytoin levels"]
  }
};

// ----------------------------------------------------------------------
// 4. GENERALIZED CLASS-TO-CLASS INTERACTION MATRIX
// ----------------------------------------------------------------------
interface ClassInteractionRule {
  class1: DrugClass;
  class2: DrugClass;
  severity: SeverityLevel;
  title: string;
  mechanism: string;
  clinicalEffect: string;
  management: string;
  evidenceLevel: "Established" | "Probable" | "Theoretical";
}

export const CLASS_INTERACTION_RULES: ClassInteractionRule[] = [
  // 1. Anticoagulant + NSAID
  {
    class1: "anticoagulant",
    class2: "nsaid",
    severity: "critical",
    title: "Severe Hemorrhagic Risk (Gastrointestinal & Systemic Bleeding)",
    mechanism: "NSAIDs cause gastric mucosal injury and platelet dysfunction via COX inhibition, while anticoagulants impair fibrin clotting cascade.",
    clinicalEffect: "Marked 3 to 6-fold increase in major gastrointestinal bleeding, ulcer perforation, and potentially fatal internal hemorrhage.",
    management: "Avoid concurrent use. If analgesia is needed, use paracetamol or topical agents. If strictly mandatory, co-prescribe a gastroprotective PPI.",
    evidenceLevel: "Established"
  },
  // 2. Antiplatelet + Anticoagulant
  {
    class1: "anticoagulant",
    class2: "antiplatelet",
    severity: "critical",
    title: "Dual Hemostatic Inhibition (Elevated Bleeding Diathesis)",
    mechanism: "Simultaneous inhibition of platelet aggregation (antiplatelet) and coagulation cascade factors (anticoagulant).",
    clinicalEffect: "Significantly heightened risk of intracranial hemorrhage and gastrointestinal bleeding.",
    management: "Combination requires strict specialist cardiology/hematology oversight (e.g. triple therapy duration minimized). Monitor hematocrit and signs of bleeding.",
    evidenceLevel: "Established"
  },
  // 3. PDE5 Inhibitor + Nitrate
  {
    class1: "pde5_inhibitor",
    class2: "nitrate",
    severity: "critical",
    title: "Life-Threatening Hypotension & Circulatory Collapse",
    mechanism: "Nitrates generate cyclic GMP while PDE5 inhibitors block its degradation, causing extreme synergy in vascular smooth muscle relaxation.",
    clinicalEffect: "Severe refractory precipitous blood pressure drop, coronary hypoperfusion, myocardial infarction, and syncope.",
    management: "ABSOLUTELY CONTRAINDICATED. Never administer nitrates within 24 hours of sildenafil or 48 hours of tadalafil.",
    evidenceLevel: "Established"
  },
  // 4. ACE Inhibitor / ARB + Potassium Sparing Diuretic
  {
    class1: "ace_inhibitor",
    class2: "potassium_sparing_diuretic",
    severity: "critical",
    title: "Severe Hyperkalemia Risk & Cardiac Conduction Block",
    mechanism: "ACE inhibitors suppress aldosterone secretion while spironolactone blocks renal aldosterone receptors, eliminating potassium excretion.",
    clinicalEffect: "Serum potassium may climb > 6.0 mEq/L, triggering fatal ventricular arrhythmias, sine waves on ECG, and cardiac arrest.",
    management: "Monitor serum potassium and creatinine within 1-2 weeks of initiation. Avoid potassium supplements or salt substitutes.",
    evidenceLevel: "Established"
  },
  {
    class1: "arb",
    class2: "potassium_sparing_diuretic",
    severity: "critical",
    title: "Severe Hyperkalemia Risk & Cardiac Conduction Block",
    mechanism: "ARBs blunt aldosterone secretion while potassium-sparing diuretics prevent potassium excretion in the distal nephron.",
    clinicalEffect: "Severe hyperkalemia leading to cardiac arrhythmias and muscular weakness.",
    management: "Regular serum electrolytes monitoring. Avoid potassium-rich dietary salt substitutes.",
    evidenceLevel: "Established"
  },
  // 5. Statin + Macrolide / Azole (CYP3A4-mediated rhabdomyolysis)
  {
    class1: "statin",
    class2: "macrolide",
    severity: "critical",
    title: "Statin Toxicity & Severe Rhabdomyolysis / Acute Kidney Injury",
    mechanism: "Macrolides (clarithromycin/erythromycin) potently inhibit CYP3A4, causing a 4 to 10-fold increase in statin plasma concentrations.",
    clinicalEffect: "Severe muscle breakdown (rhabdomyolysis), myoglobinuria, dark brown urine, and acute renal failure.",
    management: "Temporarily suspend statin therapy during the short course of macrolide antibiotic, or switch to azithromycin which does not inhibit CYP3A4.",
    evidenceLevel: "Established"
  },
  {
    class1: "statin",
    class2: "antifungal_azole",
    severity: "critical",
    title: "Marked Statin Accumulation & Rhabdomyolysis",
    mechanism: "Azole antifungals potently inactivate hepatic and intestinal CYP3A4/CYP2C9 clearance of statins.",
    clinicalEffect: "Severe toxic myopathy, extreme CPK elevation, and myoglobin-induced kidney necrosis.",
    management: "Hold atorvastatin/simvastatin during systemic azole antifungal therapy. Pravastatin or rosuvastatin may be used with caution.",
    evidenceLevel: "Established"
  },
  // 6. Benzodiazepine + Opioid
  {
    class1: "benzodiazepine",
    class2: "opioid",
    severity: "critical",
    title: "Profound Synergistic CNS & Fatal Respiratory Depression",
    mechanism: "Additive and synergistic inhibition of brainstem respiratory rhythm generation via GABA-A and mu-opioid receptor pathways.",
    clinicalEffect: "Severe sedation, hypoventilation, hypercapnia, coma, and fatal respiratory arrest (FDA Black Box Warning).",
    management: "Avoid combination whenever possible. If unavoidable, prescribe the lowest effective dosages and ensure naloxone availability.",
    evidenceLevel: "Established"
  },
  // 7. SSRI / SNRI + Opioid (Tramadol)
  {
    class1: "ssri",
    class2: "opioid",
    severity: "critical",
    title: "Serotonin Syndrome Toxicity",
    mechanism: "SSRI blocks serotonin reuptake while tramadol both blocks serotonin/norepinephrine reuptake and stimulates release.",
    clinicalEffect: "Excessive CNS serotonin stimulation leading to hyperthermia, tremor, hyperreflexia, clonus, delirium, and autonomic instability.",
    management: "Avoid combining tramadol with SSRIs/SNRIs. Choose alternative analgesics like paracetamol or consult a physician immediately if symptoms arise.",
    evidenceLevel: "Established"
  },
  // 8. SSRI / SNRI + Triptan
  {
    class1: "ssri",
    class2: "triptan",
    severity: "moderate",
    title: "Potential Serotonin Excess Risk",
    mechanism: "Additive serotonergic stimulation across central 5-HT receptors.",
    clinicalEffect: "Risk of restlessness, shivering, autonomic hyperactivity, and agitation.",
    management: "Inform patient of symptoms of serotonin syndrome; monitor closely if migraine triptans are used with antidepressants.",
    evidenceLevel: "Probable"
  },
  // 9. ACE Inhibitor / ARB + NSAID (The Renal "Double / Triple Whammy")
  {
    class1: "ace_inhibitor",
    class2: "nsaid",
    severity: "moderate",
    title: "Acute Kidney Injury & Blunted Blood Pressure Control",
    mechanism: "NSAIDs inhibit vasodilatory prostaglandins at afferent renal arterioles, while ACE inhibitors dilate efferent arterioles, collapsing glomerular filtration pressure.",
    clinicalEffect: "Acute kidney injury (elevated creatinine), sodium/water retention, and loss of hypertensive control.",
    management: "Avoid chronic concurrent use. Use paracetamol for analgesia. If NSAIDs are essential, monitor renal function and hydration.",
    evidenceLevel: "Established"
  },
  {
    class1: "arb",
    class2: "nsaid",
    severity: "moderate",
    title: "Renal Hemodynamic Impairment & Reduced Antihypertensive Efficacy",
    mechanism: "Afferent renal arteriolar vasoconstriction (NSAID) paired with efferent vasodilation (ARB) severely diminishes glomerular filtration rate.",
    clinicalEffect: "Deterioration in renal function and blunted antihypertensive response.",
    management: "Avoid long-term co-administration. Monitor BUN, serum creatinine, and blood pressure.",
    evidenceLevel: "Established"
  },
  // 10. Clopidogrel + Proton Pump Inhibitor (Omeprazole)
  {
    class1: "antiplatelet",
    class2: "proton_pump_inhibitor",
    severity: "moderate",
    title: "Reduced Antiplatelet Activation & Elevated Thrombotic Risk",
    mechanism: "Certain PPIs (particularly omeprazole/esomeprazole) competitively inhibit CYP2C19, preventing clopidogrel conversion into its active antiplatelet metabolite.",
    clinicalEffect: "Decreased platelet inhibition, increasing the risk of stent thrombosis and secondary ischemic cardiovascular events.",
    management: "If gastroprotection is needed with clopidogrel, choose pantoprazole or rabeprazole, which have minimal CYP2C19 inhibitory potency.",
    evidenceLevel: "Established"
  },
  // 11. Beta Blocker + Non-Dihydropyridine CCB
  {
    class1: "beta_blocker",
    class2: "calcium_channel_blocker",
    severity: "moderate",
    title: "Additive Bradycardia & Negative Inotropic Depression",
    mechanism: "Additive suppression of AV nodal conduction and myocardial contractility.",
    clinicalEffect: "Symptomatic sinus bradycardia, heart block, hypotension, and potential worsening of congestive heart failure.",
    management: "Avoid non-dihydropyridines (verapamil/diltiazem) with beta blockers. Dihydropyridines (amlodipine) are safer but still require pulse monitoring.",
    evidenceLevel: "Established"
  },
  // 12. Antidiabetic + Fluoroquinolone
  {
    class1: "sulfonylurea",
    class2: "fluoroquinolone",
    severity: "moderate",
    title: "Dysglycemia & Severe Refractory Hypoglycemia",
    mechanism: "Fluoroquinolones block ATP-sensitive potassium channels in pancreatic beta-islet cells, stimulating excessive insulin release alongside sulfonylureas.",
    clinicalEffect: "Rapid unpredictable drops in blood glucose leading to hypoglycemic coma or confusion.",
    management: "Instruct patient to monitor blood sugar frequently. Consider an alternate antibiotic class for diabetic patients on sulfonylureas.",
    evidenceLevel: "Established"
  },
  // 13. Beta Blocker + Antidiabetic (Hypoglycemia symptom masking)
  {
    class1: "beta_blocker",
    class2: "sulfonylurea",
    severity: "moderate",
    title: "Masking of Warning Signs of Hypoglycemia",
    mechanism: "Beta blockade attenuates sympathoadrenal symptoms (tremor, tachycardia, palpitations) caused by falling glucose levels.",
    clinicalEffect: "Patient may develop neuroglycopenic hypoglycemia without noticing autonomic warning signs (diaphoresis/sweating is usually preserved).",
    management: "Counsel patients to recognize sweating, hunger, and dizziness as key alerts. Cardioselective beta-1 blockers (e.g. metoprolol, bisoprolol) are preferred.",
    evidenceLevel: "Established"
  },
  {
    class1: "beta_blocker",
    class2: "biguanide",
    severity: "minor",
    title: "Blunted Hypoglycemic Tachycardia Response",
    mechanism: "Beta blockade attenuates adrenergic symptoms of low blood sugar.",
    clinicalEffect: "Reduced awareness of hypoglycemia, though metformin alone rarely causes hypoglycemia.",
    management: "Routine blood glucose monitoring.",
    evidenceLevel: "Probable"
  },
  // 14. Gabapentinoid + Antihistamine / CNS Depressant
  {
    class1: "gabapentinoid",
    class2: "antihistamine",
    severity: "minor",
    title: "Additive Central Nervous System Somnolence & Drowsiness",
    mechanism: "Combined subcortical and vestibular CNS depressant effects.",
    clinicalEffect: "Excessive daytime sleepiness, unsteadiness, impaired coordination, and slowed reflexes.",
    management: "Dose evening-dominant. Advise patient against operating machinery until tolerance is established.",
    evidenceLevel: "Probable"
  },
  // 15. Digoxin + Loop Diuretic
  {
    class1: "cardiac_glycoside",
    class2: "loop_diuretic",
    severity: "moderate",
    title: "Hypokalemia-Induced Digoxin Toxicity",
    mechanism: "Loop diuretics cause renal potassium/magnesium wasting. Hypokalemia increases digoxin binding to Na+/K+ ATPase, exaggerating toxicity.",
    clinicalEffect: "Digoxin toxicity: nausea, yellow-green halos in vision, bigeminy, fatal ventricular tachycardia.",
    management: "Monitor serum potassium (maintain >= 4.0 mEq/L) and serum digoxin levels. Supplement potassium as needed.",
    evidenceLevel: "Established"
  },
  // 16. Corticosteroid + NSAID
  {
    class1: "corticosteroid",
    class2: "nsaid",
    severity: "moderate",
    title: "Synergistic Peptic Ulceration & Gastrointestinal Hemorrhage",
    mechanism: "Dual suppression of gastric mucosal prostaglandin synthesis, impaired epithelial renewal, and increased gastric acid.",
    clinicalEffect: "4-fold higher risk of severe gastroduodenal ulceration, perforation, and gastrointestinal bleeding.",
    management: "Avoid concurrent use. If mandatory, co-prescribe gastroprotective agent (PPI) and monitor stool color for melena.",
    evidenceLevel: "Established"
  },
  // 17. Corticosteroid + Antidiabetic
  {
    class1: "corticosteroid",
    class2: "biguanide",
    severity: "moderate",
    title: "Antagonism of Glycemic Control (Steroid-Induced Hyperglycemia)",
    mechanism: "Corticosteroids stimulate hepatic gluconeogenesis and induce peripheral insulin resistance, directly opposing antidiabetic action.",
    clinicalEffect: "Marked postprandial and fasting hyperglycemia; potential loss of diabetic stability.",
    management: "Monitor blood glucose frequently; antidiabetic dosages may need temporary upward titration.",
    evidenceLevel: "Established"
  },
  {
    class1: "corticosteroid",
    class2: "sulfonylurea",
    severity: "moderate",
    title: "Antagonism of Glycemic Control (Steroid-Induced Hyperglycemia)",
    mechanism: "Corticosteroids cause insulin resistance opposing sulfonylurea glycemic benefits.",
    clinicalEffect: "Elevated blood glucose levels requiring medication adjustment.",
    management: "Increase blood glucose monitoring frequency while taking corticosteroids.",
    evidenceLevel: "Established"
  },
  // 18. Thyroid Hormone + Antacid
  {
    class1: "thyroid_hormone",
    class2: "antacid",
    severity: "moderate",
    title: "Decreased Thyroid Hormone Bioavailability via Chelation",
    mechanism: "Aluminum, magnesium, and calcium in antacids form insoluble complexes with levothyroxine in the GI lumen.",
    clinicalEffect: "Suboptimal T4 absorption leading to elevated TSH and persistent hypothyroid symptoms.",
    management: "Separate administration of levothyroxine and antacids by at least 4 hours.",
    evidenceLevel: "Established"
  },
  // 19. SSRI + NSAID
  {
    class1: "ssri",
    class2: "nsaid",
    severity: "moderate",
    title: "Increased Gastrointestinal Bleeding Risk",
    mechanism: "SSRIs deplete platelet serotonin stores needed for aggregation, while NSAIDs inhibit platelet COX-1 and cause gastric erosion.",
    clinicalEffect: "Substantial 3 to 5-fold rise in upper gastrointestinal hemorrhage.",
    management: "Advise patient to report dark tarry stools or epigastric pain. Consider co-prescribing a PPI for gastroprotection in high-risk patients.",
    evidenceLevel: "Established"
  },
  // 20. Fluoroquinolone + Macrolide (QTc prolongation)
  {
    class1: "fluoroquinolone",
    class2: "macrolide",
    severity: "critical",
    title: "Additive QTc Prolongation & Torsades de Pointes Risk",
    mechanism: "Additive blockade of cardiac hERG potassium channels (I_Kr current), delaying ventricular repolarization.",
    clinicalEffect: "Marked prolongation of QTc interval (> 500 ms) predisposing to fatal polymorphic ventricular tachycardia (Torsades de Pointes).",
    management: "Avoid combining two QT-prolonging antimicrobials. Perform baseline ECG if co-administration is clinically unavoidable.",
    evidenceLevel: "Established"
  }
];

// ----------------------------------------------------------------------
// 5. SPECIFIC PAIRWISE OVERRIDES / HARD CLINICAL PAIRS
// ----------------------------------------------------------------------
interface SpecificPairInteraction {
  drugA: string;
  drugB: string;
  severity: SeverityLevel;
  title: string;
  mechanism: string;
  clinicalEffect: string;
  management: string;
  evidenceLevel: "Established" | "Probable" | "Theoretical";
}

export const SPECIFIC_PAIR_DATABASE: SpecificPairInteraction[] = [
  {
    drugA: "metformin",
    drugB: "alcohol",
    severity: "moderate",
    title: "Lactic Acidosis Vulnerability",
    mechanism: "Alcohol and metformin both impair hepatic lactate clearance and gluconeogenesis.",
    clinicalEffect: "Elevated risk of lactic acidosis, malaise, tachypnea, and hypotension.",
    management: "Limit alcohol to <= 1 drink/day; do not binge drink while taking metformin.",
    evidenceLevel: "Established"
  },
  {
    drugA: "cetirizine",
    drugB: "pregabalin",
    severity: "minor",
    title: "Additive Somnolence & Drowsiness",
    mechanism: "Dual mild central nervous system sedation.",
    clinicalEffect: "Increased lethargy, reduced alertness, and daytime somnolence.",
    management: "Take cetirizine at bedtime. Avoid driving until personal response is known.",
    evidenceLevel: "Probable"
  },
  {
    drugA: "atorvastatin",
    drugB: "clarithromycin",
    severity: "critical",
    title: "Severe Rhabdomyolysis Risk via Potent CYP3A4 Blockade",
    mechanism: "Clarithromycin is a potent CYP3A4 inhibitor, multiplying atorvastatin AUC up to 5-fold.",
    clinicalEffect: "Acute toxic myopathy, severe muscle pain, elevated creatine kinase, and renal failure.",
    management: "Temporarily suspend atorvastatin during clarithromycin treatment.",
    evidenceLevel: "Established"
  },
  {
    drugA: "clopidogrel",
    drugB: "omeprazole",
    severity: "moderate",
    title: "Decreased Antiplatelet Efficacy via CYP2C19 Inhibition",
    mechanism: "Omeprazole blocks the enzyme needed to activate clopidogrel prodrug.",
    clinicalEffect: "Higher risk of adverse coronary thrombotic events.",
    management: "Switch omeprazole to pantoprazole, which does not significantly inhibit CYP2C19.",
    evidenceLevel: "Established"
  },
  {
    drugA: "warfarin",
    drugB: "aspirin",
    severity: "critical",
    title: "Major Hemorrhagic Bleeding Risk",
    mechanism: "Simultaneous inhibition of platelet aggregation and clotting factors II, VII, IX, X.",
    clinicalEffect: "High incidence of serious internal and gastrointestinal hemorrhage.",
    management: "Use only under strict cardiological indication with frequent INR surveillance.",
    evidenceLevel: "Established"
  },
  {
    drugA: "sildenafil",
    drugB: "isosorbide dinitrate",
    severity: "critical",
    title: "Life-Threatening Hypotension Shock",
    mechanism: "Cyclic GMP accumulation causes catastrophic vasodilation.",
    clinicalEffect: "Extreme precipitous blood pressure drop and myocardial hypoperfusion.",
    management: "Strictly contraindicated. Never take together.",
    evidenceLevel: "Established"
  },
  {
    drugA: "sildenafil",
    drugB: "nitroglycerin",
    severity: "critical",
    title: "Life-Threatening Hypotension Shock",
    mechanism: "Massive cGMP synergy causes catastrophic vasodilation.",
    clinicalEffect: "Refractory cardiovascular collapse.",
    management: "Strictly contraindicated.",
    evidenceLevel: "Established"
  },
  {
    drugA: "spironolactone",
    drugB: "ramipril",
    severity: "critical",
    title: "Hyperkalemia & Cardiac Arrest Hazard",
    mechanism: "Dual suppression of potassium excretion in the collecting tubules.",
    clinicalEffect: "Serum potassium > 6.0 mEq/L, arrhythmias, and conduction block.",
    management: "Closely monitor potassium and renal function; avoid potassium-sparing salts.",
    evidenceLevel: "Established"
  },
  {
    drugA: "spironolactone",
    drugB: "losartan",
    severity: "critical",
    title: "Hyperkalemia & Cardiac Arrhythmia Hazard",
    mechanism: "Dual blockade of aldosterone action and synthesis.",
    clinicalEffect: "Severe hyperkalemia.",
    management: "Monitor serum potassium regularly.",
    evidenceLevel: "Established"
  },
  {
    drugA: "digoxin",
    drugB: "furosemide",
    severity: "moderate",
    title: "Hypokalemia-Induced Digoxin Arrhythmias",
    mechanism: "Furosemide urinary potassium loss magnifies myocardial sensitivity to digoxin.",
    clinicalEffect: "Visual disturbance, heart block, and ventricular tachycardia.",
    management: "Maintain potassium >= 4.0 mEq/L and monitor serum digoxin.",
    evidenceLevel: "Established"
  }
];

// ----------------------------------------------------------------------
// 6. PIPELINE ENGINE: RESOLUTION, INFERENCE & PREDICTION
// ----------------------------------------------------------------------

/**
 * Resolves ANY medicine string (whether brand name, generic name, or novel drug)
 * into a structured DrugProfile.
 */
export function resolveDrugProfile(rawName: string): DrugProfile {
  const clean = rawName.trim().toLowerCase().replace(/[^\w\s-]/g, "");
  
  // 1. Check known generic database directly
  if (KNOWN_GENERIC_PROFILES[clean]) {
    const known = KNOWN_GENERIC_PROFILES[clean];
    return {
      name: rawName,
      genericName: known.genericName || clean,
      drugClass: known.drugClass || "unknown",
      categoryLabel: known.categoryLabel || "Prescription Medication",
      cypMetabolism: known.cypMetabolism,
      keyRisks: known.keyRisks || [],
      foodInteractions: known.foodInteractions || [],
      optimalTiming: known.optimalTiming,
      confidence: 1.0,
      detectionSource: "database"
    };
  }

  // 2. Check Brand-to-Generic Map (Indian and international brand names)
  if (BRAND_TO_GENERIC_MAP[clean]) {
    const brandEntry = BRAND_TO_GENERIC_MAP[clean];
    const genericKey = brandEntry.generic.toLowerCase();
    const known = KNOWN_GENERIC_PROFILES[genericKey];
    return {
      name: rawName,
      genericName: brandEntry.generic,
      drugClass: brandEntry.classHint || known?.drugClass || "unknown",
      categoryLabel: known?.categoryLabel || `Commercial Formulation (${brandEntry.generic})`,
      cypMetabolism: known?.cypMetabolism,
      keyRisks: known?.keyRisks || [],
      foodInteractions: known?.foodInteractions || [],
      optimalTiming: known?.optimalTiming,
      confidence: 0.95,
      detectionSource: "brand_map"
    };
  }

  // Check partial brand prefix match (e.g., "Dolo-650", "Pan-D", "Calpol-500", "Augmentin-625")
  for (const [brandKey, brandEntry] of Object.entries(BRAND_TO_GENERIC_MAP)) {
    if (clean.startsWith(brandKey) || clean.includes(brandKey)) {
      const genericKey = brandEntry.generic.toLowerCase();
      const known = KNOWN_GENERIC_PROFILES[genericKey];
      return {
        name: rawName,
        genericName: brandEntry.generic,
        drugClass: brandEntry.classHint || known?.drugClass || "unknown",
        categoryLabel: known?.categoryLabel || `Brand Alias (${brandEntry.generic})`,
        cypMetabolism: known?.cypMetabolism,
        keyRisks: known?.keyRisks || [],
        foodInteractions: known?.foodInteractions || [],
        optimalTiming: known?.optimalTiming,
        confidence: 0.90,
        detectionSource: "brand_map"
      };
    }
  }

  // 3. WHO INN Stem Classification Algorithm (Predicts class for NOVEL / UNSEEN drugs!)
  for (const stem of INN_STEM_DEFINITIONS) {
    if (stem.pattern.test(clean)) {
      return {
        name: rawName,
        genericName: clean,
        drugClass: stem.drugClass,
        categoryLabel: stem.categoryLabel,
        cypMetabolism: stem.cypProfile,
        keyRisks: stem.keyRisks,
        foodInteractions: stem.foodWarnings || [],
        optimalTiming: stem.optimalTiming,
        confidence: 0.88,
        detectionSource: "inn_stem_model"
      };
    }
  }

  // 4. Substring checks against known generic profiles (e.g. "metformin hcl 500mg" -> "metformin")
  for (const [genericKey, profile] of Object.entries(KNOWN_GENERIC_PROFILES)) {
    if (clean.includes(genericKey)) {
      return {
        name: rawName,
        genericName: profile.genericName || genericKey,
        drugClass: profile.drugClass || "unknown",
        categoryLabel: profile.categoryLabel || "Prescription Medication",
        cypMetabolism: profile.cypMetabolism,
        keyRisks: profile.keyRisks || [],
        foodInteractions: profile.foodInteractions || [],
        optimalTiming: profile.optimalTiming,
        confidence: 0.85,
        detectionSource: "heuristic"
      };
    }
  }

  // 5. Default Fallback for novel unclassified substances
  return {
    name: rawName,
    genericName: clean,
    drugClass: "unknown",
    categoryLabel: "Novel / Unclassified Agent",
    confidence: 0.5,
    detectionSource: "heuristic"
  };
}

/**
 * Evaluates pairwise interaction between two resolved drug profiles.
 */
export function evaluatePairInteraction(
  profileA: DrugProfile,
  profileB: DrugProfile
): InteractionResult | null {
  const genA = profileA.genericName.toLowerCase();
  const genB = profileB.genericName.toLowerCase();

  // 1. Direct Specific Pair Database Match (Highest priority)
  for (const pair of SPECIFIC_PAIR_DATABASE) {
    const pA = pair.drugA.toLowerCase();
    const pB = pair.drugB.toLowerCase();
    if (
      (genA.includes(pA) && genB.includes(pB)) ||
      (genA.includes(pB) && genB.includes(pA))
    ) {
      return {
        id: `${profileA.name}_${profileB.name}_direct`,
        drug1: profileA.name,
        drug2: profileB.name,
        drug1Class: profileA.categoryLabel,
        drug2Class: profileB.categoryLabel,
        severity: pair.severity,
        title: pair.title,
        mechanism: pair.mechanism,
        clinicalEffect: pair.clinicalEffect,
        management: pair.management,
        evidenceLevel: pair.evidenceLevel,
        source: "direct_pair"
      };
    }
  }

  // 2. Class-to-Class Generalized Matrix Match
  const classA = profileA.drugClass;
  const classB = profileB.drugClass;

  if (classA !== "unknown" && classB !== "unknown") {
    // Check if same class duplication (e.g. 2 NSAIDs or 2 Statins)
    if (classA === classB && ["nsaid", "statin", "ace_inhibitor", "arb", "anticoagulant", "benzodiazepine"].includes(classA)) {
      return {
        id: `${profileA.name}_${profileB.name}_duplicate_class`,
        drug1: profileA.name,
        drug2: profileB.name,
        drug1Class: profileA.categoryLabel,
        drug2Class: profileB.categoryLabel,
        severity: "critical",
        title: `Therapeutic Duplication (${profileA.categoryLabel})`,
        mechanism: `Concurrent use of two agents from the same therapeutic class (${classA}) provides no additive efficacy while exponentially compounding toxicities.`,
        clinicalEffect: "Severe increase in target-organ toxicity, side effects, and adverse drug events.",
        management: "Review regimen with prescribing physician to eliminate duplicate therapy.",
        evidenceLevel: "Established",
        source: "class_rule"
      };
    }

    for (const rule of CLASS_INTERACTION_RULES) {
      if (
        (rule.class1 === classA && rule.class2 === classB) ||
        (rule.class1 === classB && rule.class2 === classA)
      ) {
        return {
          id: `${profileA.name}_${profileB.name}_class_${rule.class1}_${rule.class2}`,
          drug1: profileA.name,
          drug2: profileB.name,
          drug1Class: profileA.categoryLabel,
          drug2Class: profileB.categoryLabel,
          severity: rule.severity,
          title: rule.title,
          mechanism: rule.mechanism,
          clinicalEffect: rule.clinicalEffect,
          management: rule.management,
          evidenceLevel: rule.evidenceLevel,
          source: (profileA.detectionSource === "inn_stem_model" || profileB.detectionSource === "inn_stem_model")
            ? "predicted_novel_stem"
            : "class_rule"
        };
      }
    }
  }

  // 3. CYP Metabolic Interaction Inference
  // If one drug is CYP3A4 substrate and other is potent inhibitor
  const isCypSubstrate = profileA.cypMetabolism?.some(c => c.includes("substrate")) || profileB.cypMetabolism?.some(c => c.includes("substrate"));
  const isCypInhibitor = profileA.cypMetabolism?.some(c => c.includes("inhibitor")) || profileB.cypMetabolism?.some(c => c.includes("inhibitor"));
  if (isCypSubstrate && isCypInhibitor) {
    return {
      id: `${profileA.name}_${profileB.name}_cyp`,
      drug1: profileA.name,
      drug2: profileB.name,
      drug1Class: profileA.categoryLabel,
      drug2Class: profileB.categoryLabel,
      severity: "moderate",
      title: "Cytochrome P450 Hepatic Clearance Competition",
      mechanism: "Competitive enzymatic inhibition increases the serum bioavailability and half-life of the co-administered substrate.",
      clinicalEffect: "Elevated risk of exaggerated pharmacological effects and dose-dependent adverse reactions.",
      management: "Monitor for symptoms of drug excess; dose adjustment or therapeutic drug monitoring may be warranted.",
      evidenceLevel: "Probable",
      source: "cyp_interaction"
    };
  }

  return null;
}

/**
 * Master Analysis Pipeline:
 * Analyzes a full list of medications (including newly added ones).
 * Returns complete InteractionAnalysisSummary with safety score,
 * categorized interactions, lifestyle precautions, and action plan.
 */
export function analyzePrescriptionInteractions(medicationNames: string[]): InteractionAnalysisSummary {
  // Deduplicate and filter empty
  const uniqueNames = Array.from(
    new Set(medicationNames.map(m => m.trim()).filter(Boolean))
  );

  // Resolve all profiles
  const profiles = uniqueNames.map(resolveDrugProfile);

  const interactions: InteractionResult[] = [];
  const foodWarnings: { drug: string; warning: FoodInteraction }[] = [];
  const timingRecommendations: { drug: string; timing: string }[] = [];

  let pairsChecked = 0;

  // Screen all pairs: N * (N - 1) / 2
  for (let i = 0; i < profiles.length; i++) {
    // Collect food & timing for each drug
    if (profiles[i].foodInteractions && profiles[i].foodInteractions!.length > 0) {
      for (const food of profiles[i].foodInteractions!) {
        foodWarnings.push({ drug: profiles[i].name, warning: food });
      }
    }
    if (profiles[i].optimalTiming) {
      timingRecommendations.push({ drug: profiles[i].name, timing: profiles[i].optimalTiming! });
    }

    for (let j = i + 1; j < profiles.length; j++) {
      pairsChecked++;
      const result = evaluatePairInteraction(profiles[i], profiles[j]);
      if (result) {
        interactions.push(result);
      }
    }
  }

  // Count severities
  const criticalCount = interactions.filter(r => r.severity === "critical").length;
  const moderateCount = interactions.filter(r => r.severity === "moderate").length;
  const minorCount = interactions.filter(r => r.severity === "minor").length;

  // Calculate Clinical Safety Score (0-100)
  // Base 100
  // Critical deducts 28 points each
  // Moderate deducts 12 points each
  // Minor deducts 4 points each
  let score = 100 - (criticalCount * 28) - (moderateCount * 12) - (minorCount * 4);
  if (score < 15) score = 15; // floor at 15
  if (profiles.length === 0) score = 100;

  let safetyRating: "Safe" | "Low Risk" | "Moderate Risk" | "High Risk" | "Critical Risk" = "Safe";
  if (criticalCount > 0 || score < 50) {
    safetyRating = "Critical Risk";
  } else if (moderateCount >= 2 || score < 70) {
    safetyRating = "High Risk";
  } else if (moderateCount === 1 || score < 85) {
    safetyRating = "Moderate Risk";
  } else if (minorCount > 0 || score < 95) {
    safetyRating = "Low Risk";
  }

  // Generate actionable summary bullet points
  const actionableSummary: string[] = [];
  if (criticalCount > 0) {
    actionableSummary.push(
      `URGENT: ${criticalCount} severe interaction(s) detected that require immediate medical review before co-administration.`
    );
  }
  if (moderateCount > 0) {
    actionableSummary.push(
      `${moderateCount} moderate interaction(s) identified. Dose spacing or lab parameter monitoring is recommended.`
    );
  }
  if (foodWarnings.length > 0) {
    actionableSummary.push(
      `${foodWarnings.length} dietary / beverage precaution(s) identified (e.g., alcohol, grapefruit, or dairy chelation).`
    );
  }
  if (interactions.length === 0 && profiles.length > 0) {
    actionableSummary.push(
      "No clinically significant drug-drug contraindications were detected across your active medication regimen."
    );
  }
  if (profiles.length === 0) {
    actionableSummary.push(
      "No active medications found in your clinical profile. Upload or scan a prescription, or use the interactive drug tester above to evaluate pharmacology safety."
    );
  }

  return {
    safetyScore: score,
    safetyRating,
    totalMeds: profiles.length,
    pairsChecked,
    criticalCount,
    moderateCount,
    minorCount,
    interactions,
    foodWarnings,
    timingRecommendations,
    actionableSummary,
    analyzedProfiles: profiles
  };
}
