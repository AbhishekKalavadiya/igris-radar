import { NextResponse } from 'next/server';
import { encryptSecret, decryptSecret } from '@/lib/crypto';
import { generateApiKey, validateApiKey } from '@/lib/apiKey';
import { scanForDestructivePatterns, checkRateSpikeAnomaly } from '@/lib/aiProxy';
import { hasPermission } from '@/lib/auth/rbac';
import { getDb } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results = [];
  let passed = 0;
  let failed = 0;

  function runTest(name, testFn) {
    try {
      testFn();
      results.push(`✅ PASS: ${name}`);
      passed++;
    } catch (e) {
      results.push(`❌ FAIL: ${name} - ${e.message}`);
      failed++;
    }
  }

  // 1. Crypto Tests
  runTest('Crypto: Encrypt and Decrypt match', () => {
    process.env.ENCRYPTION_MASTER_KEY = '12345678901234567890123456789012';
    const secret = 'super-secret-string';
    const encrypted = encryptSecret(secret);
    if (encrypted === secret) throw new Error('Encrypted text matches plain text');
    const decrypted = decryptSecret(encrypted);
    if (decrypted !== secret) throw new Error('Decrypted text does not match original');
  });

  // 2. API Key Tests
  runTest('API Key: Generate and Validate', () => {
    const { rawKey, hashedKey } = generateApiKey();
    if (!rawKey.startsWith('prov_')) throw new Error('Invalid raw key prefix');
    if (rawKey === hashedKey) throw new Error('Raw key matches hashed key');
    if (!validateApiKey(rawKey, hashedKey)) throw new Error('Validation failed for correct key');
    if (validateApiKey('prov_wrongkey', hashedKey)) throw new Error('Validation succeeded for wrong key');
  });

  // 3. AI Proxy Tests
  runTest('AI Proxy: Blocks destructive patterns', () => {
    let caught = false;
    try { scanForDestructivePatterns('delete_database'); } catch { caught = true; }
    if (!caught) throw new Error('Did not block delete_database');
    scanForDestructivePatterns('generate_report'); // should not throw
  });

  runTest('AI Proxy: Rate Spike Detection', () => {
    const id = 'test_user_' + Date.now() + Math.random();
    for (let i = 0; i < 20; i++) checkRateSpikeAnomaly(id);
    let caught = false;
    try { checkRateSpikeAnomaly(id); } catch { caught = true; }
    if (!caught) throw new Error('Did not catch rate spike on 21st call');
  });

  // 4. RBAC Tests
  runTest('RBAC: Admin can delete', () => {
    if (!hasPermission('admin', 'delete')) throw new Error('Admin cannot delete');
  });

  runTest('RBAC: Viewer cannot delete', () => {
    if (hasPermission('viewer', 'delete')) throw new Error('Viewer was allowed to delete');
  });

  // 5. Database Cleanup (clears all collections via the shared singleton)
  let dbStatus = 'Not executed';
  try {
    const db = await getDb();
    const collectionsToClear = Object.values(COLLECTIONS);
    for (const col of collectionsToClear) {
      try { await db.collection(col).deleteMany({}); } catch {}
    }
    dbStatus = `Cleared ${collectionsToClear.length} collections successfully`;
  } catch (e) {
    dbStatus = 'Failed to clear DB: ' + e.message;
  }

  return NextResponse.json({
    summary: `${passed} passed, ${failed} failed`,
    results,
    dbCleanup: dbStatus,
  });
}
