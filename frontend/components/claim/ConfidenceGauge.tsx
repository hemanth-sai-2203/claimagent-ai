'use client';

import { RadialBarChart, RadialBar, ResponsiveContainer, PolarAngleAxis } from 'recharts';

interface Props {
  score: number; // 0 to 1
  label?: string;
  size?: number;
}

function getColor(score: number): string {
  if (score >= 0.9) return '#22c55e';
  if (score >= 0.75) return '#6366f1';
  if (score >= 0.6) return '#f59e0b';
  return '#ef4444';
}

export default function ConfidenceGauge({ score, label = 'Confidence', size = 140 }: Props) {
  const pct = Math.round(score * 100);
  const color = getColor(score);
  const data = [{ value: pct, fill: color }];

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <div style={{ position: 'relative', width: size, height: size }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="72%"
            outerRadius="100%"
            barSize={10}
            data={data}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
            <RadialBar
              background={{ fill: 'var(--border)' }}
              dataKey="value"
              angleAxisId={0}
              cornerRadius={5}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        {/* Center label */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: size >= 140 ? '26px' : '20px',
              fontWeight: 800,
              color,
              lineHeight: 1,
            }}
          >
            {pct}%
          </div>
        </div>
      </div>
      <div
        style={{
          fontSize: '12px',
          fontWeight: 500,
          color: 'var(--foreground-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
    </div>
  );
}
