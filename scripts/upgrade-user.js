const { MongoClient } = require('mongodb');

async function main() {
  const client = await MongoClient.connect('mongodb://localhost:27017');
  const db = client.db('igrisradar');

  const result = await db.collection('users').updateOne(
    { email: 'alex@gma.com' },
    { $set: { plan: 'pro', updatedAt: new Date() } }
  );

  console.log('Matched:', result.matchedCount, '| Modified:', result.modifiedCount);

  if (result.matchedCount === 0) {
    console.log('No user found with that email.');
  } else if (result.modifiedCount === 1) {
    console.log('Successfully upgraded alex@gma.com to PRO plan!');
  } else {
    console.log('User was already on the pro plan.');
  }

  await client.close();
}

main().catch(console.error);
