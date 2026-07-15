/**
 * lib/db/schemas.js
 * MongoDB collection names and document shape definitions.
 *
 * These are authoritative JSDoc typedefs - the single source of truth for
 * what every document in the database looks like. All API route handlers
 * and lib modules must construct/read documents according to these shapes.
 *
 * MongoDB does not enforce schemas by default. For input validation use
 * Zod (see lib/validators/ when added) against these shapes before writing.
 */

// ─── Collection names ────────────────────────────────────────────────────────

export const COLLECTIONS = {
  USERS:           'users',
  ORGANIZATIONS:   'organizations',
  API_KEYS:        'api_keys',
  AUDIT_LOGS:      'audit_logs',
  COMPANIES:       'companies',
  // Web Scanner Collections
  SECURITY_SCANS:  'security_scans',
  SEO_SCANS:       'seo_scans',
  AEO_SCANS:       'aeo_scans',
  GEO_SCANS:       'geo_scans',
  BRAND_VISIBILITY: 'brand_visibility',
  PERFORMANCE_SCANS: 'performance_scans',
  SCHEDULED_AUDITS: 'scheduled_audits',
  PLAN_LIMITS:      'plan_limits',
  SYSTEM_CONFIG:    'system_config',
}

// ─── Document shapes (JSDoc typedefs) ────────────────────────────────────────

/**
 * @typedef {Object} UserDoc
 * @property {string}  id          - UUID v4
 * @property {string}  email       - Unique
 * @property {string}  name
 * @property {string}  [passwordHash] - bcrypt (omit for OAuth users)
 * @property {string}  [resetTokenHash]    - SHA-256 of an outstanding password-reset token
 * @property {Date}    [resetTokenExpires] - Reset token expiry; cleared once used
 * @property {'owner'|'admin'|'member'|'viewer'} role
 * @property {string}  [orgId]     - Organization the user belongs to
 * @property {'free'|'starter'|'pro'|'agency'|'enterprise'} plan
 * @property {boolean} onboarded
 * @property {string}  [avatar]           - URL
 * @property {string}  [stripeCustomerId] - Stripe customer ID (set after first payment)
 * @property {string}  [dodoCustomerId]   - Dodo Payments customer ID (set from webhook on first payment; used for the billing portal)
 * @property {Date}    [planCycleStart]   - Anchor for the 30-day usage cycle; reset on signup and every upgrade/downgrade
 * @property {{ plan: string, effectiveDate: string, cancelledAt: Date }} [pendingDowngrade] - Scheduled downgrade to free; drives the Plans page banner, cleared by the webhook when it takes effect
 * @property {UserSettings} [settings]    - Notification/security/audit preferences (see below)
 * @property {BrandingConfig} [branding]  - White-label report branding (Agency/Enterprise; see below)
 * @property {boolean} [isDeleted]        - Soft delete flag for archiving accounts
 * @property {Date}    [deletedAt]        - When the user was soft deleted
 * @property {Date}    createdAt
 * @property {Date}    updatedAt
 */

/**
 * White-label PDF report branding. Gated by the `whiteLabel` plan feature
 * (lib/server-plans.js) - only Agency/Enterprise (or whatever Admin → Plans
 * configures) may set these; other plans get the default Igris Radar
 * branding on exported PDFs. Stored separately from UserSettings because
 * `logoDataUri` can be up to ~2MB and shouldn't ride along on every small
 * notification/security preference save.
 * @typedef {Object} BrandingConfig
 * @property {string}  companyName          - Shown in the PDF header/footer instead of "Igris Radar"
 * @property {string}  [logoDataUri]        - Base64 data URI (image/png|jpeg|webp|svg+xml), max ~2MB
 * @property {string}  [footerText]         - Custom footer line (defaults to "Powered by Igris Radar")
 * @property {boolean} hideDefaultBranding  - When true, omit all Igris Radar marks from the PDF
 * @property {Date}    updatedAt
 */

/**
 * @typedef {Object} UserSettings
 * @property {Object}  notifications
 * @property {boolean} notifications.emailAlerts       - Email a summary when a scan completes
 * @property {string}  [notifications.notificationEmail] - Destination address (defaults to account email)
 * @property {boolean} notifications.pushNotifications - Browser notifications on scan completion
 * @property {boolean} notifications.weeklyReport      - Weekly SEO & visibility digest email
 * @property {boolean} notifications.marketingEmails   - Product updates and tips
 * @property {Object}  security
 * @property {boolean} security.loginAlerts            - Email on new sign-ins
 * @property {Object}  audit
 * @property {'gemini'|'openai'|'anthropic'} audit.defaultProvider - AI engine for Deep Analysis
 * @property {'global'|'us'|'uk'|'eu'} audit.targetLocale          - Default search region for audits
 * @property {boolean} audit.enableDeepAnalysis        - Run Deep AI Analysis by default on new scans
 * @property {string}  audit.defaultCompetitor         - Domain pre-filled into the competitor field
 */

/**
 * Admin-managed integration credentials (Settings via /admin). One doc per key.
 * Values are AES-256-GCM encrypted with ENCRYPTION_MASTER_KEY (lib/crypto.js) -
 * never store a raw key. DB values override .env values (lib/systemConfig.js).
 * @typedef {Object} SystemConfigDoc
 * @property {string} id             - UUID v4
 * @property {string} key            - One of MANAGED_KEYS in lib/systemConfig.js (e.g. 'GEMINI_API_KEY')
 * @property {string} valueEncrypted - iv:authTag:ciphertext
 * @property {Date}   updatedAt
 */

/**
 * @typedef {Object} OrganizationDoc
 * @property {string}  id
 * @property {string}  name
 * @property {'free'|'starter'|'pro'|'agency'|'enterprise'} plan
 * @property {string}  ownerId     - User.id of the owner
 * @property {string[]} memberIds  - User.id list
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} ApiKeyDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  orgId
 * @property {string}  keyHash   - SHA-256 of the actual key (never store raw key)
 * @property {string}  name      - Human label
 * @property {'active'|'revoked'} status
 * @property {Date}    [lastUsedAt]
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} CompanyDoc
 * @property {string}  id          - UUID v4
 * @property {string}  userId
 * @property {string}  domain      - The domain of the company
 * @property {string}  name        - Human-readable name
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} AuditLogDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  [orgId]
 * @property {string}  action    - Dot-namespaced: 'content.fingerprint', 'alert.dismiss', etc.
 * @property {Object}  metadata  - Action-specific payload
 * @property {string}  [ip]
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} SecurityScanDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  url
 * @property {number}  score
 * @property {Object[]} findings
 * @property {string}  findings.id
 * @property {string}  findings.category
 * @property {'critical'|'high'|'medium'|'low'} findings.severity
 * @property {string}  findings.title
 * @property {string}  findings.description
 * @property {boolean} findings.passed
 * @property {string}  [findings.remediation]
 * @property {string}  [findings.aiFixPrompt]
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} SeoScanDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  url
 * @property {number}  score
 * @property {Object}  categories
 * @property {Object[]} findings
 * @property {string}  findings.id
 * @property {string}  findings.category
 * @property {'critical'|'high'|'medium'|'low'|'passed'} findings.severity
 * @property {string}  findings.title
 * @property {string}  findings.description
 * @property {boolean} findings.passed
 * @property {string}  [findings.remediation]
 * @property {string}  [findings.aiFixPrompt]
 * @property {string}  [competitorUrl]
 * @property {number}  [competitorScore]
 * @property {Object}  [competitorCategories]
 * @property {Object}  [deepAnalysis]
 * @property {Object}  [crawlData]
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} AeoScanDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  url
 * @property {number}  score
 * @property {Object}  categories
 * @property {Object[]} findings
 * @property {string}  findings.id
 * @property {string}  findings.category
 * @property {'critical'|'high'|'medium'|'low'|'passed'} findings.severity
 * @property {string}  findings.title
 * @property {string}  findings.description
 * @property {boolean} findings.passed
 * @property {string}  [findings.remediation]
 * @property {string}  [findings.aiFixPrompt]
 * @property {string}  [competitorUrl]
 * @property {number}  [competitorScore]
 * @property {Object}  [competitorCategories]
 * @property {Object}  [deepAnalysis]
 * @property {Object}  [crawlData]
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} GeoScanDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  url
 * @property {number}  score
 * @property {Object}  categories
 * @property {Object[]} findings
 * @property {string}  findings.id
 * @property {string}  findings.category
 * @property {'critical'|'high'|'medium'|'low'|'passed'} findings.severity
 * @property {string}  findings.title
 * @property {string}  findings.description
 * @property {boolean} findings.passed
 * @property {string}  [findings.remediation]
 * @property {string}  [findings.aiFixPrompt]
 * @property {string}  [competitorUrl]
 * @property {number}  [competitorScore]
 * @property {Object}  [competitorCategories]
 * @property {Object}  [deepAnalysis]
 * @property {Object}  [crawlData]
 * @property {Object[]} [promptCoverage]
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} BrandVisibilityDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  brandName
 * @property {string}  url
 * @property {string[]} prompts
 * @property {Object}  results
 * @property {number}  score
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} PerformanceScanDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  url
 * @property {Object}  coreWebVitals
 * @property {number}  accessibilityScore
 * @property {Object[]} issues
 * @property {Date}    createdAt
 */

/**
 * @typedef {Object} ScheduledAuditDoc
 * @property {string}  id
 * @property {string}  userId
 * @property {string}  url
 * @property {'seo'|'aeo'} scanType
 * @property {'daily'|'weekly'|'monthly'} frequency
 * @property {number}  alertThreshold
 * @property {boolean} enabled
 * @property {Date}    [lastRunAt]
 * @property {Date}    createdAt
 */
