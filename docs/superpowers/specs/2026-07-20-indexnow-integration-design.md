# IndexNow Integration — Design

## Problem

Bing Webmaster Guidelines flag that this site has no IndexNow integration
(confirmed absent via repo-wide search — see the prior audit). Without it,
Bing only learns about new/changed/removed public pages on its own crawl
schedule, delaying indexing and grounding eligibility for new `/learn`
articles, scanner rule pages, and landing content.

## Goal

Automatically notify Bing's IndexNow API of the site's current public URL
set after every production deploy, using the API key already provided by
the user: `647d391cf7c14d1c86b286002a52e47d`.

Out of scope: per-content-change streaming submission (this site has no
runtime CMS/admin editor for public content — landing pages, `/learn`
articles, and scanner rule pages are all static code, changed only via
deploys, so deploy-time bulk submission is the correct granularity, not a
workaround).

## Key hosting

Add `public/647d391cf7c14d1c86b286002a52e47d.txt` containing exactly the
key string (no whitespace, no trailing newline beyond what a text editor
naturally adds). Next.js serves everything under `public/` at the matching
root path automatically, so this satisfies IndexNow's ownership-verification
requirement (`https://igrisradar.com/647d391cf7c14d1c86b286002a52e47d.txt`)
with zero route code.

## Submission mechanism

New script: `scripts/submit-indexnow.mjs`, run automatically via a
`postbuild` entry in `package.json` (fires after every `next build`, i.e.
every Vercel deploy, both production and preview — but see the production
guard below).

This script is standalone Node tooling, not application feature code, so
it does NOT use the `@/` import alias (that only resolves via Next.js's
bundler, not plain Node — confirmed this breaks for other standalone
scripts in this project). It also reads `process.env` directly rather
than importing `lib/env.js`, matching the existing precedent set by
`next.config.js`, which is also build tooling outside the app runtime.

Behavior:

1. **Production guard**: if `process.env.VERCEL_ENV !== 'production'`, log
   a one-line skip message and exit 0 immediately. This prevents preview
   deployments and local `yarn build` runs from submitting preview-domain
   or `localhost` URLs to Bing.
2. **Fetch the live sitemap**: `fetch(`${SITE_URL}/sitemap.xml`)` where
   `SITE_URL` comes from `process.env.NEXT_PUBLIC_SITE_URL` (falling back
   to `https://igrisradar.com`, matching `lib/env.js`'s existing default).
   This reads whatever sitemap is currently live — deliberately NOT the
   sitemap this build is about to produce, since that isn't reachable yet
   during the build step. New pages added in this deploy get submitted on
   the *next* deploy's postbuild run, a one-deploy lag that's acceptable
   given deploys happen far more often than Bing's own crawl cycle would
   otherwise refresh them anyway.
3. **Extract URLs**: parse `<loc>...</loc>` entries out of the fetched XML
   with a simple regex (no XML parser dependency needed for this narrow
   extraction — this project doesn't use one elsewhere either).
4. **Submit in one bulk POST** to `https://api.indexnow.org/indexnow` with
   JSON body:
   ```json
   {
     "host": "igrisradar.com",
     "key": "647d391cf7c14d1c86b286002a52e47d",
     "keyLocation": "https://igrisradar.com/647d391cf7c14d1c86b286002a52e47d.txt",
     "urlList": ["https://igrisradar.com/landing", "..."]
   }
   ```
   `host` and `keyLocation` are derived from the same `SITE_URL` used in
   step 2, not hardcoded, so this keeps working if the domain ever changes.
5. **Never fail the build**: wrap the fetch/submit logic in try/catch,
   log the outcome (success with URL count, or the error) via
   `console.error`/`console.log`, and always `process.exit(0)` — matching
   the "a mail failure can never break the primary operation" convention
   already established in `lib/email/mailer.js`. A failed IndexNow ping
   must never fail a deploy.

## `package.json` change

Add:
```json
"postbuild": "node scripts/submit-indexnow.mjs"
```

## Environment

`INDEXNOW_KEY` is not introduced as a required env var — the key is
hardcoded directly in `scripts/submit-indexnow.mjs` (and duplicated in the
`public/` filename), since IndexNow keys are not secrets (they must be
publicly retrievable by design) and this avoids a pointless indirection
for a single fixed value with no per-environment variance.

## Testing

No automated test framework in this project (matches existing convention).
Manual verification:
1. Run `node scripts/submit-indexnow.mjs` locally with
   `VERCEL_ENV=production` set explicitly, confirm it logs a skip if
   `NEXT_PUBLIC_SITE_URL` isn't reachable, or logs a successful submission
   count if pointed at the real live site.
2. Confirm `https://igrisradar.com/647d391cf7c14d1c86b286002a52e47d.txt`
   returns the raw key text once deployed.
3. After the next real Vercel production deploy, check the build logs for
   the postbuild step's output confirming submission succeeded.
4. Optionally cross-check via Bing Webmaster Tools' IndexNow submission
   history for the site, if the user has that dashboard access.
