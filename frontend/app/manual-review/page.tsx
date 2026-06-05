'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, CheckCircle, XCircle, ExternalLink } from 'lucide-react';
import { getManualReviewQueue } from '@/lib/apiClient';
import type { ManualReviewItem } from '@/lib/types';

function formatFlag(flag: string) {
  return flag
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export default function ManualReviewPage() {
  const [items, setItems] = useState<ManualReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<'user' | 'officer' | null>(null);

  useEffect(() => {
    setRole((localStorage.getItem('claimpilot_role') as 'user' | 'officer') || 'user');
    getManualReviewQueue()
      .then(setItems)
      .finally(() => setLoading(false));
  }, []);

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

  const pending = items.filter((i) => !i.final_decision);
  const resolved = items.filter((i) => !!i.final_decision);

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: '#a78bfa', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Manual Review
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          Review Queue
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
          Claims escalated by the AI engine due to fraud flags or anomalies requiring human judgment.
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Pending Review', value: pending.length, color: '#a78bfa', icon: Clock },
          { label: 'Resolved Today', value: resolved.length, color: '#22c55e', icon: CheckCircle },
          { label: 'Total Flagged', value: items.length, color: '#f59e0b', icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: `${color}1a`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={22} color={color} />
            </div>
            <div>
              <div style={{ fontSize: '28px', fontWeight: 800, color, letterSpacing: '-0.8px' }}>{value}</div>
              <div style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginTop: '2px' }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Queue */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#a78bfa', boxShadow: '0 0 6px #a78bfa' }} />
          Pending ({pending.length})
        </h2>

        {loading ? (
          <div style={{ height: '120px', borderRadius: '12px' }} className="shimmer" />
        ) : pending.length === 0 ? (
          <div
            className="card"
            style={{ textAlign: 'center', padding: '40px', color: 'var(--foreground-muted)', fontSize: '14px' }}
          >
            No claims pending review. All clear! ✓
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pending.map((item) => (
              <div
                key={item.claim_id}
                className="card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
                  gap: '16px',
                  alignItems: 'center',
                  borderLeft: '3px solid #a78bfa',
                  padding: '18px 20px',
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--foreground-subtle)', marginBottom: '3px' }}>Claim ID</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa', fontFamily: 'monospace' }}>{item.claim_id}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--foreground-subtle)', marginBottom: '3px' }}>Member</div>
                  <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{item.member_name}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--foreground-subtle)', marginBottom: '3px' }}>Amount</div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)' }}>
                    ₹{item.claim_amount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--foreground-subtle)', marginBottom: '6px' }}>Flags</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {item.flags.map((flag) => (
                      <span
                        key={flag}
                        style={{
                          padding: '2px 7px',
                          borderRadius: '4px',
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.25)',
                          color: '#fca5a5',
                          fontSize: '10.5px',
                          fontWeight: 600,
                        }}
                      >
                        {formatFlag(flag)}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href={`/manual-review/${item.claim_id}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '7px',
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.15))',
                    border: '1px solid rgba(167,139,250,0.3)',
                    color: '#a78bfa',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Review <ExternalLink size={12} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved */}
      {resolved.length > 0 && (
        <div>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
            Resolved ({resolved.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {resolved.map((item) => (
              <div
                key={item.claim_id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  opacity: 0.7,
                  padding: '14px 20px',
                }}
              >
                {item.final_decision === 'APPROVED' ? (
                  <CheckCircle size={18} color="#22c55e" />
                ) : (
                  <XCircle size={18} color="#ef4444" />
                )}
                <div style={{ flex: 1, fontSize: '13px', color: 'var(--foreground)' }}>
                  <span style={{ fontWeight: 600, fontFamily: 'monospace', color: 'var(--primary)', marginRight: '12px' }}>{item.claim_id}</span>
                  {item.member_name} · ₹{item.claim_amount.toLocaleString('en-IN')}
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: item.final_decision === 'APPROVED' ? '#22c55e' : '#ef4444',
                    padding: '3px 10px',
                    borderRadius: '4px',
                    background: item.final_decision === 'APPROVED' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                  }}
                >
                  {item.final_decision}
                </span>
                <span style={{ fontSize: '11.5px', color: 'var(--foreground-subtle)' }}>
                  {item.reviewed_at ? new Date(item.reviewed_at).toLocaleString('en-IN') : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
