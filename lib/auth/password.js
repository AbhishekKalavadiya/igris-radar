/**
 * lib/auth/password.js
 * Password hashing and verification using bcrypt.
 *
 * Architecture role: Identity & Access Management - credential layer.
 * Only used server-side (API routes). Never import in client components.
 */

import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 12;

/**
 * Hashes a plain-text password.
 * @param {string} plain
 * @returns {Promise<string>} bcrypt hash
 */
export async function hashPassword(plain) {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/**
 * Verifies a plain-text password against a bcrypt hash.
 * @param {string} plain
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plain, hash) {
  return bcrypt.compare(plain, hash);
}
