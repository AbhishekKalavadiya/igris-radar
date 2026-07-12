import { fetchPageSpeed } from '@/lib/scanners/shared/pageSpeed';

/**
 * Live implementation of the Performance Scanner using Google PageSpeed Insights.
 * The PSI request + Core Web Vitals parsing live in the shared pageSpeed module
 * so the SEO scanner's Core Web Vitals check reuses the exact same logic (DRY).
 */
export async function runPerformanceScan(url) {
  const result = await fetchPageSpeed(url);

  if (!result.ok) {
    console.error('[Performance Scanner] Error:', result.error);
  }

  return {
    score: result.score,
    coreWebVitals: result.coreWebVitals,
    timestamp: new Date().toISOString(),
  };
}
