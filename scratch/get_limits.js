const fs = require('fs');
const content = fs.readFileSync('../.env.local', 'utf8');
const mongoLine = content.split('\n').find(l => l.startsWith('MONGO_URL='));
let uri = mongoLine.split('=')[1].trim();
if (uri.startsWith('"') || uri.startsWith("'")) uri = uri.slice(1, -1);

const { MongoClient } = require('mongodb');
async function run() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db('provenance');
  const limits = await db.collection('plan_limits').find({}).toArray();
  console.log(JSON.stringify(limits, null, 2));
  await client.close();
}
run();
