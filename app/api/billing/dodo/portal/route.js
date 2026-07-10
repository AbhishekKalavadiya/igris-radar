import { NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { decodeSession } from '@/lib/auth/session';
import { SESSION_COOKIE } from '@/lib/constants';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { env } from '@/lib/env';

export async function POST(request) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE);
    const sessionUser = cookie ? decodeSession(cookie.value) : null;
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    if (!env.dodoApiKey) {
      return NextResponse.json({ success: false, error: 'Payment provider is not configured.' }, { status: 503 });
    }

    // The customer id is captured from the Dodo webhook on first payment.
    const usersCol = await getCollection(COLLECTIONS.USERS);
    const user = await usersCol.findOne({ id: sessionUser.id }, { projection: { dodoCustomerId: 1 } });

    if (!user?.dodoCustomerId) {
      return NextResponse.json({ success: false, error: 'No active subscription found.' }, { status: 400 });
    }

    const client = new DodoPayments({
      bearerToken: env.dodoApiKey,
      environment: env.dodoEnv,
    });

    const origin = request.headers.get('origin') || `http://${request.headers.get('host')}` || env.siteUrl;

    const portal = await client.customers.customerPortal.create(user.dodoCustomerId, {
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ success: true, data: { url: portal.link } });
  } catch (error) {
    console.error(`[Dodo Portal Error] env=${env.dodoEnv} status=${error?.status || 'n/a'}`, error?.message || error);
    const detail = env.isDev ? (error?.message || 'Unknown error') : 'Could not open billing portal.';
    return NextResponse.json({ success: false, error: detail }, { status: error?.status || 500 });
  }
}
