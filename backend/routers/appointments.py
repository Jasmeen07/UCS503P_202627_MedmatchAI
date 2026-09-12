from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Optional
from pydantic import BaseModel
from auth import get_current_user, get_supabase_client_for_user
from config import get_settings, Settings
from datetime import date, time, timedelta, datetime

router = APIRouter()

class AppointmentCreate(BaseModel):
    title: str
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    appointment_date: date
    appointment_time: Optional[time] = None
    duration_minutes: Optional[int] = 30
    location: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = "upcoming"

class AppointmentUpdate(BaseModel):
    title: Optional[str] = None
    doctor_name: Optional[str] = None
    hospital_name: Optional[str] = None
    appointment_date: Optional[date] = None
    appointment_time: Optional[time] = None
    duration_minutes: Optional[int] = None
    location: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

@router.post("/", response_model=dict)
async def create_appointment(
    apt: AppointmentCreate,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    data = apt.model_dump()
    data["user_id"] = user["id"]
    if data["appointment_date"]:
        data["appointment_date"] = data["appointment_date"].isoformat()
    if data["appointment_time"]:
        data["appointment_time"] = data["appointment_time"].isoformat()
        
    res = client.table("appointments").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create appointment")
    return {"id": res.data[0]["id"], "message": "Appointment created"}

@router.get("/", response_model=list[dict])
async def list_appointments(
    status: Optional[str] = None,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    query = client.table("appointments").select("*").eq("user_id", user["id"])
    if status:
        query = query.eq("status", status)
    res = query.order("appointment_date").execute()
    return res.data

@router.get("/upcoming", response_model=list[dict])
async def list_upcoming_appointments(
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    today = datetime.now().date()
    next_week = today + timedelta(days=7)
    res = client.table("appointments").select("*").eq("user_id", user["id"]).gte("appointment_date", today.isoformat()).lte("appointment_date", next_week.isoformat()).order("appointment_date").execute()
    return res.data

@router.put("/{apt_id}")
async def update_appointment(
    apt_id: str,
    apt: AppointmentUpdate,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    data = {k: v for k, v in apt.model_dump().items() if v is not None}
    if "appointment_date" in data and data["appointment_date"]:
        data["appointment_date"] = data["appointment_date"].isoformat()
    if "appointment_time" in data and data["appointment_time"]:
        data["appointment_time"] = data["appointment_time"].isoformat()
        
    if data:
        res = client.table("appointments").update(data).eq("id", apt_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment updated"}

@router.delete("/{apt_id}")
async def delete_appointment(
    apt_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("appointments").delete().eq("id", apt_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Appointment not found")
    return {"message": "Appointment deleted"}
