import { NextResponse } from 'next/server';
import { isRateLimited } from '@/lib/rateLimit';

/**
 * Temporary block of the public auth pages while the product is being upgraded.
 * When true, /login and /signup redirect to the landing page before they render.
 * Flip to `false` to restore access. (Pairs with SHOW_AUTH_CTAS in
 * lib/landingContent.js, which hides the buttons that point here.)
 */
const BLOCK_AUTH_PAGES = false;

function getClientIp(request) {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return request.ip || '127.0.0.1';
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Rate limiting for public API routes to guard against high-frequency scanning bursts
  if (pathname.startsWith('/api')) {
    const ip = getClientIp(request);
    if (isRateLimited(ip, 'global')) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { 
          status: 429, 
          headers: { 
            'Retry-After': '60',
            'Content-Type': 'application/json'
          } 
        }
      );
    }
  }

  if (BLOCK_AUTH_PAGES && (pathname.startsWith('/login') || pathname.startsWith('/signup'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/landing';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/login/:path*', '/signup/:path*', '/api/:path*'],
};

