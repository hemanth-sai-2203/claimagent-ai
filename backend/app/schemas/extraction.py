from pydantic import BaseModel, Field
from typing import List, Literal
from app.schemas.claim import ExtractedClaimData

class DocumentClassification(BaseModel):
    document_type: Literal["PRESCRIPTION", "MEDICAL_BILL", "DIAGNOSTIC_REPORT", "PHARMACY_BILL", "OTHER"] = Field(
        ..., description="The classified type of the document."
    )
    confidence: float = Field(..., description="Confidence score of the classification between 0.0 and 1.0")

class ExtractionResult(BaseModel):
    classification: DocumentClassification
    extracted_data: ExtractedClaimData
    overall_confidence: float = Field(..., description="Overall confidence in the extraction accuracy")
    error_flags: List[str] = Field(
        default_factory=list, 
        description="Any issues found like blurry text, missing registration number, cropped margins, etc."
    )
