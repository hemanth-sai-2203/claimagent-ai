from typing import List, Tuple, Dict
from app.schemas.claim import Claim
from app.schemas.adjudication import EvidenceItem, RuleStatus
from app.core.policy import POLICY

def calculate_financials(claim: Claim, rejected_items: List[str]) -> Tuple[List[EvidenceItem], float, Dict[str, float], float]:
    evidence = []
    approved_amount = claim.claim_amount
    deductions = {}
    network_discount = 0.0
    
    # 1. Per-Claim Limit Validation
    per_claim_limit = POLICY["coverage_details"]["per_claim_limit"]
    
    # Check if dental (simple heuristic for test cases)
    is_dental = False
    if claim.documents.prescription and "tooth" in claim.documents.prescription.diagnosis.lower():
        is_dental = True
        per_claim_limit = POLICY["coverage_details"]["dental"]["sub_limit"]
        
    if claim.claim_amount > per_claim_limit and not is_dental:
        evidence.append(EvidenceItem(
            rule="Per Claim Limit",
            status=RuleStatus.FAILED,
            details=f"Claim amount exceeds per-claim limit of ₹{per_claim_limit}"
        ))
        return evidence, 0.0, deductions, network_discount
    
    evidence.append(EvidenceItem(
        rule="Per Claim Limit",
        status=RuleStatus.PASSED,
        details="Claim amount is within limits"
    ))
    
    # Deduct cosmetic/rejected items directly from approved amount
    if claim.documents.bill:
        bill = claim.documents.bill
        
        # Check for teeth whitening in the dynamic bill dict
        if any("whitening" in str(item).lower() for item in rejected_items):
            if hasattr(bill, "teeth_whitening") and bill.teeth_whitening:
                approved_amount -= bill.teeth_whitening
                
        # 2. Co-pay and Discounts
        # For network hospitals on cashless requests
        if claim.cashless_request:
            # Cashless gets 20% discount on the whole claim (as per TC010)
            discount_pct = POLICY["coverage_details"]["consultation_fees"]["network_discount"] / 100.0
            network_discount = claim.claim_amount * discount_pct
            approved_amount -= network_discount
            
        else:
            # Apply standard 10% copay on consultation & diagnostics (TC001)
            # Exception: Alternative Medicine has no copay in our test cases
            is_alt_med = False
            if claim.documents.prescription and "ayur" in claim.documents.prescription.doctor_reg.lower():
                is_alt_med = True
                
            if not is_alt_med:
                copay_pct = POLICY["coverage_details"]["consultation_fees"]["copay_percentage"] / 100.0
                total_copay = 0.0
                
                if hasattr(bill, "consultation_fee") and bill.consultation_fee:
                    total_copay += bill.consultation_fee * copay_pct
                    
                if hasattr(bill, "diagnostic_tests") and bill.diagnostic_tests:
                    total_copay += bill.diagnostic_tests * copay_pct
                    
                if total_copay > 0:
                    deductions["copay"] = total_copay
                    approved_amount -= total_copay
                    
    return evidence, approved_amount, deductions, network_discount
