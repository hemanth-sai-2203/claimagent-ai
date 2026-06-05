import type { DecisionState } from '@/lib/types';

interface Props {
  decision: DecisionState;
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG: Record<
  DecisionState,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  APPROVED: {
    label: 'Approved',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.12)',
    border: 'rgba(34,197,94,0.3)',
    dot: '#22c55e',
  },
  REJECTED: {
    label: 'Rejected',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.12)',
    border: 'rgba(239,68,68,0.3)',
    dot: '#ef4444',
  },
  PARTIAL: {
    label: 'Partial',
    color: '#fb923c',
    bg: 'rgba(251,146,60,0.12)',
    border: 'rgba(251,146,60,0.3)',
    dot: '#fb923c',
  },
  MANUAL_REVIEW: {
    label: 'Manual Review',
    color: '#a78bfa',
    bg: 'rgba(167,139,250,0.12)',
    border: 'rgba(167,139,250,0.3)',
    dot: '#a78bfa',
  },
};

const SIZE_MAP = {
  sm: { fontSize: '11px', padding: '2px 8px', dotSize: '6px' },
  md: { fontSize: '12px', padding: '4px 10px', dotSize: '7px' },
  lg: { fontSize: '13px', padding: '6px 14px', dotSize: '8px' },
};

export default function DecisionBadge({ decision, size = 'md' }: Props) {
  const cfg = CONFIG[decision];
  const sz = SIZE_MAP[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: sz.padding,
        borderRadius: '20px',
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        fontSize: sz.fontSize,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: sz.dotSize,
          height: sz.dotSize,
          borderRadius: '50%',
          background: cfg.dot,
          display: 'inline-block',
          flexShrink: 0,
          boxShadow: `0 0 6px ${cfg.dot}`,
        }}
      />
      {cfg.label}
    </span>
  );
}
