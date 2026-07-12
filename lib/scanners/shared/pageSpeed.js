import { getKey } from '@/lib/systemConfig';

/**
 * Shared Google PageSpeed Insights fetcher.
 *
 * Both the Performance Scanner and the SEO Scanner (Core Web Vitals check)
 * consume this single module so the PSI request + Core Web Vitals parsing
 * logic lives in exactly one place (DRY).
 *
 * @param {string} url
 * @returns {Promise<{ ok: boolean, score: number, coreWebVitals: object, error?: string }>}
 */
export async function fetchPageSpeed(url) {
  const empty = {
    lcp: { value: 'N/A', raw: null, status: 'poor' },
    inp: { value: 'N/A', raw: null, status: 'poor' },
    cls: { value: 'N/A', raw: null, status: 'poor' },
    fcp: { value: 'N/A', raw: null, status: 'poor' },
  };

  try {
    const apiKey = await getKey('PAGESPEED_API_KEY');
    if (!apiKey) {
      return { ok: false, score: 0, coreWebVitals: empty, error: 'PAGESPEED_API_KEY is not configured.' };
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&key=${apiKey}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 45000);
    let response;
    try {
      response = await fetch(apiUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!response.ok) {
      return { ok: false, score: 0, coreWebVitals: empty, error: `PageSpeed API failed: ${response.status}` };
    }

    const data = await response.json();
    const metrics = data.lighthouseResult.audits.metrics.details.items[0];
    const score = Math.round(data.lighthouseResult.categories.performance.score * 100);

    const formatMs = (ms) => Math.round(ms) + 'ms';
    const formatS = (ms) => (ms / 1000).toFixed(1) + 's';

    const lcpValue = metrics.largestContentfulPaint || 0;
    const lcpStatus = lcpValue <= 2500 ? 'good' : lcpValue <= 4000 ? 'needs-improvement' : 'poor';

    // INP is a field metric; Lighthouse lab runs can't produce it directly.
    // Prefer real Chrome UX Report field data, else fall back to Total Blocking
    // Time (Google's documented lab proxy for INP).
    const fieldInp = data.loadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile
      ?? data.originLoadingExperience?.metrics?.INTERACTION_TO_NEXT_PAINT?.percentile;
    const inpValue = fieldInp ?? metrics.totalBlockingTime ?? 0;
    const inpStatus = inpValue <= 200 ? 'good' : inpValue <= 500 ? 'needs-improvement' : 'poor';

    const clsValue = metrics.cumulativeLayoutShift || 0;
    const clsStatus = clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor';

    const fcpValue = metrics.firstContentfulPaint || 0;
    const fcpStatus = fcpValue <= 1800 ? 'good' : fcpValue <= 3000 ? 'needs-improvement' : 'poor';

    const coreWebVitals = {
      lcp: { value: formatS(lcpValue), raw: lcpValue, status: lcpStatus },
      inp: { value: formatMs(inpValue), raw: inpValue, status: inpStatus },
      cls: { value: clsValue.toFixed(2), raw: clsValue, status: clsStatus },
      fcp: { value: formatS(fcpValue), raw: fcpValue, status: fcpStatus },
    };

    return { ok: true, score, coreWebVitals };
  } catch (error) {
    return { ok: false, score: 0, coreWebVitals: empty, error: error.message };
  }
}
