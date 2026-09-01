import { useState } from 'react';

export function CandlestickChart({ data }: { data: any[] }) {
  const [hovered, setHovered] = useState<number | null>(null);
  if (!data || data.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">No candlestick data</p>;

  const vals = data.flatMap(function(d) { return [d.high, d.low, d.open, d.close]; });
  const min = Math.min.apply(null, vals);
  const max = Math.max.apply(null, vals);
  const range = max - min || 1;
  const W = 700, H = 320, PL = 60, PR = 20, PT = 20, PB = 40;
  const cw = W - PL - PR;
  const ch = H - PT - PB;

  function xs(i: number) { return PL + (i + 0.5) * cw / data.length; }
  function ys(v: number) { return PT + ch - ((v - min) / range) * ch; }

  const yTicks: number[] = [];
  for (let i = 0; i <= 5; i++) yTicks.push(min + (range * i) / 5);

  return (
    <div className="w-full">
      <svg viewBox={'0 0 ' + W + ' ' + H} className="w-full h-full max-h-80">
        {yTicks.map(function(t) {
          const y = ys(t);
          return (
            <g key={String(t)}>
              <line x1={PL} y1={y} x2={W - PR} y2={y} stroke="currentColor" className="stroke-muted/30" strokeWidth={1} />
              <text x={PL - 6} y={y + 4} textAnchor="end" className="fill-muted-foreground" fontSize={10}>
                {'\u20b9'}{Math.round(t).toLocaleString('en-IN')}
              </text>
            </g>
          );
        })}
        {data.map(function(d, i) {
          const x = xs(i);
          const o = ys(d.open);
          const c = ys(d.close);
          const h = ys(d.high);
          const l = ys(d.low);
          const isUp = d.close >= d.open;
          const color = isUp ? '#22c55e' : '#ef4444';
          const bw = Math.max(3, cw / data.length * 0.5);
          const by = Math.min(o, c);
          const bh = Math.max(Math.abs(c - o), 1.5);
          const isHovered = hovered === i;
          return (
            <g key={d.weekStart || i}>
              <line x1={x} y1={h} x2={x} y2={l} stroke={color} strokeWidth={1.5} />
              <rect x={x - bw / 2} y={by} width={bw} height={bh} fill={color} rx={1}
                onMouseEnter={function() { setHovered(i); }}
                onMouseLeave={function() { setHovered(null); }}
              />
              {isHovered && (
                <g>
                  <rect x={Math.min(x + 10, W - PR - 140)} y={Math.max(PT, h - 85)} width={138} height={78} rx={4} fill="#1e293b" opacity={0.95} />
                  <text x={Math.min(x + 16, W - PR - 134)} y={Math.max(PT + 14, h - 71)} fill="#fff" fontSize={11} fontWeight={600}>
                    {new Date(d.weekStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                  </text>
                  {[['O', d.open], ['H', d.high], ['L', d.low], ['C', d.close]].map(function(p, j) {
                    const label = p[0] as string;
                    const val = p[1] as number;
                    return (
                      <text key={label} x={Math.min(x + 16, W - PR - 134)} y={Math.max(PT + 30 + j * 14, h - 57 + j * 14)}
                        fill={label === 'O' || label === 'C' ? (label === 'C' ? '#22c55e' : '#94a3b8') : '#94a3b8'}
                        fontSize={10} fontFamily="monospace">
                        {label + '  \u20b9' + Math.round(val).toLocaleString('en-IN')}
                      </text>
                    );
                  })}
                </g>
              )}
            </g>
          );
        })}
        {data.map(function(d, i) {
          if (i % Math.ceil(data.length / 6) !== 0 && i !== data.length - 1) return null;
          return (
            <text key={'x' + i} x={xs(i)} y={H - 6} textAnchor="middle" className="fill-muted-foreground" fontSize={10}>
              {new Date(d.weekStart).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
