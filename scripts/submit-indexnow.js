const INDEXNOW_KEY = '647d391cf7c14d1c86b286002a52e47d';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://igrisradar.com';

/** Extracts <loc>...</loc> URLs out of a sitemap XML string. */
function extractSitemapUrls(xml) {
  const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
  return Array.from(matches, (m) => m[1].trim()).filter(Boolean);
}

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('[indexnow] Skipping submission - VERCEL_ENV is not "production".');
    return;
  }

  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  const res = await fetch(sitemapUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${sitemapUrl}: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const urlList = extractSitemapUrls(xml);

  if (urlList.length === 0) {
    throw new Error(`No <loc> URLs found in ${sitemapUrl}`);
  }

  const host = new URL(SITE_URL).host;
  const keyLocation = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

  const submitRes = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation, urlList }),
  });

  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => '');
    throw new Error(`IndexNow submission failed: ${submitRes.status} ${submitRes.statusText} ${body}`);
  }

  console.log(`[indexnow] Submitted ${urlList.length} URLs successfully.`);
}

main().catch((error) => {
  console.error('[indexnow] Submission failed (non-fatal, build continues):', error.message);
});
