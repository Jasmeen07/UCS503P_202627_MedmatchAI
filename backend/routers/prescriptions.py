from fastapi import APIRouter, Depends, HTTPException
from typing import Any, List, Optional
from pydantic import BaseModel
from auth import get_current_user, get_supabase_client_for_user, get_supabase_admin_client
from config import get_settings, Settings
from datetime import date, datetime

router = APIRouter()

class MedicineCreate(BaseModel):
    medicine_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    duration: Optional[str] = None
    instructions: Optional[str] = None
    intended_use: Optional[str] = None
    confidence: Optional[str] = "high"
    needs_review: Optional[bool] = False

class PrescriptionCreate(BaseModel):
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    diagnosis: Optional[str] = None
    prescribed_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = "active"
    source: Optional[str] = "manual"
    ocr_confidence: Optional[float] = None
    medicines: List[MedicineCreate] = []

class PrescriptionUpdate(BaseModel):
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    diagnosis: Optional[str] = None
    prescribed_date: Optional[date] = None
    notes: Optional[str] = None
    status: Optional[str] = None

@router.post("/", response_model=dict)
async def create_prescription(
    prescription: PrescriptionCreate,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    
    # Insert prescription
    rx_data = {
        "user_id": user["id"],
        "doctor_name": prescription.doctor_name,
        "hospital_name": prescription.hospital_name,
        "diagnosis": prescription.diagnosis,
        "prescribed_date": prescription.prescribed_date.isoformat() if prescription.prescribed_date else None,
        "notes": prescription.notes,
        "status": prescription.status,
        "source": prescription.source,
        "ocr_confidence": prescription.ocr_confidence,
    }
    
    rx_res = client.table("prescriptions").insert(rx_data).execute()
    if not rx_res.data:
        raise HTTPException(status_code=400, detail="Failed to create prescription")
        
    rx_id = rx_res.data[0]["id"]
    
    # Insert medicines if any
    if prescription.medicines:
        meds_data = []
        for med in prescription.medicines:
            meds_data.append({
                "prescription_id": rx_id,
                "medicine_name": med.medicine_name,
                "dosage": med.dosage,
                "frequency": med.frequency,
                "duration": med.duration,
                "instructions": med.instructions,
                "intended_use": med.intended_use,
                "confidence": med.confidence,
                "needs_review": med.needs_review,
            })
        client.table("prescription_medicines").insert(meds_data).execute()
        
    return {"id": rx_id, "message": "Prescription created successfully"}

@router.get("/", response_model=list[dict])
async def list_prescriptions(
    status: Optional[str] = None,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    query = client.table("prescriptions").select("*, prescription_medicines(*)")
    if status:
        query = query.eq("status", status)
    
    res = query.execute()
    return res.data

@router.get("/stats")
async def get_stats(
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("prescriptions").select("status").execute()
    active = 0
    completed = 0
    for rx in res.data:
        if rx["status"] == "active":
            active += 1
        elif rx["status"] == "completed":
            completed += 1
    return {"total": len(res.data), "active": active, "completed": completed}

@router.get("/{rx_id}")
async def get_prescription(
    rx_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("prescriptions").select("*, prescription_medicines(*)").eq("id", rx_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return res.data

@router.put("/{rx_id}")
async def update_prescription(
    rx_id: str,
    prescription: PrescriptionUpdate,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    
    update_data = {k: v for k, v in prescription.model_dump().items() if v is not None}
    if "prescribed_date" in update_data and update_data["prescribed_date"]:
        update_data["prescribed_date"] = update_data["prescribed_date"].isoformat()
        
    if update_data:
        res = client.table("prescriptions").update(update_data).eq("id", rx_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Prescription not found or update failed")
    
    return {"message": "Prescription updated successfully"}

@router.delete("/{rx_id}")
async def delete_prescription(
    rx_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("prescriptions").delete().eq("id", rx_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Prescription not found or delete failed")
    return {"message": "Prescription deleted successfully"}

@router.get("/{rx_id}/summary", response_model=dict)
async def get_prescription_clinical_summary(
    rx_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """
    Generate and return a structured clinical summary report for a specific prescription.
    Suitable for direct patient download or clinical handover.
    """
    client = get_supabase_client_for_user(user, settings)
    res = client.table("prescriptions").select("*, prescription_medicines(*)").eq("id", rx_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Prescription not found")

    rx = res.data
    medicines = rx.get("prescription_medicines", [])
    med_lines = []
    for i, m in enumerate(medicines, 1):
        instructions = f" ({m['instructions']})" if m.get("instructions") else ""
        use = f" - Purpose: {m['intended_use']}" if m.get("intended_use") else ""
        med_lines.append(f"{i}. {m['medicine_name']} {m.get('dosage') or ''} - {m.get('frequency') or 'As directed'} for {m.get('duration') or 'N/A'}{instructions}{use}")

    medicines_text = "\n".join(med_lines) if med_lines else "None recorded"
    
    summary_text = (
        f"MEDMATCH-AI CLINICAL PRESCRIPTION SUMMARY REPORT\n"
        f"================================================\n"
        f"Document ID: {rx['id']}\n"
        f"Generated At: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}\n"
        f"Prescribing Clinician: {rx.get('doctor_name') or 'Treating Physician'}\n"
        f"Healthcare Facility: {rx.get('hospital_name') or 'Clinical Center'}\n"
        f"Date Prescribed: {rx.get('prescribed_date') or 'N/A'}\n"
        f"Primary Diagnosis: {rx.get('diagnosis') or 'Clinical Evaluation'}\n\n"
        f"PRESCRIBED MEDICATIONS & REGIMEN:\n"
        f"{medicines_text}\n\n"
        f"CLINICAL NOTES & INSTRUCTIONS:\n"
        f"{rx.get('notes') or 'Take medications exactly as prescribed. Return if symptoms worsen.'}\n\n"
        f"VERIFICATION STATUS:\n"
        f"Source: {rx.get('source') or 'manual'} (Confidence: {rx.get('ocr_confidence') or 'Standard'})\n"
        f"This document is an electronic extract from MedMatch-AI Health Vault.\n"
    )

    return {
        "prescriptionId": rx["id"],
        "doctorName": rx.get("doctor_name"),
        "hospitalName": rx.get("hospital_name"),
        "diagnosis": rx.get("diagnosis"),
        "prescribedDate": rx.get("prescribed_date"),
        "medicinesCount": len(medicines),
        "medicines": medicines,
        "summaryText": summary_text
    }

@router.get("/patient/{patient_id}/summary", response_model=dict)
async def get_patient_aggregate_summary(
    patient_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """
    Generate an aggregated clinical summary report of all prescriptions and active medications for a patient.
    Accessible to the patient or authorized consulting physicians.
    """
    admin_client = get_supabase_admin_client(settings)
    now = datetime.now().isoformat()

    # Verify authorization: patient themself OR doctor with active unrevoked grant
    if user["id"] != patient_id:
        grant = admin_client.table("doctor_access_grants").select("id").eq("patient_id", patient_id).or_(f"doctor_id.eq.{user['id']},doctor_email.eq.{user['email'].lower()}").eq("revoked", False).gt("expires_at", now).execute()
        if not grant.data:
            raise HTTPException(status_code=403, detail="Unauthorized: No active clinical authorization for this patient.")

    rx_res = admin_client.table("prescriptions").select("*, prescription_medicines(*)").eq("user_id", patient_id).execute()
    prescriptions = rx_res.data or []

    total_meds = sum(len(r.get("prescription_medicines", [])) for r in prescriptions)
    active_rx = [r for r in prescriptions if r.get("status") == "active"]

    return {
        "patientId": patient_id,
        "totalPrescriptions": len(prescriptions),
        "activePrescriptions": len(active_rx),
        "totalMedicinesCount": total_meds,
        "prescriptions": prescriptions,
        "generatedAt": now
    }
