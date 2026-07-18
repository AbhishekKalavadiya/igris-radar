import { NextResponse } from 'next/server';
import { getDodoClient } from '@/lib/dodo';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { env } from '@/lib/env';
import { isRateLimited } from '@/lib/rateLimit';
import { clientIp } from '@/lib/audit';

const COLLECTION_BY_TYPE = {
  security: COLLECTIONS.SECURITY_SCANS,
  seo:      COLLECTIONS.SEO_SCANS,
  aeo:      COLLECTIONS.AEO_SCANS,
  aso:      COLLECTIONS.ASO_SCANS,
};

export async function POST(request) {
  try {
    const ip = clientIp(request);
    if (isRateLimited(ip, 'global')) {
      return NextResponse.json({ success: false, error: 'Too many requests. Try again later.' }, { status: 429 });
    }

    const { scanId, scanType } = await request.json();

    if (!scanId || !scanType) {
      return NextResponse.json({ success: false, error: 'scanId and scanType are required.' }, { status: 400 });
    }

    const collection = COLLECTION_BY_TYPE[scanType];
    if (!collection) {
      return NextResponse.json({ success: false, error: 'Invalid scanType.' }, { status: 400 });
    }

    const col = await getCollection(collection);
    const scan = await col.findOne({ id: scanId }, { projection: { id: 1 } });
    if (!scan) {
      return NextResponse.json({ success: false, error: 'Scan not found.' }, { status: 404 });
    }

    const productId = env.dodoProducts.unlockReport;
    if (!productId) {
      return NextResponse.json(
        { success: false, error: 'Report unlock product is not configured. Contact support.' },
        { status: 503 }
      );
    }

    const client = getDodoClient();
    const host = request.headers.get('host');
    const protocol = host && (host.includes('localhost') || host.includes('127.0.0.1')) ? 'http' : 'https';
    const origin = request.headers.get('origin') || (host ? `${protocol}://${host}` : env.siteUrl);

    const payment = await client.payments.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      billing: { country: 'US' },
      customer: { email: 'guest@igrisradar.com', name: 'Guest', create_new_customer: false },
      return_url: `${origin}/landing?unlocked_scan=${scanId}&type=${scanType}`,
      metadata: { action: 'unlock_report', scanId, scanType },
      payment_link: true,
    });

    return NextResponse.json({ success: true, url: payment.payment_link });
  } catch (error) {
    console.error(`[Unlock Checkout Error] env=${env.dodoEnv} status=${error?.status || 'n/a'}`, error?.message || error);
    const detail = env.isDev ? (error?.message || 'Unknown error') : 'Failed to create checkout session.';
    return NextResponse.json({ success: false, error: detail }, { status: error?.status || 500 });
  }
}
