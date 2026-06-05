from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class DecisionState(str, Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PARTIAL = "PARTIAL"
    MANUAL_REVIEW = "MANUAL_REVIEW"

class RuleStatus(str, Enum):
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"

class EvidenceItem(BaseModel):
    rule: str = Field(..., description="Name of the rule evaluated")
    status: RuleStatus = Field(..., description="Outcome of the rule evaluation")
    details: str = Field(..., description="Explanation of the outcome")

class RuleResult(BaseModel):
    rule_name: str
    status: RuleStatus
    message: str

class FraudResult(BaseModel):
    fraud_score: float = Field(default=0.0, ge=0.0, le=1.0)
    flags: List[str] = Field(default_factory=list)
    is_suspicious: bool = False

class ConfidenceResult(BaseModel):
    overall_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    extraction_confidence: float = Field(default=1.0, ge=0.0, le=1.0)
    rule_certainty: float = Field(default=1.0, ge=0.0, le=1.0)
