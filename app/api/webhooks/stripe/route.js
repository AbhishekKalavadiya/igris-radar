/**
 * app/api/webhooks/stripe/route.js
 * Stripe webhook receiver.
 *
 * Handles subscription lifecycle events to keep the user's plan in sync.
 * This route MUST NOT use body parsing - raw bytes are required for signature verification.
 *
 * Setup:
 *   1. Add STRIPE_WEBHOOK_SECRET to .env.local (from Stripe dashboard → Webhooks)
 *   2. Register this endpoint in Stripe dashboard:
 *      https://yourapp.com/api/webhooks/stripe
 *   3. Listen for these events:
 *      - checkout.session.completed
 *      - customer.subscription.updated
 *      - customer.subscription.deleted
 *
 * For local testing:
 *   stripe listen --forward-to localhost:3000/api/webhooks/stripe
 */

import { NextResponse } from 'next/server';
import { stripe, planFromPriceId } from '@/lib/stripe';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { encodeSession, buildSessionCookie } from '@/lib/auth/session';

async function updateUserPlan(userId, plan, stripeCustomerId) {
  const col = await getCollection(COLLECTIONS.USERS);
  await col.updateOne(
    { id: userId },
    {
      $set: {
        plan,
        stripeCustomerId,
        updatedAt: new Date(),
      },
    }
  );
}

export async function POST(request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('[Stripe Webhook] Signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── New subscription created via Checkout ──────────────────────────────
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.mode !== 'subscription') break;

        const userId = session.client_reference_id || session.metadata?.userId;
        const plan   = session.metadata?.plan;
        const stripeCustomerId = session.customer;

        if (userId && plan) {
          await updateUserPlan(userId, plan, stripeCustomerId);
          console.log(`[Stripe Webhook] Plan upgraded: user=${userId} plan=${plan}`);
        }
        break;
      }

      // ── Subscription updated (plan change, renewal, etc.) ──────────────────
      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const stripeCustomerId = sub.customer;

        // Find the price from the first subscription item
        const priceId = sub.items?.data?.[0]?.price?.id;
        const plan = planFromPriceId(priceId);

        if (plan) {
          // Find user by stripeCustomerId
          const col = await getCollection(COLLECTIONS.USERS);
          const user = await col.findOne({ stripeCustomerId });

          if (user) {
            await col.updateOne(
              { id: user.id },
              { $set: { plan, updatedAt: new Date() } }
            );
            console.log(`[Stripe Webhook] Subscription updated: user=${user.id} plan=${plan}`);
          }
        }
        break;
      }

      // ── Subscription cancelled / payment failed ────────────────────────────
      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const stripeCustomerId = sub.customer;

        const col = await getCollection(COLLECTIONS.USERS);
        const user = await col.findOne({ stripeCustomerId });

        if (user) {
          await col.updateOne(
            { id: user.id },
            { $set: { plan: 'free', updatedAt: new Date() } }
          );
          console.log(`[Stripe Webhook] Subscription cancelled: user=${user.id} → free`);
        }
        break;
      }

      default:
        // Ignore unhandled events
        break;
    }
  } catch (err) {
    console.error('[Stripe Webhook] Handler error:', err.message);
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
