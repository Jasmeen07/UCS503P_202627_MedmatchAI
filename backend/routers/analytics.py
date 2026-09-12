from fastapi import APIRouter, Depends, HTTPException
from typing import Any, List
from pydantic import BaseModel
from auth import get_current_user, get_supabase_client_for_user
from config import get_settings, Settings
try:
    from google import genai
except ImportError:
    genai = None

router = APIRouter()

class MedList(BaseModel):
    medicines: List[str]

@router.post("/summary")
async def get_health_summary(
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("prescriptions").select("*, prescription_medicines(*)").execute()
    if not res.data:
        return {"summary": "No prescription data available to generate a summary."}

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
    genai_client = genai.Client(api_key=settings.gemini_api_key)
    
    prompt = f"Analyze these prescriptions and provide a comprehensive health summary for the patient:\n{json.dumps(res.data, indent=2)}\nKeep it concise but detailed."
    
    response = genai_client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[prompt]
    )
    
    return {"summary": response.text}

@router.post("/interactions")
async def check_interactions(
    med_list: MedList,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
    genai_client = genai.Client(api_key=settings.gemini_api_key)
    
    prompt = f"Check for drug-drug interactions, contraindications, and potential allergy warnings for the following list of medicines:\n{', '.join(med_list.medicines)}\nProvide the output in clear points."
    
    response = genai_client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[prompt]
    )
    
    return {"interactions": response.text}

@router.post("/insights")
async def get_insights(
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("prescriptions").select("*, prescription_medicines(*)").execute()
    if not res.data:
        return {"insights": "No data available."}

    if not settings.gemini_api_key:
        raise HTTPException(status_code=500, detail="Gemini API key not configured")
        
    genai_client = genai.Client(api_key=settings.gemini_api_key)
    
    prompt = f"Based on the following prescription data, generate personalized health insights, including foods to avoid and lifestyle recommendations:\n{json.dumps(res.data, indent=2)}"
    
    response = genai_client.models.generate_content(
        model="gemini-3.6-flash",
        contents=[prompt]
    )
    
    return {"insights": response.text}
