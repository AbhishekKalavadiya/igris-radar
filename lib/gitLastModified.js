import { execSync } from 'child_process'

/**
 * Returns the last git-commit date for a file, or `fallback` if git is
 * unavailable, the file has no history in a shallow clone, or any other
 * lookup failure occurs. Never throws.
 * @param {string} relativePath - path relative to the repo root, e.g. 'app/learn/page.js'
 * @param {Date} [fallback] - defaults to now
 * @returns {Date}
 */
export function getLastModified(relativePath, fallback = new Date()) {
  try {
    const output = execSync(`git log -1 --format=%cI -- "${relativePath}"`, {
      encoding: 'utf-8',
      cwd: process.cwd(),
    }).trim()
    if (!output) return fallback
    const date = new Date(output)
    return Number.isNaN(date.getTime()) ? fallback : date
  } catch {
    return fallback
  }
}
