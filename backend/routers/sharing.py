from fastapi import APIRouter, Depends, HTTPException
from typing import Any, Optional
from pydantic import BaseModel
from auth import get_current_user, get_supabase_client_for_user
from config import get_settings, Settings
from datetime import datetime, timedelta

router = APIRouter()

class GrantCreate(BaseModel):
    doctor_email: str
    duration_hours: int = 24
    scope: str = "all"
    treatment_group_id: Optional[str] = None

@router.post("/grant", response_model=dict)
async def create_grant(
    grant: GrantCreate,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    
    expires_at = datetime.now() + timedelta(hours=grant.duration_hours)
    
    data = {
        "patient_id": user["id"],
        "doctor_email": grant.doctor_email,
        "scope": grant.scope,
        "expires_at": expires_at.isoformat(),
    }
    if grant.treatment_group_id:
        data["treatment_group_id"] = grant.treatment_group_id
        
    res = client.table("doctor_access_grants").insert(data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create grant")
        
    return {"id": res.data[0]["id"], "access_token": res.data[0]["access_token"], "message": "Access granted"}

@router.get("/active", response_model=list[dict])
async def list_active_grants(
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    now = datetime.now().isoformat()
    res = client.table("doctor_access_grants").select("*").eq("patient_id", user["id"]).eq("revoked", False).gt("expires_at", now).execute()
    return res.data

@router.delete("/revoke/{grant_id}")
async def revoke_grant(
    grant_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("doctor_access_grants").update({"revoked": True}).eq("id", grant_id).eq("patient_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Grant not found")
    return {"message": "Access revoked"}
