from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Any, Optional, List, Literal
from pydantic import BaseModel, Field
from auth import get_current_user, get_supabase_client_for_user, get_supabase_admin_client
from config import get_settings, Settings
from datetime import datetime, timedelta

router = APIRouter()

# ============================================================================
# Pydantic Request & Response Schemas
# ============================================================================

class GrantCreate(BaseModel):
    doctor_email: str
    duration_hours: int = 24
    scope: str = "all"
    treatment_group_id: Optional[str] = None

class DoctorAccessRequestCreate(BaseModel):
    patient_email: str
    patient_name: Optional[str] = "Registered Patient"
    patient_uid: Optional[str] = None
    clinical_reason: str
    requested_scope: Optional[str] = "Full Clinical History, Prescriptions & Lab Scans"
    doctor_name: Optional[str] = "Dr. Reeta Bhambri"
    doctor_specialty: Optional[str] = "Obstetrics & Gynecology"
    hospital: Optional[str] = "Ranjit Hospital & Maternity Home"
    doctor_license: Optional[str] = "MCI-34182-PB"
    is_emergency: Optional[bool] = False

class RequestDecision(BaseModel):
    decision: Literal["approved", "declined"]
    duration_days: Optional[int] = 30

class PatientRevocationRequest(BaseModel):
    doctor_id: Optional[str] = None
    doctor_email: Optional[str] = None
    request_id: Optional[str] = None

# ============================================================================
# Legacy Tokenized Access Endpoints (Preserved for Backward Compatibility)
# ============================================================================

@router.post("/grant", response_model=dict)
async def create_grant(
    grant: GrantCreate,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """Patient directly creates an authorized access token for a doctor."""
    client = get_supabase_client_for_user(user, settings)
    expires_at = datetime.now() + timedelta(hours=grant.duration_hours)
    
    data = {
        "patient_id": user["id"],
        "doctor_email": grant.doctor_email.lower().strip(),
        "scope": grant.scope,
        "expires_at": expires_at.isoformat(),
        "revoked": False,
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
    """List active un-revoked access grants created by the patient."""
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
    """Revoke a specific token grant by grant ID."""
    client = get_supabase_client_for_user(user, settings)
    res = client.table("doctor_access_grants").update({"revoked": True}).eq("id", grant_id).eq("patient_id", user["id"]).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Grant not found")
    return {"message": "Access revoked"}

# ============================================================================
# Bidirectional Doctor Access Request & Patient Consent Workflow
# ============================================================================

@router.post("/request-access", response_model=dict)
async def dispatch_doctor_access_request(
    req: DoctorAccessRequestCreate,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """
    Doctor initiates an access request to view a registered patient's medical records.
    The request enters 'pending' status awaiting patient approval or decline.
    """
    admin_client = get_supabase_admin_client(settings)
    target_email = req.patient_email.lower().strip()

    # Look up patient user ID by email
    patient_id = user["id"]
    try:
        prof_res = admin_client.table("profiles").select("id, display_name").eq("display_name", target_email).execute()
        if prof_res.data:
            patient_id = prof_res.data[0]["id"]
    except Exception:
        patient_id = user["id"]

    now = datetime.now()
    request_data = {
        "doctor_id": user["id"],
        "doctor_name": req.doctor_name,
        "doctor_specialty": req.doctor_specialty,
        "hospital": req.hospital,
        "doctor_license": req.doctor_license,
        "patient_id": patient_id,
        "patient_email": target_email,
        "patient_name": req.patient_name,
        "patient_uid": req.patient_uid or f"PT-{target_email[:6].upper()}",
        "requested_scope": req.requested_scope,
        "clinical_reason": req.clinical_reason,
        "status": "pending",
        "is_emergency": req.is_emergency,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    res = admin_client.table("doctor_access_requests").insert(request_data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to dispatch access request")

    # Audit log entry
    admin_client.table("audit_log").insert({
        "user_id": user["id"],
        "action": "ACCESS_REQUEST_DISPATCHED",
        "resource_type": "patient_records",
        "metadata": {
            "doctor": req.doctor_name,
            "patient_email": target_email,
            "scope": req.requested_scope,
            "reason": req.clinical_reason
        }
    }).execute()

    return {
        "message": "Access request dispatched successfully to patient dashboard",
        "request": res.data[0]
    }

@router.get("/patient/requests", response_model=list[dict])
async def get_patient_access_requests(
    status: Optional[str] = None,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """
    Patient retrieves all incoming consultation requests dispatched by doctors.
    """
    client = get_supabase_client_for_user(user, settings)
    query = client.table("doctor_access_requests").select("*").or_(f"patient_id.eq.{user['id']},patient_email.eq.{user['email'].lower()}")
    if status:
        query = query.eq("status", status)
    
    res = query.order("created_at", desc=True).execute()
    return res.data or []

@router.post("/patient/requests/{request_id}/respond", response_model=dict)
async def respond_to_access_request(
    request_id: str,
    decision_payload: RequestDecision,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """
    Patient responds to a pending doctor request: approves or declines.
    If approved, activates a 30-day clinical record viewing grant.
    """
    admin_client = get_supabase_admin_client(settings)
    now = datetime.now()

    # Find the request
    req_res = admin_client.table("doctor_access_requests").select("*").eq("id", request_id).single().execute()
    if not req_res.data:
        raise HTTPException(status_code=404, detail="Access request not found")

    target = req_res.data
    status = decision_payload.decision

    # Update request status
    upd_res = admin_client.table("doctor_access_requests").update({
        "status": status,
        "updated_at": now.isoformat()
    }).eq("id", request_id).execute()

    if status == "approved":
        # Create active grant in doctor_access_grants
        expires_at = now + timedelta(days=decision_payload.duration_days or 30)
        grant_data = {
            "patient_id": user["id"],
            "doctor_id": target["doctor_id"],
            "doctor_email": f"{target.get('doctor_name', 'doctor').lower().replace(' ', '.')}@ranjitmaternity.com",
            "scope": target["requested_scope"],
            "expires_at": expires_at.isoformat(),
            "revoked": False,
        }
        admin_client.table("doctor_access_grants").insert(grant_data).execute()

        # Audit log entry: Granted
        admin_client.table("audit_log").insert({
            "user_id": user["id"],
            "action": "ACCESS_CONSENT_GRANTED",
            "resource_type": "patient_records",
            "metadata": {
                "doctor_name": target["doctor_name"],
                "scope": target["requested_scope"],
                "expires_at": expires_at.isoformat()
            }
        }).execute()
        return {"message": "Access granted successfully to consulting physician", "status": "approved"}
    else:
        # Audit log entry: Declined
        admin_client.table("audit_log").insert({
            "user_id": user["id"],
            "action": "ACCESS_CONSENT_DECLINED",
            "resource_type": "patient_records",
            "metadata": {
                "doctor_name": target["doctor_name"],
                "reason": target["clinical_reason"]
            }
        }).execute()
        return {"message": "Access request declined", "status": "declined"}

@router.post("/patient/revoke", response_model=dict)
async def revoke_doctor_access_anytime(
    revoke_data: PatientRevocationRequest,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """
    Patient revokes doctor access at any time.
    Immediately locks doctor out of patient prescriptions and diagnostic records.
    The doctor must submit a brand new access request to view records again.
    """
    admin_client = get_supabase_admin_client(settings)
    now = datetime.now()

    # 1. Mark requests as 'revoked'
    req_query = admin_client.table("doctor_access_requests").update({
        "status": "revoked",
        "updated_at": now.isoformat()
    }).or_(f"patient_id.eq.{user['id']},patient_email.eq.{user['email'].lower()}")

    if revoke_data.request_id:
        req_query = req_query.eq("id", revoke_data.request_id)
    elif revoke_data.doctor_id:
        req_query = req_query.eq("doctor_id", revoke_data.doctor_id)
    
    req_query.execute()

    # 2. Mark active grants as revoked = True
    grant_query = admin_client.table("doctor_access_grants").update({
        "revoked": True
    }).eq("patient_id", user["id"])

    if revoke_data.doctor_id:
        grant_query = grant_query.eq("doctor_id", revoke_data.doctor_id)
    if revoke_data.doctor_email:
        grant_query = grant_query.eq("doctor_email", revoke_data.doctor_email.lower().strip())
    
    grant_query.execute()

    # 3. Audit log entry: Revoked
    admin_client.table("audit_log").insert({
        "user_id": user["id"],
        "action": "ACCESS_CONSENT_REVOKED",
        "resource_type": "patient_records",
        "metadata": {
            "doctor_id": revoke_data.doctor_id,
            "doctor_email": revoke_data.doctor_email,
            "timestamp": now.isoformat(),
            "note": "Patient revoked access. Doctor must re-request authorization."
        }
    }).execute()

    return {
        "message": "Doctor access successfully revoked. Record access has been locked.",
        "status": "revoked"
    }

# ============================================================================
# Doctor Workstation Patient Directory & Authorized Clinical Record Viewer
# ============================================================================

@router.get("/doctor/patients", response_model=list[dict])
async def list_doctor_hospital_patients(
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """
    Doctor retrieves the roster of patients registered in the hospital system.
    Dynamically maps each patient's access status: 'none', 'pending', 'granted', 'declined', 'revoked'.
    """
    admin_client = get_supabase_admin_client(settings)
    now = datetime.now().isoformat()

    # Get active grants for this doctor
    grants_res = admin_client.table("doctor_access_grants").select("*").or_(f"doctor_id.eq.{user['id']},doctor_email.eq.{user['email'].lower()}").eq("revoked", False).gt("expires_at", now).execute()
    granted_patient_ids = {g["patient_id"] for g in (grants_res.data or [])}

    # Get requests dispatched by this doctor
    requests_res = admin_client.table("doctor_access_requests").select("*").or_(f"doctor_id.eq.{user['id']},doctor_name.ilike.%Bhambri%").order("updated_at", desc=True).execute()
    requests_by_patient = {}
    for r in (requests_res.data or []):
        p_email = r.get("patient_email", "").lower()
        if p_email and p_email not in requests_by_patient:
            requests_by_patient[p_email] = r

    # Query registered profiles
    profiles_res = admin_client.table("profiles").select("*").eq("role", "patient").execute()
    patients = []

    for prof in (profiles_res.data or []):
        p_id = prof["id"]
        p_email = (prof.get("display_name") or prof.get("phone") or "").lower()
        
        # Determine status
        matched_req = requests_by_patient.get(p_email)
        if p_id in granted_patient_ids or (matched_req and matched_req["status"] == "approved"):
            access_status = "granted"
        elif matched_req:
            access_status = matched_req["status"]
        else:
            access_status = "none"

        patients.append({
            "patientId": p_id,
            "patientEmail": p_email,
            "patientName": prof.get("display_name", "Registered Patient"),
            "phoneNumber": prof.get("phone", "+91 98140-XXXXX"),
            "bloodGroup": prof.get("blood_group", "B+"),
            "accessStatus": access_status,
            "lastRequest": matched_req
        })

    return patients

@router.get("/doctor/patient-records/{patient_id}", response_model=dict)
async def view_authorized_patient_records(
    patient_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    """
    Doctor views patient prescriptions and diagnostic documents.
    Strictly enforces clinical authorization: returns 403 Forbidden if access was revoked or never granted.
    """
    admin_client = get_supabase_admin_client(settings)
    now = datetime.now().isoformat()

    # Verify active unrevoked grant
    grant_res = admin_client.table("doctor_access_grants").select("*").eq("patient_id", patient_id).or_(f"doctor_id.eq.{user['id']},doctor_email.eq.{user['email'].lower()}").eq("revoked", False).gt("expires_at", now).execute()

    if not grant_res.data:
        # Check if there is a revoked request
        revoked_res = admin_client.table("doctor_access_requests").select("*").eq("patient_id", patient_id).eq("status", "revoked").execute()
        detail = "Access was revoked by the patient. You must request authorization again." if revoked_res.data else "Access unauthorized. Please submit an access request to the patient."
        raise HTTPException(status_code=403, detail=detail)

    # Fetch patient prescriptions and documents
    rx_res = admin_client.table("prescriptions").select("*, prescription_medicines(*)").eq("user_id", patient_id).execute()
    docs_res = admin_client.table("documents").select("*").eq("user_id", patient_id).execute()

    # Log audit entry: Records Viewed
    admin_client.table("audit_log").insert({
        "user_id": user["id"],
        "action": "DOCTOR_CLINICAL_RECORD_ACCESSED",
        "resource_type": "patient_records",
        "metadata": {
            "patient_id": patient_id,
            "doctor_email": user["email"]
        }
    }).execute()

    return {
        "patientId": patient_id,
        "accessStatus": "granted",
        "prescriptions": rx_res.data or [],
        "documents": docs_res.data or []
    }
