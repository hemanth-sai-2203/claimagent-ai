from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.db.database import get_db
from app.db.models import Claim, AuditLog, ManualReview
from app.schemas.claim import Claim as ClaimSchema
from app.schemas.result import AdjudicationResult
from app.services.engine import evaluate_claim

router = APIRouter(prefix="/adjudication", tags=["Adjudication"])

class AdjudicateRequest(BaseModel):
    document_id: str
    claim_data: ClaimSchema

@router.post("/", response_model=AdjudicationResult)
def adjudicate(request: AdjudicateRequest, db: Session = Depends(get_db)):
    # Look up prior claims from the database to prevent fraud (if not explicitly provided by test payload)
    if request.claim_data.previous_claims_same_day == 0:
        prior_claims_count = db.query(Claim).filter(
            Claim.member_id == request.claim_data.member_id,
            Claim.treatment_date == str(request.claim_data.treatment_date)
        ).count()
        request.claim_data.previous_claims_same_day = prior_claims_count

    # Run the deterministic rules engine
    try:
        result = evaluate_claim(request.claim_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Adjudication engine failed: {str(e)}")
        
    # Save the Claim to DB
    db_claim = db.query(Claim).filter(Claim.id == request.claim_data.claim_id).first()
    if not db_claim:
        db_claim = Claim(
            id=request.claim_data.claim_id,
            member_id=request.claim_data.member_id,
            member_name=request.claim_data.member_name,
            member_join_date=str(request.claim_data.member_join_date) if request.claim_data.member_join_date else None,
            treatment_date=str(request.claim_data.treatment_date),
            hospital=request.claim_data.hospital,
            claim_amount=request.claim_data.claim_amount,
            document_id=request.document_id,
        )
        db.add(db_claim)
        
    # Update Claim with result
    db_claim.decision = result.decision.value
    db_claim.approved_amount = result.approved_amount
    db_claim.confidence_score = result.confidence_score
    db_claim.fraud_score = result.fraud_score
    db_claim.adjudication_result = result.model_dump(mode="json")
    
    # Save Audit Log
    db.add(AuditLog(
        claim_id=db_claim.id,
        action="CLAIM_SUBMITTED",
        details="Claim data received from extraction."
    ))
    db.add(AuditLog(
        claim_id=db_claim.id,
        action="ADJUDICATION_COMPLETED",
        details=f"Engine returned decision: {result.decision.value}"
    ))
    
    # If MANUAL_REVIEW, add to Review Queue
    if result.decision.value == "MANUAL_REVIEW":
        review = db.query(ManualReview).filter(ManualReview.claim_id == db_claim.id).first()
        if not review:
            db.add(ManualReview(
                claim_id=db_claim.id,
                status="PENDING"
            ))
            
    db.commit()
    
    return result
