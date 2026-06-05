'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, AlertTriangle, CheckCircle, XCircle, Loader } from 'lucide-react';
import FraudFlags from '@/components/claim/FraudFlags';
import EvidenceTable from '@/components/claim/EvidenceTable';
import ConfidenceGauge from '@/components/claim/ConfidenceGauge';
import { getClaimDetail, submitManualReview } from '@/lib/apiClient';
import type { ClaimDetail } from '@/lib/types';

export default function ManualReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<'user' | 'officer' | null>(null);

  useEffect(() => {
    setRole((localStorage.getItem('claimpilot_role') as 'user' | 'officer') || 'user');
    getClaimDetail(id)
      .then(setClaim)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (role === 'user') {
    return (
      <div style={{ padding: '40px 48px', textAlign: 'center', marginTop: '10vh' }}>
        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 16px' }} />
        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--foreground)', marginBottom: '12px' }}>
          Access Denied
        </h1>
        <p style={{ color: 'var(--foreground-muted)' }}>
          Only Claims Officers can access the Manual Review queue.<br/><br/>
          <em style={{ fontSize: '13px' }}>(For demo purposes, you can switch your role to "officer" using the toggle at the bottom of the sidebar)</em>
        </p>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!decision) return;
    setSubmitting(true);
    try {
      await submitManualReview(id, decision, notes);
      setSubmitted(true);
      setTimeout(() => router.push('/manual-review'), 2000);
    } catch (e: unknown) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 48px' }}>
        <div style={{ height: '20px', width: '200px', borderRadius: '4px', marginBottom: '32px' }} className="shimmer" />
        <div style={{ height: '200px', borderRadius: '12px' }} className="shimmer" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div style={{ padding: '40px 48px' }}>
        <div style={{ color: '#ef4444' }}>Claim not found: {error}</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div
        style={{
          padding: '40px 48px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          gap: '16px',
        }}
      >
        <CheckCircle size={52} color="#22c55e" />
        <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--foreground)' }}>
          Review Submitted
        </div>
        <div style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
          Claim {id} has been marked as {decision}. Redirecting...
        </div>
      </div>
    );
  }

  const { result } = claim;

  return (
    <div style={{ padding: '40px 48px', maxWidth: '900px' }}>
      {/* Back */}
      <button
        onClick={() => router.push('/manual-review')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          color: 'var(--foreground-muted)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '13px',
          marginBottom: '24px',
          padding: 0,
        }}
      >
        <ArrowLeft size={14} /> Back to Queue
      </button>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(167,139,250,0.12)',
              border: '1px solid rgba(167,139,250,0.3)',
              color: '#a78bfa',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              marginBottom: '12px',
            }}
          >
            <AlertTriangle size={11} />
            Requires Manual Review
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.4px' }}>
            {claim.claim_id}
          </h1>
          <div style={{ fontSize: '14px', color: 'var(--foreground-muted)', marginTop: '6px' }}>
            {claim.member_name} · ₹{claim.claim_amount.toLocaleString('en-IN')} · {claim.treatment_date}
          </div>
        </div>
        <ConfidenceGauge score={result.confidence_score} label="AI Confidence" size={110} />
      </div>

      {/* Fraud Flags */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          🚩 Fraud Flags
        </h2>
        <FraudFlags flags={result.flags} fraudScore={result.fraud_score} />
      </div>

      {/* Evidence */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
          📋 Rule Evidence
        </h2>
        <EvidenceTable evidence={result.evidence} />
      </div>

      {/* Decision Form */}
      <div
        className="card"
        style={{
          borderColor: 'rgba(167,139,250,0.3)',
          background: 'rgba(167,139,250,0.03)',
        }}
      >
        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '20px' }}>
          ✍️ Your Decision
        </h2>

        {/* Decision buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
          {(['APPROVED', 'REJECTED'] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDecision(d)}
              style={{
                padding: '16px',
                borderRadius: '10px',
                border: `2px solid ${
                  decision === d
                    ? d === 'APPROVED'
                      ? '#22c55e'
                      : '#ef4444'
                    : 'var(--border)'
                }`,
                background:
                  decision === d
                    ? d === 'APPROVED'
                      ? 'rgba(34,197,94,0.1)'
                      : 'rgba(239,68,68,0.1)'
                    : 'var(--surface-2)',
                color: decision === d ? (d === 'APPROVED' ? '#22c55e' : '#ef4444') : 'var(--foreground-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                fontSize: '14px',
                fontWeight: 700,
                transition: 'all 0.15s',
              }}
            >
              {d === 'APPROVED' ? <CheckCircle size={20} /> : <XCircle size={20} />}
              {d === 'APPROVED' ? 'Approve Claim' : 'Reject Claim'}
            </button>
          ))}
        </div>

        {/* Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--foreground-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
            }}
          >
            Reviewer Notes{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(required)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Document your reasoning for this decision. E.g. 'Verified with hospital — duplicate claim confirmed. Rejecting.'"
            rows={4}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: '13.5px',
              lineHeight: 1.6,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSubmit}
            disabled={!decision || !notes.trim() || submitting}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 28px',
              borderRadius: '8px',
              background:
                !decision || !notes.trim()
                  ? 'var(--border)'
                  : decision === 'APPROVED'
                  ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                  : 'linear-gradient(135deg, #ef4444, #dc2626)',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              border: 'none',
              cursor: !decision || !notes.trim() || submitting ? 'not-allowed' : 'pointer',
              opacity: !decision || !notes.trim() ? 0.6 : 1,
              transition: 'all 0.2s',
            }}
          >
            {submitting ? (
              <>
                <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Submitting...
              </>
            ) : (
              `Submit ${decision ?? 'Decision'}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
