/**
 * Calculates a severity-weighted score and provides category-level breakdowns.
 * @param {Array} findings - Array of findings from findings.js
 * @returns {{ overall: number, categories: Object }}
 */
export function calculateScore(findings) {
  let overallMax = 0;
  let overallEarned = 0;
  const categories = {};

  const WEIGHTS = {
    critical: 15,
    high: 8,
    medium: 3,
    low: 1,
    info: 0,
    passed: 3 // fallback for old scans
  };

  findings.forEach(f => {
    // Teasers are unevaluated upsell placeholders — never let them move the score.
    if (f.teaser) return;
    if (!categories[f.category]) {
      categories[f.category] = {
        score: 100,
        passed: 0,
        failed: 0,
        total: 0,
        _max: 0,
        _earned: 0
      };
    }

    categories[f.category].total += 1;
    const sev = f.originalSeverity || f.severity;
    const weight = WEIGHTS[sev] || 0;

    categories[f.category]._max += weight;
    overallMax += weight;

    if (f.passed) {
      categories[f.category].passed += 1;
      categories[f.category]._earned += weight;
      overallEarned += weight;
    } else {
      categories[f.category].failed += 1;
    }
  });

  const overall = overallMax > 0 ? Math.round((overallEarned / overallMax) * 100) : 100;

  Object.keys(categories).forEach(cat => {
    const c = categories[cat];
    c.score = c._max > 0 ? Math.round((c._earned / c._max) * 100) : 100;
    delete c._max;
    delete c._earned;
  });

  return { overall: findings.length === 0 ? 0 : overall, categories };
}
