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

    // Map the plan to the Product ID from environment variables
    let productId = null;
    if (plan === 'starter') productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_STARTER;
    if (plan === 'pro') productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_PRO;
    if (plan === 'agency') productId = process.env.NEXT_PUBLIC_DODO_PRODUCT_AGENCY;

    if (!productId) {
      return NextResponse.json({ success: false, error: `Product ID for plan '${plan}' is not configured.` }, { status: 400 });
    }

    // Initialize the DodoPayments SDK with the API key
    // We use a specific env variable for Dodo so that running `yarn start` locally
    // doesn't force live_mode when using test keys.
    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment: process.env.DODO_ENV === 'live_mode' ? 'live_mode' : 'test_mode',
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
    console.error('[Dodo Checkout Error]', error);
    return NextResponse.json({ success: false, error: 'Failed to create checkout session.' }, { status: 500 });
  }
}
