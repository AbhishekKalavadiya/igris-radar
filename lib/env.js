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
  // The secret keys HMAC session/admin signatures — a weak value lets an
  // attacker brute-force forgeries. Enforce presence + length in production.
  const secret = process.env.SESSION_SECRET
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULTS.SESSION_SECRET) {
      console.error('[Igris Radar] SESSION_SECRET must be set to a strong random value in production.')
    } else if (secret.length < 32) {
      console.error('[Igris Radar] SESSION_SECRET must be at least 32 characters in production.')
    } else if (new Set(secret).size < 8) {
      console.error('[Igris Radar] SESSION_SECRET has too little entropy — use a random 32+ char string (e.g. `openssl rand -base64 48`).')
    }
  } else if (secret && secret.length < 32) {
    console.warn('[Igris Radar] SESSION_SECRET is shorter than 32 chars — fine for dev, but generate a strong value before production.')
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
  openaiApiKey:          process.env.OPENAI_API_KEY                  || null,
  anthropicApiKey:       process.env.ANTHROPIC_API_KEY               || null,
  perplexityApiKey:      process.env.PERPLEXITY_API_KEY              || null,

  // Server
  corsOrigins:   process.env.CORS_ORIGINS   || DEFAULTS.CORS_ORIGINS,
  sessionSecret: process.env.SESSION_SECRET || DEFAULTS.SESSION_SECRET,

  // Admin panel credentials (SECURITY_CHECKLIST C2). No hardcoded fallback —
  // when these are unset the admin login endpoint is disabled entirely.
  //
  // The bcrypt hash contains `$` characters, which dotenv-expand (used by
  // @next/env when reading .env.local) mangles as variable references. To stay
  // robust, prefer ADMIN_PASSWORD_HASH_B64 (base64 of the bcrypt hash — no `$`),
  // falling back to a raw ADMIN_PASSWORD_HASH for platforms whose env store
  // doesn't expand `$` (e.g. the Vercel dashboard).
  adminUsername:     process.env.ADMIN_USERNAME || null,
  adminPasswordHash: (() => {
    const b64 = process.env.ADMIN_PASSWORD_HASH_B64
    if (b64) {
      try { return atob(b64) } catch { return null }
    }
    return process.env.ADMIN_PASSWORD_HASH || null
  })(),

  // Shared secret for the scheduled-audit cron endpoint.
  cronSecret: process.env.CRON_SECRET || null,

  // Stripe billing — when set, real checkout is live and the fake
  // test-mode upgrade endpoint disables itself.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || null,

  // Email delivery — either SMTP (nodemailer) or Resend REST API.
  // When neither is configured, emails are logged to the console (dev fallback).
  smtpHost:     process.env.SMTP_HOST     || null,
  smtpPort:     process.env.SMTP_PORT     ? Number(process.env.SMTP_PORT) : 587,
  smtpUser:     process.env.SMTP_USER     || null,
  smtpPass:     process.env.SMTP_PASS     || null,
  resendApiKey: process.env.RESEND_API_KEY || null,
  emailFrom:    process.env.EMAIL_FROM    || 'Igris Radar <support@igrisecurity.com>',

  // Public site origin — used for canonical URLs, sitemap, robots and JSON-LD.
  // NEXT_PUBLIC_ so it is also available in client bundles.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://igrisradar.com',

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
