/**
 * lib/stripe.js
 * Stripe server-side integration.
 *
 * Usage:
 *   import { stripe, PRICE_IDS, createCheckoutSession, createPortalSession } from '@/lib/stripe'
 *
 * Environment variables required (add to .env.local):
 *   STRIPE_SECRET_KEY=sk_live_... (or sk_test_...)
 *   STRIPE_WEBHOOK_SECRET=whsec_...
 *   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_... (or pk_test_...)
 *   NEXT_PUBLIC_BASE_URL=https://yourapp.com (for redirect URLs)
 */

import Stripe from 'stripe';

/**
 * Lazily-constructed Stripe client.
 *
 * The Stripe constructor throws if no API key is provided. Building it at module
 * load meant that simply *importing* this file (which `next build` does for
 * every route when collecting page data) crashed the whole build when
 * STRIPE_SECRET_KEY was unset. Constructing on first use instead keeps the app
 * buildable without billing configured, and fails with a clear, actionable
 * error only if a Stripe operation is actually attempted.
 */
let _stripe = null;
function getStripe() {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY is not set — add it to .env.local to enable billing.');
    }
    _stripe = new Stripe(key, { apiVersion: '2024-06-20' });
  }
  return _stripe;
}

// Preserve the existing `stripe.xxx` call sites: property access is proxied to
// the lazily-created client, so construction happens at call time, not import.
export const stripe = new Proxy({}, {
  get(_target, prop) {
    const client = getStripe();
    const value = client[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

/**
 * Map plan keys → Stripe Price IDs.
 * Replace the placeholder IDs with real ones from your Stripe dashboard.
 * Create recurring monthly prices for each plan at:
 *   Dashboard → Products → Add product → Add price (recurring, monthly)
 */
export const PRICE_IDS = {
  starter:    process.env.STRIPE_PRICE_STARTER    || 'price_starter_placeholder',
  pro:        process.env.STRIPE_PRICE_PRO        || 'price_pro_placeholder',
  agency:     process.env.STRIPE_PRICE_AGENCY     || 'price_agency_placeholder',
  enterprise: null, // Enterprise is sales-only - handled via contact form
};

/**
 * Creates a Stripe Checkout Session for plan upgrades.
 *
 * @param {{ userId: string, email: string, plan: string, stripeCustomerId?: string|null }} params
 * @returns {Promise<string>} Checkout session URL
 */
export async function createCheckoutSession({ userId, email, plan, stripeCustomerId }) {
  const priceId = PRICE_IDS[plan];
  if (!priceId || priceId.endsWith('_placeholder')) {
    throw new Error(`No Stripe price configured for plan: ${plan}. Set STRIPE_PRICE_${plan.toUpperCase()} in .env.local`);
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : email,
    client_reference_id: userId,
    success_url: `${baseUrl}/settings?tab=billing&upgraded=1`,
    cancel_url:  `${baseUrl}/settings?tab=billing&cancelled=1`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { userId, plan },
      trial_period_days: 14,
    },
    metadata: { userId, plan },
  });

  return session.url;
}

/**
 * Creates a Stripe Customer Portal session so the user can manage/cancel their sub.
 *
 * @param {{ stripeCustomerId: string }} params
 * @returns {Promise<string>} Portal URL
 */
export async function createPortalSession({ stripeCustomerId }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${baseUrl}/settings?tab=billing`,
  });
  return session.url;
}

/**
 * Map Stripe Price ID back to a plan key.
 *
 * @param {string} priceId
 * @returns {string|null}
 */
export function planFromPriceId(priceId) {
  for (const [plan, id] of Object.entries(PRICE_IDS)) {
    if (id && id === priceId) return plan;
  }
  return null;
}
