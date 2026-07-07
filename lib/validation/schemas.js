/**
 * lib/validation/schemas.js
 * Zod input schemas for API endpoints (SECURITY_CHECKLIST H4, M5).
 *
 * Every state-changing endpoint should validate its body through one of these
 * before touching the database, giving a uniform, injection-resistant boundary.
 */

import { z } from 'zod'

// ─── Primitives ──────────────────────────────────────────────────────────────

const email = z.string().trim().toLowerCase().email('A valid email is required').max(254)

/**
 * Password complexity policy (M5): min 8, at least one lowercase, one
 * uppercase, one digit, and one symbol.
 */
const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(200, 'Password is too long')
  .regex(/[a-z]/, 'Password must include a lowercase letter')
  .regex(/[A-Z]/, 'Password must include an uppercase letter')
  .regex(/[0-9]/, 'Password must include a number')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character')

// A URL-ish string. SSRF/scheme validation happens separately in lib/security/ssrf.js.
const urlString = z.string().trim().min(1, 'URL is required').max(2048)

const shortText = (label, max = 200) =>
  z.string().trim().min(1, `${label} is required`).max(max)

// ─── Auth ────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  email,
  password: strongPassword,
  name: z.string().trim().max(120).optional(),
})

export const loginSchema = z.object({
  email,
  // Login only checks the value against the stored hash — don't enforce the
  // new complexity policy here or legacy accounts could never log in.
  password: z.string().min(1, 'Password is required').max(200),
})

// ─── Contact form (public, unauthenticated) ───────────────────────────────────

export const contactSchema = z.object({
  firstName: z.string().trim().max(80).optional().default(''),
  lastName:  z.string().trim().max(80).optional().default(''),
  email,
  message:   z.string().trim().min(1, 'Message is required').max(5000),
})

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(120),
  email,
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required').max(200),
  newPassword: strongPassword,
})

export const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required').max(200),
})

// ─── Branding (white-label PDF reports) ──────────────────────────────────────

// Data-URI images only; SVG included since logos are commonly vector.
// ~2MB base64 ceiling keeps the user document well under MongoDB's 16MB cap.
const logoDataUri = z
  .string()
  .regex(/^data:image\/(png|jpeg|jpg|webp|svg\+xml);base64,/, 'Logo must be a PNG, JPEG, WEBP or SVG image')
  .max(2_800_000, 'Logo is too large (max ~2MB)')

export const brandingSchema = z.object({
  companyName: z.string().trim().max(120).optional(),
  logoDataUri: z.union([logoDataUri, z.literal('')]).optional(),
  footerText: z.string().trim().max(200).optional(),
  hideDefaultBranding: z.boolean().optional(),
})

// ─── Settings ────────────────────────────────────────────────────────────────

export const settingsSchema = z.object({
  notifications: z.object({
    emailAlerts:       z.boolean(),
    notificationEmail: z.union([email, z.literal('')]).optional(),
    pushNotifications: z.boolean(),
    weeklyReport:      z.boolean(),
    marketingEmails:   z.boolean(),
  }),
  security: z.object({
    loginAlerts: z.boolean(),
  }),
  audit: z.object({
    defaultProvider:    z.enum(['gemini', 'openai', 'anthropic']),
    targetLocale:       z.enum(['global', 'us', 'uk', 'eu']),
    enableDeepAnalysis: z.boolean(),
    defaultCompetitor:  z.string().trim().max(253),
  }),
})

// ─── Admin: managed API keys ─────────────────────────────────────────────────

// Values are raw API keys (or '' to clear the stored key). The key-name
// whitelist itself is enforced against MANAGED_KEYS in lib/systemConfig.js.
export const adminKeysSchema = z.object({
  keys: z.record(z.string().trim().max(500)),
})

// ─── Scans ───────────────────────────────────────────────────────────────────

export const scanSchema = z.object({
  url: urlString,
  competitorUrl: urlString.optional().nullable(),
  deepAnalysis: z.boolean().optional(),
  crawl: z.boolean().optional(),
  promptTopic: z.string().trim().max(300).optional(),
  isOnboarding: z.boolean().optional(),
})

export const brandVisibilitySchema = z.object({
  brandName: shortText('Brand name', 200),
  url: urlString,
  prompts: z.array(z.string().trim().min(1).max(500)).min(1, 'At least one prompt is required').max(50),
  providers: z.array(z.string().trim().max(40)).max(10).optional(),
})

// ─── Companies ───────────────────────────────────────────────────────────────

export const companySchema = z.object({
  domain: shortText('Domain', 253),
  name: z.string().trim().max(200).optional(),
})

// ─── Plans / API keys ────────────────────────────────────────────────────────

export const updatePlanSchema = z.object({
  plan: z.enum(['free', 'starter', 'pro', 'agency', 'enterprise']),
})

export const apiKeySchema = z.object({
  name: shortText('Name', 120),
})

export const scheduledAuditSchema = z.object({
  url: urlString,
  scanType: z.string().trim().min(1).max(40),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  alertThreshold: z.number().int().min(0).max(100).optional(),
})

// ─── Helper ──────────────────────────────────────────────────────────────────

/**
 * Parses `data` against `schema`, throwing a 400-tagged Error (matching the
 * route's error envelope) with the first validation message on failure.
 *
 * @template T
 * @param {import('zod').ZodType<T>} schema
 * @param {unknown} data
 * @returns {T}
 */
export function parseOrThrow(schema, data) {
  const result = schema.safeParse(data)
  if (!result.success) {
    const first = result.error.issues[0]
    const err = new Error(first?.message || 'Invalid input')
    err.status = 400
    throw err
  }
  return result.data
}
