import { NextResponse } from 'next/server';
import { decodeSession } from '@/lib/auth/session';
import { SESSION_COOKIE } from '@/lib/constants';
import { getDodoClient, getDodoCustomerId } from '@/lib/dodo';
import { env } from '@/lib/env';

export async function GET(request) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE);
    const sessionUser = cookie ? decodeSession(cookie.value) : null;
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const customerId = await getDodoCustomerId(sessionUser.id);
    if (!customerId) {
      // No payment on record yet - not an error, just an empty billing history.
      return NextResponse.json({ success: true, data: { subscription: null, payments: [] } });
    }

    const client = getDodoClient();

    const [subsPage, paymentsPage] = await Promise.all([
      client.subscriptions.list({ customer_id: customerId, page_size: 20 }),
      client.payments.list({ customer_id: customerId, page_size: 50 }),
    ]);

    const subs = subsPage?.items || [];
    // The subscription the user actively pays on (active/on_hold), else the most recent.
    const subscription =
      subs.find((s) => s.status === 'active' || s.status === 'on_hold') || subs[0] || null;

    const payments = (paymentsPage?.items || []).map((p) => ({
      paymentId: p.payment_id,
      amount: p.total_amount,
      currency: p.currency,
      status: p.status,
      createdAt: p.created_at,
      hasInvoice: !!(p.invoice_id || p.invoice_url),
    }));

    return NextResponse.json({
      success: true,
      data: {
        subscription: subscription
          ? {
              subscriptionId: subscription.subscription_id,
              status: subscription.status,
              productId: subscription.product_id,
              amount: subscription.recurring_pre_tax_amount,
              currency: subscription.currency,
              nextBillingDate: subscription.next_billing_date,
              cancelAtNextBillingDate: subscription.cancel_at_next_billing_date,
            }
          : null,
        payments,
      },
    });
  } catch (error) {
    console.error(`[Dodo History Error] env=${env.dodoEnv} status=${error?.status || 'n/a'}`, error?.message || error);
    const detail = env.isDev ? (error?.message || 'Unknown error') : 'Could not load billing history.';
    return NextResponse.json({ success: false, error: detail }, { status: error?.status || 500 });
  }
}
