import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { getNextPlan } from '@/lib/plans';
import { PLANS, PLAN_LIMITS as DEFAULT_PLAN_LIMITS } from '@/lib/constants';

// ─── Core Plan Lookups ────────────────────────────────────────────────────────

/**
 * Returns the limits object for a given plan from the database.
 * Falls back to DEFAULT_PLAN_LIMITS if DB is uninitialized.
 *
 * @param {string} plan
 * @returns {Promise<typeof DEFAULT_PLAN_LIMITS[keyof typeof DEFAULT_PLAN_LIMITS]>}
 */
export async function getPlanLimits(plan) {
  const col = await getCollection(COLLECTIONS.PLAN_LIMITS);
  let dbPlan = await col.findOne({ id: plan });
  
  const defaults = DEFAULT_PLAN_LIMITS[plan] ?? DEFAULT_PLAN_LIMITS[PLANS.FREE];
  
  if (!dbPlan) {
    // Seed default if missing
    dbPlan = { id: plan, ...defaults };
    if (!dbPlan.price) {
      const defaultPrices = { free: '$0', starter: '$49 /mo', pro: '$149 /mo', agency: '$399 /mo', enterprise: 'Custom' };
      dbPlan.price = defaultPrices[plan];
    }
    await col.updateOne({ id: plan }, { $set: dbPlan }, { upsert: true });
  } else {
    // Backfill only keys that are MISSING from the stored plan (e.g. a newly
    // added feature flag). Do NOT overwrite existing values — the DB is the
    // source of truth so Admin panel edits persist. (Previously this reset
    // every field back to the constants default on every read, silently
    // reverting admin changes so they never appeared in the UI.)
    let needsUpdate = false;
    for (const key of Object.keys(defaults)) {
      if (dbPlan[key] === undefined) {
        dbPlan[key] = defaults[key];
        needsUpdate = true;
      }
    }
    if (needsUpdate) {
      const { _id, ...updateData } = dbPlan;
      await col.updateOne({ id: plan }, { $set: updateData });
    }
  }
  
  return dbPlan ?? defaults;
}

// ─── Feature access enforcement ───────────────────────────────────────────────

/**
 * Checks whether the user's plan includes a specific feature.
 *
 * @param {string} plan
 * @param {'deepAnalysis'|'competitorScan'|'monitoring'|'whiteLabel'|'apiAccess'} feature
 * @returns {Promise<boolean>}
 */
export async function canAccessFeature(plan, feature) {
  const limits = await getPlanLimits(plan);
  const value = limits[feature];
  return !!value;
}

/**
 * Throws a 403 error if the user's plan doesn't include the feature.
 *
 * @param {string} plan
 * @param {'deepAnalysis'|'competitorScan'|'monitoring'|'whiteLabel'|'apiAccess'} feature
 * @throws {{ status: 403, message: string, upgradeRequired: true, currentPlan: string }}
 */
export async function assertFeatureAccess(plan, feature) {
  const hasAccess = await canAccessFeature(plan, feature);
  if (!hasAccess) {
    const nextPlan = getNextPlan(plan);
    const labels = {
      deepAnalysis:   'AI deep analysis',
      competitorScan: 'competitor comparison scans',
      monitoring:     'automated monitoring',
      whiteLabel:     'white-label PDF reports',
      apiAccess:      'API access',
    };
    const err = new Error(
      `${labels[feature] ?? feature} is not available on the ${plan} plan. ` +
      `Upgrade to ${nextPlan} to unlock this feature.`
    );
    err.status = 403;
    err.upgradeRequired = true;
    err.currentPlan = plan;
    err.nextPlan = nextPlan;
    err.feature = feature;
    throw err;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns the start-of-current-calendar-month as a Date.
 */
function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

// ─── Scan limit enforcement ───────────────────────────────────────────────────

/**
 * Counts how many scans the user has run this calendar month across all
 * scanner collections.
 *
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function countScansThisMonth(userId) {
  const since = startOfMonth();
  const filter = { userId, createdAt: { $gte: since }, isOnboarding: { $ne: true } };

  const [sec, seo, aeo, geo, brand, perf] = await Promise.all([
    getCollection(COLLECTIONS.SECURITY_SCANS).then(c => c.countDocuments(filter)),
    getCollection(COLLECTIONS.SEO_SCANS).then(c => c.countDocuments(filter)),
    getCollection(COLLECTIONS.AEO_SCANS).then(c => c.countDocuments(filter)),
    getCollection(COLLECTIONS.GEO_SCANS).then(c => c.countDocuments(filter)),
    getCollection(COLLECTIONS.BRAND_VISIBILITY).then(c => c.countDocuments(filter)),
    getCollection(COLLECTIONS.PERFORMANCE_SCANS).then(c => c.countDocuments(filter)),
  ]);

  return sec + seo + aeo + geo + brand + perf;
}

/**
 * Checks whether the user is within their monthly scan allowance.
 *
 * @param {string} userId
 * @param {string} plan
 * @returns {Promise<{ allowed: boolean, used: number, limit: number }>}
 */
export async function checkScanLimit(userId, plan) {
  const limits = await getPlanLimits(plan);
  const limit = limits.scansPerMonth;

  if (limit === Infinity || limit === null) return { allowed: true, used: 0, limit: Infinity };

  const used = await countScansThisMonth(userId);
  return { allowed: used < limit, used, limit };
}

/**
 * Throws a 429 error if the user has exceeded their monthly scan limit.
 * Call this at the start of every scan POST handler for authenticated users.
 *
 * @param {string} userId
 * @param {string} plan
 * @throws {{ status: 429, message: string, upgradeRequired: true, currentPlan: string }}
 */
export async function assertScanLimit(userId, plan) {
  const { allowed, used, limit } = await checkScanLimit(userId, plan);
  if (!allowed) {
    const nextPlan = getNextPlan(plan);
    const err = new Error(
      `Monthly scan limit reached (${used}/${limit} scans used). ` +
      `Upgrade to ${nextPlan} to continue scanning.`
    );
    err.status = 429;
    err.upgradeRequired = true;
    err.currentPlan = plan;
    err.nextPlan = nextPlan;
    throw err;
  }
}

/**
 * Throws a 403 error if the user has reached their tracked sites limit and is trying
 * to scan a new un-tracked domain.
 * Call this at the start of every scan POST handler for authenticated users.
 *
 * @param {string} userId
 * @param {string} plan
 * @param {string} urlToScan
 * @throws {{ status: 403, message: string, upgradeRequired: true, currentPlan: string }}
 */
export async function assertSiteTrackingLimit(userId, plan, urlToScan) {
  const limits = await getPlanLimits(plan);
  if (limits.sites === Infinity || limits.sites === null) return;

  let domain;
  try {
    domain = new URL(urlToScan.startsWith('http') ? urlToScan : `https://${urlToScan}`).hostname;
  } catch {
    domain = urlToScan;
  }
  domain = domain.replace(/^www\./, '').toLowerCase();

  const companiesCol = await getCollection(COLLECTIONS.COMPANIES);
  const existingCompany = await companiesCol.findOne({ userId, domain });

  if (!existingCompany) {
    const siteCount = await companiesCol.countDocuments({ userId });
    if (limits.sites !== Infinity && limits.sites !== null && siteCount >= limits.sites) {
      const nextPlan = getNextPlan(plan);
      const err = new Error(
        `Your ${plan} plan tracks up to ${limits.sites} site${limits.sites === 1 ? '' : 's'}. ` +
        `You cannot scan a new domain. Upgrade to ${nextPlan} to add more.`
      );
      err.status = 403;
      err.upgradeRequired = true;
      err.currentPlan = plan;
      err.nextPlan = nextPlan;
      err.upgradeReason = 'sites';
      throw err;
    }
    
    // Auto-register the new domain to Companies Hub
    const { v4: uuidv4 } = await import('uuid');
    const newCompany = {
      id: uuidv4(),
      userId,
      domain,
      name: domain,
      createdAt: new Date()
    };
    await companiesCol.insertOne(newCompany);
  }
}
