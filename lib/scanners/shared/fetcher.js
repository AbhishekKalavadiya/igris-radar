import * as cheerio from 'cheerio';
import { assertSafeUrl } from '@/lib/security/ssrf';
import { env } from '@/lib/env';

/**
 * Detects whether a response is an interactive bot-challenge / security
 * checkpoint (Vercel Attack Challenge Mode, Cloudflare "Just a moment...",
 * etc.) rather than the real page. When a site sits behind one of these, the
 * body is a JS challenge shell — useless for auditing — so scanners must treat
 * it as a blocked fetch, NOT as valid HTML.
 *
 * Detection is header-first (cheap, reliable) with a small body-sniff fallback.
 * @param {Response} response
 * @param {string} [html]
 * @returns {string|null} the vendor label if challenged, else null
 */
export function detectBotChallenge(response, html = '') {
  const h = response.headers;
  // Vercel firewall / Attack Challenge Mode.
  if ((h.get('x-vercel-mitigated') || '').toLowerCase() === 'challenge') return 'Vercel';
  if (h.get('x-vercel-challenge-token')) return 'Vercel';
  // Cloudflare managed challenge / "Under attack" mode.
  if ((h.get('cf-mitigated') || '').toLowerCase() === 'challenge') return 'Cloudflare';
  const server = (h.get('server') || '').toLowerCase();
  if (response.status === 403 && server.includes('cloudflare')) return 'Cloudflare';
  // Body fallback for vendors that don't set a distinctive header.
  if (html) {
    const head = html.slice(0, 4000);
    if (/Vercel Security Checkpoint/i.test(head)) return 'Vercel';
    if (/(Just a moment|Checking your browser|cf-browser-verification|Attention Required)/i.test(head)) return 'Cloudflare';
  }
  return null;
}

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

  const headers = {
    'User-Agent': env.scannerUserAgent,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    // Firewall-bypass secret: pair this with a Vercel/Cloudflare firewall rule
    // that skips the bot challenge when this header matches, so our own scanner
    // gets through while real bots stay blocked. No-op when the env is unset.
    ...(env.scannerBypassToken ? { 'x-igris-scan-key': env.scannerBypassToken } : {}),
    ...(options.headers || {}),
  };

  const baseFetchOptions = {
    redirect: 'follow',
    ...options,
    headers,
  };
  // `headers`/`timeout` are consumed here; don't leak them into fetch init twice.
  delete baseFetchOptions.timeout;

  // Bot challenges (Vercel/Cloudflare) are often intermittent — driven by the
  // egress IP reputation of the serverless invocation or short-lived rate rules,
  // not by anything about the target page. A fresh request moments later
  // frequently draws a clean IP and succeeds, so retry a bounded number of times
  // on BOT_CHALLENGE with a short backoff before giving up. Other errors
  // (HTTP_ERROR, timeouts) are not retried — they won't change on a retry.
  const maxChallengeRetries = options.challengeRetries ?? 2;
  let lastChallenge = null;

  for (let attempt = 0; attempt <= maxChallengeRetries; attempt++) {
    const response = await fetch(targetUrl.toString(), {
      ...baseFetchOptions,
      signal: AbortSignal.timeout(options.timeout || 10000),
    });

    // A bot-challenge response is never the real page. We only need to peek at
    // headers first; the body sniff happens after we read it.
    let challengeVendor = detectBotChallenge(response);
    const html = await response.text();
    if (!challengeVendor) challengeVendor = detectBotChallenge(response, html);

    if (challengeVendor) {
      lastChallenge = challengeVendor;
      if (attempt < maxChallengeRetries) {
        // Exponential-ish backoff: 400ms, 800ms. Kept short so a scan that will
        // ultimately fail still returns quickly.
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      // Exhausted retries — surface the actionable "allowlist your scanner"
      // finding instead of aborting generically or scanning the challenge shell.
      const err = new Error(
        `${targetUrl.hostname} is behind a ${challengeVendor} bot challenge, which blocked the scanner from reading the page (after ${maxChallengeRetries + 1} attempts).`
      );
      err.code = 'BOT_CHALLENGE';
      err.vendor = challengeVendor;
      err.status = 403;
      throw err;
    }

    if (!response.ok && options.throwOnHttpError !== false) {
      const err = new Error(`Failed to fetch ${targetUrl.toString()} (Status: ${response.status})`);
      err.code = 'HTTP_ERROR';
      err.status = response.status;
      throw err;
    }

    const $ = cheerio.load(html);
    return { html, $, response, targetUrl };
  }

  // Unreachable in practice (the loop either returns or throws), but keep a
  // definitive throw so the function never falls through to `undefined`.
  const err = new Error(`${targetUrl.hostname} could not be fetched (${lastChallenge || 'unknown'} challenge).`);
  err.code = 'BOT_CHALLENGE';
  err.vendor = lastChallenge || undefined;
  err.status = 403;
  throw err;
}
