/**
 * lib/env.js
 * Centralised environment variable access with validation.
 *
 * Usage:
 *   import { env } from '@/lib/env'
 *   const key = env.geminiApiKey
 *
 * Never read process.env directly in feature code - always go through this module.
 */

const REQUIRED = ['MONGO_URL']

const DEFAULTS = {
  DB_NAME:         'provenance',
  CORS_ORIGINS:    'https://igrisradar.com',
  SESSION_SECRET:  'provenance-dev-secret-CHANGE-IN-PRODUCTION',
  NODE_ENV:        'development',
}

function validateEnv() {
  if (typeof window !== 'undefined') return  // skip on client

  if (!process.env.MONGO_URL) {
    const msg = `[Igris Radar] Missing required environment variables: MONGO_URL\nCopy .env.example → .env.local and fill in the values.`
    if (process.env.NODE_ENV === 'production') {
      console.error(msg)
      // We log instead of throw here so the Edge Middleware doesn't completely crash the site
    } else {
      console.warn(msg)
    }
  }

  // SESSION_SECRET strength enforcement (SECURITY_CHECKLIST H5).
  // The secret keys HMAC session/admin signatures - a weak value lets an
  // attacker brute-force forgeries. Enforce presence + length in production.
  const secret = process.env.SESSION_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULTS.SESSION_SECRET) {
      console.error('[Igris Radar] SESSION_SECRET must be set to a strong random value in production.')
    } else if (secret.length < 32) {
      console.error('[Igris Radar] SESSION_SECRET must be at least 32 characters in production.')
    } else if (new Set(secret).size < 8) {
      console.error('[Igris Radar] SESSION_SECRET has too little entropy - use a random 32+ char string (e.g. `openssl rand -base64 48`).')
    }
  } else if (secret && secret.length < 32) {
    console.warn('[Igris Radar] SESSION_SECRET is shorter than 32 chars - fine for dev, but generate a strong value before production.')
  }

  // Dodo Payments env/key mismatch detection (SECURITY_CHECKLIST billing).
  // A live-mode key with the SDK pointed at test_mode (or vice-versa) causes
  // every checkout to fail with an opaque error. Catch the most common case:
  // a live-looking API key while DODO_ENV was never set to 'live_mode'.
  const dodoKey = process.env.DODO_PAYMENTS_API_KEY
  const dodoLive = process.env.DODO_ENV === 'live_mode'
  if (dodoKey && /live/i.test(dodoKey) && !dodoLive) {
    console.error('[Igris Radar] DODO_PAYMENTS_API_KEY looks like a LIVE key but DODO_ENV is not "live_mode" - checkout will hit the test API and fail. Set DODO_ENV=live_mode.')
  } else if (dodoKey && /test/i.test(dodoKey) && dodoLive) {
    console.error('[Igris Radar] DODO_PAYMENTS_API_KEY looks like a TEST key but DODO_ENV=live_mode - checkout will hit the live API and fail.')
  }
}

validateEnv()

export const env = {
  // Database
  mongoUrl:    process.env.MONGO_URL || '',
  dbName:      process.env.DB_NAME   || DEFAULTS.DB_NAME,

  // API Keys
  pagespeedApiKey:       process.env.PAGESPEED_API_KEY               || null,
  geminiApiKey:          process.env.GEMINI_API_KEY                  || null,
  zaiApiKey:             process.env.Z_AI_API_KEY                    || null,
  openaiApiKey:          process.env.OPENAI_API_KEY                  || null,
  anthropicApiKey:       process.env.ANTHROPIC_API_KEY               || null,
  perplexityApiKey:      process.env.PERPLEXITY_API_KEY              || null,

  // Server
  corsOrigins:   process.env.CORS_ORIGINS   || DEFAULTS.CORS_ORIGINS,
  sessionSecret: process.env.SESSION_SECRET || DEFAULTS.SESSION_SECRET,

  // Admin panel credentials (SECURITY_CHECKLIST C2). No hardcoded fallback -
  // when these are unset the admin login endpoint is disabled entirely.
  //
  adminUsername:     process.env.ADMIN_USERNAME || null,
  adminPassword:     process.env.ADMIN_PASSWORD || null,
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH 
                     ? process.env.ADMIN_PASSWORD_HASH 
                     : process.env.ADMIN_PASSWORD_HASH_B64 
                        ? Buffer.from(process.env.ADMIN_PASSWORD_HASH_B64, 'base64').toString('utf8') 
                        : null,

  // Shared secret for the scheduled-audit cron endpoint.
  cronSecret: process.env.CRON_SECRET || null,

  // Stripe billing - when set, real checkout is live and the fake
  // test-mode upgrade endpoint disables itself.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || null,

  // Dodo Payments billing.
  // dodoEnv MUST be the exact string 'live_mode' to hit Dodo's live API;
  // anything else (unset, 'live', typo, trailing space) falls back to test.
  // Keep test_mode locally and set DODO_ENV=live_mode in production (Vercel).
  dodoApiKey:     process.env.DODO_PAYMENTS_API_KEY     || null,
  dodoWebhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || null,
  dodoEnv:        process.env.DODO_ENV === 'live_mode' ? 'live_mode' : 'test_mode',
  dodoProducts: {
    starter:      process.env.NEXT_PUBLIC_DODO_PRODUCT_STARTER       || null,
    pro:          process.env.NEXT_PUBLIC_DODO_PRODUCT_PRO            || null,
    // One-time payment product for unlocking a landing-page scan report ($2)
    unlockReport: process.env.DODO_PRODUCT_UNLOCK_REPORT              || null,
  },

  // Email delivery - either SMTP (nodemailer) or Resend REST API.
  // When neither is configured, emails are logged to the console (dev fallback).
  smtpHost:     process.env.SMTP_HOST     || null,
  smtpPort:     process.env.SMTP_PORT     ? Number(process.env.SMTP_PORT) : 587,
  smtpUser:     process.env.SMTP_USER     || null,
  smtpPass:     process.env.SMTP_PASS     || null,
  resendApiKey: process.env.RESEND_API_KEY || null,
  emailFrom:    process.env.EMAIL_FROM    || 'Igris Radar <support@igrisecurity.com>',

  // Public site origin - used for canonical URLs, sitemap, robots and JSON-LD.
  // NEXT_PUBLIC_ so it is also available in client bundles.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://igrisradar.com',

  // Scanner fetch identity + firewall bypass.
  // SCANNER_USER_AGENT: the UA the scanners send when fetching a target site.
  // SCANNER_BYPASS_TOKEN: a shared secret sent as the `x-igris-scan-key` header
  //   so you can add a Vercel/Cloudflare firewall rule that bypasses the bot
  //   challenge for our own scanner without exposing the site to real bots.
  scannerUserAgent:  process.env.SCANNER_USER_AGENT  || 'Mozilla/5.0 (compatible; IgrisRadarBot/1.0; +https://igrisradar.com/bot)',
  scannerBypassToken: process.env.SCANNER_BYPASS_TOKEN || null,

  // Helpers
  isDev:  process.env.NODE_ENV !== 'production',
  isProd: process.env.NODE_ENV === 'production',
}

/**
 * Feature flags - gates expensive or optional integrations.
 * Returns false instead of throwing when API keys are absent.
 */
export const features = {
  // Add new feature flags here as needed
  aiDeepAnalysis: !!process.env.GEMINI_API_KEY,
  llmTracking: !!process.env.OPENAI_API_KEY, // Minimal requirement for tracking
  // Real email delivery is active when SMTP or Resend credentials exist;
  // otherwise the mailer falls back to console logging.
  email: !!((process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) || process.env.RESEND_API_KEY),
}
