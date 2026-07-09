import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getDb, getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { v4 as uuidv4 } from 'uuid';
import { 
  buildSessionCookie, 
  clearSessionCookie, 
  encodeSession, 
  decodeSession
} from '@/lib/auth/session';
import { 
  verifyPassword, 
  hashPassword 
} from '@/lib/auth/password';
import { SESSION_COOKIE, isPlanAvailable } from '@/lib/constants';
import { assertFeatureAccess, canAccessFeature, getPlanLimits, assertScanLimit, countScansThisMonth, assertSiteTrackingLimit } from '@/lib/server-plans';
import { env } from '@/lib/env';
import { audit, AUDIT_ACTIONS, clientIp } from '@/lib/audit';
import { checkLoginAllowed, recordFailedLogin, recordSuccessfulLogin } from '@/lib/security/loginThrottle';
import { isRateLimited } from '@/lib/rateLimit';
import { assertSafeUrl } from '@/lib/security/ssrf';
import { safeContainsFilter } from '@/lib/security/regex';
import { signToken, verifyToken } from '@/lib/auth/tokenSigner';
import {
  signupSchema,
  loginSchema,
  contactSchema,
  scanSchema,
  brandVisibilitySchema,
  companySchema,
  updatePlanSchema,
  apiKeySchema,
  scheduledAuditSchema,
  settingsSchema,
  updateProfileSchema,
  changePasswordSchema,
  deleteAccountSchema,
  adminKeysSchema,
  brandingSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  parseOrThrow,
} from '@/lib/validation/schemas';
import { getUserSettings, mergeSettings } from '@/lib/settings';
import { getUserBranding, resolveReportBranding } from '@/lib/branding';
import { notifyScanComplete } from '@/lib/notifications';
import { sendEmail, getEmailTransport } from '@/lib/email/mailer';
import { loginAlertEmail, passwordChangedEmail, passwordResetEmail, newUserSignupEmail, contactFormEmail } from '@/lib/email/templates';
import { getKeyStatuses, setKeys, getKeys } from '@/lib/systemConfig';
import { getAvailableAiProviders, hasAnyAiProvider, testAiProvider } from '@/lib/scanners/shared/aiAnalyzer';
import { startMonitoring } from '@/lib/monitoring';
import { filterFindingsByPlan } from '@/lib/scanners/shared/findings';

// Boots the built-in monitoring loop (scheduled audits + weekly digest) on
// the first API request. Node runtime only; guarded against double-starts.
startMonitoring();

const ADMIN_COOKIE = 'provenance_admin';

/**
 * Verifies the signed admin session cookie (SECURITY_CHECKLIST C2).
 * @param {Request} request
 * @returns {boolean}
 */
function isAdminRequest(request) {
  const token = request.cookies.get(ADMIN_COOKIE)?.value;
  const payload = verifyToken(token);
  return payload?.admin === true;
}

/**
 * CSRF guard for state-changing requests (moved here from middleware.js,
 * which was removed — Vercel's Edge runtime crashed on Node globals).
 * Browsers always send an Origin header on cross-origin POST/PUT/DELETE;
 * same-origin or origin-less (curl, server-to-server) requests pass.
 * @param {Request} request
 * @returns {NextResponse|null} 403 response if blocked, null if allowed
 */
function rejectCrossOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return null;
  const self = new URL(request.url).origin;
  if (origin === self) return null;
  
  const allowed = env.corsOrigins.split(',').map(o => o.trim()).filter(Boolean);
  
  // Always allow loopback variations if we are serving on a loopback interface
  const host = new URL(request.url).hostname;
  const isLoopbackHost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  if (isLoopbackHost || !env.isProd) {
    allowed.push('http://127.0.0.1:4100', 'http://localhost:4100', 'http://127.0.0.1:3000', 'http://localhost:3000');
  }

  if (allowed.includes(origin)) return null;
  return NextResponse.json({ success: false, error: 'Cross-origin request blocked' }, { status: 403 });
}

function getSessionUser(request) {
  const cookie = request.cookies.get(SESSION_COOKIE);
  if (!cookie) return null;
  return decodeSession(cookie.value);
}

/**
 * Hashes a raw password-reset token for DB storage/lookup. The raw token is
 * only ever sent in the emailed link — the DB holds just the SHA-256 hash,
 * so a database read alone can never yield a usable token (SECURITY_CHECKLIST C1).
 * @param {string} rawToken
 * @returns {string}
 */
function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Resolves the user's Audit Preferences (Settings → Audit) into the options
 * consumed by Deep Analysis. Anonymous users get empty defaults.
 * @param {{id: string}|null} sessionUser
 * @returns {Promise<{provider?: string, locale?: string}>}
 */
async function getAuditPrefs(sessionUser) {
  if (!sessionUser) return {};
  try {
    const info = await getUserSettings(sessionUser.id);
    if (!info) return {};
    return { provider: info.settings.audit.defaultProvider, locale: info.settings.audit.targetLocale };
  } catch {
    return {};
  }
}


export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const pathParts = path.split('/').filter(Boolean);

  try {
    // Health check
    if (pathParts[0] === 'health') {
      const db = await getDb();
      await db.command({ ping: 1 });
      return NextResponse.json({ status: 'healthy', db: 'connected' });
    }

    // Get current user session
    if (pathParts[0] === 'auth' && pathParts[1] === 'me') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) {
        // If a cookie was present but failed verification (tampered, expired,
        // or an old pre-signing-upgrade token), clear it so the browser stops
        // sending it — otherwise middleware keeps treating the user as
        // "logged in" and bounces them into a blank redirect loop.
        const response = NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
        if (request.cookies.get(SESSION_COOKIE)) {
          response.headers.set('Set-Cookie', clearSessionCookie());
        }
        return response;
      }
      const col = await getCollection(COLLECTIONS.USERS);
      const user = await col.findOne({ id: sessionUser.id }, { projection: { passwordHash: 0, resetTokenHash: 0, resetTokenExpires: 0 } });
      if (!user) {
        const response = NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
        response.headers.set('Set-Cookie', clearSessionCookie());
        return response;
      }
      // Auto-refresh the session cookie to keep JWT payload in sync with DB
      const token = encodeSession(user);
      const response = NextResponse.json({ success: true, data: user });
      response.headers.set('Set-Cookie', buildSessionCookie(token));
      return response;
    }

    // User settings (Settings page)
    if (pathParts[0] === 'settings') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const col = await getCollection(COLLECTIONS.USERS);
      const user = await col.findOne({ id: sessionUser.id }, { projection: { settings: 1, email: 1, name: 1 } });
      if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

      return NextResponse.json({
        success: true,
        data: {
          settings: mergeSettings(user.settings),
          profile: { name: user.name, email: user.email },
          // Lets the UI show whether real email delivery is active and which
          // AI providers can actually serve Deep Analysis (admin keys + .env).
          emailTransport: await getEmailTransport(),
          aiProviders: await getAvailableAiProviders(),
        },
      });
    }

    // LLM provider availability (booleans only) — drives "Coming soon" labels
    // in Brand Visibility and Audit Preferences. Reflects admin keys + .env.
    if (pathParts[0] === 'ai-providers') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const keys = await getKeys(['GEMINI_API_KEY', 'OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'PERPLEXITY_API_KEY']);
      return NextResponse.json({
        success: true,
        data: {
          gemini: !!keys.GEMINI_API_KEY,
          openai: !!keys.OPENAI_API_KEY,
          anthropic: !!keys.ANTHROPIC_API_KEY,
          perplexity: !!keys.PERPLEXITY_API_KEY,
        },
      });
    }

    // White-label branding config (Settings → Branding)
    if (pathParts[0] === 'branding') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const branding = await getUserBranding(sessionUser.id);
      const hasAccess = await canAccessFeature(sessionUser.plan || 'free', 'whiteLabel');

      return NextResponse.json({ success: true, data: { branding, hasAccess } });
    }

    // Branded PDF export for a persisted scan (Export Report → Save as PDF)
    if (pathParts[0] === 'export' && pathParts[1] === 'pdf') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const scanType = searchParams.get('scanType');
      const scanId = searchParams.get('scanId');
      const collectionByType = {
        security: COLLECTIONS.SECURITY_SCANS,
        seo: COLLECTIONS.SEO_SCANS,
        aeo: COLLECTIONS.AEO_SCANS,
        geo: COLLECTIONS.GEO_SCANS,
      };
      if (!scanId || !collectionByType[scanType]) {
        return NextResponse.json({ success: false, error: 'Invalid scanType or missing scanId' }, { status: 400 });
      }

      const scansCol = await getCollection(collectionByType[scanType]);
      const scan = await scansCol.findOne({ id: scanId, userId: sessionUser.id });
      if (!scan) return NextResponse.json({ success: false, error: 'Scan not found' }, { status: 404 });

      const hasWhiteLabel = await canAccessFeature(sessionUser.plan || 'free', 'whiteLabel');
      const branding = await resolveReportBranding(sessionUser.id, hasWhiteLabel);

      const { renderScanReportPdf } = await import('@/lib/reports/pdfReport');
      const pdfBuffer = await renderScanReportPdf({ scan, scanType, branding });

      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="igris-radar-${scanType}-${scan.id.slice(0, 8)}.pdf"`,
        },
      });
    }

    // Weekly SEO & visibility digest — cron-triggered, CRON_SECRET protected
    // (same auth pattern as cron/run-scheduled-audits).
    if (pathParts[0] === 'cron' && pathParts[1] === 'send-weekly-digest') {
      if (env.cronSecret) {
        const authHeader = request.headers.get('authorization') || '';
        const provided = authHeader.replace(/^Bearer\s+/i, '') || searchParams.get('secret') || '';
        if (provided !== env.cronSecret) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
      } else if (env.isProd) {
        return NextResponse.json({ success: false, error: 'Cron endpoint is not configured' }, { status: 503 });
      }

      const { sendWeeklyDigests } = await import('@/lib/notifications');
      const result = await sendWeeklyDigests();
      return NextResponse.json({ success: true, data: { ...result, transport: await getEmailTransport() } });
    }

    // Alerts list
    if (pathParts[0] === 'alerts') {
      // Mock alerts for the notification bell
      const mockAlerts = [
        { id: 1, message: 'Welcome to Igris Radar Security. Start by running a scan on your primary domain.', severity: 'info', read: false, timestamp: 'Just now' },
        { id: 2, message: 'Your weekly security posture report is ready.', severity: 'medium', read: true, timestamp: '1 day ago' }
      ];
      return NextResponse.json({ success: true, data: mockAlerts });
    }

    // Security scans list
    if (pathParts[0] === 'security-scan') {
      const sessionUser = getSessionUser(request);
      const userPlan = sessionUser?.plan || 'free';
      const filter = sessionUser ? { userId: sessionUser.id } : { userId: 'anonymous' };
      const col = await getCollection(COLLECTIONS.SECURITY_SCANS);
      const scans = await col.find(filter).sort({ createdAt: -1 }).limit(20).toArray();
      // Apply plan-gated visibility: strip locked finding details
      const gatedScans = scans.map(s => ({
        ...s,
        findings: filterFindingsByPlan(s.findings || [], userPlan),
      }));
      return NextResponse.json({ success: true, data: gatedScans });
    }

    // SEO scans list / history
    if (pathParts[0] === 'seo-scan') {
      const isHistory = pathParts[1] === 'history';
      const targetUrl = searchParams.get('url');
      const sessionUser = getSessionUser(request);
      
      const filter = sessionUser ? { userId: sessionUser.id } : { userId: 'anonymous' };
      if (isHistory && targetUrl) {
        filter.url = targetUrl;
      }
      
      const col = await getCollection(COLLECTIONS.SEO_SCANS);
      const scans = await col.find(filter).sort({ createdAt: -1 }).limit(20).toArray();
      return NextResponse.json({ success: true, data: scans });
    }

    // AEO scans list / history
    if (pathParts[0] === 'aeo-scan') {
      const isHistory = pathParts[1] === 'history';
      const targetUrl = searchParams.get('url');
      const sessionUser = getSessionUser(request);
      
      const filter = sessionUser ? { userId: sessionUser.id } : { userId: 'anonymous' };
      if (isHistory && targetUrl) {
        filter.url = targetUrl;
      }
      
      const col = await getCollection(COLLECTIONS.AEO_SCANS);
      const scans = await col.find(filter).sort({ createdAt: -1 }).limit(20).toArray();
      return NextResponse.json({ success: true, data: scans });
    }

    // GEO scans list / history
    if (pathParts[0] === 'geo-scan') {
      const isHistory = pathParts[1] === 'history';
      const targetUrl = searchParams.get('url');
      const sessionUser = getSessionUser(request);
      
      const filter = sessionUser ? { userId: sessionUser.id } : { userId: 'anonymous' };
      if (isHistory && targetUrl) {
        filter.url = targetUrl;
      }
      
      const col = await getCollection(COLLECTIONS.GEO_SCANS);
      const scans = await col.find(filter).sort({ createdAt: -1 }).limit(20).toArray();
      return NextResponse.json({ success: true, data: scans });
    }

    // Brand Visibility list / history
    if (pathParts[0] === 'brand-visibility') {
      const sessionUser = getSessionUser(request);
      const filter = sessionUser ? { userId: sessionUser.id } : { userId: 'anonymous' };
      
      const col = await getCollection(COLLECTIONS.BRAND_VISIBILITY);
      const trackingRuns = await col.find(filter).sort({ createdAt: -1 }).limit(20).toArray();
      return NextResponse.json({ success: true, data: trackingRuns });
    }

    // Performance scans list
    if (pathParts[0] === 'performance-scan') {
      const sessionUser = getSessionUser(request);
      const filter = sessionUser ? { userId: sessionUser.id } : { userId: 'anonymous' };
      const col = await getCollection(COLLECTIONS.PERFORMANCE_SCANS);
      const scans = await col.find(filter).sort({ createdAt: -1 }).limit(20).toArray();
      return NextResponse.json({ success: true, data: scans });
    }

    // Dashboard stats (includes usage data for authenticated users to save a round trip)
    if (pathParts[0] === 'stats') {
      const sessionUser = getSessionUser(request);
      const userFilter = sessionUser ? { userId: sessionUser.id } : { userId: 'anonymous' };

      const secCol = await getCollection(COLLECTIONS.SECURITY_SCANS);
      const seoCol = await getCollection(COLLECTIONS.SEO_SCANS);
      const aeoCol = await getCollection(COLLECTIONS.AEO_SCANS);
      const perfCol = await getCollection(COLLECTIONS.PERFORMANCE_SCANS);

      const [secCount, seoCount, aeoCount, perfCount, recentSecScans, recentAeoScans, recentSeoScans] = await Promise.all([
        secCol.countDocuments(userFilter),
        seoCol.countDocuments(userFilter),
        aeoCol.countDocuments(userFilter),
        perfCol.countDocuments(userFilter),
        secCol.find(userFilter).sort({ createdAt: -1 }).limit(5).toArray(),
        aeoCol.find(userFilter).sort({ createdAt: -1 }).limit(5).toArray(),
        seoCol.find(userFilter).sort({ createdAt: -1 }).limit(5).toArray(),
      ]);

      const totalScans = secCount + seoCount + aeoCount + perfCount;

      let avgSecurityScore = 0;
      if (recentSecScans.length > 0) {
        avgSecurityScore = Math.round(recentSecScans.reduce((acc, s) => acc + s.score, 0) / recentSecScans.length);
      }

      let avgAeoScore = 0;
      if (recentAeoScans.length > 0) {
        avgAeoScore = Math.round(recentAeoScans.reduce((acc, s) => acc + s.score, 0) / recentAeoScans.length);
      }

      // Include plan usage inline so the dashboard only needs one fetch
      let usage = null;
      if (sessionUser) {
        const plan = sessionUser.plan || 'free';
        const limits = await getPlanLimits(plan);
        const scansUsed = await countScansThisMonth(sessionUser.id);
        usage = { plan, scansUsed, scansLimit: limits.scansPerMonth, limits };
      }

      return NextResponse.json({
        success: true,
        data: {
          totalScans,
          avgSecurityScore,
          avgAeoScore,
          recentScans: recentSeoScans,
          usage,
        },
      });
    }

    // Current user usage stats
    if (pathParts[0] === 'usage') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) {
        return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      }
      const plan = sessionUser.plan || 'free';
      const limits = await getPlanLimits(plan);
      const scansUsed = await countScansThisMonth(sessionUser.id);
      
      const compCol = await getCollection(COLLECTIONS.COMPANIES);
      const sitesUsed = await compCol.countDocuments({ userId: sessionUser.id });

      return NextResponse.json({
        success: true,
        data: {
          plan,
          scansUsed,
          sitesUsed,
          scansLimit: limits.scansPerMonth,
          limits,
        },
      });
    }

    // API keys list
    if (pathParts[0] === 'api-keys') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      await assertFeatureAccess(sessionUser.plan || 'free', 'apiAccess');

      const col = await getCollection(COLLECTIONS.API_KEYS);
      const keys = await col.find({ userId: sessionUser.id, status: 'active' }).sort({ createdAt: -1 }).toArray();
      // Never return keyHash - return masked key display instead
      const safeKeys = keys.map(k => ({ id: k.id, name: k.name, lastUsedAt: k.lastUsedAt, createdAt: k.createdAt }));
      return NextResponse.json({ success: true, data: safeKeys });
    }

    // Scheduled audits list
    if (pathParts[0] === 'scheduled-audit') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const col = await getCollection(COLLECTIONS.SCHEDULED_AUDITS);
      const audits = await col.find({ userId: sessionUser.id }).sort({ createdAt: -1 }).toArray();
      return NextResponse.json({ success: true, data: audits });
    }

    // Cron execution endpoint — protected by a shared CRON_SECRET so it can't
    // be triggered by arbitrary visitors (SECURITY_CHECKLIST, D1).
    if (pathParts[0] === 'cron' && pathParts[1] === 'run-scheduled-audits') {
      if (env.cronSecret) {
        const authHeader = request.headers.get('authorization') || '';
        const provided = authHeader.replace(/^Bearer\s+/i, '') || searchParams.get('secret') || '';
        if (provided !== env.cronSecret) {
          return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }
      } else if (env.isProd) {
        // Fail closed in production when no secret is configured.
        return NextResponse.json({ success: false, error: 'Cron endpoint is not configured' }, { status: 503 });
      }
      const { processScheduledAudits } = await import('@/lib/scanners/shared/scheduler');
      const result = await processScheduledAudits();
      return NextResponse.json(result);
    }

    // Companies Hub (GET)
    if (pathParts[0] === 'companies') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const col = await getCollection(COLLECTIONS.COMPANIES);
      const url = new URL(request.url);
      const domain = url.searchParams.get('domain');

      // GET /api?path=companies&domain=example.com -> Fetch unified scan history
      if (domain) {
        const [secCol, seoCol, aeoCol, geoCol, brandCol] = await Promise.all([
          getCollection(COLLECTIONS.SECURITY_SCANS),
          getCollection(COLLECTIONS.SEO_SCANS),
          getCollection(COLLECTIONS.AEO_SCANS),
          getCollection(COLLECTIONS.GEO_SCANS),
          getCollection(COLLECTIONS.BRAND_VISIBILITY)
        ]);

        // Escape the user-supplied domain before using it in a $regex query to
        // prevent regex injection and ReDoS (SECURITY_CHECKLIST H3 / C-I2/C-I3).
        const urlFilter = safeContainsFilter(domain);
        const [security, seo, aeo, geo, brand] = await Promise.all([
          secCol.find({ userId: sessionUser.id, url: urlFilter }).sort({ createdAt: -1 }).toArray(),
          seoCol.find({ userId: sessionUser.id, url: urlFilter }).sort({ createdAt: -1 }).toArray(),
          aeoCol.find({ userId: sessionUser.id, url: urlFilter }).sort({ createdAt: -1 }).toArray(),
          geoCol.find({ userId: sessionUser.id, url: urlFilter }).sort({ createdAt: -1 }).toArray(),
          brandCol.find({ userId: sessionUser.id, url: urlFilter }).sort({ createdAt: -1 }).toArray()
        ]);

        return NextResponse.json({
          success: true,
          data: { security, seo, aeo, geo, brand }
        });
      }

      // GET /api?path=companies -> List all companies (auto-aggregate from scans if missing)
      const existingCompanies = await col.find({ userId: sessionUser.id }).sort({ createdAt: -1 }).toArray();
      const existingDomains = new Set(existingCompanies.map(c => c.domain.toLowerCase()));

      try {
        const secCol = await getCollection(COLLECTIONS.SECURITY_SCANS);
        const seoCol = await getCollection(COLLECTIONS.SEO_SCANS);
        const aeoCol = await getCollection(COLLECTIONS.AEO_SCANS);
        const geoCol = await getCollection(COLLECTIONS.GEO_SCANS);

        const [secDomains, seoDomains, aeoDomains, geoDomains] = await Promise.all([
          secCol.distinct('url', { userId: sessionUser.id }),
          seoCol.distinct('url', { userId: sessionUser.id }),
          aeoCol.distinct('url', { userId: sessionUser.id }),
          geoCol.distinct('url', { userId: sessionUser.id })
        ]);

        const allDiscoveredDomains = [...new Set([
          ...secDomains, ...seoDomains, ...aeoDomains, ...geoDomains
        ])].map(url => {
          try {
            return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
          } catch {
            return url;
          }
        });

        const limits = await getPlanLimits(sessionUser.plan || 'free');
        for (const dom of allDiscoveredDomains) {
          const normalized = dom.replace(/^www\./, '').toLowerCase();
          if (!existingDomains.has(normalized)) {
            if (limits.sites !== Infinity && limits.sites !== null) {
              const currentSiteCount = await col.countDocuments({ userId: sessionUser.id });
              if (currentSiteCount >= limits.sites) continue;
            }
            const newCompany = {
              id: uuidv4(),
              userId: sessionUser.id,
              domain: normalized,
              name: normalized,
              createdAt: new Date()
            };
            await col.insertOne(newCompany);
            existingCompanies.unshift(newCompany);
            existingDomains.add(normalized);
          }
        }
      } catch (autoAggErr) {
        console.error('Auto-aggregation failed', autoAggErr);
      }

      return NextResponse.json({ success: true, data: existingCompanies });
    }

    // Admin: managed API key statuses (never returns full values)
    if (pathParts[0] === 'admin' && pathParts[1] === 'system-keys') {
      if (!isAdminRequest(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      const statuses = await getKeyStatuses();
      return NextResponse.json({ success: true, data: statuses });
    }

    // Dynamic Plan Limits
    if (pathParts[0] === 'plan-limits') {
      const { PLANS } = await import('@/lib/constants');
      const { getPlanLimits } = await import('@/lib/server-plans');
      const limits = await Promise.all(Object.values(PLANS).map(async (p) => await getPlanLimits(p)));
      const limitsMap = limits.reduce((acc, l) => ({ ...acc, [l.id]: l }), {});
      return NextResponse.json({ success: true, data: limitsMap });
    }

    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error(`[API GET] ${pathParts.join('/')}:`, error.message);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: error.status || 500 });
  }
}

export async function POST(request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const pathParts = path.split('/').filter(Boolean);

  try {
    // Mark alert as read - alerts are mock data, so acknowledge without persistence
    if (pathParts[0] === 'alerts' && pathParts[2] === 'read') {
      return NextResponse.json({ success: true, data: { id: pathParts[1], read: true } });
    }

    // Persist onboarding completion - gates the one-time onboarding scan bypass
    if (pathParts[0] === 'auth' && pathParts[1] === 'complete-onboarding') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      const usersCol = await getCollection(COLLECTIONS.USERS);
      await usersCol.updateOne(
        { id: sessionUser.id },
        { $set: { onboarded: true, updatedAt: new Date() } }
      );
      return NextResponse.json({ success: true });
    }

    // Save white-label branding config (Settings → Branding; Agency/Enterprise)
    if (pathParts[0] === 'branding') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      await assertFeatureAccess(sessionUser.plan || 'free', 'whiteLabel');

      const updates = parseOrThrow(brandingSchema, await request.json());
      const col = await getCollection(COLLECTIONS.USERS);
      const current = await getUserBranding(sessionUser.id);
      const branding = { ...current, ...updates, updatedAt: new Date() };

      await col.updateOne({ id: sessionUser.id }, { $set: { branding, updatedAt: new Date() } });

      // Never log the logo payload — just that branding changed.
      await audit({ action: AUDIT_ACTIONS.SETTINGS_UPDATE, userId: sessionUser.id, ip: clientIp(request), metadata: { section: 'branding' } });

      return NextResponse.json({ success: true, data: { branding } });
    }

    // Save user settings (Settings page — Notifications / Security / Audit tabs)
    if (pathParts[0] === 'settings') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const settings = parseOrThrow(settingsSchema, await request.json());

      const col = await getCollection(COLLECTIONS.USERS);
      await col.updateOne({ id: sessionUser.id }, { $set: { settings, updatedAt: new Date() } });

      await audit({ action: AUDIT_ACTIONS.SETTINGS_UPDATE, userId: sessionUser.id, ip: clientIp(request) });

      return NextResponse.json({ success: true, data: { settings } });
    }

    // Update profile (name / email)
    if (pathParts[0] === 'auth' && pathParts[1] === 'update-profile') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const { name, email } = parseOrThrow(updateProfileSchema, await request.json());

      const col = await getCollection(COLLECTIONS.USERS);
      const existing = await col.findOne({ email, id: { $ne: sessionUser.id } });
      if (existing) {
        return NextResponse.json({ success: false, error: 'That email is already in use by another account' }, { status: 409 });
      }

      await col.updateOne({ id: sessionUser.id }, { $set: { name, email, updatedAt: new Date() } });
      await audit({ action: AUDIT_ACTIONS.PROFILE_UPDATE, userId: sessionUser.id, ip: clientIp(request), metadata: { email } });

      // Re-issue the session cookie so the JWT payload matches the new email
      const user = await col.findOne({ id: sessionUser.id }, { projection: { passwordHash: 0, resetTokenHash: 0, resetTokenExpires: 0 } });
      const token = encodeSession(user);
      const response = NextResponse.json({ success: true, data: user });
      response.headers.set('Set-Cookie', buildSessionCookie(token));
      return response;
    }

    // Change password (Settings → Security)
    if (pathParts[0] === 'auth' && pathParts[1] === 'change-password') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const { currentPassword, newPassword } = parseOrThrow(changePasswordSchema, await request.json());

      const col = await getCollection(COLLECTIONS.USERS);
      const user = await col.findOne({ id: sessionUser.id });
      if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

      const valid = await verifyPassword(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 401 });
      }

      const passwordHash = await hashPassword(newPassword);
      await col.updateOne({ id: sessionUser.id }, { $set: { passwordHash, updatedAt: new Date() } });

      await audit({ action: AUDIT_ACTIONS.PASSWORD_CHANGE, userId: sessionUser.id, ip: clientIp(request) });

      // Best-effort confirmation email
      const settingsInfo = await getUserSettings(sessionUser.id);
      if (settingsInfo?.email) {
        const mail = passwordChangedEmail({ name: user.name, time: new Date().toUTCString() });
        await sendEmail({ to: settingsInfo.email, ...mail });
      }

      return NextResponse.json({ success: true });
    }

    // Delete account (Settings → Security → Danger Zone)
    if (pathParts[0] === 'auth' && pathParts[1] === 'delete-account') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const { password } = parseOrThrow(deleteAccountSchema, await request.json());

      const usersCol = await getCollection(COLLECTIONS.USERS);
      const user = await usersCol.findOne({ id: sessionUser.id });
      if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        return NextResponse.json({ success: false, error: 'Password is incorrect' }, { status: 401 });
      }

      // Wipe all of the user's data across every collection, then the account.
      // Audit logs are kept (immutable forensic trail — ISO A.8.15).
      const dataCollections = [
        COLLECTIONS.COMPANIES,
        COLLECTIONS.SECURITY_SCANS,
        COLLECTIONS.SEO_SCANS,
        COLLECTIONS.AEO_SCANS,
        COLLECTIONS.GEO_SCANS,
        COLLECTIONS.BRAND_VISIBILITY,
        COLLECTIONS.PERFORMANCE_SCANS,
        COLLECTIONS.SCHEDULED_AUDITS,
        COLLECTIONS.API_KEYS,
      ];
      await Promise.all(
        dataCollections.map(async (name) => {
          const col = await getCollection(name);
          await col.deleteMany({ userId: sessionUser.id });
        })
      );
      await usersCol.deleteOne({ id: sessionUser.id });

      await audit({ action: AUDIT_ACTIONS.ACCOUNT_DELETE, userId: sessionUser.id, ip: clientIp(request), metadata: { email: user.email } });

      const response = NextResponse.json({ success: true });
      response.headers.set('Set-Cookie', clearSessionCookie());
      return response;
    }

    // Request a password reset email (public, unauthenticated)
    if (pathParts[0] === 'auth' && pathParts[1] === 'forgot-password') {
      const ip = clientIp(request);
      if (isRateLimited(ip, 'reset')) {
        return NextResponse.json({ success: false, error: 'Too many requests. Try again later.' }, { status: 429 });
      }

      const { email } = parseOrThrow(forgotPasswordSchema, await request.json());

      const col = await getCollection(COLLECTIONS.USERS);
      const user = await col.findOne({ email });

      // Always respond with the same message whether or not the account
      // exists, so this endpoint can't be used to enumerate registered
      // emails (SECURITY_CHECKLIST A9). Only send an email if it does.
      if (user) {
        const rawToken = crypto.randomBytes(32).toString('hex');
        await col.updateOne(
          { id: user.id },
          { $set: {
              resetTokenHash: hashResetToken(rawToken),
              resetTokenExpires: new Date(Date.now() + 30 * 60 * 1000),
              updatedAt: new Date(),
          } }
        );

        await audit({ action: AUDIT_ACTIONS.PASSWORD_RESET_REQUEST, userId: user.id, ip, metadata: { email } });

        const resetUrl = `${env.siteUrl}/reset-password?token=${rawToken}`;
        const mail = passwordResetEmail({ name: user.name, resetUrl });
        sendEmail({ to: user.email, ...mail }).catch((err) => console.error('[auth/forgot-password] email send failed:', err.message));
      }

      return NextResponse.json({ success: true, data: { message: 'If an account exists for that email, a reset link has been sent.' } });
    }

    // Complete a password reset with a token from the emailed link (public, unauthenticated)
    if (pathParts[0] === 'auth' && pathParts[1] === 'reset-password') {
      const ip = clientIp(request);
      if (isRateLimited(ip, 'reset')) {
        return NextResponse.json({ success: false, error: 'Too many requests. Try again later.' }, { status: 429 });
      }

      const { token, password } = parseOrThrow(resetPasswordSchema, await request.json());

      const col = await getCollection(COLLECTIONS.USERS);
      const user = await col.findOne({
        resetTokenHash: hashResetToken(token),
        resetTokenExpires: { $gt: new Date() },
      });

      if (!user) {
        return NextResponse.json({ success: false, error: 'This reset link is invalid or has expired. Request a new one.' }, { status: 400 });
      }

      const passwordHash = await hashPassword(password);
      await col.updateOne(
        { id: user.id },
        {
          $set: { passwordHash, updatedAt: new Date() },
          $unset: { resetTokenHash: '', resetTokenExpires: '' },
        }
      );

      await audit({ action: AUDIT_ACTIONS.PASSWORD_RESET_COMPLETE, userId: user.id, ip });

      const mail = passwordChangedEmail({ name: user.name, time: new Date().toUTCString() });
      sendEmail({ to: user.email, ...mail }).catch((err) => console.error('[auth/reset-password] email send failed:', err.message));

      return NextResponse.json({ success: true });
    }

    // Signup
    if (pathParts[0] === 'auth' && pathParts[1] === 'signup') {
      const { email, password, name } = parseOrThrow(signupSchema, await request.json());

      const col = await getCollection(COLLECTIONS.USERS);
      const existing = await col.findOne({ email: email.toLowerCase() });
      if (existing) {
        return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 });
      }

      const passwordHash = await hashPassword(password);
      const now = new Date();
      const newUser = {
        id:           uuidv4(),
        email:        email.toLowerCase(),
        name:         name || email.split('@')[0],
        passwordHash,
        role:         'owner',
        plan:         'free',
        onboarded:    false,
        avatar:       null,
        createdAt:    now,
        updatedAt:    now,
      };

      await col.insertOne(newUser);

      await audit({ action: AUDIT_ACTIONS.SIGNUP, userId: newUser.id, ip: clientIp(request), metadata: { email: newUser.email } });

      // Notify support about the new signup
      const alertMail = newUserSignupEmail({ email: newUser.email, name: newUser.name, time: new Date().toUTCString() });
      sendEmail({ to: 'support@igrisecurity.com', ...alertMail }).catch(() => {});

      const token = encodeSession(newUser);
      const { passwordHash: _, resetTokenHash: __, resetTokenExpires: ___, ...safeUser } = newUser;

      const response = NextResponse.json({ success: true, data: safeUser }, { status: 201 });
      response.headers.set('Set-Cookie', buildSessionCookie(token));
      return response;
    }

    // Login
    if (pathParts[0] === 'auth' && pathParts[1] === 'login') {
      // Zod enforces a string email/password, which also neutralises NoSQL
      // operator injection like {"email": {"$gt": ""}} (SECURITY_CHECKLIST C-I1).
      const { email, password } = parseOrThrow(loginSchema, await request.json());
      const ip = clientIp(request);

      // Per-account brute-force lockout (SECURITY_CHECKLIST M1).
      const gate = checkLoginAllowed(email, ip);
      if (gate.locked) {
        await audit({ action: AUDIT_ACTIONS.LOGIN_LOCKED, ip, metadata: { email } });
        return NextResponse.json(
          { success: false, error: 'Too many failed attempts. Try again later.' },
          { status: 429, headers: { 'Retry-After': String(gate.retryAfterSeconds) } }
        );
      }

      const col = await getCollection(COLLECTIONS.USERS);
      const user = await col.findOne({ email });

      const validPassword = user ? await verifyPassword(password, user.passwordHash) : false;

      if (!user || !validPassword) {
        recordFailedLogin(email, ip);
        await audit({ action: AUDIT_ACTIONS.LOGIN_FAILURE, userId: user?.id || null, ip, metadata: { email } });
        // Uniform message — do not reveal whether the email exists (A9).
        return NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 });
      }

      recordSuccessfulLogin(email, ip);
      await audit({ action: AUDIT_ACTIONS.LOGIN_SUCCESS, userId: user.id, ip, metadata: { email } });

      // Login alert email (Settings → Security → Login Alerts). Best-effort.
      const loginSettings = mergeSettings(user.settings);
      if (loginSettings.security.loginAlerts) {
        const to = loginSettings.notifications.notificationEmail || user.email;
        const mail = loginAlertEmail({ name: user.name, ip, time: new Date().toUTCString() });
        sendEmail({ to, ...mail }).catch(() => {});
      }

      const token = encodeSession(user);
      const { passwordHash: _, resetTokenHash: __, resetTokenExpires: ___, ...safeUser } = user;

      const response = NextResponse.json({ success: true, data: safeUser });
      response.headers.set('Set-Cookie', buildSessionCookie(token));
      return response;
    }

    // Contact form (public, unauthenticated) — validated + IP rate-limited so
    // it can't be abused to spam the support inbox.
    if (pathParts[0] === 'contact') {
      const ip = clientIp(request);
      if (isRateLimited(`contact:${ip}`, 'contact')) {
        return NextResponse.json(
          { success: false, error: 'Too many messages. Please try again later.' },
          { status: 429 }
        );
      }

      const { firstName, lastName, email, message } = parseOrThrow(contactSchema, await request.json());

      const mail = contactFormEmail({ firstName, lastName, email, message, time: new Date().toUTCString() });
      await sendEmail({ to: 'support@igrisecurity.com', ...mail, replyTo: email });

      return NextResponse.json({ success: true });
    }

    // Logout
    if (pathParts[0] === 'auth' && pathParts[1] === 'logout') {
      const sessionUser = getSessionUser(request);
      if (sessionUser) {
        await audit({ action: AUDIT_ACTIONS.LOGOUT, userId: sessionUser.id, ip: clientIp(request) });
      }
      const response = NextResponse.json({ success: true });
      response.headers.set('Set-Cookie', clearSessionCookie());
      return response;
    }

    // Fake Upgrade — test-mode billing. Active only while Stripe is NOT
    // configured; once STRIPE_SECRET_KEY is set, plan changes happen only via
    // verified Stripe webhooks, and this endpoint disables itself — otherwise
    // any user could self-upgrade for free (SECURITY_CHECKLIST C4).
    if (pathParts[0] === 'auth' && pathParts[1] === 'update-plan') {
      if (env.stripeSecretKey) {
        return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
      }

      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const { plan } = parseOrThrow(updatePlanSchema, await request.json());

      if (!isPlanAvailable(plan)) {
        return NextResponse.json({ success: false, error: 'We do not offer this plan yet.' }, { status: 400 });
      }

      const col = await getCollection(COLLECTIONS.USERS);
      await col.updateOne({ id: sessionUser.id }, { $set: { plan, updatedAt: new Date() } });

      await audit({ action: AUDIT_ACTIONS.PLAN_CHANGE, userId: sessionUser.id, ip: clientIp(request), metadata: { plan, source: 'dev-update-plan' } });

      const user = await col.findOne({ id: sessionUser.id }, { projection: { passwordHash: 0, resetTokenHash: 0, resetTokenExpires: 0 } });
      const token = encodeSession(user);

      const response = NextResponse.json({ success: true, data: user });
      response.headers.set('Set-Cookie', buildSessionCookie(token));
      return response;
    }

    // Companies Hub (POST)
    if (pathParts[0] === 'companies') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const col = await getCollection(COLLECTIONS.COMPANIES);
      const body = parseOrThrow(companySchema, await request.json());

      let normalizedDomain = body.domain;
      try {
        normalizedDomain = new URL(body.domain.startsWith('http') ? body.domain : `https://${body.domain}`).hostname;
      } catch {}
      normalizedDomain = normalizedDomain.replace(/^www\./, '').toLowerCase();

      const exists = await col.findOne({ userId: sessionUser.id, domain: normalizedDomain });
      if (exists) {
        return NextResponse.json({ success: true, data: exists });
      }

      // Enforce the plan's tracked-sites limit
      const limits = await getPlanLimits(sessionUser.plan || 'free');
      if (limits.sites !== Infinity && limits.sites !== null) {
        const siteCount = await col.countDocuments({ userId: sessionUser.id });
        if (siteCount >= limits.sites) {
          const { getNextPlan } = await import('@/lib/plans');
          const nextPlan = getNextPlan(sessionUser.plan || 'free');
          return NextResponse.json({
            success: false,
            error: `Your ${sessionUser.plan || 'free'} plan tracks up to ${limits.sites} site${limits.sites === 1 ? '' : 's'}. Upgrade to ${nextPlan} to add more.`,
            upgradeRequired: true,
            currentPlan: sessionUser.plan || 'free',
            nextPlan,
            upgradeReason: 'sites',
          }, { status: 403 });
        }
      }

      const newCompany = {
        id: uuidv4(),
        userId: sessionUser.id,
        domain: normalizedDomain,
        name: body.name || normalizedDomain,
        createdAt: new Date()
      };
      await col.insertOne(newCompany);
      return NextResponse.json({ success: true, data: newCompany });
    }

    // Web Scanners
    if (pathParts[0] === 'security-scan') {
      const body = parseOrThrow(scanSchema, await request.json());
      const { url } = body;
      await assertSafeUrl(url); // SSRF guard (C-I6)

      const sessionUser = getSessionUser(request);
      // Onboarding scans are exempt from limits and not counted (mirrors seo-scan).
      let isOnboardingScan = false;
      if (sessionUser && body.isOnboarding) {
        const usersCol = await getCollection(COLLECTIONS.USERS);
        const dbUser = await usersCol.findOne({ id: sessionUser.id }, { projection: { onboarded: 1 } });
        isOnboardingScan = dbUser && dbUser.onboarded !== true;
      }
      if (sessionUser && !isOnboardingScan) {
        await assertScanLimit(sessionUser.id, sessionUser.plan || 'free');
        await assertSiteTrackingLimit(sessionUser.id, sessionUser.plan || 'free', url);
      }

      const { runSecurityScan } = await import('@/lib/scanners/securityScanner');
      const scanResult = await runSecurityScan(url);

      const userPlan = sessionUser?.plan || 'free';

      let aiResult = null;
      if (body.deepAnalysis && await hasAnyAiProvider()) {
        const { runDeepSecurityAnalysis } = await import('@/lib/scanners/shared/aiAnalyzer');
        // Only run deep analysis if they have access
        try {
          if (sessionUser && !isOnboardingScan) {
            await assertFeatureAccess(userPlan, 'deepAnalysis');
          }
          aiResult = await runDeepSecurityAnalysis(scanResult.findings, url, { plan: userPlan });
        } catch(e) {
          console.error("Deep analysis failed or no access:", e);
        }
      }

      const newScan = {
        id: uuidv4(),
        userId: sessionUser?.id || 'anonymous',
        url,
        score: scanResult.score,
        totalChecks: scanResult.totalChecks || scanResult.findings.length,
        findings: scanResult.findings,  // Store FULL findings in DB
        ai: aiResult,
        isOnboarding: isOnboardingScan,
        createdAt: new Date(),
      };
      
      const col = await getCollection(COLLECTIONS.SECURITY_SCANS);
      await col.insertOne(newScan);

      await notifyScanComplete(newScan.userId, { type: 'security', url, score: newScan.score, findings: newScan.findings });

      // Return plan-gated findings to the client (full data stays in DB)
      return NextResponse.json({ success: true, data: {
        ...newScan,
        findings: filterFindingsByPlan(newScan.findings, userPlan),
      } });
    }

    if (pathParts[0] === 'seo-scan') {
      const body = parseOrThrow(scanSchema, await request.json());
      const { url, competitorUrl, deepAnalysis, crawl } = body;
      await assertSafeUrl(url); // SSRF guard (C-I6)
      if (competitorUrl) await assertSafeUrl(competitorUrl);

      const sessionUser = getSessionUser(request);
      // The onboarding bypass is only valid for users who haven't completed
      // onboarding yet - otherwise the flag could be replayed to skip limits.
      let isOnboardingScan = false;
      if (sessionUser && body.isOnboarding) {
        const usersCol = await getCollection(COLLECTIONS.USERS);
        const dbUser = await usersCol.findOne({ id: sessionUser.id }, { projection: { onboarded: 1 } });
        isOnboardingScan = dbUser && dbUser.onboarded !== true;
      }
      if (sessionUser && !isOnboardingScan) {
        await assertScanLimit(sessionUser.id, sessionUser.plan || 'free');
        await assertSiteTrackingLimit(sessionUser.id, sessionUser.plan || 'free', url);
        if (competitorUrl) await assertFeatureAccess(sessionUser.plan || 'free', 'competitorScan');
        if (deepAnalysis)  await assertFeatureAccess(sessionUser.plan || 'free', 'deepAnalysis');
      }

      const { runSeoScan } = await import('@/lib/scanners/seoScanner');
      let scanResult, compResult;

      if (competitorUrl) {
        [scanResult, compResult] = await Promise.all([
          runSeoScan(url),
          runSeoScan(competitorUrl)
        ]);
      } else {
        scanResult = await runSeoScan(url);
      }

      let deepAnalysisResult = null;
      if (deepAnalysis && await hasAnyAiProvider()) {
        const { fetchWithCheerio } = await import('@/lib/scanners/shared/fetcher');
        const { runDeepSeoAnalysis } = await import('@/lib/scanners/shared/aiAnalyzer');
        try {
          const auditPrefs = await getAuditPrefs(sessionUser);
          const { html } = await fetchWithCheerio(url);
          deepAnalysisResult = await runDeepSeoAnalysis(html, url, auditPrefs);
          // A provider failure returns {error} — store null so the UI shows
          // its "AI unavailable" notice instead of an empty insights panel.
          if (deepAnalysisResult?.error) {
            console.error('Deep Analysis failed:', deepAnalysisResult.error);
            deepAnalysisResult = null;
          }
        } catch (e) {
          console.error('Deep Analysis failed:', e);
        }
      }

      let crawlData = null;
      if (crawl) {
        const { crawlSite } = await import('@/lib/scanners/shared/crawler');
        try {
          const crawlRes = await crawlSite(url, { maxPages: 5 });
          crawlData = {
            pagesCrawled: crawlRes.pages.length,
            errors: crawlRes.errors.length
          };
        } catch (e) {
          console.error('Crawl failed:', e);
        }
      }
      
      const newScan = {
        id: uuidv4(),
        userId: sessionUser?.id || 'anonymous',
        url,
        score: scanResult.score,
        categories: scanResult.categories,
        findings: scanResult.findings,
        competitorUrl: competitorUrl || null,
        competitorScore: compResult?.score || null,
        competitorCategories: compResult?.categories || null,
        deepAnalysis: deepAnalysisResult,
        crawlData,
        isOnboarding: isOnboardingScan,
        createdAt: new Date(),
      };

      const col = await getCollection(COLLECTIONS.SEO_SCANS);
      await col.insertOne(newScan);

      await notifyScanComplete(newScan.userId, { type: 'seo', url, score: newScan.score, findings: newScan.findings });

      return NextResponse.json({ success: true, data: newScan });
    }

    if (pathParts[0] === 'aeo-scan') {
      const body = parseOrThrow(scanSchema, await request.json());
      const { url, competitorUrl, deepAnalysis, crawl } = body;
      await assertSafeUrl(url); // SSRF guard (C-I6)
      if (competitorUrl) await assertSafeUrl(competitorUrl);

      const sessionUser = getSessionUser(request);
      if (sessionUser) {
        await assertScanLimit(sessionUser.id, sessionUser.plan || 'free');
        await assertSiteTrackingLimit(sessionUser.id, sessionUser.plan || 'free', url);
        if (competitorUrl) await assertFeatureAccess(sessionUser.plan || 'free', 'competitorScan');
        if (deepAnalysis)  await assertFeatureAccess(sessionUser.plan || 'free', 'deepAnalysis');
      }

      const { runAeoScan } = await import('@/lib/scanners/aeoScanner');
      let scanResult, compResult;

      if (competitorUrl) {
        [scanResult, compResult] = await Promise.all([
          runAeoScan(url),
          runAeoScan(competitorUrl)
        ]);
      } else {
        scanResult = await runAeoScan(url);
      }

      let deepAnalysisResult = null;
      if (deepAnalysis && await hasAnyAiProvider()) {
        const { fetchWithCheerio } = await import('@/lib/scanners/shared/fetcher');
        const { runDeepAeoAnalysis } = await import('@/lib/scanners/shared/aiAnalyzer');
        try {
          const auditPrefs = await getAuditPrefs(sessionUser);
          const { html } = await fetchWithCheerio(url);
          deepAnalysisResult = await runDeepAeoAnalysis(html, url, auditPrefs);
          if (deepAnalysisResult?.error) {
            console.error('Deep Analysis failed:', deepAnalysisResult.error);
            deepAnalysisResult = null;
          }
        } catch (e) {
          console.error('Deep Analysis failed:', e);
        }
      }

      let crawlData = null;
      if (crawl) {
        const { crawlSite } = await import('@/lib/scanners/shared/crawler');
        try {
          const crawlRes = await crawlSite(url, { maxPages: 5 });
          crawlData = {
            pagesCrawled: crawlRes.pages.length,
            errors: crawlRes.errors.length
          };
        } catch (e) {
          console.error('Crawl failed:', e);
        }
      }
      
      const newScan = {
        id: uuidv4(),
        userId: sessionUser?.id || 'anonymous',
        url,
        score: scanResult.score,
        categories: scanResult.categories,
        findings: scanResult.findings,
        competitorUrl: competitorUrl || null,
        competitorScore: compResult?.score || null,
        competitorCategories: compResult?.categories || null,
        deepAnalysis: deepAnalysisResult,
        crawlData,
        createdAt: new Date(),
      };

      const col = await getCollection(COLLECTIONS.AEO_SCANS);
      await col.insertOne(newScan);

      await notifyScanComplete(newScan.userId, { type: 'aeo', url, score: newScan.score, findings: newScan.findings });

      return NextResponse.json({ success: true, data: newScan });
    }

    if (pathParts[0] === 'geo-scan') {
      const body = parseOrThrow(scanSchema, await request.json());
      const { url, competitorUrl, deepAnalysis, crawl, promptTopic } = body;
      await assertSafeUrl(url); // SSRF guard (C-I6)
      if (competitorUrl) await assertSafeUrl(competitorUrl);

      const sessionUser = getSessionUser(request);
      if (sessionUser) {
        await assertScanLimit(sessionUser.id, sessionUser.plan || 'free');
        await assertSiteTrackingLimit(sessionUser.id, sessionUser.plan || 'free', url);
        if (competitorUrl) await assertFeatureAccess(sessionUser.plan || 'free', 'competitorScan');
        if (deepAnalysis)  await assertFeatureAccess(sessionUser.plan || 'free', 'deepAnalysis');
      }

      const { runGeoScan } = await import('@/lib/scanners/geoScanner');
      let scanResult, compResult;
      
      if (competitorUrl) {
        [scanResult, compResult] = await Promise.all([
          runGeoScan(url),
          runGeoScan(competitorUrl)
        ]);
      } else {
        scanResult = await runGeoScan(url);
      }

      let deepAnalysisResult = null;
      let promptCoverage = null;
      
      if (deepAnalysis && await hasAnyAiProvider()) {
        const { fetchWithCheerio } = await import('@/lib/scanners/shared/fetcher');
        const { runDeepGeoAnalysis, runPromptCoverageAnalysis } = await import('@/lib/scanners/shared/aiAnalyzer');
        try {
          const auditPrefs = await getAuditPrefs(sessionUser);
          const { html } = await fetchWithCheerio(url);
          deepAnalysisResult = await runDeepGeoAnalysis(html, url, auditPrefs);
          if (deepAnalysisResult?.error) {
            console.error('Deep Analysis failed:', deepAnalysisResult.error);
            deepAnalysisResult = null;
          }

          if (promptTopic) {
            promptCoverage = await runPromptCoverageAnalysis(html, url, promptTopic, auditPrefs);
            if (promptCoverage?.error) {
              console.error('Prompt coverage failed:', promptCoverage.error);
              promptCoverage = null;
            }
          }
        } catch (e) {
          console.error('Deep Analysis failed:', e);
        }
      }

      let crawlData = null;
      if (crawl) {
        const { crawlSite } = await import('@/lib/scanners/shared/crawler');
        try {
          const crawlRes = await crawlSite(url, { maxPages: 5 });
          crawlData = {
            pagesCrawled: crawlRes.pages.length,
            errors: crawlRes.errors.length
          };
        } catch (e) {
          console.error('Crawl failed:', e);
        }
      }
      
      const newScan = {
        id: uuidv4(),
        userId: sessionUser?.id || 'anonymous',
        url,
        score: scanResult.score,
        categories: scanResult.categories,
        findings: scanResult.findings,
        competitorUrl: competitorUrl || null,
        competitorScore: compResult?.score || null,
        competitorCategories: compResult?.categories || null,
        deepAnalysis: deepAnalysisResult,
        crawlData,
        promptCoverage,
        createdAt: new Date(),
      };

      const col = await getCollection(COLLECTIONS.GEO_SCANS);
      await col.insertOne(newScan);

      await notifyScanComplete(newScan.userId, { type: 'geo', url, score: newScan.score, findings: newScan.findings });

      return NextResponse.json({ success: true, data: newScan });
    }

    if (pathParts[0] === 'brand-visibility') {
      const { brandName, url, prompts, providers } = parseOrThrow(brandVisibilitySchema, await request.json());
      await assertSafeUrl(url); // SSRF guard (C-I6)

      const sessionUser = getSessionUser(request);
      if (sessionUser) {
        await assertScanLimit(sessionUser.id, sessionUser.plan || 'free');
        await assertSiteTrackingLimit(sessionUser.id, sessionUser.plan || 'free', url);
      }

      const { queryLLM, checkBrandMention, analyzeMentionSentiment } = await import('@/lib/scanners/shared/llmTracker');
      
      const results = {};
      let totalMentions = 0;
      let totalQueries = 0;

      // Ensure provider selection fallback
      const activeProviders = (providers && providers.length > 0) 
        ? providers 
        : ['gemini', 'openai']; 
      
      for (const prompt of prompts) {
        results[prompt] = {};
        
        for (const provider of activeProviders) {
          totalQueries++;
          try {
            const responseText = await queryLLM(provider, prompt);
            const mentioned = checkBrandMention(responseText, brandName, url);
            let sentiment = 'unknown';
            
            if (mentioned) {
              totalMentions++;
              sentiment = await analyzeMentionSentiment(responseText, brandName);
            }
            
            results[prompt][provider] = {
              mentioned,
              sentiment,
              preview: responseText.substring(0, 150) + (responseText.length > 150 ? '...' : '')
            };
          } catch (e) {
            results[prompt][provider] = { error: e.message };
          }
        }
      }

      const score = Math.round((totalMentions / totalQueries) * 100) || 0;
      
      const newTracking = {
        id: uuidv4(),
        userId: sessionUser?.id || 'anonymous',
        brandName,
        url,
        prompts,
        results,
        score,
        createdAt: new Date(),
      };
      
      const col = await getCollection(COLLECTIONS.BRAND_VISIBILITY);
      await col.insertOne(newTracking);
      
      return NextResponse.json({ success: true, data: newTracking });
    }

    if (pathParts[0] === 'performance-scan') {
      const { url } = parseOrThrow(scanSchema, await request.json());
      await assertSafeUrl(url); // SSRF guard (C-I6)

      const sessionUser = getSessionUser(request);
      if (sessionUser) {
        await assertScanLimit(sessionUser.id, sessionUser.plan || 'free');
        await assertSiteTrackingLimit(sessionUser.id, sessionUser.plan || 'free', url);
      }

      const { runPerformanceScan } = await import('@/lib/scanners/performanceScanner');
      const { runAccessibilityScan } = await import('@/lib/scanners/accessibilityScanner');
      
      const [perfResult, a11yResult] = await Promise.all([
        runPerformanceScan(url),
        runAccessibilityScan(url)
      ]);
      
      const newScan = {
        id: uuidv4(),
        userId: sessionUser?.id || 'anonymous',
        url,
        coreWebVitals: perfResult.coreWebVitals,
        accessibilityScore: a11yResult.score,
        issues: a11yResult.issues,
        createdAt: new Date(),
      };
      
      const col = await getCollection(COLLECTIONS.PERFORMANCE_SCANS);
      await col.insertOne(newScan);
      
      return NextResponse.json({ success: true, data: newScan });
    }

    // ── API Key creation ────────────────────────────────────────────────────────
    if (pathParts[0] === 'api-keys') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });
      await assertFeatureAccess(sessionUser.plan || 'free', 'apiAccess');

      const { name } = parseOrThrow(apiKeySchema, await request.json());

      // Generate a secure random API key: pvn_<32 random hex chars>
      const { randomBytes, createHash } = await import('crypto');
      const rawKey = 'pvn_' + randomBytes(24).toString('hex');
      const keyHash = createHash('sha256').update(rawKey).digest('hex');

      const now = new Date();
      const newKey = {
        id:        uuidv4(),
        userId:    sessionUser.id,
        orgId:     sessionUser.orgId || null,
        keyHash,
        name:      name.trim(),
        status:    'active',
        createdAt: now,
      };

      const col = await getCollection(COLLECTIONS.API_KEYS);
      await col.insertOne(newKey);

      await audit({ action: AUDIT_ACTIONS.API_KEY_CREATE, userId: sessionUser.id, ip: clientIp(request), metadata: { keyId: newKey.id, name: newKey.name } });

      // Return the raw key ONCE - it won't be retrievable again
      return NextResponse.json({
        success: true,
        data: {
          id:        newKey.id,
          name:      newKey.name,
          key:       rawKey,   // Only shown once
          createdAt: newKey.createdAt,
        },
      }, { status: 201 });
    }

    // ── Stripe: create Checkout session ────────────────────────────────────────
    if (pathParts[0] === 'stripe' && pathParts[1] === 'checkout') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const { plan } = await request.json();
      if (!plan) return NextResponse.json({ success: false, error: 'Plan is required' }, { status: 400 });
      if (!isPlanAvailable(plan)) {
        return NextResponse.json({ success: false, error: 'We do not offer this plan yet.' }, { status: 400 });
      }

      // Look up user for stripeCustomerId
      const usersCol = await getCollection(COLLECTIONS.USERS);
      const user = await usersCol.findOne({ id: sessionUser.id }, { projection: { email: 1, stripeCustomerId: 1 } });

      const { createCheckoutSession } = await import('@/lib/stripe');
      const url = await createCheckoutSession({
        userId:           sessionUser.id,
        email:            user?.email || sessionUser.email,
        plan,
        stripeCustomerId: user?.stripeCustomerId || null,
      });

      return NextResponse.json({ success: true, data: { url } });
    }

    // ── Stripe: create Customer Portal session ──────────────────────────────
    if (pathParts[0] === 'stripe' && pathParts[1] === 'portal') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const usersCol = await getCollection(COLLECTIONS.USERS);
      const user = await usersCol.findOne({ id: sessionUser.id }, { projection: { stripeCustomerId: 1 } });

      if (!user?.stripeCustomerId) {
        return NextResponse.json({ success: false, error: 'No active subscription found' }, { status: 400 });
      }

      const { createPortalSession } = await import('@/lib/stripe');
      const url = await createPortalSession({ stripeCustomerId: user.stripeCustomerId });

      return NextResponse.json({ success: true, data: { url } });
    }

    // Schedule a new audit
    if (pathParts[0] === 'scheduled-audit') {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const plan = sessionUser.plan || 'free';
      await assertFeatureAccess(plan, 'monitoring');

      const { url, scanType, frequency, alertThreshold } = parseOrThrow(scheduledAuditSchema, await request.json());
      await assertSafeUrl(url); // SSRF guard (C-I6)

      // Frequency cannot be more frequent than the plan's monitoring cadence
      const cadenceRank = { monthly: 1, weekly: 2, daily: 3 };
      const planLimits = await getPlanLimits(plan);
      const planCadence = planLimits.monitoring;
      if (!cadenceRank[frequency] || cadenceRank[frequency] > (cadenceRank[planCadence] || 0)) {
        return NextResponse.json({
          success: false,
          error: `Your ${plan} plan supports ${planCadence} monitoring at most. Choose a less frequent schedule or upgrade.`,
          upgradeRequired: true,
          currentPlan: plan,
          upgradeReason: 'monitoring',
        }, { status: 403 });
      }

      const newAudit = {
        id: uuidv4(),
        userId: sessionUser.id,
        url,
        scanType,
        frequency,
        alertThreshold: alertThreshold || 70,
        enabled: true,
        createdAt: new Date(),
      };
      
      const col = await getCollection(COLLECTIONS.SCHEDULED_AUDITS);
      await col.insertOne(newAudit);
      
      return NextResponse.json({ success: true, data: newAudit });
    }

    // Admin API
    if (pathParts[0] === 'admin') {
      if (pathParts[1] === 'login') {
        const ip = clientIp(request);
        const { username, password } = await request.json();

        // Credentials come from env (SECURITY_CHECKLIST C2). Without them the
        // admin panel is disabled — no hardcoded admin:admin fallback.
        if (!env.adminUsername || (!env.adminPassword && !env.adminPasswordHash)) {
          return NextResponse.json({ success: false, error: 'Admin access is not configured' }, { status: 503 });
        }

        const userMatch = typeof username === 'string' && username === env.adminUsername;
        let passMatch = false;
        
        if (typeof password === 'string') {
          if (env.adminPasswordHash) {
            const { verifyPassword } = await import('@/lib/auth/password');
            passMatch = await verifyPassword(password, env.adminPasswordHash);
          } else if (env.adminPassword) {
            passMatch = password === env.adminPassword;
          }
        }

        if (!userMatch || !passMatch) {
          await audit({ action: AUDIT_ACTIONS.ADMIN_LOGIN_FAIL, ip, metadata: { username: String(username).slice(0, 80) } });
          return NextResponse.json({ success: false, error: 'Invalid admin credentials' }, { status: 401 });
        }

        // Issue a tamper-proof, expiring admin token instead of a forgeable boolean.
        const adminToken = signToken({ admin: true, exp: Date.now() + 86400 * 1000 });
        const secure = env.isProd ? '; Secure' : '';
        await audit({ action: AUDIT_ACTIONS.ADMIN_LOGIN, ip, metadata: { username } });

        const response = NextResponse.json({ success: true });
        response.headers.set('Set-Cookie', `${ADMIN_COOKIE}=${adminToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400${secure}`);
        return response;
      }

      // Save managed API keys (encrypted at rest; '' clears back to .env)
      if (pathParts[1] === 'system-keys' && !pathParts[2]) {
        if (!isAdminRequest(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { keys } = parseOrThrow(adminKeysSchema, await request.json());
        const changed = await setKeys(keys);

        // Log key NAMES only — never values (immutable audit trail, M4).
        await audit({ action: AUDIT_ACTIONS.ADMIN_KEYS_EDIT, ip: clientIp(request), metadata: { changed } });

        const statuses = await getKeyStatuses();
        return NextResponse.json({ success: true, data: statuses });
      }

      // Round-trip test of one AI provider with the currently active key
      if (pathParts[1] === 'system-keys' && pathParts[2] === 'test') {
        if (!isAdminRequest(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const { provider } = await request.json();
        if (!['gemini', 'openai', 'anthropic'].includes(provider)) {
          return NextResponse.json({ success: false, error: 'Invalid provider' }, { status: 400 });
        }
        const result = await testAiProvider(provider);
        return NextResponse.json({ success: true, data: result });
      }

      if (pathParts[1] === 'update-plans') {
        if (!isAdminRequest(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

        const updates = await request.json(); // array of plan limit objects
        if (!Array.isArray(updates)) return NextResponse.json({ success: false, error: 'Expected an array of plans' }, { status: 400 });

        const validPlans = new Set(['free', 'starter', 'pro', 'agency', 'enterprise']);
        const nonNegativeFields = ['scansPerMonth', 'sites', 'teamMembers'];

        const col = await getCollection(COLLECTIONS.PLAN_LIMITS);
        for (const plan of updates) {
          if (!plan || !validPlans.has(plan.id)) {
            return NextResponse.json({ success: false, error: 'Invalid plan id' }, { status: 400 });
          }
          // Reject negative numeric limits (SECURITY_CHECKLIST F6).
          for (const f of nonNegativeFields) {
            if (plan[f] !== undefined && plan[f] !== null && (typeof plan[f] !== 'number' || plan[f] < 0)) {
              return NextResponse.json({ success: false, error: `${f} must be a non-negative number or null` }, { status: 400 });
            }
          }
          const { _id, ...updateData } = plan;
          await col.updateOne({ id: plan.id }, { $set: updateData }, { upsert: true });
        }
        await audit({ action: AUDIT_ACTIONS.ADMIN_PLAN_EDIT, ip: clientIp(request), metadata: { count: updates.length } });
        return NextResponse.json({ success: true });
      }
    }

    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error(`[API POST] ${pathParts.join('/')}:`, error.message);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
        ...(error.upgradeRequired && {
          upgradeRequired: true,
          currentPlan:     error.currentPlan,
          nextPlan:        error.nextPlan,
          // Prefer an explicit upgradeReason the thrower set (e.g. 'sites' from
          // assertSiteTrackingLimit), then a feature flag, then fall back to
          // scanLimit (429) or the request path. Previously the explicit
          // upgradeReason was dropped, so the tracked-sites limit surfaced as
          // 'security-scan' and the UI showed the wrong upgrade message.
          upgradeReason:   error.upgradeReason || error.feature || (error.status === 429 ? 'scanLimit' : pathParts[0]),
        }),
      },
      { status: error.status || 500 }
    );
  }
}

export async function DELETE(request) {
  const blocked = rejectCrossOrigin(request);
  if (blocked) return blocked;
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const pathParts = path.split('/').filter(Boolean);

  try {
    // Revoke an API key
    if (pathParts[0] === 'api-keys' && pathParts[1]) {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const col = await getCollection(COLLECTIONS.API_KEYS);
      const result = await col.updateOne(
        { id: pathParts[1], userId: sessionUser.id },
        { $set: { status: 'revoked', revokedAt: new Date() } }
      );
      if (result.matchedCount === 0) {
        return NextResponse.json({ success: false, error: 'API key not found' }, { status: 404 });
      }
      await audit({ action: AUDIT_ACTIONS.API_KEY_REVOKE, userId: sessionUser.id, ip: clientIp(request), metadata: { keyId: pathParts[1] } });
      return NextResponse.json({ success: true });
    }

    // Delete a scheduled audit
    if (pathParts[0] === 'scheduled-audit' && pathParts[1]) {
      const sessionUser = getSessionUser(request);
      if (!sessionUser) return NextResponse.json({ success: false, error: 'Not authenticated' }, { status: 401 });

      const col = await getCollection(COLLECTIONS.SCHEDULED_AUDITS);
      const result = await col.deleteOne({ id: pathParts[1], userId: sessionUser.id });

      if (result.deletedCount === 0) {
        return NextResponse.json({ success: false, error: 'Audit not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 });
  } catch (error) {
    console.error(`[API DELETE] ${pathParts.join('/')}:`, error.message);
    return NextResponse.json({ success: false, error: error.message || 'Internal server error' }, { status: 500 });
  }
}
