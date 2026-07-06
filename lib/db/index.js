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

const MONGO_URL = process.env.MONGO_URL
const DB_NAME   = process.env.DB_NAME || 'provenance'

if (!MONGO_URL) {
  // In production this will have been caught by lib/env.js already.
  // Here we emit a clear message for local setup.
  if (process.env.NODE_ENV !== 'test') {
    console.warn('[DB] MONGO_URL is not set. Database operations will fail.')
  }
}

let clientPromise

if (process.env.NODE_ENV === 'development') {
  // In dev, preserve the connection across HMR reloads via global.
  if (!global._mongoClientPromise) {
    const client = new MongoClient(MONGO_URL || 'mongodb://localhost:27017')
    global._mongoClientPromise = client.connect()
  }
  clientPromise = global._mongoClientPromise
} else {
  // In production, create a fresh module-level connection.
  const client = new MongoClient(MONGO_URL)
  clientPromise = client.connect()
}

/**
 * Returns the connected Db instance.
 * @returns {Promise<import('mongodb').Db>}
 */
export async function getDb() {
  const client = await clientPromise
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

export default clientPromise
