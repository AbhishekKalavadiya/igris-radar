'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { AnimatedNumber } from '@/components/ui/motion';

/**
 * Animated circular score (0–100). Color follows score thresholds by default,
 * or a fixed scanner accent when `accent` is passed (ring color string).
 */
export default function ScoreRing({ score = 0, size = 180, label, accent, showLabel = true }) {
  const reduce = useReducedMotion();
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (clamped / 100) * circumference;

  const thresholdColor =
    clamped >= 70 ? 'hsl(var(--success))' : clamped >= 40 ? 'hsl(var(--warning))' : 'hsl(var(--destructive))';
  const color = accent || thresholdColor;
  const grade = clamped >= 70 ? 'Good' : clamped >= 40 ? 'Fair' : 'At Risk';

  return (
    <div className="relative flex flex-col items-center justify-center" style={{ width: size, height: size }}>
      <svg className="absolute -rotate-90" width={size} height={size} viewBox="0 0 180 180">
        <circle cx="90" cy="90" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="12" opacity="0.4" />
        <motion.circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reduce ? { strokeDashoffset: dashOffset } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ duration: 1.1, ease: [0.2, 0, 0, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${color.replace(')', ' / 0.35)')})` }}
        />
      </svg>
      <div className="relative z-10 flex flex-col items-center justify-center">
        <AnimatedNumber value={clamped} className="text-5xl font-bold leading-none" style={{ color }} />
        {showLabel && <span className="text-sm text-muted-foreground mt-1.5 tracking-wide">{label || grade}</span>}
      </div>
    </div>
  );
}
