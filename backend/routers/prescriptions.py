from fastapi import APIRouter, Depends, HTTPException
from typing import Any, List, Optional
from pydantic import BaseModel
from auth import get_current_user, get_supabase_client_for_user
from config import get_settings, Settings
from datetime import date

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
