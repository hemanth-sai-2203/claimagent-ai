'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ExternalLink, TrendingUp } from 'lucide-react';
import DecisionBadge from '@/components/claim/DecisionBadge';
import { getClaims } from '@/lib/apiClient';
import type { ClaimRecord, DecisionState } from '@/lib/types';

const DECISION_FILTERS: { label: string; value: DecisionState | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Partial', value: 'PARTIAL' },
  { label: 'Manual Review', value: 'MANUAL_REVIEW' },
];

export default function ClaimsPage() {
  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<DecisionState | 'ALL'>('ALL');

  useEffect(() => {
    getClaims()
      .then(setClaims)
      .finally(() => setLoading(false));
  }, []);

  const filtered = claims.filter((c) => {
    const matchSearch =
      c.claim_id.toLowerCase().includes(search.toLowerCase()) ||
      c.member_name.toLowerCase().includes(search.toLowerCase()) ||
      (c.hospital ?? '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'ALL' || c.decision === filter;
    return matchSearch && matchFilter;
  });

  // Stats
  const stats = {
    total: claims.length,
    approved: claims.filter((c) => c.decision === 'APPROVED').length,
    rejected: claims.filter((c) => c.decision === 'REJECTED').length,
    review: claims.filter((c) => c.decision === 'MANUAL_REVIEW').length,
    totalApproved: claims.filter((c) => c.decision === 'APPROVED').reduce((s, c) => s + c.approved_amount, 0),
  };

  return (
    <div style={{ padding: '40px 48px' }}>
      {/* Header */}
      <div style={{ marginBottom: '36px' }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '10px' }}>
          Claims Operations
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--foreground)', letterSpacing: '-0.5px', marginBottom: '8px' }}>
          All Claims
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--foreground-muted)' }}>
          View and manage all processed OPD claims
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'Total Claims', value: stats.total, color: 'var(--primary)', sub: 'This period' },
          { label: 'Approved', value: stats.approved, color: '#22c55e', sub: `₹${stats.totalApproved.toLocaleString('en-IN')} disbursed` },
          { label: 'Rejected', value: stats.rejected, color: '#ef4444', sub: 'Policy violations' },
          { label: 'Manual Review', value: stats.review, color: '#a78bfa', sub: 'Awaiting analyst' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="card" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '10px' }}>
              {label}
            </div>
            <div style={{ fontSize: '32px', fontWeight: 800, color, letterSpacing: '-1px', marginBottom: '4px' }}>
              {value}
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--foreground-subtle)' }}>{sub}</div>
            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.1 }}>
              <TrendingUp size={32} color={color} />
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} color="var(--foreground-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search claims, members, hospitals..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 34px',
              borderRadius: '8px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: '13px',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          {DECISION_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setFilter(value)}
              style={{
                padding: '7px 14px',
                borderRadius: '7px',
                border: `1px solid ${filter === value ? 'var(--primary)' : 'var(--border)'}`,
                background: filter === value ? 'rgba(99,102,241,0.15)' : 'var(--surface)',
                color: filter === value ? 'var(--primary)' : 'var(--foreground-muted)',
                fontSize: '12.5px',
                fontWeight: filter === value ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Table Head */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.7fr 40px',
            padding: '11px 20px',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
            gap: '12px',
          }}
        >
          {['Claim ID', 'Member', 'Treatment Date', 'Claimed', 'Approved', 'Decision', ''].map((h) => (
            <div key={h} style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {h}
            </div>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                height: '52px',
                borderBottom: '1px solid var(--border)',
                padding: '16px 20px',
              }}
              className="shimmer"
            />
          ))
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center', color: 'var(--foreground-muted)', fontSize: '14px' }}>
            No claims match your search.
          </div>
        ) : (
          filtered.map((claim, i) => (
            <div
              key={claim.claim_id}
              style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1fr 0.8fr 0.8fr 0.8fr 0.7fr 40px',
                padding: '14px 20px',
                gap: '12px',
                borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                alignItems: 'center',
                background: 'transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.04)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLDivElement).style.background = 'transparent')}
            >
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>
                {claim.claim_id}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--foreground)' }}>{claim.member_name}</div>
                <div style={{ fontSize: '11.5px', color: 'var(--foreground-subtle)' }}>{claim.member_id}</div>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--foreground-muted)' }}>{claim.treatment_date}</div>
              <div style={{ fontSize: '13px', color: 'var(--foreground)' }}>
                ₹{claim.claim_amount.toLocaleString('en-IN')}
              </div>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: claim.decision === 'REJECTED' ? '#ef4444' : '#22c55e',
                }}
              >
                ₹{claim.approved_amount.toLocaleString('en-IN')}
              </div>
              <div>
                <DecisionBadge decision={claim.decision} size="sm" />
              </div>
              <div>
                <Link href={`/claim/${claim.claim_id}`}>
                  <ExternalLink size={15} color="var(--foreground-muted)" style={{ cursor: 'pointer' }} />
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {!loading && (
        <div style={{ marginTop: '12px', fontSize: '12px', color: 'var(--foreground-subtle)' }}>
          Showing {filtered.length} of {claims.length} claims
        </div>
      )}
    </div>
  );
}
