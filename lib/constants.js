/**
 * lib/constants.js
 * App-wide constants - single source of truth for routes, roles, enums, limits.
 */

// ─── Routes ──────────────────────────────────────────────────────────────────

export const ROUTES = {
  HOME:          '/',
  LANDING:       '/landing',
  LOGIN:         '/login',
  SIGNUP:        '/signup',
  ONBOARDING:    '/onboarding',
  DASHBOARD:     '/dashboard',
  SETTINGS:      '/settings',
  // Web Scanner Routes
  SECURITY_SCAN: '/security-scan',
  SEO_AUDIT:     '/seo-audit',
  AEO_AUDIT:     '/aeo-audit',
  GEO_AUDIT:     '/geo-audit',
  SITE_HEALTH:   '/site-health',
  UPTIME:        '/uptime',
  DOMAIN_HEALTH: '/domain-health',
  BRAND_VISIBILITY: '/brand-visibility',
  COMPANIES:     '/companies',
  PLANS:         '/plans',
}

/** Routes that require an active session */
export const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD,
  ROUTES.SETTINGS,
  ROUTES.ONBOARDING,
  ROUTES.SECURITY_SCAN,
  ROUTES.SEO_AUDIT,
  ROUTES.AEO_AUDIT,
  ROUTES.GEO_AUDIT,
  ROUTES.SITE_HEALTH,
  ROUTES.UPTIME,
  ROUTES.DOMAIN_HEALTH,
  ROUTES.BRAND_VISIBILITY,
  ROUTES.COMPANIES,
  ROUTES.PLANS,
]

/** Routes that redirect to dashboard when already authenticated */
export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.SIGNUP,
]

// ─── Session ─────────────────────────────────────────────────────────────────

export const SESSION_COOKIE  = 'provenance_session'
export const SESSION_MAX_AGE = 4 * 60 * 60 // 4 hours (seconds)

// ─── RBAC ─────────────────────────────────────────────────────────────────────

export const ROLES = {
  OWNER:  'owner',
  ADMIN:  'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
}

/** Which roles can perform which actions */
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]:  ['read', 'write', 'delete', 'manage', 'billing'],
  [ROLES.ADMIN]:  ['read', 'write', 'delete', 'manage'],
  [ROLES.MEMBER]: ['read', 'write'],
  [ROLES.VIEWER]: ['read'],
}

// ─── Plans ───────────────────────────────────────────────────────────────────

export const PLANS = {
  FREE:       'free',
  STARTER:    'starter',
  PRO:        'pro',
  AGENCY:     'agency',
  ENTERPRISE: 'enterprise',
}

/**
 * Plans that exist in the pricing/limits model but are not yet sold —
 * self-service upgrade (dev fake-upgrade, Stripe checkout) is blocked for
 * these. Kept as a single list so every entry point (API routes, billing UI,
 * upgrade prompts) enforces the same set consistently.
 */
export const UNAVAILABLE_PLANS = [PLANS.ENTERPRISE]

/** @param {string} plan @returns {boolean} */
export function isPlanAvailable(plan) {
  return !UNAVAILABLE_PLANS.includes(plan)
}

/**
 * Hard limits enforced server-side per plan.
 * scansPerMonth: total scans across all scanner types combined this calendar month.
 * sites: max unique domains the user can scan (enforced via distinct url count).
 * monitoring: whether scheduled/automated monitoring is available.
 * deepAnalysis: whether Gemini AI deep analysis is available.
 * competitorScan: whether running a competitor comparison scan is allowed.
 * whiteLabel: whether white-label PDF exports are available.
 * apiAccess: whether API key creation is allowed.
 */
export const PLAN_LIMITS = {
  [PLANS.FREE]: {
    scansPerMonth:    10,
    sites:            2,
    teamMembers:      Infinity,
    monitoring:       false,
    deepAnalysis:     false,
    competitorScan:   false,
    whiteLabel:       false,
    apiAccess:        false,
  },
  [PLANS.STARTER]: {
    scansPerMonth:    25,
    sites:            5,
    teamMembers:      Infinity,
    monitoring:       false,
    deepAnalysis:     false,
    competitorScan:   false,
    whiteLabel:       false,
    apiAccess:        false,
  },
  [PLANS.PRO]: {
    scansPerMonth:    100,
    sites:            10,
    teamMembers:      Infinity,
    monitoring:       'weekly',
    deepAnalysis:     true,
    competitorScan:   true,
    whiteLabel:       false,
    apiAccess:        false,
  },
  [PLANS.AGENCY]: {
    scansPerMonth:    Infinity,
    sites:            Infinity,
    teamMembers:      Infinity,
    monitoring:       'daily',
    deepAnalysis:     true,
    competitorScan:   true,
    whiteLabel:       true,
    apiAccess:        true,
  },
  [PLANS.ENTERPRISE]: {
    scansPerMonth:    Infinity,
    sites:            Infinity,
    teamMembers:      Infinity,
    monitoring:       'daily',
    deepAnalysis:     true,
    competitorScan:   true,
    whiteLabel:       true,
    apiAccess:        true,
  },
}

// ─── API path keys ────────────────────────────────────────────────────────────

export const API_PATHS = {
  // Auth
  AUTH_LOGIN:  'auth/login',
  AUTH_LOGOUT: 'auth/logout',
  AUTH_ME:     'auth/me',
  // Utility
  HEALTH: 'health',
  SEED:   'seed-mock-data',
  // Web Scanner
  SECURITY_SCAN:   'security-scan',
  SEO_SCAN:        'seo-scan',
  AEO_SCAN:        'aeo-scan',
  PERFORMANCE_SCAN:'performance-scan',
  DASHBOARD_STATS: 'dashboard-stats',
}
