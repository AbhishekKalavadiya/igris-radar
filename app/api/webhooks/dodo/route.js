import { NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { PLANS } from '@/lib/constants';
import { env } from '@/lib/env';

export async function POST(req) {
  try {
    const body = await req.text();
    const headers = {
      'webhook-id': req.headers.get('webhook-id'),
      'webhook-signature': req.headers.get('webhook-signature'),
      'webhook-timestamp': req.headers.get('webhook-timestamp'),
    };

    // Initialize DodoPayments client
    // Note: bearerToken is required by SDK but not strictly needed for just webhook verification,
    // so we pass a placeholder if the real API key isn't set yet.
    const client = new DodoPayments({
      bearerToken: env.dodoApiKey || 'placeholder_for_webhook',
      webhookKey: env.dodoWebhookKey,
      environment: env.dodoEnv,
    });

    let event;
    try {
      // Verify signature and unwrap payload
      event = client.webhooks.unwrap(body, { headers });
    } catch (err) {
      console.error('[Dodo Webhook] Verification failed:', err.message);
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    // Process the event
    // Dodo Payments typically sends payment.succeeded or subscription.active
    if (event.type === 'payment.succeeded' || event.type === 'subscription.active' || event.type === 'subscription.renewed') {
      const data = event.data;

      // Resolve the user: prefer metadata (set at checkout), else fall back to
      // the stored Dodo customer id - some subscription events don't echo the
      // original checkout metadata.
      const userId = await resolveUserId(data);

      if (!userId) {
        console.warn('[Dodo Webhook] Received payment success but could not resolve a user.', event.id);
        return NextResponse.json({ success: true, warning: 'No user resolved' });
      }

      // Determine the target plan, most-reliable source first:
      //  1. metadata.plan  - set explicitly at checkout / changePlan
      //  2. product_id map - deterministic, immune to prorated amounts
      //  3. amount guess    - last resort (NOTE: a prorated upgrade charge is a
      //     partial amount, so this must never run before the product map or it
      //     would misclassify an upgrade as a cheaper plan).
      const productId = data.product_id || data.product_cart?.[0]?.product_id || data.subscription?.product_id;
      const targetPlan = data.metadata?.plan || planFromProductId(productId) || guessPlanFromAmount(data.total_amount || data.amount);

      if (targetPlan) {
        // Capture the Dodo customer id so "Manage Billing" can open the
        // customer portal for this user later.
        const dodoCustomerId = data.customer?.customer_id || data.customer_id || null;

        const usersCol = await getCollection(COLLECTIONS.USERS);
        await usersCol.updateOne(
          { id: userId },
          {
            // Reset the 30-day usage cycle to start now, and clear any pending
            // downgrade (the user is active/paid again).
            $set: {
              plan: targetPlan,
              planCycleStart: new Date(),
              ...(dodoCustomerId ? { dodoCustomerId } : {}),
              updatedAt: new Date(),
            },
            $unset: { pendingDowngrade: '' },
          }
        );
        console.log(`[Dodo Webhook] Upgraded user ${userId} to ${targetPlan}`);
      } else {
        console.warn('[Dodo Webhook] Could not determine target plan from event.', event.id);
      }
    }

    // Subscription ended for good - downgrade the user back to the free plan.
    // Only terminal states are handled here: a scheduled cancellation keeps the
    // subscription 'active' until the period end, and a failed payment goes to
    // 'on_hold' (dunning/retries) rather than being terminal - so we must NOT
    // downgrade on those, or a transient card decline would strip a paying
    // customer's plan mid-cycle.
    if (event.type === 'subscription.cancelled' || event.type === 'subscription.expired') {
      const data = event.data;
      const userId = await resolveUserId(data);

      if (!userId) {
        console.warn('[Dodo Webhook] Subscription ended but could not resolve a user.', event.id);
        return NextResponse.json({ success: true, warning: 'No user resolved' });
      }

      const usersCol = await getCollection(COLLECTIONS.USERS);
      await usersCol.updateOne(
        { id: userId },
        {
          // Free tier begins now (this event fires at the paid period's end).
          // Start a fresh 30-day cycle and clear the pending-downgrade banner.
          $set: { plan: PLANS.FREE, planCycleStart: new Date(), updatedAt: new Date() },
          $unset: { pendingDowngrade: '' },
        }
      );
      console.log(`[Dodo Webhook] Downgraded user ${userId} to ${PLANS.FREE} (${event.type})`);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Dodo Webhook] Internal Error:', err);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Resolve our internal user id from a Dodo event payload.
 * Prefers the metadata set at checkout; falls back to looking the user up by
 * the Dodo customer id we stored on first payment (covers events that don't
 * echo the original checkout metadata).
 * @param {any} data - event.data
 * @returns {Promise<string|null>}
 */
async function resolveUserId(data) {
  const fromMeta = data?.metadata?.userId || data?.client_reference_id;
  if (fromMeta) return fromMeta;

  const customerId = data?.customer?.customer_id || data?.customer_id;
  if (!customerId) return null;

  const usersCol = await getCollection(COLLECTIONS.USERS);
  const user = await usersCol.findOne({ dodoCustomerId: customerId }, { projection: { id: 1 } });
  return user?.id || null;
}

/**
 * Deterministically map a Dodo product id back to our plan key using the
 * configured product ids. Immune to prorated/partial amounts.
 * @param {string|null|undefined} productId
 * @returns {string|null}
 */
function planFromProductId(productId) {
  if (!productId) return null;
  const match = Object.entries(env.dodoProducts).find(([, id]) => id && id === productId);
  return match ? match[0] : null;
}

function guessPlanFromAmount(amount) {
  if (!amount) return null;
  // Fallback heuristic if metadata doesn't contain the plan
  // Starter = $49 (4900 cents), Pro = $149, Agency = $399
  // (adjust these values to match your exact Dodo product prices in cents)
  if (amount >= 39900) return 'agency';
  if (amount >= 14900) return 'pro';
  if (amount >= 4900) return 'starter';
  return null;
}
