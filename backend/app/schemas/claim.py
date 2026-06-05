from datetime import date
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator, ConfigDict

class PrescriptionData(BaseModel):
    doctor_name: str
    doctor_reg: str = Field(..., description="Doctor's registration number (e.g. KA/45678/2015)")
    diagnosis: str
    medicines_prescribed: List[str] = Field(default_factory=list)
    procedures: List[str] = Field(default_factory=list)
    tests_prescribed: List[str] = Field(default_factory=list)
    treatment: Optional[str] = None

class BillData(BaseModel):
    consultation_fee: float = Field(default=0.0, ge=0.0)
    medicines: float = Field(default=0.0, ge=0.0)
    diagnostic_tests: float = Field(default=0.0, ge=0.0)
    test_names: List[str] = Field(default_factory=list)
    root_canal: Optional[float] = Field(default=None, ge=0.0)
    teeth_whitening: Optional[float] = Field(default=None, ge=0.0)

class ExtractedClaimData(BaseModel):
    prescription: Optional[PrescriptionData] = None
    bill: Optional[BillData] = None

class Claim(BaseModel):
    claim_id: str
    member_id: str
    member_name: str
    member_join_date: Optional[date] = None
    treatment_date: date
    claim_amount: float = Field(..., gt=0)
    hospital: Optional[str] = None
    cashless_request: bool = False
    previous_claims_same_day: int = Field(default=0, ge=0)
    documents: ExtractedClaimData
    
    @field_validator('treatment_date', 'member_join_date', mode='before')
    def parse_date(cls, v):
        if isinstance(v, str):
            return date.fromisoformat(v)
        return v
        
    @field_validator('claim_amount')
    def validate_min_claim_amount(cls, v):
        if v < 500:
            raise ValueError("Claim amount must be at least ₹500 as per policy")
        return v
