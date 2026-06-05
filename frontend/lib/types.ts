// ============================================================
// ClaimPilot AI — Shared TypeScript Types
// ============================================================

export type DecisionState = 'APPROVED' | 'REJECTED' | 'PARTIAL' | 'MANUAL_REVIEW';

export type DocumentType =
  | 'PRESCRIPTION'
  | 'MEDICAL_BILL'
  | 'DIAGNOSTIC_REPORT'
  | 'PHARMACY_BILL'
  | 'OTHER';

export interface EvidenceItem {
  rule: string;
  status: 'passed' | 'failed' | 'skipped';
  details: string;
}

export interface AdjudicationResult {
  claim_id: string;
  decision: DecisionState;
  approved_amount: number;
  confidence_score: number;
  fraud_score: number;
  rejection_reasons: string[];
  rejected_items: string[];
  flags: string[];
  notes: string | null;
  next_steps: string | null;
  evidence: EvidenceItem[];
  deductions: Record<string, number> | null;
  network_discount: number | null;
  cashless_approved: boolean | null;
}

export interface ClaimRecord {
  claim_id: string;
  member_id: string;
  member_name: string;
  treatment_date: string;
  claim_amount: number;
  hospital: string | null;
  cashless_request: boolean;
  decision: DecisionState;
  approved_amount: number;
  confidence_score: number;
  created_at: string;
}

export interface DocumentRecord {
  document_id: string;
  claim_id: string;
  document_type: DocumentType;
  classification_confidence: number;
  created_at: string;
}

export interface AuditLogEntry {
  id: number;
  claim_id: string;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
}

export interface ManualReviewItem {
  claim_id: string;
  member_name: string;
  claim_amount: number;
  flags: string[];
  confidence_score: number;
  created_at: string;
  reviewed_at: string | null;
  final_decision: 'APPROVED' | 'REJECTED' | null;
}

export interface ClaimDetail extends ClaimRecord {
  result: AdjudicationResult;
  documents: DocumentRecord[];
  audit_logs: AuditLogEntry[];
  manual_review: ManualReviewItem | null;
}
