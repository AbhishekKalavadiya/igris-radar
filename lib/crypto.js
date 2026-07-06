import crypto from 'crypto';
import { env } from './env';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * Gets the master encryption key from environment variables.
 * Falls back to a derived key from sessionSecret in development,
 * but in production it throws if not properly set.
 */
function getMasterKey() {
  const rawKey = process.env.ENCRYPTION_MASTER_KEY;
  if (rawKey && rawKey.length >= 32) {
    return Buffer.from(rawKey.substring(0, 32), 'utf-8');
  }
  
  if (env.isProd) {
    throw new Error('ENCRYPTION_MASTER_KEY must be a 32+ character string in production.');
  }

  // Fallback for dev
  return crypto.scryptSync(env.sessionSecret, 'salt', 32);
}

/**
 * Encrypts a plain text secret using AES-256-GCM
 * @param {string} text - The secret to encrypt
 * @returns {string} - The encrypted string format: iv:authTag:ciphertext
 */
export function encryptSecret(text) {
  if (!text) return text;
  
  const key = getMasterKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a ciphertext using AES-256-GCM
 * @param {string} encryptedText - The encrypted string format: iv:authTag:ciphertext
 * @returns {string} - The decrypted plain text secret
 */
export function decryptSecret(encryptedText) {
  if (!encryptedText || !encryptedText.includes(':')) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted text format');
    
    const [ivHex, authTagHex, ciphertextHex] = parts;
    const key = getMasterKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error.message);
    throw new Error('Failed to decrypt secret. Key mismatch or corrupted data.');
  }
}
