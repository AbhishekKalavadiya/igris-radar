# IndexNow Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically notify Bing's IndexNow API of the site's current public URL set after every production deploy, using the provided key `647d391cf7c14d1c86b286002a52e47d`.

**Architecture:** A static verification file in `public/` proves key ownership to Bing. A standalone CommonJS script (`scripts/submit-indexnow.js`, matching the existing `scripts/upgrade-user.js` convention in this repo — no `@/` alias, no ESM) fetches the live `/sitemap.xml`, extracts URLs, and POSTs them to IndexNow's bulk endpoint. It runs automatically via a `postbuild` npm script after every `next build` (i.e. every Vercel deploy), guarded to only fire in production.

**Tech Stack:** Node.js built-in `fetch` (Node 18+, no new dependency), CommonJS (`.js`, matching `scripts/upgrade-user.js`), npm `postbuild` lifecycle hook.

No automated test framework exists in this project. This plan uses manual verification steps, matching the convention already established for prior features in this repo.

---

### Task 1: Host the IndexNow verification key

**Files:**
- Create: `public/647d391cf7c14d1c86b286002a52e47d.txt`

- [ ] **Step 1: Create the file**

Create `public/647d391cf7c14d1c86b286002a52e47d.txt` with exactly this content (no extra whitespace, no trailing blank line beyond a single newline if your editor insists on one):

```
647d391cf7c14d1c86b286002a52e47d
```

- [ ] **Step 2: Verify locally**

Run: `yarn dev` (or confirm it's already running), then in a browser or via curl hit:
```bash
curl http://localhost:3000/647d391cf7c14d1c86b286002a52e47d.txt
```
Expected output: `647d391cf7c14d1c86b286002a52e47d` (exactly the key, nothing else — Next.js serves `public/` files verbatim at the matching root path).

- [ ] **Step 3: Commit**

```bash
git add public/647d391cf7c14d1c86b286002a52e47d.txt
git commit -m "feat: add IndexNow key verification file"
```

---

### Task 2: Write the IndexNow submission script

**Files:**
- Create: `scripts/submit-indexnow.js`

- [ ] **Step 1: Write the script**

Create `scripts/submit-indexnow.js` with exactly this content:

```js
const INDEXNOW_KEY = '647d391cf7c14d1c86b286002a52e47d';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://igrisradar.com';

/** Extracts <loc>...</loc> URLs out of a sitemap XML string. */
function extractSitemapUrls(xml) {
  const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
  return Array.from(matches, (m) => m[1].trim()).filter(Boolean);
}

async function main() {
  if (process.env.VERCEL_ENV !== 'production') {
    console.log('[indexnow] Skipping submission - VERCEL_ENV is not "production".');
    return;
  }

  const sitemapUrl = `${SITE_URL}/sitemap.xml`;
  const res = await fetch(sitemapUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch ${sitemapUrl}: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();
  const urlList = extractSitemapUrls(xml);

  if (urlList.length === 0) {
    throw new Error(`No <loc> URLs found in ${sitemapUrl}`);
  }

  const host = new URL(SITE_URL).host;
  const keyLocation = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

  const submitRes = await fetch('https://api.indexnow.org/indexnow', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation, urlList }),
  });

  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => '');
    throw new Error(`IndexNow submission failed: ${submitRes.status} ${submitRes.statusText} ${body}`);
  }

  console.log(`[indexnow] Submitted ${urlList.length} URLs successfully.`);
}

main().catch((error) => {
  console.error('[indexnow] Submission failed (non-fatal, build continues):', error.message);
});
```

Note this deliberately never calls `process.exit(1)` and the outer `.catch()` swallows all errors after logging — a failed IndexNow submission must never fail the build, matching the "never throws" convention already used by `lib/email/mailer.js`'s `sendEmail`.

- [ ] **Step 2: Verify the URL extraction logic in isolation**

Run this quick manual check (no test framework in this repo, so this is a throwaway verification, not a permanent test):

```bash
node -e "
const xml = '<urlset><url><loc>https://a.com/</loc></url><url><loc>https://b.com/</loc></url></urlset>';
const matches = xml.matchAll(/<loc>(.*?)<\/loc>/g);
const urls = Array.from(matches, (m) => m[1].trim()).filter(Boolean);
console.log(JSON.stringify(urls));
"
```
Expected output: `["https://a.com/","https://b.com/"]`

- [ ] **Step 3: Verify the production guard**

Run:
```bash
node scripts/submit-indexnow.js
```
(with `VERCEL_ENV` unset, which is the normal local case)
Expected output: `[indexnow] Skipping submission - VERCEL_ENV is not "production".` and the script exits cleanly (exit code 0, no error).

- [ ] **Step 4: Verify a real submission against the live site** (optional but recommended if the site is already deployed and its sitemap is reachable)

Run:
```bash
VERCEL_ENV=production node scripts/submit-indexnow.js
```
Expected: either `[indexnow] Submitted N URLs successfully.` (if the live `/sitemap.xml` and IndexNow's endpoint are both reachable) or a caught, logged error starting with `[indexnow] Submission failed` — either way, the process must exit with code 0. Confirm the exit code with `echo $?` (should print `0`) immediately after the command.

- [ ] **Step 5: Commit**

```bash
git add scripts/submit-indexnow.js
git commit -m "feat: add IndexNow bulk submission script"
```

---

### Task 3: Wire the script into the build via `postbuild`

**Files:**
- Modify: `package.json:5-12`

- [ ] **Step 1: Add the postbuild script**

Find in `package.json`:

```json
    "scripts": {
        "dev": "cross-env NODE_OPTIONS='--max-old-space-size=2048' next dev --hostname 0.0.0.0 --port 3000",
        "dev:lowmem": "cross-env NODE_OPTIONS='--max-old-space-size=512' next dev --hostname 0.0.0.0 --port 3000",
        "dev:no-reload": "next dev --hostname 0.0.0.0 --port 3000",
        "dev:webpack": "next dev --hostname 0.0.0.0 --port 3000",
        "build": "next build",
        "start": "next start"
    },
```

Change to:

```json
    "scripts": {
        "dev": "cross-env NODE_OPTIONS='--max-old-space-size=2048' next dev --hostname 0.0.0.0 --port 3000",
        "dev:lowmem": "cross-env NODE_OPTIONS='--max-old-space-size=512' next dev --hostname 0.0.0.0 --port 3000",
        "dev:no-reload": "next dev --hostname 0.0.0.0 --port 3000",
        "dev:webpack": "next dev --hostname 0.0.0.0 --port 3000",
        "build": "next build",
        "postbuild": "node scripts/submit-indexnow.js",
        "start": "next start"
    },
```

(Only the `postbuild` line is new — everything else in this block is unchanged.)

- [ ] **Step 2: Verify the JSON is valid and the hook fires**

Run:
```bash
node -e "console.log(require('./package.json').scripts.postbuild)"
```
Expected output: `node scripts/submit-indexnow.js`

Then run a local build to confirm npm/yarn actually invokes `postbuild` after `build` (this will attempt a real submission attempt if `VERCEL_ENV` happens to be set in your shell, or skip cleanly otherwise per Task 2's guard — either outcome is fine, you're only confirming the hook fires, not the network result):

```bash
yarn build
```
Expected: the build completes normally, and somewhere in the output after the Next.js build finishes you see either `[indexnow] Skipping submission...` or `[indexnow] Submitted N URLs...` / `[indexnow] Submission failed...` — confirming `postbuild` executed. The build's overall exit code must be `0` regardless of which IndexNow outcome occurred (`echo $?` after the command).

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "feat: run IndexNow submission automatically after production builds"
```

---

## Self-Review Notes (for the plan author, already applied above)

- Spec coverage: key hosting ✓ (Task 1), live-sitemap-fetch + bulk POST + never-fail-build behavior ✓ (Task 2), production-only guard ✓ (Task 2 Step 1's `VERCEL_ENV` check), automatic-on-deploy trigger via `postbuild` ✓ (Task 3), no new required env var / key hardcoded per spec's explicit decision ✓ (Task 2 uses a literal constant, not `process.env.INDEXNOW_KEY`), `host`/`keyLocation` derived from `SITE_URL` not hardcoded ✓ (Task 2's `new URL(SITE_URL).host` and template literal).
- Type consistency: the key string `647d391cf7c14d1c86b286002a52e47d` appears identically in Task 1's file content and Task 2's `INDEXNOW_KEY` constant — verified matching.
- No placeholders: all three tasks have complete, runnable code and exact verification commands with expected output.
- Module system check: `scripts/submit-indexnow.js` uses CommonJS style (no `import`/`export`, matching `scripts/upgrade-user.js`'s existing convention in this repo) and relies only on Node's built-in global `fetch` (available Node 18+) — no new dependency, no `@/` alias, avoiding the cross-environment import problems hit earlier with a different standalone script in this project.
