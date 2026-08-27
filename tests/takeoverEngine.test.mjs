/**
 * tests/takeoverEngine.test.mjs
 * Unit and integration tests for Subdomain Takeover & Dangling DNS Engine.
 */

import assert from 'node:assert/strict';
import { CLOUD_TAKEOVER_SIGNATURES, evaluateHostTakeover, runTakeoverAudit } from '../lib/scanners/shared/takeoverEngine.mjs';
import { discoverSubdomains } from '../lib/scanners/shared/subdomainDiscovery.mjs';

console.log('🧪 Running Subdomain Takeover & Dangling DNS Engine Tests...\n');

// Test 1: Signature Database Integrity
console.log('Test 1: Verifying signature database...');
assert(Array.isArray(CLOUD_TAKEOVER_SIGNATURES), 'Signatures must be an array');
assert(CLOUD_TAKEOVER_SIGNATURES.length >= 20, `Expected at least 20 signatures, got ${CLOUD_TAKEOVER_SIGNATURES.length}`);

for (const sig of CLOUD_TAKEOVER_SIGNATURES) {
  assert(sig.name, 'Each signature must have a name');
  assert(Array.isArray(sig.patterns) && sig.patterns.length > 0, `Signature ${sig.name} must have patterns`);
  assert(Array.isArray(sig.fingerprints) && sig.fingerprints.length > 0, `Signature ${sig.name} must have fingerprints`);
  assert(typeof sig.remediation === 'string' && sig.remediation.length > 0, `Signature ${sig.name} must have remediation`);
}
console.log(`✅ Passed: ${CLOUD_TAKEOVER_SIGNATURES.length} cloud service signatures validated.\n`);

// Test 2: Direct Host / IP Evaluation
console.log('Test 2: Testing direct host evaluation without CNAME...');
const directHostResult = await evaluateHostTakeover('example.com', []);
assert.strictEqual(directHostResult.recordType === 'A' || directHostResult.recordType === 'NONE', true);
assert.strictEqual(directHostResult.isVulnerable, false);
assert.strictEqual(directHostResult.isDangling, false);
console.log('✅ Passed: Direct host correctly evaluated as non-vulnerable.\n');

// Test 3: Batch RunTakeoverAudit
console.log('Test 3: Testing batch runTakeoverAudit...');
const mockAssets = [
  { host: 'www.example.com', cnames: [], ips: ['93.184.216.34'] },
  { host: 'api.example.com', cnames: [], ips: ['93.184.216.35'] },
];

const batchResult = await runTakeoverAudit(mockAssets, 2);
assert.strictEqual(batchResult.totalScanned, 2);
assert.strictEqual(typeof batchResult.vulnerableCount, 'number');
assert.strictEqual(typeof batchResult.danglingCount, 'number');
assert.strictEqual(typeof batchResult.secureCount, 'number');
assert.strictEqual(batchResult.assets.length, 2);
console.log('✅ Passed: Batch takeover audit completed successfully.\n');

// Test 4: Subdomain Discovery Function Shape
console.log('Test 4: Testing subdomainDiscovery interface...');
assert.strictEqual(typeof discoverSubdomains, 'function');
console.log('✅ Passed: Subdomain discovery module exported properly.\n');

console.log('🎉 All Subdomain Takeover & Dangling DNS Radar tests PASSED successfully!');
