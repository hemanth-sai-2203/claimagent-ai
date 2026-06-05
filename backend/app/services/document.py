import re
from typing import List
from app.schemas.claim import Claim
from app.schemas.adjudication import EvidenceItem, RuleStatus

DOCTOR_REG_PATTERN = re.compile(r"^[A-Z]{2,4}/\d{3,6}/\d{4}$")

def validate_documents(claim: Claim) -> List[EvidenceItem]:
    evidence = []
    
    # 1. Check for missing documents (prescription)
    if not claim.documents.prescription:
        evidence.append(EvidenceItem(
            rule="Document Completeness",
            status=RuleStatus.FAILED,
            details="Prescription from registered doctor is required"
        ))
        return evidence
    
    evidence.append(EvidenceItem(
        rule="Document Completeness",
        status=RuleStatus.PASSED,
        details="All required documents are present"
    ))
    
    # 2. Doctor Registration Validation
    reg_number = claim.documents.prescription.doctor_reg
    # We relax the strict matching just slightly if it contains 'AYUR' or similar valid prefixes.
    # Our regex captures things like KA/45678/2015. 
    # For alternative medicine like AYUR/KL/2345/2019, we adapt the regex check.
    is_valid_format = bool(re.search(r"[A-Z]{2,4}/?\w*/\d{3,6}/\d{4}", reg_number.upper()))
    
    if not is_valid_format:
        evidence.append(EvidenceItem(
            rule="Doctor Registration",
            status=RuleStatus.FAILED,
            details=f"Invalid doctor registration format: {reg_number}"
        ))
    else:
        evidence.append(EvidenceItem(
            rule="Doctor Registration",
            status=RuleStatus.PASSED,
            details="Doctor registration number is valid"
        ))
        
    return evidence
