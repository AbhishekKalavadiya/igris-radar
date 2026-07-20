# Sitemap Freshness (real `lastModified`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace `app/sitemap.js`'s fake `lastModified: now` (identical on every entry, every time) with each page's real last-git-commit date, so Bing's `lastmod` freshness signal is trustworthy.

**Architecture:** A new helper `lib/gitLastModified.js` runs `git log -1` on a given file path to get its real last-commit date, falling back to `new Date()` if git is unavailable or the file has no history (never throws). `app/sitemap.js` is updated to map each sitemap entry to its real source file and call this helper instead of using one shared `now` timestamp.

**Tech Stack:** Node.js built-in `child_process.execSync`, ESM (`import`/`export`, matching every other `lib/*.js` file in this project).

No automated test framework exists in this project. This plan uses manual verification steps, matching the convention established for prior features in this repo.

---

### Task 1: `lib/gitLastModified.js` helper

**Files:**
- Create: `lib/gitLastModified.js`

- [ ] **Step 1: Write the helper**

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

- [ ] **Step 2: Verify against real git history**

Run (from the project root):
```bash
node -e "
import('./lib/gitLastModified.js').then(({ getLastModified }) => {
  console.log('app/learn/page.js:', getLastModified('app/learn/page.js'));
  console.log('nonexistent-file.js:', getLastModified('nonexistent-file.js', new Date('2020-01-01')));
});
"
```
Expected: the first line prints a real, plausible date (should be very
recent, since `app/learn/page.js` was just modified in this session's
canonical-URL fix) — NOT today's exact current second (unless you happen
to run this within the same minute as that prior commit). The second line
prints `2020-01-01T00:00:00.000Z` (the fallback), since `git log` returns
empty output for a file that was never committed.

- [ ] **Step 3: Verify the fallback path explicitly**

Run:
```bash
node -e "
import('./lib/gitLastModified.js').then(({ getLastModified }) => {
  const fallback = new Date('2099-01-01');
  const result = getLastModified('definitely-does-not-exist.xyz', fallback);
  console.log(result.toISOString() === fallback.toISOString() ? 'PASS' : 'FAIL: ' + result);
});
"
```
Expected output: `PASS`

- [ ] **Step 4: Commit**

```bash
git add lib/gitLastModified.js
git commit -m "feat: add git-derived last-modified date helper"
```

---

### Task 2: Wire real dates into `app/sitemap.js`

**Files:**
- Modify: `app/sitemap.js` (full file, shown below for exact before/after since nearly every line changes)

- [ ] **Step 1: Read the current file to confirm it hasn't changed**

Read `app/sitemap.js` and confirm it currently matches this content:

```js
import { SITE_URL } from '@/lib/seo'
import { FINDING_EXPLANATIONS } from '@/lib/scannerExplanations'
import { slugify } from '@/lib/slugify'

const FEATURE_SLUGS = [
  'security-scanner',
  'seo-audit',
  'aeo-audit',
  'geo-audit',
  'brand-visibility',
  'site-health',
]

const LEARN_PAGES = [
  '/learn',
  '/learn/understanding-domain-reputation-for-email-security',
  '/learn/what-is-a-dmarc-policy',
  '/learn/what-is-an-spf-record',
  '/learn/what-is-an-ssl-certificate',
  '/learn/what-is-a-404-error-and-how-it-affects-aeo',
  '/learn/optimizing-content-for-llm-crawlers',
  '/learn/what-is-a-knowledge-graph',
  '/learn/brand-entity-recognition-in-generative-ai',
  '/learn/core-web-vitals-and-ranking-factors',
  '/learn/what-is-a-canonical-tag',
  '/learn/rules'
]

/** Serves /sitemap.xml with every indexable public page. */
export default function sitemap() {
  const now = new Date()

  // Generate sitemap entries for all 100+ scanner rules
  const rulePages = Object.keys(FINDING_EXPLANATIONS).map((rule) => ({
    url: `${SITE_URL}/learn/rules/${slugify(rule)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const learnPages = LEARN_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: `${SITE_URL}/landing`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...FEATURE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/landing/features/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    ...learnPages,
    ...rulePages,
    { url: `${SITE_URL}/landing/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/landing/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
```

If it doesn't match exactly (e.g. line numbers or content differ), STOP
and report BLOCKED with the actual current content rather than guessing
how to adapt.

- [ ] **Step 2: Replace the full file content**

Replace the entire file with:

```js
import { SITE_URL } from '@/lib/seo'
import { FINDING_EXPLANATIONS } from '@/lib/scannerExplanations'
import { slugify } from '@/lib/slugify'
import { getLastModified } from '@/lib/gitLastModified'

const FEATURE_SLUGS = [
  'security-scanner',
  'seo-audit',
  'aeo-audit',
  'geo-audit',
  'brand-visibility',
  'site-health',
]

const LEARN_PAGES = [
  '/learn',
  '/learn/understanding-domain-reputation-for-email-security',
  '/learn/what-is-a-dmarc-policy',
  '/learn/what-is-an-spf-record',
  '/learn/what-is-an-ssl-certificate',
  '/learn/what-is-a-404-error-and-how-it-affects-aeo',
  '/learn/optimizing-content-for-llm-crawlers',
  '/learn/what-is-a-knowledge-graph',
  '/learn/brand-entity-recognition-in-generative-ai',
  '/learn/core-web-vitals-and-ranking-factors',
  '/learn/what-is-a-canonical-tag',
  '/learn/rules'
]

/** Maps a LEARN_PAGES entry to the source file that holds its content. */
function learnPageFile(path) {
  if (path === '/learn') return 'app/learn/page.js'
  if (path === '/learn/rules') return 'app/learn/rules/page.js'
  return `app${path}/page.js`
}

/** Serves /sitemap.xml with every indexable public page. */
export default function sitemap() {
  const landingModified = getLastModified('app/landing/page.js')
  const featuresModified = getLastModified('lib/landingContent.js')
  const rulesContentModified = getLastModified('lib/scannerExplanations.js')
  const aboutModified = getLastModified('app/landing/about/page.js')
  const contactModified = getLastModified('app/landing/contact/page.js')
  const termsModified = getLastModified('app/landing/terms/page.js')
  const privacyModified = getLastModified('app/landing/privacy/page.js')

  // Generate sitemap entries for all 100+ scanner rules - all share the
  // same source file (lib/scannerExplanations.js), so the git lookup runs
  // once above and is reused here rather than once per rule.
  const rulePages = Object.keys(FINDING_EXPLANATIONS).map((rule) => ({
    url: `${SITE_URL}/learn/rules/${slugify(rule)}`,
    lastModified: rulesContentModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const learnPages = LEARN_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: getLastModified(learnPageFile(path)),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: `${SITE_URL}/landing`, lastModified: landingModified, changeFrequency: 'weekly', priority: 1 },
    ...FEATURE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/landing/features/${slug}`,
      lastModified: featuresModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    ...learnPages,
    ...rulePages,
    { url: `${SITE_URL}/landing/about`, lastModified: aboutModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/contact`, lastModified: contactModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/terms`, lastModified: termsModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/landing/privacy`, lastModified: privacyModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
```

Note: `learnPages` calls `getLastModified` inline once per `LEARN_PAGES`
entry (12 entries, 12 distinct files) rather than hoisting each one to a
named variable like the other groups — this is intentional, since there
are too many distinct files to name individually without heavy
boilerplate, and each is a genuinely distinct file (unlike the feature
pages and rule pages, which share one file each and are hoisted to avoid
redundant identical git lookups).

- [ ] **Step 3: Manually verify the sitemap output**

Run `yarn dev`, then in a browser or via curl:
```bash
curl http://localhost:3000/sitemap.xml
```
Confirm:
1. The command succeeds and returns valid XML (starts with `<?xml` or
   `<urlset`).
2. Multiple different `<lastmod>` values appear across the output (not
   every single one identical) — run:
   ```bash
   curl -s http://localhost:3000/sitemap.xml | grep -o '<lastmod>[^<]*</lastmod>' | sort -u
   ```
   Expected: more than one distinct value in the output (proving dates
   now vary by page rather than all being the same request-time `now`).
3. None of the dates are in the future or obviously wrong (e.g. year
   1970) — spot check a few values visually.

- [ ] **Step 4: Verify the build still succeeds**

Run:
```bash
yarn build
```
Expected: build completes successfully (exit code 0), no new errors
introduced by the sitemap changes. (This will also trigger the
`postbuild` IndexNow script from a prior feature — that's expected and
unrelated to this task; it will either submit or skip per its own
`VERCEL_ENV` guard, and either outcome is fine here.)

- [ ] **Step 5: Commit**

```bash
git add app/sitemap.js
git commit -m "feat: derive sitemap lastModified dates from git history"
```

---

## Self-Review Notes (for the plan author, already applied above)

- Spec coverage: helper with fallback ✓ (Task 1), per-entry file mapping
  table from the spec ✓ (Task 2's hoisted variables + `learnPageFile`
  helper), shared-file dedup for feature pages and rule pages (computed
  once, reused) ✓, `changeFrequency`/`priority` left unchanged ✓ (spec
  said this touches only `lastModified` — confirmed unchanged in Task 2's
  replacement content).
- Type consistency: `getLastModified(relativePath, fallback)` signature
  defined in Task 1 is called consistently in Task 2 with the same
  parameter order and no third argument (all calls use the default
  fallback of `new Date()`), matching the spec's examples.
- No placeholders: both tasks have complete, runnable code and exact
  verification commands with expected output.
