// ============================================================
// ClaimPilot AI — API Client
// All calls return mock data; swap BASE_URL logic for real API.
// ============================================================

import type { ClaimDetail, ClaimRecord, ManualReviewItem, AdjudicationResult } from './types';
import { MOCK_CLAIMS, MOCK_CLAIM_DETAILS, MOCK_MANUAL_REVIEW_QUEUE } from './mockData';

const USE_MOCK = false; // Set to false when backend is live
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api/v1';

// ---- Helpers -----------------------------------------------

async function post<T>(path: string, body: FormData | Record<string, unknown> | null): Promise<T> {
  const isForm = body instanceof FormData;
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: isForm ? undefined : { 'Content-Type': 'application/json' },
    body: isForm ? body : (body ? JSON.stringify(body) : null),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

async function put<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

// ---- Upload ------------------------------------------------

export async function uploadDocument(file: File): Promise<{ document_id: string }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1200));
    return { document_id: `DOC-MOCK-${Date.now()}` };
  }
  const fd = new FormData();
  fd.append('file', file);
  return post('/documents/upload', fd);
}

// ---- Extract -----------------------------------------------

export async function extractDocument(document_id: string): Promise<unknown> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1500));
    return {
      classification: { document_type: 'MEDICAL_BILL', confidence: 0.97 },
      overall_confidence: 0.95,
      error_flags: [],
    };
  }
  return post('/claims/extract', { document_id });
}

// ---- Adjudicate --------------------------------------------

export async function adjudicateClaim(payload: Record<string, unknown>): Promise<AdjudicationResult> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1800));
    return MOCK_CLAIM_DETAILS['CLM-2024-001'].result;
  }
  return post('/adjudication/', payload);
}

// ---- Claims ------------------------------------------------

export async function getClaims(): Promise<ClaimRecord[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_CLAIMS;
  }
  return get('/claims/');
}

export async function getClaimDetail(id: string): Promise<ClaimDetail> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 700));
    const detail = MOCK_CLAIM_DETAILS[id];
    if (!detail) throw new Error(`Claim ${id} not found`);
    return detail;
  }
  return get(`/claims/${id}`);
}

// ---- Manual Review -----------------------------------------

export async function getManualReviewQueue(): Promise<ManualReviewItem[]> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 600));
    return MOCK_MANUAL_REVIEW_QUEUE;
  }
  return get('/manual-review/');
}

export async function submitManualReview(
  claim_id: string,
  decision: 'APPROVED' | 'REJECTED',
  notes: string,
): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 1000));
    return { success: true };
  }
  return post(`/manual-review/${claim_id}`, { decision, notes });
}

export async function appealClaim(claim_id: string): Promise<{ success: boolean }> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 800));
    return { success: true };
  }
  return post(`/manual-review/appeal/${claim_id}`, null);
}

// ---- Admin Policy ------------------------------------------

export async function getPolicy(): Promise<any> {
  if (USE_MOCK) return {};
  return get('/admin/policy');
}

export async function updatePolicy(payload: any): Promise<{ success: boolean }> {
  if (USE_MOCK) return { success: true };
  return put('/admin/policy', payload);
}

// ---- Analytics ---------------------------------------------

export async function getAnalytics(): Promise<any> {
  if (USE_MOCK) return { total_claims: 0, decisions: {}, avg_confidence: 0, fraud_flags: [] };
  return get('/analytics/metrics');
}
