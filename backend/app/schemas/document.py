from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field

class DocumentType(str, Enum):
    PRESCRIPTION = "prescription"
    BILL = "bill"
    DIAGNOSTIC_REPORT = "diagnostic_report"
    PHARMACY_BILL = "pharmacy_bill"
    UNKNOWN = "unknown"

class Document(BaseModel):
    document_id: str
    claim_id: str
    file_name: str
    file_type: str = Field(..., pattern=r"^(application/pdf|image/(jpeg|png))$")
    document_category: DocumentType
    storage_path: Optional[str] = None
