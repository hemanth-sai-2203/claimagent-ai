'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, User, Calendar, Building2, IndianRupee,
  FileText, Clock, ChevronRight,
} from 'lucide-react';
import DecisionBadge from '@/components/claim/DecisionBadge';
import ConfidenceGauge from '@/components/claim/ConfidenceGauge';
import EvidenceTable from '@/components/claim/EvidenceTable';
import FraudFlags from '@/components/claim/FraudFlags';
import { getClaimDetail, appealClaim } from '@/lib/apiClient';
import type { ClaimDetail } from '@/lib/types';

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; color?: string }>;
  label: string;
  value: string | number;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          background: 'var(--surface-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={15} color="var(--foreground-muted)" />
      </div>
      <div>
        <div style={{ fontSize: '11px', color: 'var(--foreground-subtle)', marginBottom: '1px' }}>{label}</div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{value}</div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h2
        style={{
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--foreground)',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function ClaimDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [claim, setClaim] = useState<ClaimDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appealing, setAppealing] = useState(false);

  const fetchClaim = () => {
    setLoading(true);
    getClaimDetail(id)
      .then(setClaim)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClaim();
  }, [id]);

  const handleAppeal = async () => {
    if (!confirm('Are you sure you want to appeal this decision? It will be sent for manual review.')) return;
    setAppealing(true);
    try {
      await appealClaim(id);
      fetchClaim(); // reload to show new status
    } catch (err: any) {
      alert('Appeal failed: ' + err.message);
    } finally {
      setAppealing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px 48px' }}>
        <div style={{ height: '20px', width: '180px', borderRadius: '4px', marginBottom: '32px' }} className="shimmer" />
        <div style={{ height: '120px', borderRadius: '12px' }} className="shimmer" />
      </div>
    );
  }

  if (error || !claim) {
    return (
      <div style={{ padding: '40px 48px' }}>
        <div style={{ color: '#ef4444', fontSize: '14px' }}>Claim not found: {error}</div>
      </div>
    );
  }

  const { result } = claim;
  const totalDeductions = result.deductions
    ? Object.values(result.deductions).reduce((a, b) => a + b, 0)
    : 0;

  return (
    <div style={{ padding: '40px 48px', maxWidth: '960px' }}>
      {/* Back and Actions */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => router.back()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--foreground-muted)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: '13px',
            padding: 0,
          }}
        >
          <ArrowLeft size={14} /> Back to Claims
        </button>
        <div style={{ display: 'flex', gap: '12px' }}>
          {(claim.decision === 'REJECTED' || claim.decision === 'PARTIAL') && (
            <button
              onClick={handleAppeal}
              disabled={appealing}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #ef4444',
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: appealing ? 0.7 : 1,
              }}
            >
              {appealing ? 'Appealing...' : 'Appeal Decision'}
            </button>
          )}
          <button
            onClick={() => window.print()}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--primary)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Download Summary (PDF)
          </button>
        </div>
      </div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Claim Result
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.4px', marginBottom: '8px' }}>
            {claim.claim_id}
          </h1>
          <DecisionBadge decision={claim.decision} size="lg" />
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', color: 'var(--foreground-subtle)', marginBottom: '4px' }}>Approved Amount</div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: claim.decision === 'REJECTED' ? '#ef4444' : '#22c55e', letterSpacing: '-1px' }}>
            ₹{result.approved_amount.toLocaleString('en-IN')}
          </div>
          {totalDeductions > 0 && (
            <div style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginTop: '4px' }}>
              after ₹{totalDeductions} deductions
            </div>
          )}
        </div>
      </div>

      {/* Summary Row */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '24px',
          marginBottom: '20px',
        }}
      >
        <MetaItem icon={User} label="Member" value={claim.member_name} />
        <MetaItem icon={Calendar} label="Treatment Date" value={claim.treatment_date} />
        <MetaItem icon={Building2} label="Hospital" value={claim.hospital ?? '—'} />
        <MetaItem icon={IndianRupee} label="Claimed Amount" value={`₹${claim.claim_amount.toLocaleString('en-IN')}`} />
      </div>

      {/* Confidence + Notes */}
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '20px', marginBottom: '20px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <ConfidenceGauge score={result.confidence_score} />
          {result.fraud_score > 0 && (
            <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--foreground-muted)' }}>
              Fraud Score:{' '}
              <span style={{ color: result.fraud_score > 0.5 ? '#ef4444' : '#22c55e', fontWeight: 600 }}>
                {Math.round(result.fraud_score * 100)}%
              </span>
            </div>
          )}
        </div>

        <div className="card">
          {result.notes && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Decision Notes
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--surface-2)',
                  fontSize: '13.5px',
                  color: 'var(--foreground)',
                  lineHeight: 1.6,
                  borderLeft: '3px solid var(--primary)',
                }}
              >
                {result.notes}
              </div>
            </div>
          )}

          {result.rejection_reasons.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Rejection Reasons
              </div>
              {result.rejection_reasons.map((r) => (
                <span
                  key={r}
                  style={{
                    display: 'inline-block',
                    marginRight: '6px',
                    marginBottom: '6px',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#fca5a5',
                    fontSize: '12px',
                    fontWeight: 600,
                    letterSpacing: '0.03em',
                  }}
                >
                  {r}
                </span>
              ))}
            </div>
          )}

          {result.next_steps && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                Next Steps
              </div>
              <div style={{ fontSize: '13px', color: 'var(--foreground-muted)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                <ChevronRight size={15} color="var(--primary)" style={{ flexShrink: 0, marginTop: '1px' }} />
                {result.next_steps}
              </div>
            </div>
          )}

          {result.deductions && (
            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
                Deductions
              </div>
              {Object.entries(result.deductions).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--foreground-muted)', textTransform: 'capitalize' }}>{k}</span>
                  <span style={{ color: '#fbbf24', fontWeight: 600 }}>−₹{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Fraud Flags */}
      <div className="no-print">
        <Section title="🛡 Fraud Detection">
          <FraudFlags flags={result.flags} fraudScore={result.fraud_score} />
        </Section>
      </div>

      {/* Evidence Table */}
      <Section title="📋 Adjudication Evidence Trail">
        <EvidenceTable evidence={result.evidence} />
      </Section>

      {/* Documents */}
      <Section title="📄 Documents">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {claim.documents.map((doc) => (
            <div
              key={doc.document_id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'var(--surface-2)',
                border: '1px solid var(--border)',
              }}
            >
              <FileText size={16} color="var(--primary)" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>
                  {doc.document_type.replace('_', ' ')}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--foreground-subtle)', marginTop: '2px' }}>
                  ID: {doc.document_id}
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
                Confidence:{' '}
                <span style={{ fontWeight: 600, color: '#22c55e' }}>
                  {Math.round(doc.classification_confidence * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Audit Log */}
      <Section title="🔍 Audit Log">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
          {claim.audit_logs.map((log, i) => (
            <div
              key={log.id}
              style={{
                display: 'flex',
                gap: '16px',
                paddingBottom: '16px',
                marginBottom: i < claim.audit_logs.length - 1 ? '0' : '0',
                position: 'relative',
              }}
            >
              {/* Timeline dot */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', marginTop: '4px', flexShrink: 0 }} />
                {i < claim.audit_logs.length - 1 && (
                  <div style={{ width: '1px', flex: 1, background: 'var(--border)', marginTop: '4px' }} />
                )}
              </div>
              <div style={{ flex: 1, paddingBottom: i < claim.audit_logs.length - 1 ? '8px' : '0' }}>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)', marginBottom: '2px' }}>
                  {log.action.replace(/_/g, ' ')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--foreground-subtle)' }}>
                  <Clock size={11} />
                  {new Date(log.created_at).toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
