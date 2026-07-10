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
    // added feature flag). Do NOT overwrite existing values - the DB is the
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

// ─── Billing cycle (30-day rolling, anchored to plan start) ───────────────────

// Every plan - free included - uses a fixed 30-day cycle rather than the
// calendar month. The window is anchored to `planCycleStart` on the user
// (set at signup and reset on every upgrade/downgrade), so a user who upgrades
// mid-month gets a full 30 days before their scan count rolls over.
const CYCLE_DAYS = 30;
const CYCLE_MS = CYCLE_DAYS * 24 * 60 * 60 * 1000;

/**
 * Given an anchor date, return the current 30-day window [start, end) that
 * contains `at`. The anchor rolls forward in whole 30-day steps.
 * @param {Date} anchor
 * @param {Date} [at]
 * @returns {{ start: Date, end: Date }}
 */
export function cycleBounds(anchor, at = new Date()) {
  const a = anchor.getTime();
  const elapsed = at.getTime() - a;
  const cycles = elapsed > 0 ? Math.floor(elapsed / CYCLE_MS) : 0;
  const start = new Date(a + cycles * CYCLE_MS);
  return { start, end: new Date(start.getTime() + CYCLE_MS) };
}

/**
 * Resolve the current billing/usage window for a user from their stored
 * `planCycleStart` (falls back to account creation, then now).
 * @param {string} userId
 * @returns {Promise<{ start: Date, end: Date }>}
 */
export async function getScanCycle(userId) {
  const usersCol = await getCollection(COLLECTIONS.USERS);
  const user = await usersCol.findOne({ id: userId }, { projection: { planCycleStart: 1, createdAt: 1 } });
  const anchor = new Date(user?.planCycleStart || user?.createdAt || Date.now());
  return cycleBounds(anchor);
}

// ─── Scan limit enforcement ───────────────────────────────────────────────────

/**
 * Counts scans a user has run since a given window start, across all scanners.
 * @param {string} userId
 * @param {Date} since
 * @returns {Promise<number>}
 */
export async function countScansSince(userId, since) {
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
 * Counts how many scans the user has run in their current 30-day cycle.
 * @param {string} userId
 * @returns {Promise<number>}
 */
export async function countScansThisCycle(userId) {
  const { start } = await getScanCycle(userId);
  return countScansSince(userId, start);
}

/**
 * Checks whether the user is within their scan allowance for the current cycle.
 *
 * @param {string} userId
 * @param {string} plan
 * @returns {Promise<{ allowed: boolean, used: number, limit: number }>}
 */
export async function checkScanLimit(userId, plan) {
  const limits = await getPlanLimits(plan);
  const limit = limits.scansPerMonth;

  if (limit === Infinity || limit === null) return { allowed: true, used: 0, limit: Infinity };

  const used = await countScansThisCycle(userId);
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
