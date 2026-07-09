import { filterFindingsByPlan } from './lib/scanners/shared/findings.js';

const mockFindings = [
  { id: 'f1', category: 'SSL/TLS', severity: 'critical', title: 'HTTPS Enforced', description: 'desc', passed: true, remediation: 'rem', tier: 'free' },
  { id: 'f2', category: 'SSL/TLS', severity: 'critical', title: 'SSL Certificate Expiry', description: 'desc', passed: false, remediation: 'rem', tier: 'starter' },
  { id: 'f3', category: 'Infrastructure', severity: 'high', title: 'Open Port Scan (Common DB/Admin)', description: 'desc', passed: false, remediation: 'rem', tier: 'pro' },
  { id: 'f4', category: 'DNS Security', severity: 'medium', title: 'Threat Modeling Analysis', description: 'desc', passed: false, remediation: 'rem', tier: 'agency' }
];

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${message}`);
    failed++;
  }
}

console.log("--- Testing Plan Blur Logic ---");

const freeResults = filterFindingsByPlan(mockFindings, 'free');
assert(freeResults[0].locked === undefined, 'Free finding is NOT locked for free user');
assert(freeResults[1].locked === true, 'Starter finding IS locked for free user');
assert(freeResults[1].title.includes('Finding'), 'Starter finding title is blurred for free user');
assert(freeResults[2].locked === true, 'Pro finding IS locked for free user');
assert(freeResults[3].locked === true, 'Agency finding IS locked for free user');

const starterResults = filterFindingsByPlan(mockFindings, 'starter');
assert(starterResults[0].locked === undefined, 'Free finding is NOT locked for starter user');
assert(starterResults[1].locked === undefined, 'Starter finding is NOT locked for starter user');
assert(starterResults[1].title === 'SSL Certificate Expiry', 'Starter finding title is visible for starter user');
assert(starterResults[2].locked === true, 'Pro finding IS locked for starter user');

const proResults = filterFindingsByPlan(mockFindings, 'pro');
assert(proResults[1].locked === undefined, 'Starter finding is NOT locked for pro user');
assert(proResults[2].locked === undefined, 'Pro finding is NOT locked for pro user');
assert(proResults[2].title === 'Open Port Scan (Common DB/Admin)', 'Pro finding title is visible for pro user');
assert(proResults[3].locked === true, 'Agency finding IS locked for pro user');

const agencyResults = filterFindingsByPlan(mockFindings, 'agency');
assert(agencyResults[2].locked === undefined, 'Pro finding is NOT locked for agency user');
assert(agencyResults[3].locked === undefined, 'Agency finding is NOT locked for agency user');
assert(agencyResults[3].title === 'Threat Modeling Analysis', 'Agency finding title is visible for agency user');

const lockedFinding = freeResults[1];
assert(lockedFinding.severity === 'critical', 'Severity IS preserved on locked findings');
assert(lockedFinding.remediation === '', 'Remediation IS stripped from locked findings');
assert(lockedFinding.description === '', 'Description IS stripped from locked findings');

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
