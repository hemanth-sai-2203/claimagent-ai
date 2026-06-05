from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.documents import router as documents_router
from app.api.claims import router as claims_router
from app.api.adjudication import router as adjudication_router
from app.api.review import router as review_router
from app.api.admin import router as admin_router
from app.api.analytics import router as analytics_router

app = FastAPI(
    title="ClaimPilot AI",
    description="Automated OPD Claims Operations Copilot",
    version="1.0.0"
)

# CORS middleware for Next.js frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exactly e.g., ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all API routers
app.include_router(documents_router, prefix="/api/v1")
app.include_router(claims_router, prefix="/api/v1")
app.include_router(adjudication_router, prefix="/api/v1")
app.include_router(review_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(analytics_router, prefix="/api/v1")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "ClaimPilot AI Backend"}
