/**
 * lib/dodo.js
 * Shared Dodo Payments helpers - the single place that builds a DodoPayments
 * client and resolves a user's Dodo customer id. Route handlers must import
 * from here rather than newing up their own client (DRY + consistent env mode).
 */

import DodoPayments from 'dodopayments';
import { getCollection } from '@/lib/db';
import { COLLECTIONS } from '@/lib/db/schemas';
import { env } from '@/lib/env';

/**
 * Build a DodoPayments client bound to the configured environment.
 * @returns {DodoPayments}
 * @throws {Error} status 503 when no API key is configured.
 */
export function getDodoClient() {
  if (!env.dodoApiKey) {
    const err = new Error('Payment provider is not configured.');
    err.status = 503;
    throw err;
  }
  return new DodoPayments({
    bearerToken: env.dodoApiKey,
    environment: env.dodoEnv,
  });
}

/**
 * Look up the Dodo customer id stored on a user (set by the webhook on first
 * payment). Returns null when the user has never paid.
 * @param {string} userId
 * @returns {Promise<string|null>}
 */
export async function getDodoCustomerId(userId) {
  const usersCol = await getCollection(COLLECTIONS.USERS);
  const user = await usersCol.findOne({ id: userId }, { projection: { dodoCustomerId: 1 } });
  return user?.dodoCustomerId || null;
}
