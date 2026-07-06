import crypto from 'crypto';

/**
 * Generates a new API key and its corresponding SHA-256 hash.
 * 
 * @returns {Object} An object containing the raw key (to show to the user once) 
 *                   and the hashed key (to store in the database).
 */
export function generateApiKey() {
  const rawKey = `prov_${crypto.randomBytes(32).toString('base64url')}`;
  const hashedKey = hashApiKey(rawKey);
  return { rawKey, hashedKey };
}

/**
 * Hashes an API key using SHA-256 for secure storage and comparison.
 * 
 * @param {string} rawKey - The raw API key provided by the user in the Authorization header.
 * @returns {string} The SHA-256 hash of the API key.
 */
export function hashApiKey(rawKey) {
  if (!rawKey) return null;
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

/**
 * Validates a provided raw API key against a stored hash.
 * 
 * @param {string} rawKey - The raw API key to check.
 * @param {string} storedHash - The previously stored SHA-256 hash.
 * @returns {boolean} True if the key matches the hash.
 */
export function validateApiKey(rawKey, storedHash) {
  if (!rawKey || !storedHash) return false;
  const hash = hashApiKey(rawKey);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch (e) {
    // If lengths differ or strings are invalid hex, timingSafeEqual throws
    return false;
  }
}
