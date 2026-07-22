import { fetchWithCheerio } from './fetcher';
import gplay from 'google-play-scraper';

/**
 * Normalizes an App Store or Play Store URL and extracts platform & ID.
 * @param {string} url
 * @returns {{ platform: 'ios'|'android', appId: string, normalizedUrl: string }}
 */
export function parseAppUrl(url) {
  const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
  
  if (parsed.hostname.includes('apple.com')) {
    // e.g., https://apps.apple.com/us/app/notion/id1232780281
    const match = parsed.pathname.match(/\/id(\d+)/);
    if (!match) throw new Error('Invalid App Store URL. Must contain /id[numbers]');
    return { platform: 'ios', appId: match[1], normalizedUrl: url };
  }
  
  if (parsed.hostname.includes('play.google.com')) {
    // e.g., https://play.google.com/store/apps/details?id=com.spotify.music
    const appId = parsed.searchParams.get('id');
    if (!appId) throw new Error('Invalid Google Play URL. Must contain ?id=...');
    return { platform: 'android', appId, normalizedUrl: url };
  }
  
  throw new Error('Unsupported URL. Please provide an App Store or Google Play URL.');
}

/**
 * Extracts data for an iOS app using the iTunes Lookup API and HTML scrape.
 */
export async function extractIos(appId, url) {
  // 1. iTunes Lookup API (Exact data)
  const lookupRes = await fetch(`https://itunes.apple.com/lookup?id=${appId}&country=us`);
  if (!lookupRes.ok) throw new Error('Failed to fetch from iTunes API');
  const lookupData = await lookupRes.json();
  
  if (lookupData.resultCount === 0) {
    throw new Error('App not found in the US App Store');
  }
  
  const app = lookupData.results[0];
  
  // 2. HTML Scrape (for data missing from API, like some hreflang links)
  let html = '';
  let $ = null;
  let hreflangs = [];
  try {
    const fetchRes = await fetchWithCheerio(url);
    html = fetchRes.html;
    $ = fetchRes.$;
    $('link[rel="alternate"][hreflang]').each((_, el) => {
      hreflangs.push($(el).attr('hreflang'));
    });
  } catch (e) {
    console.warn('Failed to fetch App Store HTML for secondary checks', e);
  }

  return {
    platform: 'ios',
    appId,
    title: app.trackName || '',
    subtitle: app.subtitle || '', // Note: sometimes available, sometimes not in API
    description: app.description || '',
    developer: app.sellerName || '',
    category: app.primaryGenreName || '',
    contentRating: app.contentAdvisoryRating || '',
    // Prefer the App Store's embedded structured flag; fall back to the on-page
    // "In-App Purchases" label. (Dropped the lowercase "in-app-purchases" variant,
    // which false-matched CSS classes and URL slugs rather than real IAP data.)
    hasIAP: /"hasInAppPurchases"\s*:\s*true/i.test(html) || /In-App Purchases/.test(html),
    isUniversal: app.features?.includes('iosUniversal') || false,
    lastUpdated: app.currentVersionReleaseDate || app.releaseDate,
    rating: app.averageUserRating || 0,
    ratingCount: app.userRatingCount || 0,
    // Ratings on the CURRENT version — a genuine "recent activity" signal from the
    // iTunes API (replaces the old html.includes(year) heuristic in the scanner).
    ratingCountCurrentVersion: app.userRatingCountForCurrentVersion || 0,
    recentReviewCount: null, // iOS uses ratingCountCurrentVersion for recency instead
    screenshots: app.screenshotUrls || [],
    hasVideo: false, // iTunes API doesn't cleanly expose video presence sometimes, default false unless HTML says otherwise
    locales: app.languageCodesISO2A || hreflangs || [],
    iconUrl: app.artworkUrl512 || '',
    price: app.price || 0,
    raw: app,
    html
  };
}

/**
 * Extracts data for an Android app using google-play-scraper.
 */
export async function extractAndroid(appId, url) {
  let app;
  try {
    app = await gplay.app({ appId });
  } catch (e) {
    throw new Error(`Failed to fetch from Google Play: ${e.message}`);
  }

  // HTML scrape for hreflangs/structured data
  let html = '';
  let $ = null;
  let hreflangs = [];
  try {
    const fetchRes = await fetchWithCheerio(url);
    html = fetchRes.html;
    $ = fetchRes.$;
    $('link[rel="alternate"][hreflang]').each((_, el) => {
      hreflangs.push($(el).attr('hreflang'));
    });
  } catch (e) {
    console.warn('Failed to fetch Play Store HTML for secondary checks', e);
  }

  return {
    platform: 'android',
    appId,
    title: app.title || '',
    subtitle: app.summary || '',
    description: app.description || '',
    developer: app.developer || '',
    category: app.genreId || app.genre || '',
    contentRating: app.contentRating || '',
    hasIAP: app.offersIAP || false,
    lastUpdated: app.updated ? new Date(app.updated).toISOString() : null,
    rating: app.score || 0,
    ratingCount: app.ratings || 0,
    ratingCountCurrentVersion: null, // not exposed by the Play scraper
    // Sample of recent review snippets the Play scraper returns — a real "recent
    // activity" signal (replaces the old html.includes(year) heuristic).
    recentReviewCount: Array.isArray(app.comments) ? app.comments.length : 0,
    screenshots: app.screenshots || [],
    hasVideo: !!app.video,
    locales: hreflangs || [],
    iconUrl: app.icon || '',
    hasFeatureGraphic: !!app.headerImage,
    minInstalls: app.minInstalls || 0,
    raw: app,
    html
  };
}

/**
 * Approximate Keyword Rank check.
 */
export async function getKeywordRank(platform, term, appId) {
  try {
    if (platform === 'ios') {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=200`);
      const data = await res.json();
      const index = data.results.findIndex(r => r.trackId.toString() === appId.toString());
      return index >= 0 ? index + 1 : null;
    } else {
      const results = await gplay.search({ term, num: 100 });
      const index = results.findIndex(r => r.appId === appId);
      return index >= 0 ? index + 1 : null;
    }
  } catch (e) {
    console.warn(`Failed to get keyword rank for ${term}`, e);
    return null;
  }
}

/**
 * Approximate Category / Similar Competitors.
 */
export async function getCategoryCompetitors(platform, categoryId, appId, primaryTerm) {
  try {
    if (platform === 'android') {
      // First try to get similar apps directly for this app (much more accurate than broad category)
      try {
        const similar = await gplay.similar({ appId });
        if (similar && similar.length > 0) {
          return similar.slice(0, 10).map(r => ({ name: r.title, appId: r.appId }));
        }
      } catch (e) {
        console.warn('Similar apps failed, falling back to category', e.message);
      }
      // Fallback to broad category if similar fails
      const cat = gplay.category[categoryId?.toUpperCase()] || gplay.category.APPLICATION;
      const results = await gplay.list({ category: cat, collection: gplay.collection.TOP_FREE, num: 10 });
      return results.map(r => ({ name: r.title, appId: r.appId })).filter(r => r.appId !== appId);
    } else {
      // For iOS, search the primary keyword to find direct competitors
      const term = primaryTerm || categoryId;
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=software&limit=15`);
      const data = await res.json();
      return data.results
        .filter(r => r.trackId.toString() !== appId.toString())
        .slice(0, 10)
        .map(r => ({ name: r.trackName, appId: r.trackId }));
    }
  } catch (e) {
    console.warn(`Failed to get competitors`, e);
    return [];
  }
}
