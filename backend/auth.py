"""Authentication dependency for FastAPI routes."""

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase import create_client, Client
from config import get_settings, Settings
from typing import Any

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings),
) -> dict[str, Any]:
    """Validate the Supabase JWT and return the user data."""
    token = credentials.credentials
    supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
    try:
        response = supabase.auth.get_user(token)
        if response.user is None:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return {
            "id": str(response.user.id),
            "email": response.user.email,
            "role": response.user.user_metadata.get("role", "patient") if response.user.user_metadata else "patient",
            "token": token,
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Authentication failed")


def get_supabase_client_for_user(user: dict[str, Any], settings: Settings) -> Client:
    """Create a Supabase client authenticated as the given user (for RLS)."""
    client = create_client(settings.supabase_url, settings.supabase_anon_key)
    client.postgrest.auth(user["token"])
    return client


def get_supabase_admin_client(settings: Settings) -> Client:
    """Create a Supabase client with service role key (bypasses RLS)."""
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
