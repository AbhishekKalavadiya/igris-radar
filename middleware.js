import { NextResponse } from 'next/server';

/**
 * Temporary block of the public auth pages while the product is being upgraded.
 * When true, /login and /signup redirect to the landing page before they render.
 * Flip to `false` to restore access. (Pairs with SHOW_AUTH_CTAS in
 * lib/landingContent.js, which hides the buttons that point here.)
 */
const BLOCK_AUTH_PAGES = false;

export function middleware(request) {
  if (BLOCK_AUTH_PAGES) {
    const url = request.nextUrl.clone();
    url.pathname = '/landing';
    url.search = '';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

// Only run this middleware for the auth pages we want to block.
export const config = {
  matcher: ['/login/:path*', '/signup/:path*'],
};
