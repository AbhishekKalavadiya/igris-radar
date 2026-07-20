# Sitemap Freshness (real `lastModified`) — Design

## Problem

`app/sitemap.js` sets `lastModified: now` (the timestamp at the moment the
sitemap is generated) on every single entry, for every request/build. This
defeats the purpose of the `lastmod` freshness signal Bing's guidelines
call out explicitly: every URL always claims to have "just changed," which
is indistinguishable from a URL that changed a year ago.

## Goal

Replace the fake `now` timestamp with each page's real last-git-commit
date, derived at sitemap-generation time. No manual date bookkeeping, no
new CMS/metadata system — just read the truth that already exists in git
history.

Out of scope: per-content granularity finer than the file level (e.g. a
single rule inside `lib/scannerExplanations.js` changing shouldn't need
its own tracked date — the whole file's last-commit date is an honest,
if coarse, proxy for "this content was reviewed/edited on this date").

## Helper: `lib/gitLastModified.js`

This project's `lib/*.js` files use ESM (`import`/`export`) throughout, so
this helper follows that convention rather than CommonJS:

```js
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
```

This mirrors the "never throws" convention already established in this
codebase (`lib/email/mailer.js`'s `sendEmail`, `lib/scanAnalytics.js`'s
per-collection error isolation) — a git lookup failure (no `.git` in a
shallow-cloned build container, file renamed, etc.) must never break the
sitemap route.

## `app/sitemap.js` changes

Replace the single shared `now` with per-entry lookups mapped to each
page's real source file:

| Sitemap entry | Source file passed to `getLastModified` |
|---|---|
| `/landing` | `app/landing/page.js` |
| `/landing/features/<slug>` (all 6) | `lib/landingContent.js` (shared config file where feature content actually lives — coarser than per-feature, since all 6 features' content lives in one file, but still a real, honest date rather than a fake one) |
| `/learn` | `app/learn/page.js` |
| `/learn/rules` | `app/learn/rules/page.js` |
| every other `/learn/<slug>` in `LEARN_PAGES` | `app/learn/${slug}/page.js` |
| every rule page (`/learn/rules/<slug>`, 100+) | `lib/scannerExplanations.js` (shared source of all rule text — computed ONCE via `getLastModified`, then reused for all 100+ entries, not looked up per-rule, since it's the same file for all of them and re-running `git log` 100+ times for an identical answer is wasteful) |
| `/landing/about` | `app/landing/about/page.js` |
| `/landing/contact` | `app/landing/contact/page.js` |
| `/landing/terms` | `app/landing/terms/page.js` |
| `/landing/privacy` | `app/landing/privacy/page.js` |

The `LEARN_PAGES` array currently mixes `'/learn'` and `'/learn/rules'` in
with the article slugs. Add a small local helper inside `app/sitemap.js`
that maps a `LEARN_PAGES` entry to its file path:

```js
function learnPageFile(path) {
  if (path === '/learn') return 'app/learn/page.js'
  if (path === '/learn/rules') return 'app/learn/rules/page.js'
  return `app${path}/page.js` // '/learn/what-is-a-canonical-tag' -> 'app/learn/what-is-a-canonical-tag/page.js'
}
```

`changeFrequency` and `priority` values are unchanged — this spec only
touches `lastModified`.

## Performance

`sitemap.js` is a static Next.js route by default (no `export const
dynamic`), so this runs once at build time, not per-request. Total git
subprocess calls: 1 (`/landing`) + 1 (`lib/landingContent.js`, reused for
all 6 feature entries) + ~12 (`LEARN_PAGES` entries) + 1
(`lib/scannerExplanations.js`, reused for all 100+ rule entries) + 4
(about/contact/terms/privacy) ≈ 20 total `execSync` calls at build time.
Cheap, no caching layer needed.

## Risk: shallow clones in CI/Vercel builds

If Vercel's build container does a shallow git clone that doesn't include
the commit that last touched a given file, `git log -1 -- <path>` returns
empty output, and `getLastModified` falls back to `fallback` (defaults to
`new Date()` — today's date, same as current behavior for that one entry).
This is a graceful degradation, not a crash: worst case, some entries fall
back to "now" exactly like today, while others get a real historical date.

## Testing

No automated test framework in this project. Manual verification:
1. Run `yarn dev` and hit `http://localhost:3000/sitemap.xml`, confirming
   `<lastmod>` values differ across URLs (not all identical to the second)
   and are plausible dates (not in the future, not epoch-zero).
2. Confirm `yarn build` still completes successfully with the new sitemap
   logic in place.
3. The shallow-clone fallback path (git lookup failing) is a defensive
   branch, not something this repo can currently reproduce locally (it's
   always a full git repo in dev) — it's covered by code review/inspection
   rather than a live repro.
