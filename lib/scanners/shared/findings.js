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
   */
  const addFinding = (category, severity, title, description, passed, remediation = '', aiFixPrompt = '', details = '') => {
    // If passed, severity doesn't matter much for scoring, but good to normalize.
    allFindings.push({
      id: uuidv4(),
      category,
      severity: passed ? 'passed' : severity,
      title,
      description,
      passed,
      remediation,
      aiFixPrompt,
      details
    });
  };

  const getFindings = () => allFindings;

  return { addFinding, getFindings };
}
