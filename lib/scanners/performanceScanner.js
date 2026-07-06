import { getKey } from '@/lib/systemConfig';

/**
 * Live implementation of the Performance Scanner using Google PageSpeed Insights API.
 */
export async function runPerformanceScan(url) {
  try {
    const apiKey = await getKey('PAGESPEED_API_KEY');
    if (!apiKey) {
      throw new Error('Google PageSpeed API Key is missing. Please configure PAGESPEED_API_KEY.');
    }

    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&key=${apiKey}`;
    
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
    const metrics = data.lighthouseResult.audits.metrics.details.items[0];
    const score = Math.round(data.lighthouseResult.categories.performance.score * 100);

    const formatMs = (ms) => Math.round(ms) + 'ms';
    const formatS = (ms) => (ms / 1000).toFixed(1) + 's';

    // Extracting actual metrics (with fallback for some that might be missing in lab data)
    const lcpValue = metrics.largestContentfulPaint || 0;
    const lcpStatus = lcpValue <= 2500 ? 'good' : lcpValue <= 4000 ? 'needs-improvement' : 'poor';

    const inpValue = metrics.interactive || 0; // Fallback to interactive time as INP isn't always directly in lab data
    const inpStatus = inpValue <= 200 ? 'good' : inpValue <= 500 ? 'needs-improvement' : 'poor';

    const clsValue = metrics.cumulativeLayoutShift || 0;
    const clsStatus = clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor';

    const fcpValue = metrics.firstContentfulPaint || 0;
    const fcpStatus = fcpValue <= 1800 ? 'good' : fcpValue <= 3000 ? 'needs-improvement' : 'poor';

    const coreWebVitals = {
      lcp: { value: formatS(lcpValue), status: lcpStatus },
      inp: { value: formatMs(inpValue), status: inpStatus },
      cls: { value: clsValue.toFixed(2), status: clsStatus },
      fcp: { value: formatS(fcpValue), status: fcpStatus },
    };

    return {
      score,
      coreWebVitals,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Performance Scanner] Error:', error);
    return {
      score: 0,
      coreWebVitals: {
        lcp: { value: 'N/A', status: 'poor' },
        inp: { value: 'N/A', status: 'poor' },
        cls: { value: 'N/A', status: 'poor' },
        fcp: { value: 'N/A', status: 'poor' },
      },
      timestamp: new Date().toISOString()
    };
  }
}
