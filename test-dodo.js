const { DodoPayments } = require('dodopayments');
require('dotenv').config({ path: '.env.local' });

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: 'test_mode'
});

async function main() {
  try {
    const payment = await client.payments.create({
      product_cart: [{ product_id: process.env.DODO_PRODUCT_UNLOCK_REPORT, quantity: 1 }],
      billing: { country: 'US', zip_code: '10001', state: 'NY', city: 'New York', street: '123 Main St' },
      customer: { email: 'guest@igrisradar.com', name: 'Guest' },
      return_url: `http://localhost:4000/landing?unlocked_scan=test&type=security`,
      metadata: { action: 'unlock_report', scanId: 'test', scanType: 'security' },
    });
    console.log("Success payload:");
    console.log(JSON.stringify(payment, null, 2));
  } catch (error) {
    console.error("Error creating payment:");
    console.error(error.status, error.message);
  }
}

main();
