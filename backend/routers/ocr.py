from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from typing import Any, Optional
import json
import asyncio
from auth import get_current_user
from config import get_settings, Settings
try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

router = APIRouter()

def get_ocr_prompt(clinical_context: str | None = None, has_verification: bool = False) -> str:
    prompt = """You are an expert clinical pharmacist assistant analyzing a real doctor's prescription (common in Indian medical practice).
Indian doctors write brand names like Dolo 650, Stemlo, Stamlo, Avas, Asomex, Thyrox, Thyronorm, Augmentin, Azithral, Glycomet, Rigler Forte, Muphyline, Mucolite, Zifi, etc.
Dosage timings are written as shorthand: "1-0-1", "0-0-1", "1-0-0", or with arrows/dots.

Analyze the medical image(s) thoroughly and extract ALL information into valid JSON.
"""
    if clinical_context and clinical_context.strip():
        prompt += f"""
PATIENT-PROVIDED CLINICAL CONTEXT / SUSPECTED DIAGNOSIS:
"{clinical_context.strip()}"
Use this clinical context to eliminate 90% of irrelevant drug classes! For example, if diagnosis is "chest congestion and cough", prioritize respiratory and bronchodilator/mucolytic medications (e.g. Muphyline, Mucolite, Zifi, Montair-LC) over cardiovascular or antidiabetic drugs when deciphering cursive handwriting.
For any ambiguous or cursive medicine where you are not 100% certain, provide a list of top 2 to 4 condition-relevant brand candidates in "candidate_suggestions".
"""

    if has_verification:
        prompt += """
SECONDARY VERIFICATION DOCUMENT ATTACHED (Printed Pharmacy Bill / Medicine Strip Packaging):
Compare the handwritten prescription entries with the printed items on the pharmacy bill or medicine packaging.
Use the clear printed text from the pharmacy bill or packaging to decisively resolve cursive handwriting ambiguities!
For items verified against the secondary document, set "verified_source" to "pharmacy_bill" or "medicine_strip", "confidence" to "high", and "needs_review" to false.
"""

    prompt += """
IMPORTANT REQUIREMENTS:
1. Extract EVERY SINGLE MEDICINE prescribed without omitting any. Count each numbered line (1, 2, 3, 4, etc.).
2. For each medicine, provide:
   - "medicine_name": The brand or generic name
   - "dosage": e.g. "5mg", "75mcg", "400mg"
   - "frequency": e.g. "0-0-1", "1-0-0", "1-0-1"
   - "duration": e.g. "30 days"
   - "instructions": e.g. "At night", "Morning empty stomach"
   - "intended_use": What this specific medicine is used for (e.g. "Chest congestion and cough relief", "Blood pressure control")
   - "confidence": "high" | "medium" | "low"
   - "needs_review": boolean (true if handwriting is ambiguous or uncertain)
   - "candidate_suggestions": Array of string drug name suggestions based on clinical context if ambiguous, e.g. ["Muphyline 400", "Mucolite", "Zifi 200"]
   - "verified_source": "prescription_slip" | "pharmacy_bill" | "medicine_strip" | "manual"
3. Provide a "clinical_summary" object containing:
   - "overview": A concise plain-English explanation of what this set of medicines collectively treats.
   - "total_medicines": Total count of medicines detected.
   - "review_warning": A clear warning if any medicine needs verification due to handwriting ambiguity, or empty string if all are clear.

Return ONLY this JSON structure:
{
  "patient_name": "",
  "patient_age_gender": "",
  "date": "",
  "doctor_name": "",
  "clinic_name": "",
  "diagnosis": "",
  "clinical_context": "",
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

Do not output any commentary outside the JSON object.
"""
    return prompt

@router.post("/scan")
async def scan_prescription(
    file: UploadFile = File(...),
    verification_file: Optional[UploadFile] = File(None),
    clinical_context: Optional[str] = Form(None),
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    if genai is None:
        raise HTTPException(status_code=501, detail="google-genai is not installed on the server")

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")

    contents = await file.read()
    has_verification = verification_file is not None
    verification_contents = await verification_file.read() if has_verification else None

    prompt = get_ocr_prompt(clinical_context, has_verification)
    
    client = genai.Client(api_key=settings.gemini_api_key)
    
    models_to_try = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]
    
    for i, model_name in enumerate(models_to_try):
        try:
            parts = [
                prompt,
                types.Part.from_bytes(data=contents, mime_type=file.content_type or "image/jpeg")
            ]
            if has_verification and verification_contents and verification_file:
                parts.append(types.Part.from_bytes(
                    data=verification_contents,
                    mime_type=verification_file.content_type or "image/jpeg"
                ))

            response = client.models.generate_content(
                model=model_name,
                contents=parts,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            
            try:
                result = json.loads(response.text)
                return result
            except json.JSONDecodeError:
                raise HTTPException(status_code=500, detail="AI returned invalid JSON")
                
        except Exception as e:
            if i == len(models_to_try) - 1:
                raise HTTPException(status_code=503, detail=f"OCR failed: {str(e)}")
            await asyncio.sleep(1 * (i + 1))
            
    raise HTTPException(status_code=503, detail="OCR service unavailable")
