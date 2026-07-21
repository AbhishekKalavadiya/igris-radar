/**
 * lib/systemConfig.js
 * Admin-managed integration credentials, stored encrypted in MongoDB.
 *
 * Resolution order for every key: database (set via /admin → API Keys)
 * overrides the .env value. Values are AES-256-GCM encrypted at rest
 * (lib/crypto.js) and cached in-process for CACHE_TTL_MS so scan endpoints
 * don't hit the DB per request; saving keys invalidates the cache, so admin
 * changes apply immediately without a restart.
 */

import { v4 as uuidv4 } from 'uuid'
import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'
import { encryptSecret, decryptSecret } from '@/lib/crypto'
import { env } from '@/lib/env'

/**
 * Whitelist of keys the admin panel may manage. `envValue` is the .env
 * fallback (via lib/env.js - never process.env directly).
 */
export const MANAGED_KEYS = {
  GEMINI_API_KEY: {
    label: 'Google Gemini',
    group: 'AI Providers',
    description: 'Powers Deep AI Analysis, prompt coverage and sentiment analysis',
    envValue: () => env.geminiApiKey,
  },
  Z_AI_API_KEY: {
    label: 'Z.ai',
    group: 'AI Providers',
    description: 'Fallback for Gemini (Deep AI Analysis)',
    envValue: () => env.zaiApiKey,
  },
  OPENAI_API_KEY: {
    label: 'OpenAI',
    group: 'AI Providers',
    description: 'Deep Analysis provider option + brand visibility tracking (GPT)',
    envValue: () => env.openaiApiKey,
  },
  ANTHROPIC_API_KEY: {
    label: 'Anthropic Claude',
    group: 'AI Providers',
    description: 'Deep Analysis provider option + brand visibility tracking (Claude)',
    envValue: () => env.anthropicApiKey,
  },
  PERPLEXITY_API_KEY: {
    label: 'Perplexity',
    group: 'AI Providers',
    description: 'Brand visibility tracking on Perplexity',
    envValue: () => env.perplexityApiKey,
  },
  PAGESPEED_API_KEY: {
    label: 'Google PageSpeed',
    group: 'Integrations',
    description: 'Site Health performance and accessibility scans',
    envValue: () => env.pagespeedApiKey,
  },
  RESEND_API_KEY: {
    label: 'Resend',
    group: 'Email',
    description: 'Email delivery for alerts and digests (alternative to SMTP)',
    envValue: () => env.resendApiKey,
  },
}

const CACHE_TTL_MS = 30_000

/** @type {{values: Record<string, string|null>, at: number}|null} */
let cache = null

export function invalidateKeyCache() {
  cache = null
}

/** Loads all managed keys (DB overrides env) with a short in-process cache. */
async function loadAll() {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.values

  const values = {}
  let docs = []
  try {
    const col = await getCollection(COLLECTIONS.SYSTEM_CONFIG)
    docs = await col.find({ key: { $in: Object.keys(MANAGED_KEYS) } }).toArray()
  } catch (error) {
    console.error('[systemConfig] DB read failed, falling back to env:', error.message)
  }
  const byKey = Object.fromEntries(docs.map(d => [d.key, d]))

  for (const [key, def] of Object.entries(MANAGED_KEYS)) {
    let value = null
    if (byKey[key]?.valueEncrypted) {
      try {
        value = decryptSecret(byKey[key].valueEncrypted)
      } catch (error) {
        console.error(`[systemConfig] failed to decrypt ${key}:`, error.message)
      }
    }
    values[key] = value || def.envValue() || null
  }

  cache = { values, at: Date.now() }
  return values
}

/**
 * @param {keyof typeof MANAGED_KEYS} name
 * @returns {Promise<string|null>}
 */
export async function getKey(name) {
  const values = await loadAll()
  return values[name] ?? null
}

/**
 * @param {Array<keyof typeof MANAGED_KEYS>} names
 * @returns {Promise<Record<string, string|null>>}
 */
export async function getKeys(names) {
  const values = await loadAll()
  return Object.fromEntries(names.map(n => [n, values[n] ?? null]))
}

/**
 * Saves admin-provided keys. An empty string clears the DB entry (the key
 * falls back to its .env value). Unknown key names are rejected.
 * @param {Record<string, string>} updates
 * @returns {Promise<string[]>} the key names that were changed
 */
export async function setKeys(updates) {
  const invalid = Object.keys(updates).filter(k => !MANAGED_KEYS[k])
  if (invalid.length) {
    const err = new Error(`Unknown key(s): ${invalid.join(', ')}`)
    err.status = 400
    throw err
  }

  const col = await getCollection(COLLECTIONS.SYSTEM_CONFIG)
  const changed = []
  for (const [key, rawValue] of Object.entries(updates)) {
    const value = (rawValue || '').trim()
    if (!value) {
      const res = await col.deleteOne({ key })
      if (res.deletedCount > 0) changed.push(key)
      continue
    }
    await col.updateOne(
      { key },
      {
        $set: { valueEncrypted: encryptSecret(value), updatedAt: new Date() },
        $setOnInsert: { id: uuidv4(), key },
      },
      { upsert: true }
    )
    changed.push(key)
  }

  invalidateKeyCache()
  return changed
}

/**
 * Status list for the admin UI - never returns full values, only a masked
 * tail and where the active value comes from.
 * @returns {Promise<Array<{key: string, label: string, group: string, description: string, source: 'admin'|'env'|null, masked: string|null}>>}
 */
export async function getKeyStatuses() {
  let docs = []
  try {
    const col = await getCollection(COLLECTIONS.SYSTEM_CONFIG)
    docs = await col.find({ key: { $in: Object.keys(MANAGED_KEYS) } }).toArray()
  } catch (error) {
    console.error('[systemConfig] DB read failed:', error.message)
  }
  const byKey = Object.fromEntries(docs.map(d => [d.key, d]))

  return Object.entries(MANAGED_KEYS).map(([key, def]) => {
    let source = null
    let value = null
    if (byKey[key]?.valueEncrypted) {
      try {
        value = decryptSecret(byKey[key].valueEncrypted)
        source = 'admin'
      } catch {
        source = null
      }
    }
    if (!value && def.envValue()) {
      value = def.envValue()
      source = 'env'
    }
    return {
      key,
      label: def.label,
      group: def.group,
      description: def.description,
      source,
      masked: value ? `••••${value.slice(-4)}` : null,
    }
  })
}
