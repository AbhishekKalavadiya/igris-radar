import { NextResponse } from 'next/server';
import { decodeSession } from '@/lib/auth/session';
import { SESSION_COOKIE } from '@/lib/constants';
import { getDodoClient, getDodoCustomerId } from '@/lib/dodo';
import { env } from '@/lib/env';

export async function GET(request, { params }) {
  try {
    const cookie = request.cookies.get(SESSION_COOKIE);
    const sessionUser = cookie ? decodeSession(cookie.value) : null;
    if (!sessionUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { paymentId } = params;
    if (!paymentId) {
      return NextResponse.json({ success: false, error: 'paymentId is required.' }, { status: 400 });
    }

    const client = getDodoClient();

    // Ownership check: the payment must belong to this user's Dodo customer,
    // otherwise a user could fetch someone else's invoice by guessing an id.
    const customerId = await getDodoCustomerId(sessionUser.id);
    if (!customerId) {
      return NextResponse.json({ success: false, error: 'No billing records found.' }, { status: 400 });
    }
    const payment = await client.payments.retrieve(paymentId);
    if (payment?.customer?.customer_id !== customerId) {
      return NextResponse.json({ success: false, error: 'Receipt not found.' }, { status: 404 });
    }

    // Stream the invoice PDF from Dodo through our authenticated route.
    const pdfResponse = await client.invoices.payments.retrieve(paymentId);
    const blob = await pdfResponse.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="receipt-${paymentId}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error) {
    console.error(`[Dodo Receipt Error] env=${env.dodoEnv} status=${error?.status || 'n/a'}`, error?.message || error);
    const detail = env.isDev ? (error?.message || 'Unknown error') : 'Could not fetch receipt.';
    return NextResponse.json({ success: false, error: detail }, { status: error?.status || 500 });
  }
}
