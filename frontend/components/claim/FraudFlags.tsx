import { AlertTriangle, Shield } from 'lucide-react';

interface Props {
  flags: string[];
  fraudScore?: number;
}

function formatFlag(flag: string): string {
  return flag
    .split('_')
    .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
    .join(' ');
}

export default function FraudFlags({ flags, fraudScore }: Props) {
  if (flags.length === 0 && !fraudScore) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '14px 16px',
          borderRadius: '8px',
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.2)',
        }}
      >
        <Shield size={18} color="#22c55e" />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>
            No Fraud Detected
          </div>
          <div style={{ fontSize: '12px', color: 'var(--foreground-muted)', marginTop: '2px' }}>
            All fraud checks passed successfully.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Fraud Score Bar */}
      {fraudScore !== undefined && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--foreground-muted)', fontWeight: 500 }}>
              Fraud Risk Score
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 700,
                color: fraudScore > 0.5 ? '#ef4444' : fraudScore > 0.3 ? '#f59e0b' : '#22c55e',
              }}
            >
              {Math.round(fraudScore * 100)}%
            </span>
          </div>
          <div
            style={{
              height: '6px',
              borderRadius: '3px',
              background: 'var(--border)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${fraudScore * 100}%`,
                borderRadius: '3px',
                background:
                  fraudScore > 0.5
                    ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                    : fraudScore > 0.3
                    ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                    : 'linear-gradient(90deg, #22c55e, #16a34a)',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>
      )}

      {/* Flags */}
      {flags.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {flags.map((flag, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
              }}
            >
              <AlertTriangle size={15} color="#ef4444" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#fca5a5' }}>
                {formatFlag(flag)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
