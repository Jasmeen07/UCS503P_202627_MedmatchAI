"""Application settings loaded from environment variables.

"""

from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # ── Supabase ────────────────────────────────────────────────────────────
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # ── Gemini ──────────────────────────────────────────────────────────────
    gemini_api_key: str = ""

    # ── Security ────────────────────────────────────────────────────────────
    # Comma-separated allowed origins, e.g. "http://localhost:3000,https://medmatch.ai"
    cors_allowed_origins: str = "http://localhost:3000"

    # ── Redis ───────────────────────────────────────────────────────────────
    redis_url: str = "redis://localhost:6379"

    # ── Environment ─────────────────────────────────────────────────────────
    environment: str = "development"  # "development" | "production"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """Parse the comma-separated CORS string into a list."""
        return [origin.strip() for origin in self.cors_allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (loaded once at startup)."""
    return Settings()
