from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from typing import Any
import uuid
from auth import get_current_user, get_supabase_client_for_user
from config import get_settings, Settings

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "application/pdf"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    prescription_id: str = None,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Invalid file type")
        
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="File too large")
        
    client = get_supabase_client_for_user(user, settings)
    file_ext = file.filename.split(".")[-1]
    storage_path = f"{user['id']}/{uuid.uuid4()}.{file_ext}"
    
    # Upload to storage
    client.storage.from_("prescription-images").upload(storage_path, contents, {"content-type": file.content_type})
    
    # Create db entry
    doc_data = {
        "user_id": user["id"],
        "file_name": file.filename,
        "file_type": file.content_type,
        "file_size": len(contents),
        "storage_path": storage_path,
    }
    if prescription_id:
        doc_data["prescription_id"] = prescription_id
        
    res = client.table("documents").insert(doc_data).execute()
    if not res.data:
        raise HTTPException(status_code=400, detail="Failed to create document record")
        
    return {"id": res.data[0]["id"], "message": "Document uploaded successfully"}

@router.get("/{doc_id}/url")
async def get_document_url(
    doc_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("documents").select("*").eq("id", doc_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Document not found")
        
    storage_path = res.data["storage_path"]
    url_res = client.storage.from_("prescription-images").create_signed_url(storage_path, 3600)
    
    if "signedURL" not in url_res:
        raise HTTPException(status_code=500, detail="Failed to generate URL")
        
    return {"url": url_res["signedURL"]}

@router.delete("/{doc_id}")
async def delete_document(
    doc_id: str,
    user: dict[str, Any] = Depends(get_current_user),
    settings: Settings = Depends(get_settings),
):
    client = get_supabase_client_for_user(user, settings)
    res = client.table("documents").select("*").eq("id", doc_id).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Document not found")
        
    storage_path = res.data["storage_path"]
    client.storage.from_("prescription-images").remove([storage_path])
    
    del_res = client.table("documents").delete().eq("id", doc_id).execute()
    return {"message": "Document deleted successfully"}
