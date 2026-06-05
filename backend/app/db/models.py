from sqlalchemy import Column, String, Float, Boolean, JSON, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Document(Base):
    __tablename__ = "documents"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)
    document_type = Column(String, nullable=True)  # Set after extraction
    extraction_confidence = Column(Float, nullable=True) # Set after extraction
    extracted_data = Column(JSON, nullable=True) # Raw JSON from extraction
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    claims = relationship("Claim", back_populates="document")

class Claim(Base):
    __tablename__ = "claims"

    id = Column(String, primary_key=True, index=True) # e.g. CLM-2024-001
    member_id = Column(String, index=True, nullable=False)
    member_name = Column(String, nullable=False)
    member_join_date = Column(String, nullable=True) # YYYY-MM-DD
    treatment_date = Column(String, nullable=False) # YYYY-MM-DD
    hospital = Column(String, nullable=True)
    claim_amount = Column(Float, nullable=False)
    
    # Links back to the document
    document_id = Column(String, ForeignKey("documents.id"))
    document = relationship("Document", back_populates="claims")

    # Adjudication fields
    decision = Column(String, nullable=True) # APPROVED, REJECTED, PARTIAL, MANUAL_REVIEW
    approved_amount = Column(Float, nullable=True)
    confidence_score = Column(Float, nullable=True)
    fraud_score = Column(Float, nullable=True)
    adjudication_result = Column(JSON, nullable=True) # Full JSON dump of the rules engine result
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    audit_logs = relationship("AuditLog", back_populates="claim")
    manual_reviews = relationship("ManualReview", back_populates="claim")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    claim_id = Column(String, ForeignKey("claims.id"))
    action = Column(String, nullable=False) # e.g. CLAIM_SUBMITTED, ADJUDICATION_COMPLETED
    details = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    claim = relationship("Claim", back_populates="audit_logs")

class ManualReview(Base):
    __tablename__ = "manual_reviews"

    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    claim_id = Column(String, ForeignKey("claims.id"), unique=True)
    status = Column(String, default="PENDING") # PENDING, RESOLVED
    final_decision = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    claim = relationship("Claim", back_populates="manual_reviews")
