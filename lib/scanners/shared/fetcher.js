import * as cheerio from 'cheerio';
import { assertSafeUrl } from '@/lib/security/ssrf';

/**
 * Fetches a URL and returns both raw HTML and a parsed Cheerio instance.
 * @param {string} url - The URL to fetch.
 * @param {object} options - Optional fetch options.
 * @returns {Promise<{ html: string, $: cheerio.Root, response: Response, targetUrl: URL }>}
 */
export async function fetchWithCheerio(url, options = {}) {
  // SSRF guard (SECURITY_CHECKLIST C-I6): reject internal/private/metadata
  // targets and non-http schemes before issuing any request.
  const safeUrl = await assertSafeUrl(url);
  const targetUrl = new URL(safeUrl);

  const fetchOptions = {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; IgrisRadarBot/1.0)' },
    signal: AbortSignal.timeout(options.timeout || 10000),
    ...options
  };

  const response = await fetch(targetUrl.toString(), fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${targetUrl.toString()} (Status: ${response.status})`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  return { html, $, response, targetUrl };
}
