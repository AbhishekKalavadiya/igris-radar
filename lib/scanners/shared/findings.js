import { v4 as uuidv4 } from 'uuid';

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

  const getFindings = () => allFindings;

  return { addFinding, getFindings };
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

    // Locked: strip all identifying details.
    // Free users see ONLY the severity badge (no title, no description).
    // Starter/Pro users see severity + category (but no title/details for higher tiers).
    return {
      id: f.id,
      category: userRank >= 1 ? f.category : undefined, // Free users don't even see category
      severity: f.severity,
      originalSeverity: f.originalSeverity,
      passed: f.passed,
      tier: f.tier,
      locked: true,
      requiredPlan: f.tier,
      // Everything else is stripped:
      // title, description, remediation, aiFixPrompt, details → gone
    };
  });
}
