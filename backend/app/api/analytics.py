from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.database import get_db
from app.db.models import Claim

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/metrics")
def get_metrics(db: Session = Depends(get_db)):
    claims = db.query(Claim).all()
    
    total_claims = len(claims)
    
    decisions = {"APPROVED": 0, "REJECTED": 0, "PARTIAL": 0, "MANUAL_REVIEW": 0}
    total_confidence = 0.0
    fraud_flags_freq = {}
    
    for c in claims:
        # Decision distribution
        d = c.decision or "PENDING"
        if d in decisions:
            decisions[d] += 1
            
        # Confidence
        total_confidence += (c.confidence_score or 0.0)
        
        # Fraud Flags
        if c.adjudication_result and "flags" in c.adjudication_result:
            for flag in c.adjudication_result["flags"]:
                if isinstance(flag, str):
                    reason = flag
                else:
                    reason = flag.get("reason", "Unknown Flag")
                fraud_flags_freq[reason] = fraud_flags_freq.get(reason, 0) + 1
                
    avg_confidence = (total_confidence / total_claims) if total_claims > 0 else 0.0
    
    # Sort fraud flags by frequency descending
    sorted_flags = [{"reason": k, "count": v} for k, v in sorted(fraud_flags_freq.items(), key=lambda item: item[1], reverse=True)]
    
    return {
        "total_claims": total_claims,
        "decisions": decisions,
        "avg_confidence": avg_confidence,
        "fraud_flags": sorted_flags
    }
