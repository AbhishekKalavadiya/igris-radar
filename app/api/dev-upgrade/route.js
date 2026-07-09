import { NextResponse } from 'next/server';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { SESSION_COOKIE } from '@/lib/constants';
import { decodeSession, encodeSession, buildSessionCookie } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // Security check: Only allow this in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'This endpoint is strictly for local development testing.' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan') || 'starter'; // free, starter, pro, agency

  const cookie = request.cookies.get(SESSION_COOKIE);
  if (!cookie) {
    return NextResponse.json({ error: 'You are not logged in. Please log in first.' }, { status: 401 });
  }

  const sessionUser = decodeSession(cookie.value);
  if (!sessionUser) {
    return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
  }

  try {
    const col = await getCollection(COLLECTIONS.USERS);
    // Update the user's plan in the database
    await col.updateOne({ id: sessionUser.id }, { $set: { plan } });

    // Re-fetch the updated user to encode a new session
    const updatedUser = await col.findOne({ id: sessionUser.id });
    if (!updatedUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const token = encodeSession(updatedUser);
    
    // Redirect the user to the Security Scan page
    const response = NextResponse.redirect(new URL('/security-scan', request.url));
    
    // Set the new session cookie so the frontend sees the new plan immediately
    response.headers.set('Set-Cookie', buildSessionCookie(token));

    return response;
  } catch (error) {
    console.error('[Dev Upgrade Error]', error);
    return NextResponse.json({ error: 'Failed to update plan' }, { status: 500 });
  }
}
