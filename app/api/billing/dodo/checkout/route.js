import { NextResponse } from 'next/server';
import { decodeSession } from '@/lib/auth/session';
import { SESSION_COOKIE } from '@/lib/constants';
import { getDodoClient, getDodoCustomerId } from '@/lib/dodo';
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

    const client = getDodoClient();

    // If the user already has an active subscription, this is a mid-cycle
    // upgrade - change the existing subscription in place (prorated, billed
    // immediately) rather than creating a second subscription. This restarts
    // the billing cycle from today, giving them a fresh 30 days.
    const customerId = await getDodoCustomerId(sessionUser.id);
    if (customerId) {
      const subsPage = await client.subscriptions.list({ customer_id: customerId, page_size: 20 });
      const activeSub = (subsPage?.items || []).find((s) => s.status === 'active' || s.status === 'on_hold') || null;

      if (activeSub && activeSub.product_id !== productId) {
        await client.subscriptions.changePlan(activeSub.subscription_id, {
          product_id: productId,
          proration_billing_mode: 'prorated_immediately',
          quantity: 1,
          effective_at: 'immediately',
          // Only apply the change if the prorated charge succeeds - never grant
          // a higher tier on a failed payment.
          on_payment_failure: 'prevent_change',
          metadata: { userId: sessionUser.id, plan },
        });

        // changePlan resolved => payment succeeded. Reflect immediately: switch
        // the plan and restart the 30-day usage cycle from now. The webhook is
        // a backstop that sets the same fields.
        const usersCol = await getCollection(COLLECTIONS.USERS);
        await usersCol.updateOne(
          { id: sessionUser.id },
          {
            $set: { plan, planCycleStart: new Date(), updatedAt: new Date() },
            $unset: { pendingDowngrade: '' },
          }
        );

        return NextResponse.json({ success: true, changed: true, plan });
      }
    }

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
