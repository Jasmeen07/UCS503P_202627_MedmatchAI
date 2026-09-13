import { NextRequest, NextResponse } from "next/server";

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const verificationFile = formData.get("verification_file") as File | null;
    const clinicalContext = (formData.get("clinical_context") as string | null) || "";

    if (!file) {
      return NextResponse.json(
        { error: "No file was provided in the upload request." },
        { status: 400 }
      );
    }

    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey) {
      const arrayBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = file.type || "image/jpeg";

      const hasVerification = Boolean(verificationFile && verificationFile.size > 0);
      const promptText = buildPrompt(clinicalContext, hasVerification);

      const parts: any[] = [
        { text: promptText },
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
      ];

      // Attach secondary verification file if provided
      if (hasVerification && verificationFile) {
        const vBuffer = await verificationFile.arrayBuffer();
        const vBase64 = Buffer.from(vBuffer).toString("base64");
        const vMimeType = verificationFile.type || "image/jpeg";
        parts.push({
          inlineData: {
            mimeType: vMimeType,
            data: vBase64,
          },
        });
      }

      const modelsToTry = [
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-flash-latest",
      ];
      let lastError: unknown = null;

      for (const model of modelsToTry) {
        try {
          const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
          const geminiRes = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts,
                },
              ],
              generationConfig: {
                responseMimeType: "application/json",
              },
            }),
          });

          if (!geminiRes.ok) {
            const errText = await geminiRes.text();
            lastError = errText;
            continue;
          }

          const geminiJson = await geminiRes.json();
          const rawContent =
            geminiJson.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
          const parsed = JSON.parse(rawContent);

          return NextResponse.json({
            success: true,
            source: "gemini",
            modelUsed: model,
            data: parsed,
          });
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      return NextResponse.json(
        {
          error: "All Gemini OCR models failed or were temporarily unreachable.",
          details: String(lastError),
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error: "GEMINI_API_KEY is not configured.",
        message:
          "To enable automatic prescription extraction, set GEMINI_API_KEY in frontend/.env.local or backend/.env.",
      },
      { status: 501 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "An unexpected error occurred while processing the file.", details: String(error) },
      { status: 500 }
    );
  }
}
