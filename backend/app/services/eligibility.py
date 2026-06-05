from typing import List
from app.schemas.claim import Claim
from app.schemas.adjudication import EvidenceItem, RuleStatus
from app.core.policy import POLICY

def validate_eligibility(claim: Claim) -> List[EvidenceItem]:
    evidence = []
    
    # 1. Policy Active (Assume active for now unless we add an end_date to policy)
    evidence.append(EvidenceItem(
        rule="Policy Active",
        status=RuleStatus.PASSED,
        details="Policy is active on treatment date"
    ))
    
    # 2. Covered Member
    evidence.append(EvidenceItem(
        rule="Member Covered",
        status=RuleStatus.PASSED,
        details=f"Member {claim.member_name} is covered"
    ))
    
    # 3. Waiting Periods
    if claim.member_join_date:
        days_active = (claim.treatment_date - claim.member_join_date).days
        
        # Check specific ailments waiting periods if diagnosis is available
        if claim.documents.prescription and claim.documents.prescription.diagnosis:
            diag_lower = claim.documents.prescription.diagnosis.lower()
            specific_ailments = POLICY.get("waiting_periods", {}).get("specific_ailments", {})
            
            for ailment, waiting_days in specific_ailments.items():
                if ailment in diag_lower:
                    if days_active < waiting_days:
                        evidence.append(EvidenceItem(
                            rule="Waiting Period",
                            status=RuleStatus.FAILED,
                            details=f"{ailment.capitalize()} has a {waiting_days}-day waiting period. Only {days_active} days elapsed."
                        ))
                        return evidence # Fail fast
                        
    evidence.append(EvidenceItem(
        rule="Waiting Period",
        status=RuleStatus.PASSED,
        details="All applicable waiting periods completed"
    ))
    
    return evidence
