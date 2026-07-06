/**
 * Calculates a severity-weighted score and provides category-level breakdowns.
 * @param {Array} findings - Array of findings from findings.js
 * @returns {{ overall: number, categories: Object }}
 */
export function calculateScore(findings) {
  let overall = 100;
  const categories = {};

  findings.forEach(f => {
    // Initialize category if it doesn't exist
    if (!categories[f.category]) {
      categories[f.category] = {
        score: 100, // Starts at 100, deducted per failed finding in this category
        passed: 0,
        failed: 0,
        total: 0
      };
    }

    categories[f.category].total += 1;

    if (!f.passed) {
      categories[f.category].failed += 1;
      let deduction = 0;
      if (f.severity === 'critical') deduction = 25;
      else if (f.severity === 'high') deduction = 15;
      else if (f.severity === 'medium') deduction = 5;
      else if (f.severity === 'low') deduction = 2;

      overall -= deduction;
      categories[f.category].score -= deduction;
    } else {
      categories[f.category].passed += 1;
    }
  });

  // Ensure scores don't drop below 0
  overall = Math.max(0, overall);
  Object.keys(categories).forEach(cat => {
    categories[cat].score = Math.max(0, categories[cat].score);
  });

  // If no findings, score is 0
  if (findings.length === 0) {
    overall = 0;
  }

  return { overall, categories };
}
