'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getAnalytics } from '@/lib/apiClient';
import { Activity, ShieldAlert, Brain, FileCheck2 } from 'lucide-react';

export default function AnalyticsPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Role check
    const role = localStorage.getItem('claimpilot_role');
    if (role !== 'officer') {
      router.replace('/upload');
      return;
    }

    getAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div style={{ padding: '40px 48px' }}>
        <div style={{ height: '32px', width: '200px', borderRadius: '6px', marginBottom: '24px' }} className="shimmer" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
          <div style={{ height: '120px', borderRadius: '12px' }} className="shimmer" />
          <div style={{ height: '120px', borderRadius: '12px' }} className="shimmer" />
          <div style={{ height: '120px', borderRadius: '12px' }} className="shimmer" />
          <div style={{ height: '120px', borderRadius: '12px' }} className="shimmer" />
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '40px' }}>Failed to load metrics.</div>;

  const total = data.total_claims || 0;
  const approved = data.decisions.APPROVED || 0;
  const rejected = data.decisions.REJECTED || 0;
  const partial = data.decisions.PARTIAL || 0;
  const manual = data.decisions.MANUAL_REVIEW || 0;
  
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;
  const avgConfidence = Math.round(data.avg_confidence * 100);

  return (
    <div style={{ padding: '40px 48px', maxWidth: '1100px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          AI Evaluation Metrics
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
          Monitor the accuracy, confidence, and efficiency of the ClaimPilot rules engine.
        </p>
      </div>

      {/* Top Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground-subtle)', fontSize: '12.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Activity size={16} /> Total Claims Processed
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800 }}>{total}</div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground-subtle)', fontSize: '12.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Brain size={16} /> Avg AI Confidence
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: avgConfidence > 80 ? '#22c55e' : '#f59e0b' }}>
            {avgConfidence}%
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground-subtle)', fontSize: '12.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <FileCheck2 size={16} /> Auto-Approval Rate
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>
            {approvalRate}%
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--foreground-subtle)', fontSize: '12.5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <ShieldAlert size={16} /> Manual Review Rate
          </div>
          <div style={{ fontSize: '32px', fontWeight: 800, color: '#f59e0b' }}>
            {total > 0 ? Math.round((manual / total) * 100) : 0}%
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Decisions Breakdown */}
        <div className="card">
          <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            Decision Distribution
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              { label: 'Approved', count: approved, color: '#22c55e' },
              { label: 'Partial', count: partial, color: '#3b82f6' },
              { label: 'Manual Review', count: manual, color: '#f59e0b' },
              { label: 'Rejected', count: rejected, color: '#ef4444' },
            ].map(d => (
              <div key={d.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 500 }}>{d.label}</span>
                  <span style={{ color: 'var(--foreground-muted)' }}>{d.count} ({total > 0 ? Math.round((d.count / total) * 100) : 0}%)</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'var(--surface-2)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${total > 0 ? (d.count / total) * 100 : 0}%`, height: '100%', background: d.color, borderRadius: '3px' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fraud Flags */}
        <div className="card">
          <h2 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' }}>
            Top Fraud Flags
          </h2>
          {data.fraud_flags.length === 0 ? (
            <div style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>No fraud flags detected yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {data.fraud_flags.slice(0, 5).map((f: any) => (
                <div key={f.reason} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: '6px', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '13px', color: 'var(--foreground)' }}>{f.reason}</span>
                  <span style={{ fontSize: '12px', fontWeight: 700, background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '10px' }}>
                    {f.count} instances
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
