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

    const { subscriptionId, immediate = false } = await request.json().catch(() => ({}));
    if (!subscriptionId) {
      return NextResponse.json({ success: false, error: 'subscriptionId is required.' }, { status: 400 });
    }

    const client = getDodoClient();

    // Ownership check: the subscription must belong to this user's Dodo customer.
    // Prevents a user cancelling an arbitrary subscription id.
    const customerId = await getDodoCustomerId(sessionUser.id);
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'No active subscription found.' }, { status: 400 });
    }
    const sub = await client.subscriptions.retrieve(subscriptionId);
    if (sub?.customer?.customer_id !== customerId) {
      return NextResponse.json({ success: false, error: 'Subscription not found.' }, { status: 404 });
    }

    // Default: cancel at the end of the paid period (user keeps access until then).
    // immediate=true terminates now.
    await client.subscriptions.update(subscriptionId, {
      status: immediate ? 'cancelled' : undefined,
      cancel_at_next_billing_date: immediate ? undefined : true,
      cancel_reason: 'cancelled_by_customer',
    });

    const effectiveDate = immediate ? null : sub.next_billing_date;

    // Record the scheduled downgrade so the Plans page can show the
    // "cancelled - switches to free on <date>" message. Cleared by the webhook
    // once the change actually takes effect (or if the user re-subscribes).
    if (!immediate) {
      const usersCol = await getCollection(COLLECTIONS.USERS);
      await usersCol.updateOne(
        { id: sessionUser.id },
        { $set: { pendingDowngrade: { plan: sessionUser.plan || null, effectiveDate, cancelledAt: new Date() }, updatedAt: new Date() } }
      );
    }

    return NextResponse.json({
      success: true,
      data: { immediate: !!immediate, effectiveDate },
    });
  } catch (error) {
    console.error(`[Dodo Cancel Error] env=${env.dodoEnv} status=${error?.status || 'n/a'}`, error?.message || error);
    const detail = env.isDev ? (error?.message || 'Unknown error') : 'Could not cancel subscription.';
    return NextResponse.json({ success: false, error: detail }, { status: error?.status || 500 });
  }
}
