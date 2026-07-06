import { v4 as uuidv4 } from 'uuid';

// Generate fingerprint ID
export function generateFingerprintId() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let id = 'CFP-2025-';
  for (let i = 0; i < 6; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Calculate security score based on real data
export function calculateSecurityScore(protectedContent = [], voiceRegistered = false, alerts = []) {
  let score = 50; // Base score
  
  // Add points for protected content
  const contentCount = protectedContent.length;
  score += Math.min(contentCount * 5, 25);
  
  // Add points for voice registration
  if (voiceRegistered) score += 15;
  
  // Subtract points for violations
  const violations = protectedContent.filter(c => 
    c.status === 'possible_match' || c.status === 'confirmed_violation'
  ).length;
  score -= violations * 10;

  // Subtract for unresolved alerts
  const pendingAlerts = alerts.filter(a => a.status === 'pending').length;
  score -= pendingAlerts * 5;
  
  return Math.max(0, Math.min(100, score));
}
