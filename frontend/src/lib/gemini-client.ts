export interface MedicineItem {
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

export interface ExtractedData {
  patient_name?: string;
  patient_age_gender?: string;
  date?: string;
  doctor_name?: string;
  clinic_name?: string;
  diagnosis?: string | string[];
  clinical_context?: string;
  vitals?: string;
  investigations?: string[];
  clinical_summary?: {
    overview?: string;
    total_medicines?: number;
    review_warning?: string;
  };
  medicines?: MedicineItem[];
  other_notes?: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
}

function buildPrompt(clinicalContext?: string, hasVerificationFile?: boolean): string {
  let prompt = `You are an expert clinical pharmacist assistant analyzing a real doctor's prescription (common in Indian medical practice).
Indian doctors write brand names like Dolo 650, Stemlo, Stamlo, Avas, Asomex, Thyrox, Thyronorm, Augmentin, Azithral, Glycomet, Rigler Forte, Muphyline, Mucolite, Zifi, etc.
Dosage timings are written as shorthand: "1-0-1", "0-0-1", "1-0-0", or with arrows/dots.

Analyze the uploaded medical image(s) thoroughly and extract ALL information into valid JSON.
`;

  if (clinicalContext && clinicalContext.trim()) {
    prompt += `
PATIENT-PROVIDED CLINICAL CONTEXT / SUSPECTED DIAGNOSIS:
"${clinicalContext.trim()}"
CRITICAL INSTRUCTION FOR CLINICAL CONTEXT:
Use this clinical context to eliminate 90% of irrelevant drug classes! For example, if the diagnosis is "chest congestion and cough", prioritize respiratory and bronchodilator/mucolytic medications (e.g., Muphyline, Mucolite, Zifi, Montair-LC, Ascoril) over cardiovascular or antidiabetic drugs when deciphering cursive or ambiguous letters.
For any ambiguous or cursive medicine where you are not 100% certain, provide a list of top 2 to 4 condition-relevant brand candidates in "candidate_suggestions".
`;
  }

  if (hasVerificationFile) {
    prompt += `
SECONDARY VERIFICATION DOCUMENT ATTACHED (Printed Pharmacy Bill / Medicine Strip Packaging):
You are provided with two images in the request:
1. Primary Image: Doctor's handwritten prescription slip.
2. Secondary Image: Printed pharmacy bill/receipt or dispensed medicine strip packaging.
CROSS-VERIFICATION INSTRUCTION:
Compare the handwritten prescription entries with the printed items on the pharmacy bill or medicine packaging.
Use the clear printed text from the pharmacy bill or packaging to decisively resolve cursive handwriting ambiguities!
For items verified against the secondary document, set "verified_source" to "pharmacy_bill" or "medicine_strip", "confidence" to "high", and "needs_review" to false.
`;
  }

  prompt += `
IMPORTANT EXTRACTION REQUIREMENTS:
1. Extract EVERY SINGLE MEDICINE prescribed without omitting any. Count each numbered line (1, 2, 3, 4, etc.).
2. For each medicine, provide:
   - "medicine_name": The brand or generic name (most likely match)
   - "dosage": e.g. "5mg", "75mcg", "400mg"
   - "frequency": e.g. "0-0-1", "1-0-0", "1-0-1"
   - "duration": e.g. "5 days", "30 days"
   - "instructions": e.g. "After food", "At night"
   - "intended_use": What this specific medicine is used for (e.g. "Chest congestion and bronchospasm relief", "Blood pressure regulation", "Antibiotic bacterial infection")
   - "confidence": "high" | "medium" | "low"
   - "needs_review": boolean (true if handwriting is ambiguous or uncertain)
   - "candidate_suggestions": Array of string drug name suggestions based on the clinical context if handwriting is ambiguous, e.g. ["Muphyline 400", "Mucolite", "Zifi 200"]. Empty array if clear.
   - "verified_source": "prescription_slip" | "pharmacy_bill" | "medicine_strip" | "manual"
3. Provide a "clinical_summary" object containing:
   - "overview": Concise plain-English explanation of what this set of medicines collectively treats.
   - "total_medicines": Total count of medicines detected.
   - "review_warning": Clear warning if any medicine needs verification due to handwriting ambiguity, or empty string if all are clear.

Return ONLY this JSON structure:
{
  "patient_name": "",
  "patient_age_gender": "",
  "date": "",
  "doctor_name": "",
  "clinic_name": "",
  "diagnosis": "",
  "clinical_context": "${clinicalContext?.trim() || ""}",
  "vitals": "",
  "investigations": [],
  "clinical_summary": {
    "overview": "",
    "total_medicines": 0,
    "review_warning": ""
  },
  "medicines": [
    {
      "medicine_name": "",
      "dosage": "",
      "frequency": "",
      "duration": "",
      "instructions": "",
      "intended_use": "",
      "confidence": "high",
      "needs_review": false,
      "candidate_suggestions": [],
      "verified_source": "prescription_slip"
    }
  ],
  "other_notes": ""
}

Do not output any commentary outside the JSON object.`;

  return prompt;
}

export async function extractWithGeminiApi(
  file: File,
  apiKey: string,
  clinicalContext?: string,
  verificationFile?: File | null
): Promise<ExtractedData> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No Gemini API key provided. Please connect an API key.");
  }

  const base64Data = await fileToBase64(file);
  const mimeType = file.type || "image/jpeg";
  const hasVerification = Boolean(verificationFile && verificationFile.size > 0);
  const promptText = buildPrompt(clinicalContext, hasVerification);

  const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [
    { text: promptText },
    {
      inlineData: {
        mimeType,
        data: base64Data,
      },
    },
  ];

  if (hasVerification && verificationFile) {
    const vBase64 = await fileToBase64(verificationFile);
    parts.push({
      inlineData: {
        mimeType: verificationFile.type || "image/jpeg",
        data: vBase64,
      },
    });
  }

  const modelsToTry = [
    "gemini-3.6-flash",
    "gemini-flash-latest",
    "gemini-2.5-flash-lite",
  ];

  let lastErrorMsg = "";

  for (const model of modelsToTry) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        const errMsg = errorData?.error?.message || `HTTP ${res.status} error`;
        lastErrorMsg = errMsg;
        console.warn(`Model ${model} failed with:`, errMsg);
        continue;
      }

      const resJson = await res.json();
      const rawText = resJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
      const cleanJson = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed: any = JSON.parse(cleanJson);

      // Normalize medicines array
      const rawMedicines = Array.isArray(parsed.medicines) ? parsed.medicines : [];
      const normalizedMedicines: MedicineItem[] = rawMedicines.map((m: any) => ({
        medicine_name: String(m.medicine_name || m.name || "").trim() || "Prescribed Medicine",
        dosage: String(m.dosage || m.dose || "As directed").trim(),
        frequency: String(m.frequency || m.freq || "As directed").trim(),
        duration: String(m.duration || m.dur || "As prescribed").trim(),
        instructions: String(m.instructions || m.instr || "").trim(),
        intended_use: String(m.intended_use || "").trim(),
        confidence: (m.confidence === "high" || m.confidence === "medium" || m.confidence === "low")
          ? m.confidence
          : (m.conf || "medium"),
        needs_review: Boolean(m.needs_review),
        candidate_suggestions: Array.isArray(m.candidate_suggestions)
          ? m.candidate_suggestions.map((c: any) => String(c).trim()).filter(Boolean)
          : [],
        verified_source: m.verified_source || (hasVerification ? "pharmacy_bill" : "prescription_slip"),
      }));

      // Normalize diagnosis
      let normalizedDiag: string = "";
      if (Array.isArray(parsed.diagnosis)) {
        normalizedDiag = parsed.diagnosis.join(", ");
      } else if (typeof parsed.diagnosis === "string") {
        normalizedDiag = parsed.diagnosis;
      } else {
        normalizedDiag = clinicalContext || "";
      }

      // Build clinical summary
      const summaryObj = parsed.clinical_summary || {};
      const reviewItems = normalizedMedicines.filter((m) => m.needs_review);
      const summaryOverview = summaryObj.overview || 
        (normalizedMedicines.length > 0 
          ? `Identified ${normalizedMedicines.length} prescribed medication${normalizedMedicines.length > 1 ? "s" : ""} from the prescription slip.`
          : "No medications could be deciphered from this document.");
      
      const summaryWarning = summaryObj.review_warning ||
        (reviewItems.length > 0
          ? `${reviewItems.map((m) => m.medicine_name).join(", ")} contain cursive or ambiguous strokes and should be checked with the dispensing pharmacy.`
          : "");

      const result: ExtractedData = {
        patient_name: parsed.patient_name || "",
        patient_age_gender: parsed.patient_age_gender || "",
        date: parsed.date || new Date().toISOString().split("T")[0],
        doctor_name: parsed.doctor_name || "",
        clinic_name: parsed.clinic_name || "",
        diagnosis: normalizedDiag,
        clinical_context: clinicalContext || "",
        vitals: parsed.vitals || "",
        investigations: Array.isArray(parsed.investigations) ? parsed.investigations : [],
        clinical_summary: {
          overview: summaryOverview,
          total_medicines: normalizedMedicines.length,
          review_warning: summaryWarning,
        },
        medicines: normalizedMedicines,
        other_notes: parsed.other_notes || "",
      };

      return result;
    } catch (e: any) {
      lastErrorMsg = e?.message || "Extraction failed";
      console.warn(`Error invoking ${model}:`, e);
    }
  }

  throw new Error(lastErrorMsg || "Gemini model could not process this prescription. Please verify your API key and file format.");
}
