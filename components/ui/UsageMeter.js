'use client';

/**
 * components/ui/UsageMeter.js
 * Horizontal progress bar showing scan usage against monthly limit.
 * Used in the billing tab and dashboard.
 */

/**
 * @param {{
 *   used: number,
 *   limit: number,
 *   label?: string,
 *   className?: string,
 * }} props
 */
export default function UsageMeter({ used, limit, label, className = '' }) {
  const isUnlimited = limit === Infinity || limit === null;
  const pct = isUnlimited ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const remaining = isUnlimited ? null : Math.max(0, limit - used);

  const barColor =
    pct >= 90 ? 'bg-destructive' :
    pct >= 70 ? 'bg-warning' :
    'bg-primary';

  return (
    <div className={`space-y-1.5 ${className}`}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label || 'Scans this month'}</span>
        <span className="font-medium text-foreground tabular-nums">
          {used.toLocaleString()}
          {!isUnlimited && (
            <span className="text-muted-foreground"> / {limit.toLocaleString()}</span>
          )}
          {isUnlimited && <span className="text-muted-foreground"> / Unlimited</span>}
        </span>
      </div>
      <div className="h-1.5 w-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${barColor}`}
          style={{ width: isUnlimited ? '100%' : `${pct}%`, opacity: isUnlimited ? 0.3 : 1 }}
        />
      </div>
      {!isUnlimited && (
        <p className="text-xs text-muted-foreground">
          {remaining === 0
            ? 'Limit reached. Upgrade to keep scanning'
            : `${remaining.toLocaleString()} scan${remaining === 1 ? '' : 's'} remaining this month`}
        </p>
      )}
    </div>
  );
}
