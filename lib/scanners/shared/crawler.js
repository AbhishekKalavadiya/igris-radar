import { fetchWithCheerio } from './fetcher.js';
import { fetchRobotsTxt, isUserAgentAllowed } from './robotsParser.js';

/**
 * Lightweight BFS JS crawler for multi-page audits.
 * @param {string} startUrl
 * @param {object} options
 * @returns {Promise<{ pages: Array<{ url: string, html: string, $: any, statusCode: number }>, errors: Array<{ url: string, error: string }> }>}
 */
export async function crawlSite(startUrl, options = {}) {
  const { maxPages = 20, delay = 500, sameDomainOnly = true, timeout = 30000 } = options;

  let targetUrl;
  try {
    targetUrl = new URL(startUrl.startsWith('http') ? startUrl : 'https://' + startUrl);
  } catch (e) {
    throw new Error('Invalid start URL');
  }

  const origin = targetUrl.origin;
  const visited = new Set();
  const queue = [targetUrl.toString()];
  const pages = [];
  const errors = [];

  // Fetch robots.txt first
  const robotsTxt = await fetchRobotsTxt(origin);

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrlString = queue.shift();
    if (visited.has(currentUrlString)) continue;
    visited.add(currentUrlString);

    let currentUrl;
    try {
      currentUrl = new URL(currentUrlString);
    } catch (e) {
      continue;
    }

    if (sameDomainOnly && currentUrl.origin !== origin) continue;
    
    // Check robots.txt
    if (robotsTxt && !isUserAgentAllowed(robotsTxt, 'IgrisRadarBot')) {
      errors.push({ url: currentUrlString, error: 'Blocked by robots.txt' });
      continue;
    }

    try {
      const { html, $, response } = await fetchWithCheerio(currentUrlString, { timeout });
      pages.push({ url: currentUrlString, html, $, statusCode: response.status });

      // Extract links for next crawl step if we haven't reached maxPages
      if (pages.length < maxPages) {
        $('a').each((_, el) => {
          const href = $(el).attr('href');
          if (href) {
            try {
              const nextUrl = new URL(href, currentUrl.href);
              // Simple normalization: remove hash
              nextUrl.hash = '';
              if (sameDomainOnly && nextUrl.origin === origin && !visited.has(nextUrl.toString())) {
                queue.push(nextUrl.toString());
              }
            } catch (e) {
              // Ignore invalid URLs
            }
          }
        });
      }

      // Add a small delay between requests
      if (queue.length > 0 && pages.length < maxPages) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    } catch (error) {
      errors.push({ url: currentUrlString, error: error.message });
    }
  }

  return { pages, errors };
}
