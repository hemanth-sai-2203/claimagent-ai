import json
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List

from app.db.database import get_db
from app.db.models import Document, Claim, AuditLog, ManualReview
from app.schemas.extraction import ExtractionResult
from app.schemas.claim import Claim as ClaimSchema
from app.services.extraction import extract_document_data

router = APIRouter(prefix="/claims", tags=["Claims"])

class ExtractRequest(BaseModel):
    document_id: str

@router.post("/extract", response_model=ExtractionResult)
async def extract_claim_document(request: ExtractRequest, db: Session = Depends(get_db)):
    doc = db.query(Document).filter(Document.id == request.document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    try:
        with open(doc.file_path, "rb") as f:
            contents = f.read()
            
        # Call Gemini extraction service
        # Assumes image based on previous validation
        mime_type = "image/jpeg" 
        if doc.file_path.lower().endswith(".png"):
            mime_type = "image/png"
        elif doc.file_path.lower().endswith(".pdf"):
            mime_type = "application/pdf"
            
        result = extract_document_data(contents, mime_type)
        
        # Update DB document with extraction metadata
        doc.document_type = result.classification.document_type
        doc.extraction_confidence = result.overall_confidence
        doc.extracted_data = result.extracted_data.model_dump()
        db.commit()
        
        return result
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Extraction failed: {str(e)}"
        )

@router.get("/")
def get_all_claims(db: Session = Depends(get_db)):
    claims = db.query(Claim).all()
    # Format for frontend table
    return [
        {
            "claim_id": c.id,
            "member_id": c.member_id,
            "member_name": c.member_name,
            "treatment_date": c.treatment_date,
            "claim_amount": c.claim_amount,
            "approved_amount": c.approved_amount or 0.0,
            "decision": c.decision or "PENDING"
        }
        for c in claims
    ]

@router.get("/{claim_id}")
def get_claim_detail(claim_id: str, db: Session = Depends(get_db)):
    c = db.query(Claim).filter(Claim.id == claim_id).first()
    if not c:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Claim not found")
        
    # Build full detail
    docs = db.query(Document).filter(Document.id == c.document_id).all()
    logs = db.query(AuditLog).filter(AuditLog.claim_id == c.id).order_by(AuditLog.created_at).all()
    
    return {
        "claim_id": c.id,
        "member_id": c.member_id,
        "member_name": c.member_name,
        "treatment_date": c.treatment_date,
        "hospital": c.hospital,
        "claim_amount": c.claim_amount,
        "decision": c.decision or "PENDING",
        "result": c.adjudication_result,
        "documents": [
            {
                "document_id": d.id,
                "document_type": d.document_type or "UNKNOWN",
                "classification_confidence": d.extraction_confidence or 0.0
            } for d in docs
        ],
        "audit_logs": [
            {
                "id": l.id,
                "action": l.action,
                "created_at": l.created_at.isoformat()
            } for l in logs
        ]
    }
