import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';

const SCAN_COLLECTIONS = [
  { key: 'security', label: 'Security Scan', col: COLLECTIONS.SECURITY_SCANS },
  { key: 'seo',      label: 'SEO Audit',     col: COLLECTIONS.SEO_SCANS },
  { key: 'aeo',      label: 'AEO Audit',     col: COLLECTIONS.AEO_SCANS },
  { key: 'geo',      label: 'GEO Audit',     col: COLLECTIONS.GEO_SCANS },
  { key: 'aso',      label: 'ASO Audit',     col: COLLECTIONS.ASO_SCANS },
  { key: 'health',   label: 'Site Health',   col: COLLECTIONS.PERFORMANCE_SCANS },
  { key: 'brand',    label: 'Brand Visibility', col: COLLECTIONS.BRAND_VISIBILITY },
];

/**
 * Aggregates scan analytics specifically highlighting:
 * 1. Landing page scanner usage & top scanners used by anonymous visitors.
 * 2. Top scanned websites and recent scan activity feed.
 */
export async function getScannedWebsitesData() {
  const usersCol = await getCollection(COLLECTIONS.USERS);
  const usersList = await usersCol.find({}, { projection: { id: 1, email: 1, name: 1 } }).toArray();
  const userMap = new Map(usersList.map(u => [u.id, u]));

  const allScans = [];
  const landingCounts = { security: 0, seo: 0, aeo: 0, geo: 0, aso: 0, health: 0, brand: 0 };
  const userCounts    = { security: 0, seo: 0, aeo: 0, geo: 0, aso: 0, health: 0, brand: 0 };

  for (const { key, label, col: colName } of SCAN_COLLECTIONS) {
    try {
      const col = await getCollection(colName);
      const docs = await col.find({}).sort({ createdAt: -1 }).limit(300).toArray();

      for (const doc of docs) {
        const isLanding = doc.userId === 'anonymous' || !doc.userId;
        if (isLanding) {
          landingCounts[key] = (landingCounts[key] || 0) + 1;
        } else {
          userCounts[key] = (userCounts[key] || 0) + 1;
        }

        let rawUrl = doc.url || doc.domain || doc.appName || doc.brandName || 'N/A';
        let hostname = rawUrl;
        try {
          if (rawUrl.startsWith('http')) {
            hostname = new URL(rawUrl).hostname.replace(/^www\./, '');
          }
        } catch (e) {}

        const userInfo = doc.userId && doc.userId !== 'anonymous' ? userMap.get(doc.userId) : null;

        allScans.push({
          id: doc.id || String(doc._id),
          type: key,
          typeLabel: label,
          url: rawUrl,
          domain: hostname,
          score: doc.score ?? null,
          isLandingPage: isLanding,
          userId: doc.userId || 'anonymous',
          userEmail: userInfo ? userInfo.email : null,
          userName: userInfo ? userInfo.name : null,
          createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`[getScannedWebsitesData] Error querying collection ${colName}:`, err.message);
    }
  }

  // Sort all scans by createdAt descending
  allScans.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  // Aggregate top websites / domains
  const domainMap = new Map();
  for (const scan of allScans) {
    const dom = scan.domain.toLowerCase();
    if (!domainMap.has(dom)) {
      domainMap.set(dom, {
        domain: dom,
        sampleUrl: scan.url,
        totalScans: 0,
        landingScans: 0,
        userScans: 0,
        totalScore: 0,
        scoreCount: 0,
        lastScanned: scan.createdAt,
        types: new Set(),
      });
    }
    const entry = domainMap.get(dom);
    entry.totalScans += 1;
    if (scan.isLandingPage) entry.landingScans += 1;
    else entry.userScans += 1;

    if (scan.score !== null && scan.score !== undefined) {
      entry.totalScore += scan.score;
      entry.scoreCount += 1;
    }
    entry.types.add(scan.typeLabel);
  }

  const topWebsites = Array.from(domainMap.values()).map(e => ({
    domain: e.domain,
    sampleUrl: e.sampleUrl,
    totalScans: e.totalScans,
    landingScans: e.landingScans,
    userScans: e.userScans,
    avgScore: e.scoreCount > 0 ? Math.round(e.totalScore / e.scoreCount) : null,
    lastScanned: e.lastScanned,
    scannerTypes: Array.from(e.types),
  })).sort((a, b) => b.totalScans - a.totalScans);

  // Total landing scans count & total logged-in scans count
  const totalLandingScans = Object.values(landingCounts).reduce((a, b) => a + b, 0);
  const totalUserScans = Object.values(userCounts).reduce((a, b) => a + b, 0);

  // Find most used scanner on landing page
  let mostUsedLandingScanner = null;
  let maxLandingCount = -1;
  for (const [key, count] of Object.entries(landingCounts)) {
    if (count > maxLandingCount) {
      maxLandingCount = count;
      mostUsedLandingScanner = key;
    }
  }

  return {
    summary: {
      totalScans: allScans.length,
      totalLandingScans,
      totalUserScans,
      uniqueWebsitesCount: domainMap.size,
      mostUsedLandingScanner,
      landingCounts,
      userCounts,
    },
    topWebsites: topWebsites.slice(0, 100),
    recentScans: allScans.slice(0, 150),
  };
}
