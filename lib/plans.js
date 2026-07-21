/**
 * lib/plans.js
 * Pure client-safe plan utilities and messaging.
 * Server-side plan enforcement functions are now in lib/server-plans.js.
 */

import { PLANS } from '@/lib/constants';

// ─── Upgrade messaging ────────────────────────────────────────────────────────

const PLAN_ORDER = [PLANS.FREE, PLANS.STARTER, PLANS.PRO];

/**
 * Returns the next plan up from the current one, or null if the user is
 * already on the top plan (Pro).
 *
 * @param {string} plan
 * @returns {string|null}
 */
export function getNextPlan(plan) {
  const idx = PLAN_ORDER.indexOf(plan);
  if (idx === -1 || idx >= PLAN_ORDER.length - 1) return null;
  return PLAN_ORDER[idx + 1];
}

/**
 * Maps each gated reason to the minimum plan that unlocks it.
 * For scanLimit we just suggest the next plan up; everything else
 * jumps straight to the correct tier so users aren't told to buy a
 * plan that still doesn't include the feature.
 */
const FEATURE_MIN_PLAN = {
  scanLimit:      null,           // use next plan
  sites:          null,           // use next plan
  deepAnalysis:   PLANS.PRO,
  multiPageCrawl: PLANS.PRO,
  competitorScan: PLANS.PRO,
  monitoring:     PLANS.PRO,
  whiteLabel:     PLANS.PRO,
};

// Numeric quota limits (not boolean feature flags). For these the "cheapest
// plan with the feature" heuristic doesn't apply - every plan has a nonzero
// quota - so always recommend the next plan up.
const NUMERIC_LIMIT_REASONS = new Set(['scanLimit', 'sites']);

/** Cheapest plan (in PLAN_ORDER) whose live limits have `feature` truthy. */
function cheapestPlanWithFeature(planLimits, feature) {
  for (const plan of PLAN_ORDER) {
    if (planLimits?.[plan]?.[feature]) return plan;
  }
  return null;
}

/**
 * Returns a user-facing upgrade message for display in the UI.
 *
 * @param {string} currentPlan
 * @param {'scanLimit'|'sites'|'deepAnalysis'|'competitorScan'|'monitoring'|'whiteLabel'} reason
 * @param {Record<string, Record<string, any>>} [planLimits] - live limits from
 *   GET /api?path=plan-limits (see hooks/use-plan-limits.js). When supplied,
 *   the target plan reflects Admin → Plans exactly instead of the static
 *   FEATURE_MIN_PLAN fallback below.
 * @returns {{ title: string, description: string, nextPlan: string }}
 */
export function getUpgradeMessage(currentPlan, reason, planLimits) {
  const minPlan = NUMERIC_LIMIT_REASONS.has(reason)
    ? null
    : (planLimits ? cheapestPlanWithFeature(planLimits, reason) : FEATURE_MIN_PLAN[reason]);
  // If the user is already at or above the required tier, fall back to next plan
  const currentIdx = PLAN_ORDER.indexOf(currentPlan);
  const minIdx = minPlan ? PLAN_ORDER.indexOf(minPlan) : -1;
  const target = minPlan && currentIdx < minIdx ? minPlan : getNextPlan(currentPlan);

  // Already on the top plan (Pro) - no higher tier to suggest.
  if (!target) {
    return {
      title: 'You have reached the limits of your Pro plan',
      description: 'Contact us if you need higher limits or custom capacity.',
      nextPlan: null,
    };
  }

  const targetLabel = target.charAt(0).toUpperCase() + target.slice(1);

  const messages = {
    scanLimit: {
      title: `You've used all your ${currentPlan} scans this month`,
      description: `Upgrade to ${targetLabel} to keep scanning. Your limit resets on the 1st of next month.`,
    },
    sites: {
      title: `You've reached your ${currentPlan} tracked-sites limit`,
      description: `Upgrade to ${targetLabel} to monitor more domains. You can still re-scan the sites you already track.`,
    },
    deepAnalysis: {
      title: 'AI deep analysis is a Pro feature',
      description: `Upgrade to ${targetLabel} to unlock Gemini-powered deep analysis and AI-generated recommendations.`,
    },
    competitorScan: {
      title: 'Competitor comparison is a Pro feature',
      description: `Upgrade to ${targetLabel} to run side-by-side competitor scans and see exactly where you fall behind.`,
    },
    multiPageCrawl: {
      title: 'Multi-page crawling is a Pro feature',
      description: `Upgrade to ${targetLabel} to crawl your whole site and get aggregated, site-wide findings instead of a single page.`,
    },
    monitoring: {
      title: 'Automated monitoring is not available on your plan',
      description: `Upgrade to ${targetLabel} to schedule recurring audits and get alerted when your scores drop.`,
    },
    whiteLabel: {
      title: 'White-label reports are a Pro feature',
      description: `Upgrade to ${targetLabel} to export PDF reports under your own brand.`,
    },
  };

  return { ...(messages[reason] ?? messages.scanLimit), nextPlan: target };
}
