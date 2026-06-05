import json
import pytest
from pathlib import Path
from decimal import Decimal
from app.schemas.claim import Claim, ExtractedClaimData
from app.services.engine import evaluate_claim

# Load test cases
TEST_CASES_FILE = Path(__file__).parent.parent.parent / "test_cases.json"

def load_test_cases():
    with open(TEST_CASES_FILE, "r") as f:
        data = json.load(f)
    return data["test_cases"]

TEST_CASES = load_test_cases()


@pytest.mark.parametrize("test_case", TEST_CASES, ids=lambda tc: tc["case_id"])
def test_adjudication_scenarios(test_case: dict):
    """
    Test all adjudication scenarios defined in test_cases.json.
    """
    input_data = test_case["input_data"]
    expected = test_case["expected_output"]
    
    # Construct Claim object
    documents_data = input_data.get("documents", {})
    documents = ExtractedClaimData(**documents_data)
        
    claim = Claim(
        claim_id=test_case["case_id"],
        member_id=input_data["member_id"],
        member_name=input_data["member_name"],
        member_join_date=input_data.get("member_join_date"),
        treatment_date=input_data["treatment_date"],
        claim_amount=float(input_data["claim_amount"]),
        documents=documents,
        hospital=input_data.get("hospital"),
        cashless_request=input_data.get("cashless_request", False),
        previous_claims_same_day=input_data.get("previous_claims_same_day", 0)
    )
    
    result = evaluate_claim(claim)
    
    # 1. Validate Decision
    assert result.decision.value == expected["decision"], f"Expected {expected['decision']} but got {result.decision.value}"
    
    # 2. Validate Approved Amount
    if "approved_amount" in expected:
        assert result.approved_amount == Decimal(str(expected["approved_amount"])), f"Expected {expected['approved_amount']} but got {result.approved_amount}"
        
    # 3. Validate Rejection Reasons
    if "rejection_reasons" in expected:
        reasons = [r for r in result.rejection_reasons]
        assert set(reasons) == set(expected["rejection_reasons"]), f"Expected {expected['rejection_reasons']} but got {reasons}"
        
    # 4. Validate Confidence Score
    if "confidence_score" in expected:
        assert float(result.confidence_score) == expected["confidence_score"], f"Expected {expected['confidence_score']} but got {result.confidence_score}"
        
    # 5. Validate specific notes/deductions/rejected_items/cashless
    if "deductions" in expected:
        assert result.deductions.get("copay") == Decimal(str(expected["deductions"]["copay"]))
        
    if "rejected_items" in expected:
        assert set(result.rejected_items) == set(expected["rejected_items"])
        
    if "cashless_approved" in expected:
        assert result.cashless_approved == expected["cashless_approved"]
        
    if "network_discount" in expected:
        assert result.network_discount == Decimal(str(expected["network_discount"]))
