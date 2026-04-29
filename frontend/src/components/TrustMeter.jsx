import { useEffect, useState } from 'react';

export default function TrustMeter({ score = 5.0, size = 160 }) {
  const clamp = Math.max(1, Math.min(5, score));
  // Animate from 0 to score
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    // Small delay before animating
    const timeout = setTimeout(() => {
      setDisplayScore(clamp);
    }, 300);
    return () => clearTimeout(timeout);
  }, [clamp]);

  const pct = (displayScore - 1) / 4; // 0..1 based on 1..5 scale. But initially displayScore is 0.
  // We need to map displayScore. If it's 0, pct is 0.
  const actualPct = displayScore === 0 ? 0 : (displayScore - 1) / 4;
  
  const R = size * 0.38; 
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -210; 
  const endAngle = 30; // 240° sweep
  const toRad = (d) => (d * Math.PI) / 180;

  const arcPath = (startDeg, endDeg, r) => {
    const s = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
    const e = { x: cx + r * Math.cos(toRad(endDeg)),   y: cy + r * Math.sin(toRad(endDeg)) };
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const sweepDeg  = startAngle + actualPct * (endAngle - startAngle);
  
  // Use Tailwind colors directly or hex if needed. We'll use CSS custom properties via currentColor classes, but for SVG stroke it's easier to use hex variables.
  const color = clamp < 3 ? '#ef4444' : clamp < 4 ? '#f59e0b' : '#22c55e';
  const label = clamp < 3 ? 'Low' : clamp < 4 ? 'Good' : 'Excellent';

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <path 
            d={arcPath(startAngle, endAngle, R)} 
            fill="none" 
            className="stroke-slate-200 dark:stroke-slate-800" 
            strokeWidth={size * 0.08} 
            strokeLinecap="round" 
          />
          {/* Fill Track */}
          <path 
            d={arcPath(startAngle, sweepDeg, R)} 
            fill="none" 
            stroke={color} 
            strokeWidth={size * 0.08} 
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
            style={{ filter: `drop-shadow(0 0 8px ${color}66)` }} 
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="text-4xl font-extrabold tracking-tighter text-text">
            {displayScore.toFixed(1)}
          </span>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mt-1">
            / 5.0
          </span>
        </div>
      </div>
      <div className="text-center -mt-2">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trust Score</div>
        <div className="text-sm font-bold mt-1" style={{ color }}>{label}</div>
      </div>
    </div>
  );
}
