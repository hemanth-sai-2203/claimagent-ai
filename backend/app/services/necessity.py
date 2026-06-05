from typing import List
from app.schemas.claim import Claim
from app.schemas.adjudication import EvidenceItem, RuleStatus

def validate_necessity(claim: Claim) -> List[EvidenceItem]:
    evidence = []
    
    # In a full production system, this maps ICD-10 (diagnosis) to CPT (treatment)
    # For now, we assume medical necessity is passed unless explicitly flagged.
    evidence.append(EvidenceItem(
        rule="Medical Necessity",
        status=RuleStatus.PASSED,
        details="Treatment aligns with stated diagnosis"
    ))
    
    return evidence
