from datetime import date
from typing import List, Dict, Any
from app.schemas.claim import Claim
from app.schemas.adjudication import DecisionState, EvidenceItem, RuleStatus
from app.schemas.result import AdjudicationResult
from app.core.policy import POLICY

from .eligibility import validate_eligibility
from .document import validate_documents
from .coverage import validate_coverage
from .limits import calculate_financials
from .necessity import validate_necessity
from .fraud import validate_fraud


def _compute_waiting_period_note(claim: Claim) -> str:
    """Generate a precise waiting period rejection note from claim data."""
    if not claim.documents.prescription or not claim.member_join_date:
        return "Treatment falls within the policy waiting period"

    diag = claim.documents.prescription.diagnosis
    specific_ailments = POLICY.get("waiting_periods", {}).get("specific_ailments", {})
    diag_lower = diag.lower()

    for ailment, waiting_days in specific_ailments.items():
        if ailment in diag_lower:
            eligible_date = date.fromordinal(claim.member_join_date.toordinal() + waiting_days)
            return (
                f"{diag} has a {waiting_days}-day waiting period. "
                f"Eligible from {eligible_date.strftime('%Y-%m-%d')}"
            )

    # General waiting period
    general_days = POLICY.get("waiting_periods", {}).get("general_waiting_period_days", 30)
    eligible_date = date.fromordinal(claim.member_join_date.toordinal() + general_days)
    return f"Treatment falls within general {general_days}-day waiting period. Eligible from {eligible_date.strftime('%Y-%m-%d')}"


def evaluate_claim(claim: Claim) -> AdjudicationResult:
    all_evidence = []
    rejection_reasons = []
    flags = []

    # ── Step 1: Eligibility ─────────────────────────────────────────────────
    eligibility_ev = validate_eligibility(claim)
    all_evidence.extend(eligibility_ev)
    for e in eligibility_ev:
        if e.status == RuleStatus.FAILED:
            if "Waiting" in e.rule or "waiting" in e.details:
                rejection_reasons.append("WAITING_PERIOD")
            elif "Member" in e.rule:
                rejection_reasons.append("MEMBER_NOT_COVERED")
            elif "Policy" in e.rule:
                rejection_reasons.append("POLICY_INACTIVE")

    # ── Step 2: Document Validation ─────────────────────────────────────────
    doc_ev = validate_documents(claim)
    all_evidence.extend(doc_ev)
    for e in doc_ev:
        if e.status == RuleStatus.FAILED:
            if "Prescription" in e.details or "prescription" in e.details:
                rejection_reasons.append("MISSING_DOCUMENTS")
            elif "registration" in e.details.lower() or "reg" in e.details.lower():
                rejection_reasons.append("DOCTOR_REG_INVALID")
            else:
                rejection_reasons.append("DOCUMENT_INVALID")

    # ── Step 3: Coverage Validation ─────────────────────────────────────────
    cov_ev, rejected_items = validate_coverage(claim)
    all_evidence.extend(cov_ev)
    for e in cov_ev:
        if e.status == RuleStatus.FAILED:
            if "Pre-Authorization" in e.rule:
                rejection_reasons.append("PRE_AUTH_MISSING")
            elif "excluded" in e.details.lower() or "Excluded" in e.details:
                # Only a hard rejection if the ENTIRE claim is excluded (not just partial)
                if not rejected_items:
                    rejection_reasons.append("SERVICE_NOT_COVERED")

    # ── Step 4: Fraud Detection ─────────────────────────────────────────────
    fraud_ev, fraud_flags = validate_fraud(claim)
    all_evidence.extend(fraud_ev)
    flags.extend(fraud_flags)

    # ── Step 5: Medical Necessity ───────────────────────────────────────────
    nec_ev = validate_necessity(claim)
    all_evidence.extend(nec_ev)

    # ── Compute confidence ──────────────────────────────────────────────────
    confidence_score = 0.95
    if flags:
        confidence_score = 0.65

    # ── MANUAL_REVIEW: fraud flags take priority ────────────────────────────
    if flags:
        return AdjudicationResult(
            claim_id=claim.claim_id,
            decision=DecisionState.MANUAL_REVIEW,
            approved_amount=0.0,
            confidence_score=confidence_score,
            flags=flags,
            evidence=all_evidence,
            notes="Claim flagged for fraud indicators. Routing to human review.",
            next_steps="An analyst will review this claim within 2 business days. You will be notified of the outcome.",
        )

    # ── REJECTED: hard policy violations ───────────────────────────────────
    if rejection_reasons:
        notes = "Claim rejected based on policy rules"
        next_steps = "Please contact your HR / insurance helpdesk for assistance."

        if "WAITING_PERIOD" in rejection_reasons:
            notes = _compute_waiting_period_note(claim)
            next_steps = "You may resubmit this claim after the waiting period has elapsed."
        elif "MISSING_DOCUMENTS" in rejection_reasons:
            notes = "Prescription from a registered doctor is required"
            next_steps = "Please attach a valid prescription and resubmit the claim."
        elif "DOCTOR_REG_INVALID" in rejection_reasons:
            notes = "Doctor's registration number is missing or in an invalid format"
            next_steps = "Obtain a prescription with a valid doctor registration number (e.g. KA/45678/2015) and resubmit."
        elif "PRE_AUTH_MISSING" in rejection_reasons:
            notes = "MRI requires pre-authorization for claims above ₹10,000"
            next_steps = "Please obtain pre-authorization before undergoing this procedure and resubmit."
        elif "SERVICE_NOT_COVERED" in rejection_reasons:
            notes = "Treatment or service is excluded from coverage under your policy"
            next_steps = "Review your policy exclusions. Contact support if you believe this is an error."
        elif "POLICY_INACTIVE" in rejection_reasons:
            notes = "Policy was not active on the treatment date"
            next_steps = "Please ensure your policy is active before submitting claims."

        # Confidence varies by rejection type
        conf_map = {
            "MISSING_DOCUMENTS": 1.0,
            "WAITING_PERIOD": 0.96,
            "SERVICE_NOT_COVERED": 0.97,
            "PRE_AUTH_MISSING": 0.94,
            "DOCTOR_REG_INVALID": 0.93,
        }
        computed_conf = next(
            (conf_map[r] for r in rejection_reasons if r in conf_map),
            0.92
        )

        return AdjudicationResult(
            claim_id=claim.claim_id,
            decision=DecisionState.REJECTED,
            approved_amount=0.0,
            rejection_reasons=rejection_reasons,
            notes=notes,
            next_steps=next_steps,
            confidence_score=computed_conf,
            evidence=all_evidence,
        )

    # ── Step 6: Limits and Financials ───────────────────────────────────────
    fin_ev, approved_amount, deductions, discount = calculate_financials(claim, rejected_items)
    all_evidence.extend(fin_ev)

    for e in fin_ev:
        if e.status == RuleStatus.FAILED:
            rejection_reasons.append("PER_CLAIM_EXCEEDED")
            return AdjudicationResult(
                claim_id=claim.claim_id,
                decision=DecisionState.REJECTED,
                approved_amount=0.0,
                rejection_reasons=rejection_reasons,
                notes=f"Claim amount of ₹{claim.claim_amount:,.0f} exceeds the per-claim limit of ₹{POLICY['coverage_details']['per_claim_limit']:,}",
                next_steps="Claim amounts beyond the per-claim limit cannot be reimbursed. Contact HR for details on your coverage limits.",
                confidence_score=0.98,
                evidence=all_evidence,
            )

    # ── Success: APPROVED or PARTIAL ────────────────────────────────────────
    decision = DecisionState.APPROVED
    notes = None
    next_steps = "Your claim has been approved. Reimbursement will be processed within 5-7 business days."

    if rejected_items:
        decision = DecisionState.PARTIAL
        confidence_score = 0.92
        rejected_desc = "; ".join(rejected_items)
        notes = f"Partial approval: the following items were excluded — {rejected_desc}"
        next_steps = f"Approved amount of ₹{approved_amount:,.0f} will be reimbursed. Excluded items are not covered under your policy."
    elif claim.cashless_request:
        confidence_score = 0.93
        notes = "Cashless claim approved at network hospital"
        next_steps = "Cashless approval confirmed. The hospital will settle directly with the insurer."
    elif (
        claim.documents.prescription
        and claim.documents.prescription.doctor_reg
        and "ayur" in claim.documents.prescription.doctor_reg.lower()
    ):
        notes = "Alternative medicine covered under policy"
        confidence_score = 0.89
        next_steps = "Ayurvedic/alternative treatment is covered. Reimbursement in 5-7 business days."

    return AdjudicationResult(
        claim_id=claim.claim_id,
        decision=decision,
        approved_amount=approved_amount,
        deductions=deductions if deductions else None,
        network_discount=discount if discount > 0 else None,
        cashless_approved=True if claim.cashless_request else None,
        confidence_score=confidence_score,
        rejected_items=rejected_items,
        notes=notes,
        next_steps=next_steps,
        evidence=all_evidence,
    )
