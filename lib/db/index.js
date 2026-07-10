/**
 * lib/db/index.js
 * MongoDB connection singleton.
 *
 * Architecture role: Data Layer - the only place that holds a DB connection.
 * All API routes and server utilities must import from here, never create
 * their own MongoClient instances.
 *
 * Pattern: singleton via global (development HMR-safe) / module-level (production).
 */

import { MongoClient } from 'mongodb'

const DB_NAME = process.env.DB_NAME || 'provenance'

/**
 * Lazily create (and memoise) the connection promise.
 *
 * IMPORTANT: nothing here runs at import time. Vercel imports route modules
 * during the build to collect page data, before runtime env vars are applied -
 * constructing a MongoClient with an undefined MONGO_URL there crashes the build
 * (`Cannot read properties of undefined (reading 'startsWith')`). Deferring until
 * the first getDb() call keeps the build clean and only requires MONGO_URL at
 * request time.
 */
function getClientPromise() {
  const MONGO_URL = process.env.MONGO_URL
  if (!MONGO_URL) {
    throw new Error('[DB] MONGO_URL is not set. Set it in your environment (Vercel project settings / .env.local).')
  }

  if (process.env.NODE_ENV === 'development') {
    // In dev, preserve the connection across HMR reloads via global.
    if (!global._mongoClientPromise) {
      global._mongoClientPromise = new MongoClient(MONGO_URL).connect()
    }
    return global._mongoClientPromise
  }

  // In production, memoise a single module-level connection.
  if (!clientPromise) {
    clientPromise = new MongoClient(MONGO_URL).connect()
  }
  return clientPromise
}

let clientPromise

/**
 * Returns the connected Db instance.
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDb() {
  const client = await getClientPromise()
  return client.db(DB_NAME)
}

/**
 * Returns a typed collection handle.
 * @param {string} name - Collection name (use COLLECTIONS constants)
 * @returns {Promise<import('mongodb').Collection>}
 */
export async function getCollection(name) {
  const db = await getDb()
  return db.collection(name)
}

// Lazy accessor for the raw connection promise (no eager connect at import).
export default getClientPromise
