import { NextResponse } from 'next/server'
import { SESSION_COOKIE, PROTECTED_ROUTES, AUTH_ROUTES, ROUTES } from '@/lib/constants'
import { isRateLimited } from '@/lib/rateLimit'
import { isSameOriginRequest } from '@/lib/security/originCheck'
import { env } from '@/lib/env'

/**
 * Cheap, Edge-safe check that a session cookie is a live signed token.
 * Does NOT verify the HMAC signature (that happens server-side in the API
 * route) — it only rejects cookies that are structurally not a signed token
 * (e.g. pre-upgrade base64 JSON, which has no `.`) or are past their `exp`.
 * This prevents stale/expired cookies from being treated as an active session
 * and causing a /login ⇄ /dashboard redirect loop.
 *
 * @param {string|undefined} value
 * @returns {boolean}
 */
function hasLiveSessionCookie(value) {
  if (!value || typeof value !== 'string') return false
  const parts = value.split('.')
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false
  try {
    let b64 = parts[0].replace(/-/g, '+').replace(/_/g, '/')
    b64 += '='.repeat((4 - (b64.length % 4)) % 4)
    const payload = JSON.parse(atob(b64))
    if (payload && typeof payload.exp === 'number' && Date.now() > payload.exp) return false
  } catch {
    return false
  }
  return true
}

/**
 * Next.js Edge Middleware — Security Gateway
 *
 * Implements:
 * 1. Identity & Access Management gateway (Session checks)
 * 2. Network Perimeter Protection (Rate Limiting, Body Size Limits)
 * 3. SEO gateway (HTTPS enforcement, noindex on private routes)
 */
export function middleware(request) {
  try {
    const { pathname } = request.nextUrl
    const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown-ip'

    // --- 0. HTTPS enforcement (production, behind a proxy/CDN) ---
    const host = request.nextUrl.hostname
    const isLoopbackHost = host === 'localhost' || host === '127.0.0.1' || host === '::1'
    if (env.isProd && !isLoopbackHost && request.headers.get('x-forwarded-proto') === 'http') {
      const httpsUrl = request.nextUrl.clone()
      httpsUrl.protocol = 'https:'
      return NextResponse.redirect(httpsUrl, 308)
    }

    // --- 1. Network Perimeter: Layered Rate Limiting ---
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

    // --- 2. Network Perimeter: Strict Body Limits ---
    if (request.method === 'POST' || request.method === 'PUT') {
      const contentLength = request.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > 2 * 1024 * 1024) {
        return new NextResponse('Payload Too Large (Exceeds 2MB limit)', { status: 413 })
      }
    }

    // --- 2b. CSRF: Origin verification on state-changing requests ---
    const allowedOrigins = (env.corsOrigins || '').split(',')
    if (isLoopbackHost) {
      allowedOrigins.push('http://127.0.0.1:4100', 'http://localhost:4100', 'http://127.0.0.1:4000', 'http://localhost:4000')
    }
    if (!isSameOriginRequest(request, request.nextUrl.origin, allowedOrigins)) {
      return NextResponse.json({ success: false, error: 'Cross-origin request blocked' }, { status: 403 })
    }

    // --- 3. Identity & Access Management ---
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
    // Fail open if middleware crashes so we don't bring down the whole site,
    // or fail closed if security is paramount. Since this is crashing the homepage,
    // let's fail open and rely on the API routes for primary security.
    return NextResponse.next()
  }
}

export const config = {
  // Apply middleware to all paths, including API routes, to enforce rate limits
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)'],
}
