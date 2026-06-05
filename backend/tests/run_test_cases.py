# -*- coding: utf-8 -*-
"""
ClaimPilot AI — Automated Test Case Runner
==========================================
Runs all 10 test cases from test_cases.json directly against the
/api/v1/adjudication/ endpoint and reports pass/fail vs expected output.

Usage:
    cd backend
    python -m tests.run_test_cases

Prerequisites:
    Backend must be running: uvicorn app.main:app --reload
"""

import sys
import io
import json
import requests

# Ensure UTF-8 output on Windows
if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
from pathlib import Path
from datetime import datetime
from typing import Any, Dict

# ── Config ─────────────────────────────────────────────────────────────────
BASE_URL = "http://localhost:8000/api/v1"
TEST_CASES_PATH = Path(__file__).parent.parent.parent / "test_cases.json"

GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
CYAN   = "\033[96m"
BOLD   = "\033[1m"
RESET  = "\033[0m"


# ── Helpers ─────────────────────────────────────────────────────────────────

def _check(label: str, got: Any, expected: Any, tolerance: float = 0.05) -> bool:
    """
    Compare a single field. Returns True if matching.
    Floats are compared with a tolerance. Strings are compared case-insensitively.
    """
    if expected is None:
        return True  # Field not required in expected output → skip
    if isinstance(expected, float) or isinstance(got, float):
        try:
            return abs(float(got) - float(expected)) <= tolerance
        except (TypeError, ValueError):
            return False
    if isinstance(expected, str):
        return str(got).upper() == str(expected).upper()
    if isinstance(expected, list):
        got_set = {str(x).upper() for x in (got or [])}
        exp_set = {str(x).upper() for x in expected}
        return exp_set.issubset(got_set)
    return got == expected


def _build_claim_payload(tc_input: Dict, case_id: str) -> Dict:
    """
    Converts test_cases.json input_data format into the ClaimPilot
    /adjudication/ request body format.
    """
    docs = tc_input.get("documents", {})

    # Map prescription
    presc_raw = docs.get("prescription")
    prescription = None
    if presc_raw:
        prescription = {
            "doctor_name":          presc_raw.get("doctor_name", ""),
            "doctor_reg":           presc_raw.get("doctor_reg", ""),
            "diagnosis":            presc_raw.get("diagnosis", ""),
            "medicines_prescribed": presc_raw.get("medicines_prescribed", []),
            "procedures":           presc_raw.get("procedures", []),
            "tests_prescribed":     presc_raw.get("tests_prescribed", []),
            "treatment":            presc_raw.get("treatment"),
        }

    # Map bill
    bill_raw = docs.get("bill", {})
    bill = {
        "consultation_fee":  float(bill_raw.get("consultation_fee", 0)),
        "medicines":         float(bill_raw.get("medicines", 0)),
        "diagnostic_tests":  float(bill_raw.get("diagnostic_tests", 0)),
        "test_names":        bill_raw.get("test_names", []),
        "root_canal":        float(bill_raw["root_canal"])    if "root_canal"    in bill_raw else None,
        "teeth_whitening":   float(bill_raw["teeth_whitening"]) if "teeth_whitening" in bill_raw else None,
    }

    # Build claim_data
    claim_data: Dict[str, Any] = {
        "claim_id":                  case_id,
        "member_id":                 tc_input.get("member_id", "TEST-MEM"),
        "member_name":               tc_input.get("member_name", "Test Member"),
        "treatment_date":            tc_input.get("treatment_date", "2024-11-01"),
        "claim_amount":              float(tc_input.get("claim_amount", 1000)),
        "cashless_request":          bool(tc_input.get("cashless_request", False)),
        "previous_claims_same_day":  int(tc_input.get("previous_claims_same_day", 0)),
        "documents": {
            "prescription": prescription,
            "bill":         bill,
        },
    }

    if "member_join_date" in tc_input:
        claim_data["member_join_date"] = tc_input["member_join_date"]
    if "hospital" in tc_input:
        claim_data["hospital"] = tc_input["hospital"]

    return {
        "document_id": f"DOC-{case_id}",
        "claim_data":  claim_data,
    }


def _validate_result(result: Dict, expected: Dict) -> tuple[bool, list[str]]:
    """Compares the API result against the expected output. Returns (passed, issues)."""
    issues = []

    # Decision
    if not _check("decision", result.get("decision"), expected.get("decision")):
        issues.append(
            f"decision: got '{result.get('decision')}', expected '{expected.get('decision')}'"
        )

    # Approved amount (only when expected provided)
    if "approved_amount" in expected:
        if not _check("approved_amount", result.get("approved_amount"), expected["approved_amount"], tolerance=1.0):
            issues.append(
                f"approved_amount: got {result.get('approved_amount')}, expected {expected['approved_amount']}"
            )

    # Rejection reasons (all expected reasons must be present)
    if "rejection_reasons" in expected:
        if not _check("rejection_reasons", result.get("rejection_reasons"), expected["rejection_reasons"]):
            issues.append(
                f"rejection_reasons: got {result.get('rejection_reasons')}, expected {expected['rejection_reasons']}"
            )

    # Confidence score (within ±0.06)
    if "confidence_score" in expected:
        if not _check("confidence_score", result.get("confidence_score"), expected["confidence_score"], tolerance=0.06):
            issues.append(
                f"confidence_score: got {result.get('confidence_score'):.2f}, expected {expected['confidence_score']:.2f}"
            )

    # Cashless approved
    if expected.get("cashless_approved") is True:
        if not result.get("cashless_approved"):
            issues.append("cashless_approved: expected True, got falsy")

    # Network discount present
    if "network_discount" in expected and expected["network_discount"]:
        if not result.get("network_discount"):
            issues.append(f"network_discount: expected ~{expected['network_discount']}, got nothing")

    # Flags (all expected flags substring-matched)
    if "flags" in expected:
        result_flags_str = " ".join(str(f).lower() for f in (result.get("flags") or []))
        for flag in expected["flags"]:
            if flag.lower().split()[0] not in result_flags_str:
                issues.append(f"flags: expected flag '{flag}' not found in {result.get('flags')}")

    # Rejected items (partial approval)
    if "rejected_items" in expected:
        exp_items = [str(x).lower() for x in expected["rejected_items"]]
        got_items = [str(x).lower() for x in (result.get("rejected_items") or [])]
        for item in exp_items:
            keyword = item.split()[0]  # e.g. "teeth"
            if not any(keyword in g for g in got_items):
                issues.append(f"rejected_items: expected '{item}' not found in {result.get('rejected_items')}")

    return len(issues) == 0, issues


# ── Runner ──────────────────────────────────────────────────────────────────

def run_all() -> None:
    # Load test cases
    with open(TEST_CASES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    test_cases = data["test_cases"]

    SEP = "=" * 70
    print(f"\n{BOLD}{CYAN}{SEP}{RESET}")
    print(f"{BOLD}{CYAN}  ClaimPilot AI - Test Case Runner  ({datetime.now().strftime('%H:%M:%S')}){RESET}")
    print(f"{BOLD}{CYAN}{SEP}{RESET}\n")

    passed_count = 0
    failed_count = 0
    errors_count = 0
    results_summary = []

    for tc in test_cases:
        case_id   = tc["case_id"]
        case_name = tc["case_name"]
        expected  = tc["expected_output"]
        payload   = _build_claim_payload(tc["input_data"], case_id)

        print(f"  {BOLD}{case_id}{RESET} — {case_name}")

        try:
            resp = requests.post(f"{BASE_URL}/adjudication/", json=payload, timeout=15)
            if resp.status_code not in (200, 201):
                print(f"    {RED}✗ HTTP {resp.status_code}: {resp.text[:200]}{RESET}\n")
                errors_count += 1
                results_summary.append({"id": case_id, "status": "ERROR", "note": f"HTTP {resp.status_code}"})
                continue

            result = resp.json()
            passed, issues = _validate_result(result, expected)

            if passed:
                print(f"    {GREEN}✓ PASS{RESET}  decision={result.get('decision')}  approved=₹{result.get('approved_amount', 0):,.0f}  conf={result.get('confidence_score', 0):.2f}")
                passed_count += 1
                results_summary.append({"id": case_id, "status": "PASS"})
            else:
                print(f"    {RED}✗ FAIL{RESET}  decision={result.get('decision')}  approved=₹{result.get('approved_amount', 0):,.0f}  conf={result.get('confidence_score', 0):.2f}")
                for issue in issues:
                    print(f"         {YELLOW}⚠ {issue}{RESET}")
                failed_count += 1
                results_summary.append({"id": case_id, "status": "FAIL", "issues": issues})

        except requests.exceptions.ConnectionError:
            print(f"    {RED}✗ ERROR: Cannot connect to {BASE_URL}. Is the backend running?{RESET}")
            errors_count += 1
            results_summary.append({"id": case_id, "status": "ERROR", "note": "Connection refused"})

        except Exception as ex:
            print(f"    {RED}✗ EXCEPTION: {ex}{RESET}")
            errors_count += 1
            results_summary.append({"id": case_id, "status": "ERROR", "note": str(ex)})

        print()

    # ── Summary ─────────────────────────────────────────────────────────────
    total = len(test_cases)
    SEP = "=" * 70
    print(f"{BOLD}{CYAN}{SEP}{RESET}")
    print(f"{BOLD}  Results: {GREEN}{passed_count} passed{RESET}{BOLD}, {RED}{failed_count} failed{RESET}{BOLD}, {YELLOW}{errors_count} errors{RESET}{BOLD} / {total} total{RESET}")
    print(f"{BOLD}{CYAN}{SEP}{RESET}\n")

    if failed_count > 0 or errors_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    run_all()
