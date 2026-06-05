from typing import List, Tuple
from app.schemas.claim import Claim
from app.schemas.adjudication import EvidenceItem, RuleStatus

def validate_fraud(claim: Claim) -> Tuple[List[EvidenceItem], List[str]]:
    evidence = []
    flags = []
    
    # 1. Multiple claims same day (TC008)
    if claim.previous_claims_same_day >= 3:
        flags.append("Multiple claims same day")
        flags.append("Unusual pattern detected")
        
        evidence.append(EvidenceItem(
            rule="Fraud Check",
            status=RuleStatus.FAILED,
            details=f"{claim.previous_claims_same_day} previous claims submitted on same day"
        ))
    else:
        evidence.append(EvidenceItem(
            rule="Fraud Check",
            status=RuleStatus.PASSED,
            details="No obvious fraud indicators detected"
        ))
        
    return evidence, flags
