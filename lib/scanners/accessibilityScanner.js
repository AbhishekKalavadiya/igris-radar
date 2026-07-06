import { v4 as uuidv4 } from 'uuid';
import { getKey } from '@/lib/systemConfig';

/**
 * Live implementation of the Accessibility Scanner using Google PageSpeed Insights API.
 */
export async function runAccessibilityScan(url) {
  try {
    const apiKey = await getKey('PAGESPEED_API_KEY');
    if (!apiKey) {
      throw new Error('Google PageSpeed API Key is missing. Please configure PAGESPEED_API_KEY.');
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=accessibility&key=${apiKey}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000); // 45 second timeout
    
    let response;
    try {
      response = await fetch(apiUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      throw new Error(`PageSpeed API failed: ${response.status}`);
    }

    const data = await response.json();
    const score = Math.round(data.lighthouseResult.categories.accessibility.score * 100);
    
    const audits = data.lighthouseResult.audits;
    const issues = [];

    // Process all accessibility audits
    Object.values(audits).forEach(audit => {
      // Only include actual accessibility checks (which have a weight or are part of a11y group)
      if (audit.scoreDisplayMode === 'binary' || audit.scoreDisplayMode === 'numeric') {
        // Exclude generic metrics not related to a11y violations
        if (audit.id === 'is-on-https' || audit.id.startsWith('total-')) return;
        
        // If score is 0, it failed
        if (audit.score === 0 || audit.score === null) {
          issues.push({
            id: uuidv4(),
            ruleId: audit.id,
            severity: audit.scoreDisplayMode === 'binary' ? 'critical' : 'serious',
            description: audit.title + (audit.description ? ` - ${audit.description.split('.')[0]}.` : ''),
            passed: false,
          });
        } 
        // If score is 1, it passed (limit passed checks to avoid bloating data)
        else if (audit.score === 1 && issues.length < 15) {
          issues.push({
            id: uuidv4(),
            ruleId: audit.id,
            severity: 'none',
            description: audit.title,
            passed: true,
          });
        }
      }
    });

    return {
      score,
      issues,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Accessibility Scanner] Error:', error);
    return {
      score: 0,
      issues: [
        {
          id: uuidv4(),
          ruleId: 'scan-failed',
          severity: 'critical',
          description: `Failed to run accessibility scan: ${error.message}`,
          passed: false
        }
      ],
      timestamp: new Date().toISOString()
    };
  }
}
