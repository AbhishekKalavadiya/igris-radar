// One-time migration: reassigns any leftover 'agency'/'enterprise' plan users
// to 'pro', removes their orphaned plan_limits docs, and backfills the
// starter/pro plan_limits docs with the current 3-tier pricing/limits.
//
// Usage (against production):
//   MONGO_URL="<prod mongo url>" DB_NAME="<prod db name>" node scripts/prod-plan-migration.js
//
// Safe to re-run - all operations are idempotent.

const { MongoClient } = require('mongodb');

async function main() {
  const mongoUrl = process.env.MONGO_URL;
  const dbName = process.env.DB_NAME;
  if (!mongoUrl || !dbName) {
    console.error('Set MONGO_URL and DB_NAME env vars before running this script.');
    process.exit(1);
  }

  const client = new MongoClient(mongoUrl);
  await client.connect();
  const db = client.db(dbName);

  const u = await db.collection('users').updateMany(
    { plan: { $in: ['agency', 'enterprise'] } },
    { $set: { plan: 'pro', updatedAt: new Date() } }
  );
  console.log('users migrated to pro:', u.modifiedCount);

  const delAgency = await db.collection('plan_limits').deleteOne({ id: 'agency' });
  const delEnt = await db.collection('plan_limits').deleteOne({ id: 'enterprise' });
  console.log('plan_limits agency/enterprise removed:', delAgency.deletedCount, delEnt.deletedCount);

  await db.collection('plan_limits').updateOne({ id: 'starter' }, { $set: { price: '$5 /mo' } });
  await db.collection('plan_limits').updateOne({ id: 'pro' }, { $set: {
    price: '$20 /mo', scansPerMonth: null, sites: null,
    monitoring: 'daily', whiteLabel: true, apiAccess: true,
  }});

  console.log('final plan_limits:', JSON.stringify(await db.collection('plan_limits').find({}).toArray(), null, 2));

  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
