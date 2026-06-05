import { CheckCircle, XCircle, MinusCircle } from 'lucide-react';
import type { EvidenceItem } from '@/lib/types';

interface Props {
  evidence: EvidenceItem[];
}

const STATUS_CONFIG = {
  passed: {
    icon: CheckCircle,
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    label: 'PASS',
  },
  failed: {
    icon: XCircle,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.08)',
    label: 'FAIL',
  },
  skipped: {
    icon: MinusCircle,
    color: '#6b7280',
    bg: 'rgba(107,114,128,0.08)',
    label: 'SKIP',
  },
};

export default function EvidenceTable({ evidence }: Props) {
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60px 1fr 1fr',
          gap: '0',
          borderRadius: '8px',
          overflow: 'hidden',
          border: '1px solid var(--border)',
        }}
      >
        {/* Header */}
        <div
          style={{
            gridColumn: '1 / -1',
            display: 'grid',
            gridTemplateColumns: '60px 1fr 1fr',
            background: 'var(--surface-2)',
            borderBottom: '1px solid var(--border)',
            padding: '10px 16px',
            gap: '16px',
          }}
        >
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Status
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Rule
          </div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--foreground-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Evidence
          </div>
        </div>

        {/* Rows */}
        {evidence.map((item, idx) => {
          const cfg = STATUS_CONFIG[item.status];
          const Icon = cfg.icon;
          return (
            <div
              key={idx}
              style={{
                gridColumn: '1 / -1',
                display: 'grid',
                gridTemplateColumns: '60px 1fr 1fr',
                padding: '12px 16px',
                gap: '16px',
                borderBottom: idx < evidence.length - 1 ? '1px solid var(--border)' : 'none',
                background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                alignItems: 'flex-start',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(99,102,241,0.05)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background =
                  idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)';
              }}
            >
              {/* Status */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    background: cfg.bg,
                    color: cfg.color,
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                  }}
                >
                  <Icon size={11} />
                  {cfg.label}
                </span>
              </div>

              {/* Rule name */}
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--foreground)',
                  paddingTop: '2px',
                }}
              >
                {item.rule}
              </div>

              {/* Details */}
              <div
                style={{
                  fontSize: '12.5px',
                  color: 'var(--foreground-muted)',
                  lineHeight: 1.5,
                  paddingTop: '2px',
                }}
              >
                {item.details}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
