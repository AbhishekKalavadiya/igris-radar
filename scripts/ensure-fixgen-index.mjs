import { MongoClient } from 'mongodb';

const url = process.env.MONGO_URL || 'mongodb://localhost:27017';
const dbName = process.env.DB_NAME || 'provenance';

try {
  const client = await new MongoClient(url).connect();
  await client.db(dbName).collection('generated_fixes')
    .createIndex({ userId: 1, scanType: 1, scanId: 1, findingId: 1 }, { unique: true });
  console.log('generated_fixes unique index ensured');
  await client.close();
} catch (err) {
  console.error('Failed to ensure generated_fixes index:', err.message);
}
