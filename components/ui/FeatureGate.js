'use client';

/**
 * components/ui/FeatureGate.js
 * Wraps a scan-form option (checkbox, input, etc.) and gates it behind a
 * plan feature. Users whose plan doesn't have the feature see the option
 * visually but cannot interact with it; hovering or clicking shows a
 * tooltip naming the cheapest plan that unlocks it.
 *
 * Two ways to gate:
 *  - `feature` + `planLimits` (preferred): looks up the live, admin-editable
 *    limits from GET /api?path=plan-limits (see hooks/use-plan-limits.js) so
 *    a change made in Admin → Plans takes effect here without a redeploy.
 *  - `minPlan` (legacy/fallback): a static ordinal comparison, used only
 *    when `planLimits` isn't supplied (e.g. still loading).
 */

import { useState, useRef, useEffect } from 'react';
import { Lock } from 'lucide-react';

const PLAN_ORDER = ['free', 'starter', 'pro'];

/** Cheapest plan (in PLAN_ORDER) whose limits have `feature` truthy. */
function cheapestPlanWithFeature(planLimits, feature) {
  for (const plan of PLAN_ORDER) {
    if (planLimits?.[plan]?.[feature]) return plan;
  }
  return null;
}

/**
 * @param {{
 *   children: React.ReactNode,
 *   currentPlan: string,
 *   feature?: string,
 *   planLimits?: Record<string, Record<string, any>>,
 *   minPlan?: string,
 *   className?: string,
 * }} props
 */
export default function FeatureGate({
  children,
  currentPlan = 'free',
  feature,
  planLimits,
  minPlan = 'pro',
  className = '',
}) {
  // Data-driven mode: exact admin-configured boolean for this plan/feature.
  // Falls back to the static minPlan comparison while planLimits is loading
  // (or when no `feature` is given), matching the previous behavior.
  const dataDriven = !!(feature && planLimits);
  const isLocked = dataDriven
    ? !planLimits[currentPlan]?.[feature]
    : PLAN_ORDER.indexOf(currentPlan) < PLAN_ORDER.indexOf(minPlan);

  const requiredPlan = dataDriven
    ? (cheapestPlanWithFeature(planLimits, feature) || 'a higher plan')
    : minPlan;

  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef(null);
  const hideTimeout = useRef(null);

  // Clean up timeout on unmount
  useEffect(() => () => { clearTimeout(hideTimeout.current); }, []);

  const show = () => {
    clearTimeout(hideTimeout.current);
    setShowTooltip(true);
  };

  const hide = () => {
    hideTimeout.current = setTimeout(() => setShowTooltip(false), 200);
  };

  const minLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  if (!isLocked) return <>{children}</>;

  return (
    <div
      className={`relative ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        show();
        hideTimeout.current = setTimeout(() => setShowTooltip(false), 2500);
      }}
    >
      {/* Render children but block all interaction */}
      <div className="pointer-events-none opacity-50 select-none">
        {children}
      </div>

      {/* Lock icon overlay */}
      <div className="absolute inset-0 flex items-center justify-end pr-2 pointer-events-none">
        <Lock className="h-3.5 w-3.5 text-muted-foreground/60" />
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          ref={tooltipRef}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 whitespace-nowrap px-3 py-1.5 rounded-md text-xs font-medium bg-foreground text-background shadow-lg animate-in fade-in zoom-in-95 duration-150"
        >
          Please upgrade to {minLabel} or above
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>
      )}
    </div>
  );
}
