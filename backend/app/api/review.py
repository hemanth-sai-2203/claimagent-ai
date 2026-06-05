from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.db.models import Claim, ManualReview, AuditLog

router = APIRouter(prefix="/manual-review", tags=["Manual Review"])

class ReviewDecision(BaseModel):
    decision: str  # APPROVED or REJECTED
    notes: str

@router.get("/")
def get_manual_reviews(db: Session = Depends(get_db)):
    reviews = db.query(ManualReview).all()
    result = []
    for r in reviews:
        c = r.claim
        result.append({
            "claim_id": c.id,
            "member_name": c.member_name,
            "claim_amount": c.claim_amount,
            "flags": c.adjudication_result.get("flags", []) if c.adjudication_result else [],
            "status": r.status,
            "final_decision": r.final_decision,
            "reviewed_at": r.reviewed_at.isoformat() if r.reviewed_at else None
        })
    return result

@router.post("/{claim_id}")
def submit_review(claim_id: str, payload: ReviewDecision, db: Session = Depends(get_db)):
    if payload.decision not in ["APPROVED", "REJECTED"]:
        raise HTTPException(status_code=400, detail="Decision must be APPROVED or REJECTED")
        
    review = db.query(ManualReview).filter(ManualReview.claim_id == claim_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Manual review record not found")
        
    if review.status == "RESOLVED":
        raise HTTPException(status_code=400, detail="Review already resolved")
        
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    # Update Review
    review.status = "RESOLVED"
    review.final_decision = payload.decision
    review.notes = payload.notes
    review.reviewed_at = datetime.utcnow()
    
    # Update Claim
    claim.decision = payload.decision
    if claim.adjudication_result:
        claim.adjudication_result["decision"] = payload.decision
        claim.adjudication_result["notes"] = payload.notes
        
    # Add Audit Log
    db.add(AuditLog(
        claim_id=claim.id,
        action="MANUAL_REVIEW_COMPLETED",
        details=f"Human reviewer set decision to {payload.decision}. Notes: {payload.notes}"
    ))
    
    db.commit()
    
    return {"success": True}

@router.post("/appeal/{claim_id}")
def appeal_claim(claim_id: str, db: Session = Depends(get_db)):
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    if claim.decision not in ["REJECTED", "PARTIAL", "APPROVED"]:
        # usually you wouldn't appeal a pending claim, but allowed for completeness.
        pass
        
    # Check if there's already a review
    review = db.query(ManualReview).filter(ManualReview.claim_id == claim_id).first()
    if not review:
        review = ManualReview(
            claim_id=claim.id,
            status="PENDING"
        )
        db.add(review)
    else:
        review.status = "PENDING"
        review.final_decision = None
        review.reviewed_at = None
        
    # Reset claim decision
    claim.decision = "MANUAL_REVIEW"
    
    # Audit log
    db.add(AuditLog(
        claim_id=claim.id,
        action="CLAIM_APPEALED",
        details="User appealed the decision. Sent to manual review queue."
    ))
    
    db.commit()
    
    return {"success": True}
