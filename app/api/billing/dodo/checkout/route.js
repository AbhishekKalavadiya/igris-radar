import { NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { decodeSession } from '@/lib/auth/session';
import { SESSION_COOKIE } from '@/lib/constants';
import { env } from '@/lib/env';

export async function POST(request) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE);
    const sessionUser = cookie ? decodeSession(cookie.value) : null;
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json();

    // Map the plan to the Product ID (env-specific: live and test products
    // have different IDs in Dodo, so these must match the current DODO_ENV).
    const productId = env.dodoProducts[plan] || null;

    if (!productId) {
      return NextResponse.json({ success: false, error: `Product ID for plan '${plan}' is not configured.` }, { status: 400 });
    }

    if (!env.dodoApiKey) {
      return NextResponse.json({ success: false, error: 'Payment provider is not configured.' }, { status: 503 });
    }

    // Initialize the DodoPayments SDK. env.dodoEnv is 'live_mode' only when
    // DODO_ENV is set to exactly that string; otherwise it stays 'test_mode',
    // so `yarn start` locally with test keys never hits the live API.
    const client = new DodoPayments({
      bearerToken: env.dodoApiKey,
      environment: env.dodoEnv,
    });

    // Determine the base URL dynamically so local testing doesn't redirect to production
    const origin = request.headers.get('origin') || `http://${request.headers.get('host')}` || env.siteUrl;

    // Create the checkout session
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        }
      ],
      customer: {
        email: sessionUser.email,
        name: sessionUser.name || sessionUser.email.split('@')[0],
      },
      return_url: `${origin}/settings`,
      metadata: {
        userId: sessionUser.id,
        plan: plan,
      }
    });

    return NextResponse.json({ success: true, url: session.checkout_url });
  } catch (error) {
    // Log the full error server-side (env, status, message) so a live/test
    // mismatch or bad product ID is diagnosable from the Vercel logs.
    console.error(`[Dodo Checkout Error] env=${env.dodoEnv} status=${error?.status || 'n/a'}`, error?.message || error);
    const detail = env.isDev ? (error?.message || 'Unknown error') : 'Failed to create checkout session.';
    return NextResponse.json({ success: false, error: detail }, { status: error?.status || 500 });
  }
}
