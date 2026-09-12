from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings

settings = get_settings()

app = FastAPI(
    title="MedMatch AI Backend",
    description="Backend services for MedMatch AI",
    version="1.0.0",
)

# [FIX GAP-1] CORS origins are now read from the CORS_ALLOWED_ORIGINS environment
# variable via config.py — never hardcoded. In development this defaults to
# "http://localhost:3000". In production, set the env var on your hosting platform.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


from routers import prescriptions, documents, ocr, analytics, appointments, sharing

app.include_router(prescriptions.router, prefix="/api/prescriptions", tags=["Prescriptions"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(appointments.router, prefix="/api/appointments", tags=["Appointments"])
app.include_router(sharing.router, prefix="/api/sharing", tags=["Sharing"])

@app.get("/")
def read_root():
    return {"message": "Welcome to MedMatch AI Backend API"}


@app.get("/health")
def health_check():
    return {"status": "ok", "environment": settings.environment}
