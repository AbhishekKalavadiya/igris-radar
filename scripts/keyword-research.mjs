#!/usr/bin/env node
/**
 * scripts/keyword-research.mjs
 * ─────────────────────────────
 * Multi-source keyword research tool for Igris Radar.
 *
 * Pulls data from up to 4 free sources:
 *   1. Google Trends          (zero setup — `google-trends-api` package)
 *   2. Google Autocomplete    (zero setup — public endpoint)
 *   3. Google Keyword Planner (free Google Ads account required)
 *   4. Google Search Console  (free service account required)
 *
 * Usage:
 *   node scripts/keyword-research.mjs                        # Trends + Autocomplete (zero setup)
 *   node scripts/keyword-research.mjs --no-gsc --no-kwp      # Same as above, explicit
 *   node scripts/keyword-research.mjs --service security      # Focus on security keywords
 *   node scripts/keyword-research.mjs --service seo           # Focus on SEO keywords
 *   node scripts/keyword-research.mjs --top 20                # Limit to top 20 results
 *   node scripts/keyword-research.mjs --days 90               # GSC: 90-day lookback
 *   node scripts/keyword-research.mjs                         # All 4 sources (after setup)
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { createSign } from 'crypto';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PROJECT_ROOT = resolve(__dirname, '..');

// ── Load environment variables from .env.local ──────────────────────
function loadEnv() {
  const envPath = resolve(PROJECT_ROOT, '.env.local');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    // Strip surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv();

// ═══════════════════════════════════════════════════════════════════════
// SERVICE SEED KEYWORDS
// ═══════════════════════════════════════════════════════════════════════
// These are the seed terms for each Igris Radar service. The script
// expands them via Autocomplete and Trends to discover high-value
// long-tail keywords.
// ═══════════════════════════════════════════════════════════════════════

const SERVICE_SEEDS = {
  landing: {
    name: 'Landing Page (Main Platform)',
    page: '/landing',
    seeds: [
      'ai search visibility platform',
      'ai website audit tool',
      'all in one website audit platform',
      'ai search optimization tool',
      'seo aeo geo audit',
      'website audit platform free',
      'ai search visibility tool',
      'website security and seo audit',
      'brand visibility checker tool',
      'ai search engine optimization',
    ],
  },
  security: {
    name: 'Security Scanner',
    page: '/landing/features/security-scanner',
    seeds: [
      'website security scanner',
      'website security checker',
      'web vulnerability scanner',
      'free website security scan',
      'website malware scanner',
      'ssl checker',
      'security headers checker',
      'website risk assessment',
      'subdomain takeover checker',
      'cve scanner online',
    ],
  },
  seo: {
    name: 'SEO Audit',
    page: '/landing/features/seo-audit',
    seeds: [
      'seo audit tool',
      'free seo audit',
      'seo checker online',
      'website seo analysis',
      'technical seo audit',
      'seo score checker',
      'on page seo checker',
      'core web vitals checker',
      'website seo report',
      'seo analysis free',
    ],
  },
  aeo: {
    name: 'AEO Audit',
    page: '/landing/features/aeo-audit',
    seeds: [
      'answer engine optimization',
      'aeo audit',
      'chatgpt optimization',
      'ai search optimization',
      'get cited by chatgpt',
      'ai overview optimization',
      'perplexity optimization',
      'optimize for ai search',
      'ai answer engine',
      'how to appear in ai answers',
    ],
  },
  geo: {
    name: 'GEO Audit',
    page: '/landing/features/geo-audit',
    seeds: [
      'generative engine optimization',
      'geo audit tool',
      'ai visibility checker',
      'ai citation checker',
      'generative ai visibility',
      'llm optimization',
      'ai search visibility',
      'optimize for generative ai',
      'chatgpt visibility',
      'ai recommendation optimization',
    ],
  },
  brand: {
    name: 'Brand Visibility',
    page: '/landing/features/brand-visibility',
    seeds: [
      'ai brand monitoring',
      'brand visibility checker',
      'brand mention tracking',
      'ai brand tracking',
      'chatgpt brand monitoring',
      'ai recommendation tracking',
      'brand visibility in ai',
      'does ai recommend my brand',
      'ai brand visibility tool',
      'track brand in chatgpt',
    ],
  },
  health: {
    name: 'Site Health',
    page: '/landing/features/site-health',
    seeds: [
      'core web vitals checker',
      'website health check',
      'site speed test',
      'accessibility checker',
      'wcag audit tool',
      'website performance test',
      'page speed checker',
      'web accessibility audit',
      'lighthouse score checker',
      'website uptime checker',
    ],
  },
  aso: {
    name: 'ASO Audit',
    page: '/landing/features/aso-audit',
    seeds: [
      'app store optimization',
      'aso audit tool',
      'app store ranking checker',
      'aso checker',
      'app metadata audit',
      'play store optimization',
      'app store seo',
      'aso tool free',
      'app store optimization tool',
      'app ranking analysis',
    ],
  },
  llmstxt: {
    name: 'llms.txt Generator',
    page: '/tools/llms-txt-generator',
    seeds: [
      'llms.txt generator',
      'llms.txt validator',
      'llms.txt file',
      'ai crawler optimization',
      'llms txt format',
      'llms.txt creator',
      'what is llms.txt',
      'create llms.txt',
      'llms.txt for website',
      'ai bot optimization file',
    ],
  },
};

// Modifiers appended to seeds for autocomplete expansion
const AUTOCOMPLETE_MODIFIERS = [
  '', ' free', ' online', ' tool', ' 2026', ' best',
  'best ', 'free ', 'how to ',
];

// ═══════════════════════════════════════════════════════════════════════
// CLI ARGUMENT PARSING
// ═══════════════════════════════════════════════════════════════════════

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    service: null,     // Focus on one service (e.g., 'security')
    days: 28,          // GSC lookback days
    top: 50,           // Max results per section
    noGsc: false,      // Skip Google Search Console
    noKwp: false,      // Skip Keyword Planner
    noTrends: false,   // Skip Google Trends
    noAutocomplete: false, // Skip Autocomplete
    verbose: false,    // Extra logging
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--service':  opts.service = args[++i]; break;
      case '--days':     opts.days = parseInt(args[++i], 10); break;
      case '--top':      opts.top = parseInt(args[++i], 10); break;
      case '--no-gsc':   opts.noGsc = true; break;
      case '--no-kwp':   opts.noKwp = true; break;
      case '--no-trends': opts.noTrends = true; break;
      case '--no-autocomplete': opts.noAutocomplete = true; break;
      case '--verbose':  opts.verbose = true; break;
      case '--help':
        console.log(`
Usage: node scripts/keyword-research.mjs [options]

Options:
  --service <name>    Focus on one service: security, seo, aeo, geo, brand, health, aso, llmstxt
  --days <n>          GSC lookback window in days (default: 28)
  --top <n>           Max results per section (default: 50)
  --no-gsc            Skip Google Search Console
  --no-kwp            Skip Google Keyword Planner
  --no-trends         Skip Google Trends
  --no-autocomplete   Skip Google Autocomplete
  --verbose           Extra debug logging
  --help              Show this help

Examples:
  node scripts/keyword-research.mjs                        # Trends + Autocomplete (zero setup)
  node scripts/keyword-research.mjs --service security     # Security keywords only
  node scripts/keyword-research.mjs --no-gsc --no-kwp      # Trends + Autocomplete only
  node scripts/keyword-research.mjs --top 20               # Top 20 results
`);
        process.exit(0);
      default:
        console.error(`Unknown option: ${args[i]}. Use --help for usage.`);
        process.exit(1);
    }
  }

  return opts;
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════

function log(msg) { console.log(`  ${msg}`); }
function warn(msg) { console.log(`  ⚠ ${msg}`); }
function info(msg) { console.log(`  ℹ ${msg}`); }

/** Pause for ms milliseconds (rate-limit courtesy). */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** Format a number with commas. */
function fmtNum(n) {
  if (n == null) return '—';
  return Number(n).toLocaleString('en-US');
}

/** Pad/truncate a string to a fixed width. */
function pad(str, width) {
  const s = String(str ?? '');
  return s.length >= width ? s.slice(0, width) : s + ' '.repeat(width - s.length);
}

/** Right-align a value in a fixed width. */
function rpad(str, width) {
  const s = String(str ?? '');
  return s.length >= width ? s.slice(0, width) : ' '.repeat(width - s.length) + s;
}

/** Today as YYYY-MM-DD. */
function today() { return new Date().toISOString().split('T')[0]; }

/** N days ago as YYYY-MM-DD. */
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

// ═══════════════════════════════════════════════════════════════════════
// SOURCE 1: GOOGLE TRENDS
// ═══════════════════════════════════════════════════════════════════════

async function fetchGoogleTrends(seedsByService, verbose) {
  let googleTrends;
  try {
    googleTrends = (await import('google-trends-api')).default;
  } catch {
    warn('google-trends-api not installed. Run: yarn add google-trends-api');
    return null;
  }

  const results = { interestComparison: [], relatedQueries: [] };

  // Compare interest across top seeds from each service
  const allSeeds = [];
  for (const [svc, data] of Object.entries(seedsByService)) {
    // Take top 2 seeds per service (Google Trends compares max 5 at a time)
    allSeeds.push(...data.seeds.slice(0, 2).map(s => ({ service: svc, keyword: s })));
  }

  // Compare in groups of 5 (Google Trends limit)
  for (let i = 0; i < allSeeds.length; i += 5) {
    const group = allSeeds.slice(i, i + 5);
    const keywords = group.map(g => g.keyword);

    try {
      if (verbose) log(`Trends: comparing [${keywords.join(', ')}]`);
      const raw = await googleTrends.interestOverTime({
        keyword: keywords,
        startTime: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days
        geo: '',
        category: 0,
      });
      const data = JSON.parse(raw);
      const timeline = data?.default?.timelineData || [];
      const averages = data?.default?.averages || [];

      keywords.forEach((kw, idx) => {
        const svc = group[idx].service;
        const avgInterest = averages[idx] || 0;
        // Calculate trend direction from last 4 data points
        const recent = timeline.slice(-4);
        const recentAvg = recent.length
          ? recent.reduce((sum, p) => sum + (p.value?.[idx] || 0), 0) / recent.length
          : 0;
        const olderPoints = timeline.slice(0, Math.max(1, timeline.length - 4));
        const olderAvg = olderPoints.length
          ? olderPoints.reduce((sum, p) => sum + (p.value?.[idx] || 0), 0) / olderPoints.length
          : 0;
        const trendDirection = olderAvg > 0
          ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100)
          : 0;

        results.interestComparison.push({
          keyword: kw,
          service: svc,
          avgInterest,
          recentInterest: Math.round(recentAvg),
          trendPct: trendDirection,
          trend: trendDirection > 20 ? '↑ Rising' :
                 trendDirection < -20 ? '↓ Declining' : '→ Stable',
        });
      });
    } catch (err) {
      if (verbose) warn(`Trends comparison error: ${err.message}`);
    }
    await sleep(1500); // Rate limit
  }

  // Fetch related/rising queries for each service's top seed
  for (const [svc, data] of Object.entries(seedsByService)) {
    const topSeed = data.seeds[0];
    try {
      if (verbose) log(`Trends: related queries for "${topSeed}"`);
      const raw = await googleTrends.relatedQueries({ keyword: topSeed });
      const parsed = JSON.parse(raw);
      const ranked = parsed?.default?.rankedList || [];

      // Top queries
      const topQueries = ranked[0]?.rankedKeyword || [];
      // Rising queries
      const risingQueries = ranked[1]?.rankedKeyword || [];

      for (const q of topQueries.slice(0, 5)) {
        results.relatedQueries.push({
          keyword: q.query,
          service: svc,
          seedKeyword: topSeed,
          type: 'top',
          value: q.value,
          formattedValue: q.formattedValue,
        });
      }
      for (const q of risingQueries.slice(0, 5)) {
        results.relatedQueries.push({
          keyword: q.query,
          service: svc,
          seedKeyword: topSeed,
          type: 'rising',
          value: q.value,
          formattedValue: q.formattedValue,
        });
      }
    } catch (err) {
      if (verbose) warn(`Trends related queries error for "${topSeed}": ${err.message}`);
    }
    await sleep(1200);
  }

  // Sort by interest
  results.interestComparison.sort((a, b) => b.avgInterest - a.avgInterest);

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// SOURCE 2: GOOGLE AUTOCOMPLETE
// ═══════════════════════════════════════════════════════════════════════

async function fetchAutocomplete(seedsByService, verbose) {
  const results = [];
  const seen = new Set();

  for (const [svc, data] of Object.entries(seedsByService)) {
    // Expand each seed with modifiers
    const queries = [];
    for (const seed of data.seeds.slice(0, 5)) { // Top 5 seeds per service
      for (const mod of AUTOCOMPLETE_MODIFIERS) {
        const q = mod.endsWith(' ') ? `${mod}${seed}` : `${seed}${mod}`;
        if (!seen.has(q.toLowerCase())) {
          queries.push(q);
          seen.add(q.toLowerCase());
        }
      }
    }

    for (const query of queries) {
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&hl=en`;
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
        });
        if (!res.ok) {
          if (verbose) warn(`Autocomplete HTTP ${res.status} for "${query}"`);
          continue;
        }
        const json = await res.json();
        const suggestions = json[1] || [];

        for (const suggestion of suggestions) {
          const lower = suggestion.toLowerCase().trim();
          if (!seen.has(lower) && lower !== query.toLowerCase()) {
            seen.add(lower);
            results.push({
              keyword: suggestion.trim(),
              service: svc,
              seedQuery: query,
              source: 'autocomplete',
            });
          }
        }
      } catch (err) {
        if (verbose) warn(`Autocomplete error for "${query}": ${err.message}`);
      }
      await sleep(250); // Gentle rate limit
    }
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// SOURCE 3: GOOGLE KEYWORD PLANNER
// ═══════════════════════════════════════════════════════════════════════

async function fetchKeywordPlanner(seedsByService, verbose) {
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID;

  if (!clientId || !clientSecret || !devToken || !refreshToken || !customerId) {
    warn('Google Keyword Planner not configured. Set GOOGLE_ADS_* vars in .env.local');
    info('See docs/keyword-research-setup.md for setup instructions');
    return null;
  }

  // Exchange refresh token for access token
  let accessToken;
  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || tokenData.error || 'Token exchange failed');
    accessToken = tokenData.access_token;
    if (verbose) log('Keyword Planner: authenticated successfully');
  } catch (err) {
    warn(`Keyword Planner auth failed: ${err.message}`);
    return null;
  }

  const results = [];
  const cleanCustomerId = customerId.replace(/-/g, '');

  for (const [svc, data] of Object.entries(seedsByService)) {
    // Take top 10 seed keywords per service
    const keywords = data.seeds.slice(0, 10);

    try {
      if (verbose) log(`Keyword Planner: fetching ideas for ${svc} (${keywords.length} seeds)`);

      const res = await fetch(
        `https://googleads.googleapis.com/v18/customers/${cleanCustomerId}:generateKeywordIdeas`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'developer-token': devToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            keywordSeed: { keywords },
            language: 'languageConstants/1000',           // English
            geoTargetConstants: ['geoTargetConstants/2840'], // United States
            keywordPlanNetwork: 'GOOGLE_SEARCH',
            pageSize: 50,
          }),
        }
      );

      if (!res.ok) {
        const errBody = await res.text();
        if (verbose) warn(`Keyword Planner API error (${svc}): ${res.status} ${errBody.slice(0, 200)}`);
        continue;
      }

      const apiData = await res.json();
      const ideas = apiData.results || [];

      for (const idea of ideas) {
        const metrics = idea.keywordIdeaMetrics || {};
        results.push({
          keyword: idea.text,
          service: svc,
          avgMonthlySearches: parseInt(metrics.avgMonthlySearches || '0', 10),
          competition: metrics.competition || 'UNSPECIFIED',
          competitionIndex: parseInt(metrics.competitionIndex || '0', 10),
          lowBidCents: Math.round((parseInt(metrics.lowTopOfPageBidMicros || '0', 10)) / 10000),
          highBidCents: Math.round((parseInt(metrics.highTopOfPageBidMicros || '0', 10)) / 10000),
          source: 'keyword_planner',
        });
      }
    } catch (err) {
      warn(`Keyword Planner error for ${svc}: ${err.message}`);
    }
    await sleep(500);
  }

  // Sort by search volume descending
  results.sort((a, b) => b.avgMonthlySearches - a.avgMonthlySearches);
  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// SOURCE 4: GOOGLE SEARCH CONSOLE
// ═══════════════════════════════════════════════════════════════════════

async function fetchGSCData(days, verbose) {
  const keyB64 = process.env.GSC_SERVICE_ACCOUNT_KEY;
  const siteUrl = process.env.GSC_SITE_URL;

  if (!keyB64 || !siteUrl) {
    warn('Google Search Console not configured. Set GSC_* vars in .env.local');
    info('See docs/keyword-research-setup.md for setup instructions');
    return null;
  }

  // Parse service account key
  let serviceAccount;
  try {
    serviceAccount = JSON.parse(Buffer.from(keyB64, 'base64').toString('utf8'));
  } catch {
    warn('GSC_SERVICE_ACCOUNT_KEY is not valid base64-encoded JSON');
    return null;
  }

  // Generate JWT for auth
  let accessToken;
  try {
    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claims = Buffer.from(JSON.stringify({
      iss: serviceAccount.client_email,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    })).toString('base64url');

    const signatureInput = `${header}.${claims}`;
    const sign = createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(serviceAccount.private_key, 'base64url');
    const jwt = `${signatureInput}.${signature}`;

    // Exchange JWT for access token
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) throw new Error(tokenData.error_description || tokenData.error || 'JWT exchange failed');
    accessToken = tokenData.access_token;
    if (verbose) log('GSC: authenticated successfully');
  } catch (err) {
    warn(`GSC authentication failed: ${err.message}`);
    return null;
  }

  // Fetch search analytics — queries
  const encodedSiteUrl = encodeURIComponent(siteUrl);
  const results = { queries: [], pages: [] };

  try {
    if (verbose) log(`GSC: fetching top queries (last ${days} days)`);
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: daysAgo(days),
          endDate: today(),
          dimensions: ['query'],
          rowLimit: 500,
          dataState: 'final',
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      warn(`GSC queries API error: ${res.status} ${body.slice(0, 200)}`);
    } else {
      const data = await res.json();
      results.queries = (data.rows || []).map(row => ({
        keyword: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: Math.round(row.ctr * 1000) / 10,  // e.g. 0.023 → 2.3
        position: Math.round(row.position * 10) / 10,
        page: Math.ceil(row.position / 10),
      }));
    }
  } catch (err) {
    warn(`GSC queries fetch error: ${err.message}`);
  }

  // Fetch search analytics — pages
  try {
    if (verbose) log('GSC: fetching page performance');
    const res = await fetch(
      `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodedSiteUrl}/searchAnalytics/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: daysAgo(days),
          endDate: today(),
          dimensions: ['page'],
          rowLimit: 100,
          dataState: 'final',
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text();
      warn(`GSC pages API error: ${res.status} ${body.slice(0, 200)}`);
    } else {
      const data = await res.json();
      results.pages = (data.rows || []).map(row => ({
        page: row.keys[0],
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: Math.round(row.ctr * 1000) / 10,
        position: Math.round(row.position * 10) / 10,
      }));
    }
  } catch (err) {
    warn(`GSC pages fetch error: ${err.message}`);
  }

  // Sort queries by impressions (most visible first)
  results.queries.sort((a, b) => b.impressions - a.impressions);
  results.pages.sort((a, b) => b.impressions - a.impressions);

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// COMBINED ANALYSIS & OPPORTUNITY SCORING
// ═══════════════════════════════════════════════════════════════════════

function buildCombinedOpportunities(trends, autocomplete, kwp, gsc, seedsByService) {
  const keywordMap = new Map(); // keyword → aggregated data

  // Helper: upsert keyword
  function upsert(keyword, data) {
    const key = keyword.toLowerCase().trim();
    if (!key) return;
    if (!keywordMap.has(key)) {
      keywordMap.set(key, {
        keyword: keyword.trim(),
        services: new Set(),
        sources: new Set(),
        trendInterest: 0,
        trendDirection: '',
        trendPct: 0,
        autocompleteCount: 0,
        kwpVolume: 0,
        kwpCompetition: '',
        gscClicks: 0,
        gscImpressions: 0,
        gscPosition: 0,
        gscCtr: 0,
        recommendedPage: '',
      });
    }
    const entry = keywordMap.get(key);
    if (data.service) entry.services.add(data.service);
    if (data.source) entry.sources.add(data.source);
    Object.assign(entry, { ...entry, ...data, services: entry.services, sources: entry.sources });
  }

  // Merge Trends data
  if (trends) {
    for (const item of trends.interestComparison) {
      upsert(item.keyword, {
        source: 'trends',
        service: item.service,
        trendInterest: item.avgInterest,
        trendDirection: item.trend,
        trendPct: item.trendPct,
        recommendedPage: seedsByService[item.service]?.page || '',
      });
    }
    for (const item of trends.relatedQueries) {
      upsert(item.keyword, {
        source: 'trends_related',
        service: item.service,
        trendDirection: item.type === 'rising' ? '↑ Rising' : '→ Top',
        recommendedPage: seedsByService[item.service]?.page || '',
      });
    }
  }

  // Merge Autocomplete data
  if (autocomplete) {
    for (const item of autocomplete) {
      const existing = keywordMap.get(item.keyword.toLowerCase().trim());
      upsert(item.keyword, {
        source: 'autocomplete',
        service: item.service,
        autocompleteCount: (existing?.autocompleteCount || 0) + 1,
        recommendedPage: seedsByService[item.service]?.page || '',
      });
    }
  }

  // Merge Keyword Planner data
  if (kwp) {
    for (const item of kwp) {
      upsert(item.keyword, {
        source: 'keyword_planner',
        service: item.service,
        kwpVolume: item.avgMonthlySearches,
        kwpCompetition: item.competition,
        recommendedPage: seedsByService[item.service]?.page || '',
      });
    }
  }

  // Merge GSC data
  if (gsc) {
    for (const item of gsc.queries) {
      // Try to match to a service based on seed keyword overlap
      let bestService = '';
      for (const [svc, data] of Object.entries(seedsByService)) {
        if (data.seeds.some(s => item.keyword.toLowerCase().includes(s.split(' ')[0]))) {
          bestService = svc;
          break;
        }
      }
      upsert(item.keyword, {
        source: 'gsc',
        service: bestService,
        gscClicks: item.clicks,
        gscImpressions: item.impressions,
        gscPosition: item.position,
        gscCtr: item.ctr,
        recommendedPage: bestService ? seedsByService[bestService]?.page || '' : '',
      });
    }
  }

  // Calculate opportunity score
  // Higher score = better opportunity to target
  const opportunities = Array.from(keywordMap.values()).map(entry => {
    let score = 0;

    // Source diversity bonus (found in multiple sources = high confidence)
    score += entry.sources.size * 15;

    // Trend interest (0-100 scale from Google Trends)
    score += entry.trendInterest * 0.5;

    // Rising trend bonus
    if (entry.trendPct > 50) score += 25;
    else if (entry.trendPct > 20) score += 15;

    // Keyword Planner volume
    if (entry.kwpVolume > 10000) score += 40;
    else if (entry.kwpVolume > 1000) score += 30;
    else if (entry.kwpVolume > 100) score += 20;
    else if (entry.kwpVolume > 0) score += 10;

    // Low competition bonus
    if (entry.kwpCompetition === 'LOW') score += 20;
    else if (entry.kwpCompetition === 'MEDIUM') score += 10;

    // GSC: already ranking = easier to improve
    if (entry.gscImpressions > 0) {
      score += 20; // Already visible
      // Position 30-70 (pages 4-7) = best opportunities
      if (entry.gscPosition >= 30 && entry.gscPosition <= 70) score += 25;
      // High impressions but low CTR = title/description needs work
      if (entry.gscImpressions > 100 && entry.gscCtr < 2) score += 15;
    }

    // Autocomplete presence = real user demand
    if (entry.autocompleteCount > 0) score += 10 + entry.autocompleteCount * 2;

    return {
      ...entry,
      services: Array.from(entry.services),
      sources: Array.from(entry.sources),
      opportunityScore: Math.round(score),
    };
  });

  // Sort by opportunity score
  opportunities.sort((a, b) => b.opportunityScore - a.opportunityScore);

  return opportunities;
}

// ═══════════════════════════════════════════════════════════════════════
// REPORT FORMATTING & OUTPUT
// ═══════════════════════════════════════════════════════════════════════

function printReport(trends, autocomplete, kwp, gsc, opportunities, opts) {
  const line = '═'.repeat(72);
  const thinLine = '─'.repeat(72);

  console.log('');
  console.log(line);
  console.log('  IGRIS RADAR — Multi-Source Keyword Research Report');
  console.log(`  Generated: ${today()}`);
  console.log(`  Sources: ${[
    !opts.noTrends ? 'Google Trends' : null,
    !opts.noAutocomplete ? 'Autocomplete' : null,
    !opts.noKwp && kwp ? 'Keyword Planner' : null,
    !opts.noGsc && gsc ? 'Search Console' : null,
  ].filter(Boolean).join(' + ') || 'None'}`);
  if (opts.service) console.log(`  Service filter: ${opts.service}`);
  console.log(line);

  // ── Section: Google Trends ──
  if (trends && trends.interestComparison.length > 0) {
    console.log('');
    console.log('  📈 GOOGLE TRENDS — Search Interest (last 90 days)');
    console.log(thinLine);
    console.log(`  ${pad('Keyword', 40)} ${rpad('Interest', 10)} ${rpad('Trend', 12)}`);
    console.log(`  ${'-'.repeat(40)} ${'-'.repeat(10)} ${'-'.repeat(12)}`);
    for (const item of trends.interestComparison.slice(0, opts.top)) {
      const trendStr = item.trendPct > 0 ? `↑ +${item.trendPct}%` :
                       item.trendPct < 0 ? `↓ ${item.trendPct}%` : '→ Stable';
      console.log(`  ${pad(item.keyword, 40)} ${rpad(`${item.avgInterest}/100`, 10)} ${rpad(trendStr, 12)}`);
    }

    if (trends.relatedQueries.length > 0) {
      console.log('');
      console.log('  📈 GOOGLE TRENDS — Related & Rising Queries');
      console.log(thinLine);
      const rising = trends.relatedQueries.filter(q => q.type === 'rising').slice(0, 10);
      const top = trends.relatedQueries.filter(q => q.type === 'top').slice(0, 10);

      if (rising.length > 0) {
        console.log('  🔥 Rising:');
        for (const q of rising) {
          console.log(`     • ${q.keyword} (${q.formattedValue || 'Breakout'}) [${q.service}]`);
        }
      }
      if (top.length > 0) {
        console.log('  ⭐ Top Related:');
        for (const q of top) {
          console.log(`     • ${q.keyword} (score: ${q.value}) [${q.service}]`);
        }
      }
    }
  }

  // ── Section: Autocomplete ──
  if (autocomplete && autocomplete.length > 0) {
    console.log('');
    console.log('  🔍 GOOGLE AUTOCOMPLETE — What People Are Typing');
    console.log(thinLine);
    // Group by service
    const byService = {};
    for (const item of autocomplete) {
      if (!byService[item.service]) byService[item.service] = [];
      byService[item.service].push(item);
    }
    for (const [svc, items] of Object.entries(byService)) {
      const svcName = SERVICE_SEEDS[svc]?.name || svc;
      console.log(`  📂 ${svcName}:`);
      for (const item of items.slice(0, 8)) {
        console.log(`     → ${item.keyword}`);
      }
      if (items.length > 8) console.log(`     ... and ${items.length - 8} more`);
      console.log('');
    }
  }

  // ── Section: Keyword Planner ──
  if (kwp && kwp.length > 0) {
    console.log('');
    console.log('  🔑 GOOGLE KEYWORD PLANNER — Search Volume & Competition');
    console.log(thinLine);
    console.log(`  ${pad('Keyword', 38)} ${rpad('Volume/mo', 10)} ${rpad('Competition', 12)} ${rpad('CPC', 8)}`);
    console.log(`  ${'-'.repeat(38)} ${'-'.repeat(10)} ${'-'.repeat(12)} ${'-'.repeat(8)}`);
    for (const item of kwp.slice(0, opts.top)) {
      const cpc = item.highBidCents > 0 ? `$${(item.highBidCents / 100).toFixed(2)}` : '—';
      console.log(`  ${pad(item.keyword, 38)} ${rpad(fmtNum(item.avgMonthlySearches), 10)} ${rpad(item.competition, 12)} ${rpad(cpc, 8)}`);
    }
  }

  // ── Section: Google Search Console ──
  if (gsc && gsc.queries.length > 0) {
    console.log('');
    console.log('  📊 GOOGLE SEARCH CONSOLE — Your Current Rankings');
    console.log(thinLine);
    console.log(`  ${pad('Keyword', 38)} ${rpad('Clicks', 8)} ${rpad('Impr', 8)} ${rpad('CTR', 7)} ${rpad('Pos', 7)} ${rpad('Page', 5)}`);
    console.log(`  ${'-'.repeat(38)} ${'-'.repeat(8)} ${'-'.repeat(8)} ${'-'.repeat(7)} ${'-'.repeat(7)} ${'-'.repeat(5)}`);
    for (const q of gsc.queries.slice(0, opts.top)) {
      console.log(`  ${pad(q.keyword, 38)} ${rpad(fmtNum(q.clicks), 8)} ${rpad(fmtNum(q.impressions), 8)} ${rpad(q.ctr + '%', 7)} ${rpad(q.position, 7)} ${rpad('#' + q.page, 5)}`);
    }

    if (gsc.pages.length > 0) {
      console.log('');
      console.log('  📊 GOOGLE SEARCH CONSOLE — Page Performance');
      console.log(thinLine);
      console.log(`  ${pad('Page URL', 50)} ${rpad('Clicks', 8)} ${rpad('Impr', 8)} ${rpad('Pos', 7)}`);
      console.log(`  ${'-'.repeat(50)} ${'-'.repeat(8)} ${'-'.repeat(8)} ${'-'.repeat(7)}`);
      for (const p of gsc.pages.slice(0, 20)) {
        const shortUrl = p.page.replace('https://igrisradar.com', '').replace('https://www.igrisradar.com', '') || '/';
        console.log(`  ${pad(shortUrl, 50)} ${rpad(fmtNum(p.clicks), 8)} ${rpad(fmtNum(p.impressions), 8)} ${rpad(p.position, 7)}`);
      }
    }
  }

  // ── Section: Combined Opportunities ──
  if (opportunities.length > 0) {
    console.log('');
    console.log(line);
    console.log('  🎯 COMBINED OPPORTUNITIES — Best Keywords to Target');
    console.log(line);
    console.log(`  ${pad('#', 4)} ${pad('Keyword', 36)} ${rpad('Score', 6)} ${rpad('Volume', 8)} ${rpad('Trend', 10)} ${rpad('GSC Pos', 8)} ${pad('Sources', 16)}`);
    console.log(`  ${'-'.repeat(4)} ${'-'.repeat(36)} ${'-'.repeat(6)} ${'-'.repeat(8)} ${'-'.repeat(10)} ${'-'.repeat(8)} ${'-'.repeat(16)}`);

    for (let i = 0; i < Math.min(opportunities.length, opts.top); i++) {
      const o = opportunities[i];
      const vol = o.kwpVolume > 0 ? fmtNum(o.kwpVolume) : '—';
      const trend = o.trendDirection || '—';
      const pos = o.gscPosition > 0 ? `${o.gscPosition} (#${Math.ceil(o.gscPosition / 10)})` : '—';
      const sources = o.sources.join(', ');
      console.log(`  ${pad(i + 1, 4)} ${pad(o.keyword, 36)} ${rpad(o.opportunityScore, 6)} ${rpad(vol, 8)} ${rpad(trend, 10)} ${rpad(pos, 8)} ${pad(sources, 16)}`);
    }

    // Show recommended content changes for top 5
    console.log('');
    console.log('  💡 RECOMMENDED ACTIONS');
    console.log(thinLine);
    const topOpps = opportunities.slice(0, 5).filter(o => o.recommendedPage);
    for (let i = 0; i < topOpps.length; i++) {
      const o = topOpps[i];
      console.log(`  ${i + 1}. Target "${o.keyword}" on ${o.recommendedPage}`);
      console.log(`     Score: ${o.opportunityScore} | Sources: ${o.sources.join(', ')}`);
      if (o.kwpVolume > 0) console.log(`     Monthly searches: ${fmtNum(o.kwpVolume)} (${o.kwpCompetition} competition)`);
      if (o.gscPosition > 0) console.log(`     Current position: ${o.gscPosition} (page ${Math.ceil(o.gscPosition / 10)}) — ${fmtNum(o.gscImpressions)} impressions`);
      if (o.trendDirection) console.log(`     Trend: ${o.trendDirection}`);
      console.log('');
    }
  }

  console.log(thinLine);
  console.log('  ✅ Report complete. Ask me to update content for any keyword above.');
  console.log(thinLine);
  console.log('');
}

function saveReport(trends, autocomplete, kwp, gsc, opportunities) {
  const exportDir = resolve(PROJECT_ROOT, 'csv_export');
  if (!existsSync(exportDir)) mkdirSync(exportDir, { recursive: true });

  const report = {
    generated: new Date().toISOString(),
    summary: {
      totalOpportunities: opportunities.length,
      trendsKeywords: trends?.interestComparison?.length || 0,
      autocompleteKeywords: autocomplete?.length || 0,
      kwpKeywords: kwp?.length || 0,
      gscQueries: gsc?.queries?.length || 0,
    },
    opportunities: opportunities.slice(0, 100),
    trends: trends || null,
    autocomplete: autocomplete?.slice(0, 200) || null,
    keywordPlanner: kwp?.slice(0, 100) || null,
    searchConsole: gsc || null,
  };

  const filename = `keyword-report-${today()}.json`;
  const filepath = resolve(exportDir, filename);
  writeFileSync(filepath, JSON.stringify(report, null, 2));
  console.log(`  📄 Full report saved: csv_export/${filename}`);
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════

async function main() {
  const opts = parseArgs();

  console.log('');
  console.log('  🚀 Igris Radar Keyword Research');
  console.log('  ─────────────────────────────────');

  // Select services to research
  let seedsByService = { ...SERVICE_SEEDS };
  if (opts.service) {
    if (!SERVICE_SEEDS[opts.service]) {
      console.error(`  ✗ Unknown service: ${opts.service}`);
      console.error(`  Available: ${Object.keys(SERVICE_SEEDS).join(', ')}`);
      process.exit(1);
    }
    seedsByService = { [opts.service]: SERVICE_SEEDS[opts.service] };
    log(`Focusing on: ${SERVICE_SEEDS[opts.service].name}`);
  } else {
    log(`Researching all ${Object.keys(seedsByService).length} services`);
  }

  // ── Fetch from all sources in parallel where possible ──
  const tasks = [];

  // Google Trends
  if (!opts.noTrends) {
    log('📈 Fetching Google Trends data...');
    tasks.push(fetchGoogleTrends(seedsByService, opts.verbose).then(r => ({ key: 'trends', data: r })));
  } else {
    tasks.push(Promise.resolve({ key: 'trends', data: null }));
  }

  // Google Autocomplete (run after trends due to rate limits)
  if (!opts.noAutocomplete) {
    log('🔍 Fetching Google Autocomplete suggestions...');
    tasks.push(fetchAutocomplete(seedsByService, opts.verbose).then(r => ({ key: 'autocomplete', data: r })));
  } else {
    tasks.push(Promise.resolve({ key: 'autocomplete', data: null }));
  }

  // Wait for the fast sources before starting API-based ones
  // (Trends and Autocomplete can run somewhat in parallel)

  // Google Keyword Planner
  if (!opts.noKwp) {
    log('🔑 Fetching Google Keyword Planner data...');
    tasks.push(fetchKeywordPlanner(seedsByService, opts.verbose).then(r => ({ key: 'kwp', data: r })));
  } else {
    tasks.push(Promise.resolve({ key: 'kwp', data: null }));
  }

  // Google Search Console
  if (!opts.noGsc) {
    log('📊 Fetching Google Search Console data...');
    tasks.push(fetchGSCData(opts.days, opts.verbose).then(r => ({ key: 'gsc', data: r })));
  } else {
    tasks.push(Promise.resolve({ key: 'gsc', data: null }));
  }

  const results = await Promise.all(tasks);
  const data = {};
  for (const r of results) data[r.key] = r.data;

  // Check if we got any data
  const hasSomething = Object.values(data).some(v => v !== null);
  if (!hasSomething) {
    console.log('');
    warn('No data collected from any source.');
    info('Run with --verbose for details, or check your setup:');
    info('  • Google Trends: yarn add google-trends-api');
    info('  • Autocomplete: should work out of the box');
    info('  • Keyword Planner: set GOOGLE_ADS_* env vars');
    info('  • Search Console: set GSC_* env vars');
    info('  See docs/keyword-research-setup.md for full instructions.');
    process.exit(1);
  }

  // Build combined opportunity ranking
  log('🎯 Analyzing and ranking opportunities...');
  const opportunities = buildCombinedOpportunities(
    data.trends, data.autocomplete, data.kwp, data.gsc, seedsByService
  );

  // Print formatted report
  printReport(data.trends, data.autocomplete, data.kwp, data.gsc, opportunities, opts);

  // Save JSON report
  saveReport(data.trends, data.autocomplete, data.kwp, data.gsc, opportunities);
}

main().catch((err) => {
  console.error('');
  console.error(`  ✗ Fatal error: ${err.message}`);
  if (err.stack) console.error(err.stack);
  process.exit(1);
});
