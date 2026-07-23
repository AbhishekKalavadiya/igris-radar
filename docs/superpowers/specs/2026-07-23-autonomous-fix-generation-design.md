# Autonomous Fix Generation — Design Spec

**Date:** 2026-07-23
**Status:** Approved (brainstorming complete, ready for implementation plan)
**Author:** Igris Radar team

---

## 1. Overview & Positioning

A **Pro-only** feature that turns each failed finding's `aiFixPrompt` from *a prompt
the user copies* into *a concrete, ready-to-apply fix artifact*.

The user clicks **"Generate Fix"** on a failed finding card, we call the existing AI
layer, and render a structured artifact: the exact code/content to apply, where to put
it, and how to verify it worked. The fix is **cached per finding** so re-opening the
report is instant and costs no tokens.

**Generate-only MVP:** no auto-deploy. The user pastes the fix into their own site.
This still crosses the L3→L4 perceptual line in the competitive positioning map — Igris
moves from "another AI scanner" toward "the tool that audits *and* fixes."

This is the first of three competitor-gap features (autonomous remediation,
share-of-voice tracking, real-prompt dataset). It builds directly on infrastructure
that already exists: every finding carries `aiFixPrompt` + `remediation`, and the app
already has plan tiers with `canAccessFeature`.

### Scope decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Delivery mechanism | **Generate-only** (artifact, no push) |
| Interaction model | **Per-finding, on-demand** |
| Persistence | **Cache per finding** in MongoDB |
| Gating | **Pro-only** headline feature |
| Output shape | **Structured artifact** (`summary`, `fixContent`, `language`, `whereToApply`, `verifyStep`) |
| Cached-fix loading | **Prefetch** — report page loads cached fixes and passes down as props |

---

## 2. Data Model

Cached fixes live in a **new collection**, `generated_fixes` — not embedded in scan
docs (scan docs are large and re-written on re-scan, which would clobber or bloat an
embedded fix). A separate collection keeps generation independent of the scan lifecycle
and gives a clean object for the future deploy-connector layer to consume.

Add to `lib/db/schemas.js` `COLLECTIONS`:

```js
GENERATED_FIXES: 'generated_fixes',
```

### Document shape (`GeneratedFixDoc`)

```
{
  id:           uuidv4(),
  userId:       string,          // isolation — always present
  scanType:     'seo'|'aeo'|'geo'|'aso'|'security'|'performance',
  scanId:       string,          // the scan this finding came from
  findingId:    string,          // finding.id
  findingTitle: string,          // denormalized for display / history
  category:     string,
  // ── the structured artifact (from AI) ──
  fix: {
    summary:      string,        // one line: what this fix does
    fixContent:   string,        // the exact code/text to apply
    language:     string,        // 'html'|'json'|'nginx'|'text'|... for syntax context
    whereToApply: string,        // "paste into <head> of your homepage"
    verifyStep:   string,        // "re-run the scan / check response header X"
  },
  provider:     string,          // which AI provider produced it
  createdAt:    Date,
  updatedAt:    Date,            // bumped on regenerate
}
```

### Cache key

Unique compound index on `(userId, scanType, scanId, findingId)`. Regenerate overwrites
the same doc (updates `fix` + `updatedAt`).

Including `userId` in the key means one user's generated fix is never served to another —
important because findings repeat across users scanning the same public URL.

---

## 3. API Endpoint & AI Prompt Contract

### Endpoints

Added to `app/api/[[...slug]]/route.js`, following existing `?path=` + response-envelope
conventions.

**Generate (or return cached):**
```
POST /api?path=generate-fix
body: { scanType, scanId, findingId, regenerate?: boolean }
```

**List cached fixes for a scan (prefetch):**
```
GET /api?path=generated-fixes&scanType=<type>&scanId=<id>
→ { success: true, data: GeneratedFixDoc[] }   // scoped to userId
```

### POST handler flow

1. `getSessionUser(request)` → 401 if no session.
2. Gate: `canAccessFeature(user.plan, 'autonomousFix')` → 403 `{ success:false, error:'Upgrade to Pro…' }` if not Pro.
3. Load the scan doc (by `scanType` + `scanId`, scoped to `userId`); find the finding by `findingId`. 404 if either missing; 400 if the finding **passed** (nothing to fix).
4. **Cache check:** unless `regenerate`, look up `generated_fixes` by the 4-part key. Hit → return stored `fix` immediately (no token spend).
5. **Miss / regenerate:** build the prompt, call `generateFix()`, parse structured JSON, upsert the doc, return `fix`.

### New lib module

`lib/scanners/shared/fixGenerator.js` (follows the DRY scanner-shared convention).

- Exports `generateFix(finding, { url, scanType, provider })`.
- Reuses `aiAnalyzer.js`'s `callAI` + `parseJsonObject` — these are currently module-private and will be **exported** for reuse.

### Prompt contract

The finding already carries `title`, `description`, `remediation`, `aiFixPrompt`,
`category`. The prompt feeds all of that plus the site URL, asking for strict JSON:

```
You are a senior web engineer producing a COPY-EXACT fix for one audit finding
on {url}. Return ONLY JSON, no markdown fences.

Finding: {title}
Problem: {description}
Recommended remediation: {remediation}
Category: {category} / Scan type: {scanType}

Return:
{
  "summary":      "One sentence: what this fix does.",
  "fixContent":   "The exact, ready-to-paste code or text. No placeholders unless the user MUST fill them, and if so use <CLEARLY_MARKED> tokens.",
  "language":     "html|json|nginx|apache|javascript|text|markdown",
  "whereToApply": "Precisely where this goes (file, tag, or dashboard location).",
  "verifyStep":   "How to confirm the fix worked."
}
```

Parsing reuses `parseJsonObject`. On parse failure the handler returns a 502-style
`{ success:false, error:'Could not generate a valid fix, please retry' }` and does
**not** cache the failure.

`fixContent` may contain clearly-marked placeholders (e.g. a domain the AI can't know)
rather than the AI hallucinating a value.

---

## 4. UI on the Finding Card

All changes live in `components/ui/AuditFindingCard.js` (the shared card — DRY, so every
scanner page benefits). Only the **failed, non-locked** branch changes; passed and locked
cards are untouched.

### Placement

The existing "Agent-Native Fix Prompt" block with its copy button **stays as-is** (free-tier
value). Directly beneath it, add the generate affordance.

### States

1. **Idle (Pro, no cached fix):** primary **"⚡ Generate Fix"** button (`Sparkles` icon, `text-primary` teal per Igris tokens).
2. **Loading:** disabled spinner, "Generating fix…". Single in-flight guard per finding.
3. **Rendered fix:** a `glass-subtle` panel showing the structured artifact:
   - `summary` as a one-line lead
   - **What to change** → `whereToApply`
   - `fixContent` in a `<code>` block with a copy button (reuse existing `copyToClipboard`), labeled with `language`
   - **Verify** → `verifyStep`
   - subtle **"Regenerate"** ghost button (POST with `regenerate:true`)
4. **Error:** inline `text-destructive` message + "Try again".
5. **Non-Pro user:** button renders with a `Lock` icon and label **"Generate Fix — Pro"**; click routes to `/plans` (mirrors the existing locked-card upgrade pattern). No API call is made.

### Data loading — prefetch

The scan report page, when it loads findings, also fetches all cached fixes for that scan
in one call (`GET /api?path=generated-fixes&scanType=&scanId=`) and passes each down as a
prop. Previously-generated fixes render immediately on report open.

The card stays **purely presentational**: the cached `fix` is passed as a prop, and the
generate handler is passed as a callback. The page owns the data.

---

## 5. Gating, Cost Control, Errors & Testing

### Gating
- New feature flag `autonomousFix` in the plan-features map (where `canAccessFeature` reads), `true` for `pro` only.
- Enforced server-side in **both** the POST and GET handlers. The UI lock is cosmetic; the API is the real gate.

### Cost control
- Cache-first: a generated fix costs tokens exactly once; every subsequent view is free.
- Client-side in-flight guard (no double-submit) **and** the server-side unique index (concurrent requests for the same finding can't create duplicates — second upsert overwrites).
- `regenerate:true` is the only path that re-spends tokens, and it is an explicit user action.

### Error handling (per CLAUDE.md envelope + existing route try/catch)
- 401 no session · 403 not Pro · 404 scan/finding missing · 400 finding already passed · 502-style on AI parse/timeout failure.
- Parse/timeout failures are **not cached** — retry stays clean.
- The AI layer's existing model-fallback + timeout budgets (from `aiAnalyzer`) are reused, so a single overloaded model won't fail the request.

### Testing
- **`fixGenerator.js` unit:** given a sample finding, the prompt includes title/description/remediation; a well-formed JSON response parses into the 5-field `fix` shape; a malformed response throws (and is not cached).
- **Endpoint integration:** non-Pro → 403; Pro cache-miss → generates + persists (mock AI); Pro cache-hit → returns stored doc with **zero** AI calls; passed finding → 400; `regenerate` → overwrites `updatedAt`.
- **Card render:** failed + Pro shows Generate button; loading/rendered/error states render; non-Pro shows locked variant and fires **no** fetch.

### Security review addendum (2026-07-23)

Verified against the codebase; these are binding requirements:

1. **Rate limit generation.** Cache-first only protects the first generation; `regenerate:true` is otherwise unbounded token spend. Add a `fix_gen` type to `lib/rateLimit.js` (10 requests / 10 min, keyed by `userId`) and check it in the POST handler before calling the AI. 429 on breach. (Known caveat: the store is in-memory per-instance — acceptable at current scale, same as all other limits.)
2. **Prompt-injection hardening.** Finding descriptions contain text scraped from the scanned site, which is attacker-controlled. The prompt must instruct the model to treat finding text strictly as data, and the handler must validate the parsed response: exactly the 5 known fields, all strings, `language` clamped to the allowlist (`html|json|nginx|apache|javascript|text|markdown`; anything else → `text`). The UI renders `fixContent` as plain text only — never `dangerouslySetInnerHTML`.
3. **Plan-flag plumbing.** Add `autonomousFix: false/false/true` (free/starter/pro) to `PLAN_LIMITS` defaults in `lib/constants.js` — `canAccessFeature` reads DB-backed limits seeded from there, and `getPlanLimits` backfills the new key into existing DB rows automatically. Use the existing `assertFeatureAccess(plan, 'autonomousFix')` (adds the consistent 403 + `upgradeRequired` envelope) and add an `autonomousFix` label to its `labels` map.
4. **Output size caps.** Before upsert: `fixContent` ≤ 20 KB, every other fix field ≤ 2 KB. Over-limit responses are treated as generation failures (not cached), same as parse failures.
5. **Input allowlisting.** `scanType` must match one of the 6 known scan types before any collection lookup; `scanId`/`findingId` must be non-empty strings. 400 otherwise.

### Out of scope (YAGNI)
Auto-deploy / connectors, bulk "fix all", metered quotas, non-Pro access, and fix version
history beyond the single latest doc. All deferred by scope decisions above; the collection
shape leaves room for them later.
