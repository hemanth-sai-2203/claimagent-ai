from typing import List, Optional, Dict
from pydantic import BaseModel
from .adjudication import DecisionState, EvidenceItem, FraudResult, ConfidenceResult

class AdjudicationResult(BaseModel):
    claim_id: str
    decision: DecisionState
    approved_amount: float
    deductions: Optional[Dict[str, float]] = None
    network_discount: Optional[float] = None
    cashless_approved: Optional[bool] = None
    confidence_score: float
    fraud_score: float = 0.0
    evidence: List[EvidenceItem] = []
    rejection_reasons: List[str] = []
    rejected_items: List[str] = []
    flags: List[str] = []
    notes: Optional[str] = None
    next_steps: Optional[str] = None
