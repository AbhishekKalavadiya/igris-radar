/**
 * Immutable Audit Trails
 * Provides forensic logging of all significant actions, payloads, latencies, and policy outcomes.
 */

import { v4 as uuidv4 } from 'uuid'
import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'

/** Canonical audit action names for security-sensitive events (M4 / ISO A.8.15). */
export const AUDIT_ACTIONS = {
  LOGIN_SUCCESS:    'auth.login.success',
  LOGIN_FAILURE:    'auth.login.failure',
  LOGIN_LOCKED:     'auth.login.locked',
  SIGNUP:           'auth.signup',
  LOGOUT:           'auth.logout',
  PLAN_CHANGE:      'billing.plan.change',
  PASSWORD_CHANGE:  'auth.password.change',
  PASSWORD_RESET_REQUEST:  'auth.password.reset.request',
  PASSWORD_RESET_COMPLETE: 'auth.password.reset.complete',
  PROFILE_UPDATE:   'auth.profile.update',
  ACCOUNT_DELETE:   'auth.account.delete',
  SETTINGS_UPDATE:  'settings.update',
  API_KEY_CREATE:   'apikey.create',
  API_KEY_REVOKE:   'apikey.revoke',
  ADMIN_LOGIN:      'admin.login.success',
  ADMIN_LOGIN_FAIL: 'admin.login.failure',
  ADMIN_PLAN_EDIT:  'admin.plans.update',
  ADMIN_KEYS_EDIT:  'admin.keys.update',
}

/**
 * Best-effort client IP for audit context.
 * @param {Request} request
 * @returns {string}
 */
export function clientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

/**
 * Writes a security audit record to COLLECTIONS.AUDIT_LOGS. Never throws —
 * audit logging must not break the primary operation.
 *
 * @param {Object} entry
 * @param {string} entry.action    - one of AUDIT_ACTIONS
 * @param {string|null} [entry.userId]
 * @param {string|null} [entry.orgId]
 * @param {string} [entry.ip]
 * @param {Object} [entry.metadata]
 */
export async function audit({ action, userId = null, orgId = null, ip = 'unknown', metadata = {} }) {
  try {
    const col = await getCollection(COLLECTIONS.AUDIT_LOGS)
    await col.insertOne({
      id: uuidv4(),
      userId,
      orgId,
      action,
      ip,
      metadata,
      createdAt: new Date(),
    })
  } catch (err) {
    console.error('[audit] failed to write log:', err.message)
  }
}

/**
 * Logs a significant action to the database.
 * 
 * @param {import('mongodb').Db} db - The MongoDB database instance
 * @param {Object} options - The audit log parameters
 * @param {string} options.actor - Who performed the action (User ID, AI Model, System)
 * @param {string} options.action - The action performed (e.g., 'TOOL_CALL', 'DELETE_POLICY')
 * @param {Object} options.payload - The exact data/payload involved
 * @param {number} options.latencyMs - The time taken to execute or evaluate the action
 * @param {string} options.policyOutcome - The result ('ALLOW', 'DENY', 'ERROR')
 */
export async function logAuditAction(db, { actor, action, payload, latencyMs, policyOutcome }) {
  if (!db) return;
  
  try {
    const auditRecord = {
      actor,
      action,
      payload,
      latencyMs,
      policyOutcome,
      timestamp: new Date(),
      // Adding a cryptographic hash of the record contents ensures immutability.
      // If someone modifies the DB directly, the hash will no longer match the contents.
      hash: null 
    };

    // Calculate a simple verification hash for immutability check
    const crypto = require('crypto');
    const dataString = `${actor}:${action}:${JSON.stringify(payload)}:${latencyMs}:${policyOutcome}:${auditRecord.timestamp.getTime()}`;
    auditRecord.hash = crypto.createHash('sha256').update(dataString).digest('hex');

    await db.collection('audit_logs').insertOne(auditRecord);
    
    // In a highly secure system, we would also stream this to cold storage (e.g., S3 Glacier)
  } catch (error) {
    console.error('[Audit System] Failed to write audit log:', error);
    // Crucial: Security failure behavior. Do we fail open or closed?
    // Often audit failures require halting the operation to preserve forensic integrity.
  }
}
