import { v4 as uuidv4 } from 'uuid';
import { getFindingExplanation } from '@/lib/scannerExplanations';

/**
 * Creates a findings collector to unify finding shapes across all scanners.
 * @returns {{ addFinding: Function, getFindings: Function }}
 */
export function createFindingsCollector() {
  const allFindings = [];

  /**
   * Adds a finding to the collector.
   * @param {string} category
   * @param {'critical'|'high'|'medium'|'low'|'passed'} severity
   * @param {string} title
   * @param {string} description
   * @param {boolean} passed
   * @param {string} [remediation]
   * @param {string} [aiFixPrompt]
   * @param {string} [details]
   * @param {'free'|'starter'|'pro'|'agency'} [tier='free'] - Which plan tier unlocks this finding
   */
  const addFinding = (category, severity, title, description, passed, remediation = '', aiFixPrompt = '', details = '', tier = 'free') => {
    // If passed, severity doesn't matter much for scoring, but good to normalize.
    allFindings.push({
      id: uuidv4(),
      category,
      severity: passed ? 'passed' : severity,
      originalSeverity: severity,
      title,
      description,
      passed,
      remediation,
      aiFixPrompt,
      details,
      tier,
    });
  };

  /**
   * Adds a locked "teaser" placeholder for a check the user's plan can't access.
   * Teasers exist purely to populate the upgrade upsell (they are always redacted
   * by filterFindingsByPlan for the users who see them) so we DON'T run the real,
   * expensive check. They are excluded from scoring — an unevaluated check must
   * not move the score in either direction.
   *
   * @param {string} category
   * @param {'critical'|'high'|'medium'|'low'} severity
   * @param {string} title
   * @param {'starter'|'pro'|'agency'} tier
   */
  const addTeaser = (category, severity, title, tier) => {
    allFindings.push({
      id: uuidv4(),
      category,
      severity,
      originalSeverity: severity,
      title,
      description: '',
      passed: false,
      remediation: '',
      aiFixPrompt: '',
      details: '',
      tier,
      teaser: true,
    });
  };

  const getFindings = () => allFindings;

  return { addFinding, addTeaser, getFindings };
}

/**
 * Filters findings based on the user's plan tier.
 * - Findings at or below the user's plan tier are returned in full.
 * - Findings above the user's plan are "locked": only severity, category,
 *   passed status, and the required plan are visible (NO title for Free users).
 *
 * The overall score should be computed BEFORE calling this filter so it
 * reflects all checks regardless of plan.
 *
 * @param {Array} findings - Full findings array from a scanner
 * @param {string} userPlan - The user's current plan ('free'|'starter'|'pro'|'agency'|'enterprise')
 * @returns {Array} Findings with locked items redacted
 */
export function filterFindingsByPlan(findings, userPlan) {
  const TIER_RANK = { free: 0, starter: 1, pro: 2, agency: 3, enterprise: 3 };
  const userRank = TIER_RANK[userPlan] ?? 0;

  return findings.map(f => {
    const findingRank = TIER_RANK[f.tier] ?? 0;
    if (userRank >= findingRank) {
      // User can see this finding fully
      return f;
    }

    // Locked: the finding NAME is never sent for a plan the user hasn't bought,
    // so it can't be read from the page or the network response. We only expose
    // the category + severity (for context) and a generic, site-agnostic
    // explanation of what the check is — the card renders the name as a blurred
    // placeholder. The site-specific RESULT and fix (title, description,
    // remediation, aiFixPrompt, details) all stay hidden: that's the paid value.
    return {
      id: f.id,
      category: f.category,
      severity: f.severity,
      originalSeverity: f.originalSeverity,
      passed: f.passed,
      tier: f.tier,
      locked: true,
      requiredPlan: f.tier,
      explanation: getFindingExplanation(f), // resolved from the real title before it's dropped
      // Stripped: title, description, remediation, aiFixPrompt, details
    };
  });
}
