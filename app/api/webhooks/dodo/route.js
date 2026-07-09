import { NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
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
      bearerToken: process.env.DODO_PAYMENTS_API_KEY || 'placeholder_for_webhook',
      webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_KEY || env.DODO_PAYMENTS_WEBHOOK_KEY,
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
      
      // Extract userId from metadata or client_reference_id
      const userId = data.metadata?.userId || data.client_reference_id;
      
      if (!userId) {
        console.warn('[Dodo Webhook] Received payment success but no userId in metadata.', event.id);
        return NextResponse.json({ success: true, warning: 'No userId attached' });
      }

      // Determine the plan based on the product_id or price paid.
      // Alternatively, we can assume the metadata contains the target plan if we pass it:
      const targetPlan = data.metadata?.plan || guessPlanFromAmount(data.total_amount || data.amount);

      if (targetPlan) {
        const usersCol = await getCollection(COLLECTIONS.USERS);
        await usersCol.updateOne(
          { id: userId },
          { $set: { plan: targetPlan, updatedAt: new Date() } }
        );
        console.log(`[Dodo Webhook] Upgraded user ${userId} to ${targetPlan}`);
      } else {
        console.warn('[Dodo Webhook] Could not determine target plan from event.', event.id);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Dodo Webhook] Internal Error:', err);
    return NextResponse.json({ success: false, error: 'Webhook processing failed' }, { status: 500 });
  }
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
