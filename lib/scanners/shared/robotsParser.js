/**
 * Fetches and parses robots.txt for a given origin.
 * @param {string} origin
 * @returns {Promise<string|null>}
 */
export async function fetchRobotsTxt(origin) {
  try {
    const robotsUrl = new URL('/robots.txt', origin);
    const res = await fetch(robotsUrl.toString(), { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      return await res.text();
    }
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Checks if a specific User-Agent is explicitly blocked from crawling the root.
 * Very basic parser for demonstration.
 * @param {string} robotsTxt
 * @param {string} userAgent
 * @returns {boolean}
 */
export function isUserAgentAllowed(robotsTxt, userAgent) {
  if (!robotsTxt) return true;
  
  const lines = robotsTxt.toLowerCase().split('\n').map(l => l.trim());
  let inTargetAgent = false;
  let inAsteriskAgent = false;

  for (const line of lines) {
    if (line.startsWith('user-agent:')) {
      const agent = line.split(':')[1].trim();
      inTargetAgent = agent.includes(userAgent.toLowerCase());
      inAsteriskAgent = agent === '*';
    } else if (line.startsWith('disallow:')) {
      const path = line.split(':')[1].trim();
      if ((inTargetAgent || (inAsteriskAgent && !inTargetAgent)) && (path === '/' || path === '/*')) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Checks if robots.txt exists.
 * @param {string} origin
 * @returns {Promise<boolean>}
 */
export async function hasRobotsTxt(origin) {
  const text = await fetchRobotsTxt(origin);
  return !!text;
}

/**
 * Extracts sitemap URLs from robots.txt.
 * @param {string} robotsTxt
 * @returns {string[]}
 */
export function getSitemapUrls(robotsTxt) {
  if (!robotsTxt) return [];
  const lines = robotsTxt.toLowerCase().split('\n').map(l => l.trim());
  const sitemaps = [];
  for (const line of lines) {
    if (line.startsWith('sitemap:')) {
      sitemaps.push(line.substring(8).trim());
    }
  }
  return sitemaps;
}
