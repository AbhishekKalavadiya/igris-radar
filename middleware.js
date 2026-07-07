import { NextResponse } from 'next/server'

// --- CONSTANTS ---
const ROUTES = {
  HOME:          '/',
  LANDING:       '/landing',
  LOGIN:         '/login',
  SIGNUP:        '/signup',
  ONBOARDING:    '/onboarding',
  DASHBOARD:     '/dashboard',
  SETTINGS:      '/settings',
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

const PROTECTED_ROUTES = [
  ROUTES.DASHBOARD, ROUTES.SETTINGS, ROUTES.ONBOARDING,
  ROUTES.SECURITY_SCAN, ROUTES.SEO_AUDIT, ROUTES.AEO_AUDIT,
  ROUTES.GEO_AUDIT, ROUTES.SITE_HEALTH, ROUTES.UPTIME,
  ROUTES.DOMAIN_HEALTH, ROUTES.BRAND_VISIBILITY, ROUTES.COMPANIES, ROUTES.PLANS,
]

const AUTH_ROUTES = [ROUTES.LOGIN, ROUTES.SIGNUP]
const SESSION_COOKIE = 'provenance_session'

// --- ENV (Mocked for Edge) ---
// Note: we can't do full process.env lookup at top level cleanly across all edge runtimes, 
// so we access it inside the middleware function where it's 100% safe.

// --- SECURITY: CSRF Check ---
const STATE_CHANGING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
function isSameOriginRequest(request, selfOrigin, extraAllowed = []) {
  if (!STATE_CHANGING.has(request.method)) return true
  const origin = request.headers.get('origin')
  if (!origin) return true 
  if (origin === selfOrigin) return true
  const allowed = extraAllowed.map(o => o.trim()).filter(Boolean)
  return allowed.includes(origin)
}

// --- RATE LIMITING ---
const rateLimitStore = new Map()
const GLOBAL_LIMIT = 500
const GLOBAL_WINDOW = 60000
const API_KEY_LIMIT = 2000
const API_KEY_WINDOW = 60000

let lastSweep = Date.now()
function sweep(now) {
  if (now - lastSweep < 60000) return
  lastSweep = now
  for (const [key, rec] of rateLimitStore) {
    if (now - rec.firstRequestTime > Math.max(GLOBAL_WINDOW, API_KEY_WINDOW)) {
      rateLimitStore.delete(key)
    }
  }
}

function isRateLimited(identifier, type = 'global') {
  const limit = type === 'key' ? API_KEY_LIMIT : GLOBAL_LIMIT
  const windowMs = type === 'key' ? API_KEY_WINDOW : GLOBAL_WINDOW
  const now = Date.now()
  sweep(now)
  const record = rateLimitStore.get(identifier) || { count: 0, firstRequestTime: now }
  if (now - record.firstRequestTime > windowMs) {
    record.count = 1
    record.firstRequestTime = now
  } else {
    record.count += 1
  }
  rateLimitStore.set(identifier, record)
  return record.count > limit
}

// --- SESSION CHECK ---
function hasLiveSessionCookie(value) {
  if (!value || typeof value !== 'string') return false
  const parts = value.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false
  try {
    let b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/')
    b64 += '='.repeat((4 - (b64.length % 4)) % 4)
    // Basic decode to avoid Buffer dependencies
    const payload = JSON.parse(atob(b64))
    if (payload && typeof payload.exp === 'number' && Date.now() > payload.exp) return false
  } catch {
    return false
  }
  return true
}

// --- MIDDLEWARE ---
export function middleware(request) {
  try {
    const isProd = process.env.NODE_ENV === 'production'
    const corsOrigins = process.env.CORS_ORIGINS || 'https://igrisradar.com'

    const { pathname } = request.nextUrl
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown-ip'

    const host = request.nextUrl.hostname
    const isLoopbackHost = host === 'localhost' || host === '127.0.0.1' || host === '::1'
    if (isProd && !isLoopbackHost && request.headers.get('x-forwarded-proto') === 'http') {
      const httpsUrl = request.nextUrl.clone()
      httpsUrl.protocol = 'https:'
      return NextResponse.redirect(httpsUrl, 308)
    }

    const authHeader = request.headers.get('authorization')
    if (authHeader && authHeader.startsWith('Bearer pvn_')) {
      if (isRateLimited(authHeader, 'key')) {
        return new NextResponse('Too Many Requests (API Key Limit)', { status: 429 })
      }
    } else {
      if (isRateLimited(ip, 'global')) {
        return new NextResponse('Too Many Requests (IP Limit)', { status: 429 })
      }
    }

    if (request.method === 'POST' || request.method === 'PUT') {
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
        return new NextResponse('Payload Too Large (Exceeds 2MB limit)', { status: 413 })
      }
    }

    const allowedOrigins = (corsOrigins || '').split(',')
    if (isLoopbackHost) {
      allowedOrigins.push('http://127.0.0.1:4100', 'http://localhost:4100', 'http://127.0.0.1:4000', 'http://localhost:4000')
    }
    if (!isSameOriginRequest(request, request.nextUrl.origin, allowedOrigins)) {
      return NextResponse.json({ success: false, error: 'Cross-origin request blocked' }, { status: 403 })
    }

    const sessionCookie = request.cookies.get(SESSION_COOKIE)
    const session = hasLiveSessionCookie(sessionCookie?.value)

    const isProtected = PROTECTED_ROUTES.some(p => pathname.startsWith(p))
    const isAuthRoute  = AUTH_ROUTES.some(p => pathname.startsWith(p))

    if (pathname === '/' && !session) {
      const landingUrl = request.nextUrl.clone()
      landingUrl.pathname = ROUTES.LANDING
      return NextResponse.redirect(landingUrl, 307)
    }

    if (isProtected && !session) {
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = ROUTES.LOGIN
      loginUrl.searchParams.set('from', pathname)
      return NextResponse.redirect(loginUrl)
    }

    if (isAuthRoute && session) {
      const dashUrl = request.nextUrl.clone()
      dashUrl.pathname = ROUTES.DASHBOARD
      dashUrl.searchParams.delete('from')
      return NextResponse.redirect(dashUrl)
    }

    const response = NextResponse.next()

    if (isProtected || isAuthRoute || pathname.startsWith('/api')) {
      response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    }

    return response
  } catch (error) {
    console.error('MIDDLEWARE UNCAUGHT ERROR:', error.message, error.stack)
    return NextResponse.next()
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
