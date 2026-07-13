/**
 * lib/scanners/shared/scanErrors.js
 *
 * DRY error handling for scanners. Turns any failure thrown while fetching the
 * target site into a single, specific finding so a blocked/unreachable scan
 * reports *why* it failed instead of silently collapsing to a couple of checks.
 *
 * Used by every HTML-based scanner (SEO, AEO, GEO, Security) so the messaging
 * stays consistent across the product.
 */

/**
 * Classify a thrown scan error into a uniform finding descriptor.
 * @param {Error & { code?: string, vendor?: string, status?: number }} error
 * @returns {{ category: string, severity: string, title: string, description: string, remediation: string, aiFixPrompt: string }}
 */
export function classifyScanError(error) {
  const code = error?.code;
  const msg = error?.message || 'Unknown error';

  if (code === 'BOT_CHALLENGE') {
    const vendor = error.vendor || 'a security';
    return {
      category: 'General',
      severity: 'critical',
      title: 'Scanner Blocked by Bot Challenge',
      description:
        `The site is protected by ${vendor === 'a security' ? 'a bot' : vendor} challenge (e.g. Vercel Attack Challenge Mode or Cloudflare "Under Attack"), ` +
        `which served a security checkpoint instead of the page. The scanner could not read your content, so no checks could run.`,
      remediation:
        `Allow the scanner through your firewall: either turn off Attack Challenge Mode for steady-state traffic, ` +
        `or add a bypass rule. Set SCANNER_BYPASS_TOKEN in your environment and create a firewall rule that skips the ` +
        `challenge when the request carries the "x-igris-scan-key" header matching that token (real bots stay blocked).`,
      aiFixPrompt:
        `How do I add a Vercel Firewall bypass rule that skips the bot challenge for requests with a specific custom header value?`,
    };
  }

  const isTimeout = /timeout|aborted|abort/i.test(msg) || error?.name === 'TimeoutError';
  if (isTimeout) {
    return {
      category: 'General',
      severity: 'critical',
      title: 'Site Fetch Timed Out',
      description: `The site took too long to respond and the scan timed out. (${msg})`,
      remediation: 'Ensure the site is online and responds quickly, then run the scan again. Check for slow server response times or an unreachable host.',
      aiFixPrompt: '',
    };
  }

  if (code === 'HTTP_ERROR') {
    return {
      category: 'General',
      severity: 'critical',
      title: 'Site Returned an Error',
      description: `The site responded with an HTTP error, so the page could not be scanned. (${msg})`,
      remediation: 'Confirm the URL is correct and the page returns a 200 status for anonymous visitors, then run the scan again.',
      aiFixPrompt: '',
    };
  }

  return {
    category: 'General',
    severity: 'critical',
    title: 'Site Fetch Failed',
    description: `Failed to load URL: ${msg}`,
    remediation: 'Ensure the site is accessible and the URL is correct, then try again.',
    aiFixPrompt: '',
  };
}

/**
 * Convenience: add the classified error as a finding via a collector's addFinding.
 * @param {Function} addFinding - from createFindingsCollector()
 * @param {Error} error
 */
export function addScanErrorFinding(addFinding, error) {
  const f = classifyScanError(error);
  addFinding(f.category, f.severity, f.title, f.description, false, f.remediation, f.aiFixPrompt);
}
