# Provenance — Claude Instructions

This file is the authoritative guide for developing the Provenance project.
Read it fully before writing any code. These rules override Claude's defaults.

---

## 1. Project Overview

**Provenance** is a SaaS AI content security platform. It protects AI-generated
content (text, images, audio, video) through:

- **Digital fingerprinting** — unique ID per content piece, AI-analysed
- **Web scanning** — finds unauthorized copies across the internet
- **Voice & likeness monitoring** — detects voice clones on YouTube, TikTok, SoundCloud
- **Legal reporting** — generates DMCA notices and violation reports

**Framework:** Next.js 14 (App Router, `app/` directory), client components only (`'use client'`)
**Database:** MongoDB via `mongodb` driver (no ORM)
**Styling:** Tailwind CSS + shadcn/ui (Radix primitives)
**AI:** Google Gemini (`@google/generative-ai`), Google Cloud Vision, Custom Search

---

## 2. Architecture

The project follows a modular pipeline architecture inspired by the enterprise
architecture document (`architecture-overview.html`). Each module has one clear
responsibility.

```
User Request
    │
    ▼
middleware.js          ← Identity & Access Management gateway
    │                     Checks session cookie, gates protected routes
    ▼
app/page.js            ← Home redirect logic (auth state → correct page)
    │
    ├── app/landing/   ← Public marketing (no auth)
    ├── app/login/     ← Auth routes
    ├── app/signup/
    ├── app/onboarding/
    │
    └── app/dashboard/ ─┐
    app/fingerprint/    ├── Protected pages (require session cookie)
    app/voice-monitor/  │   All wrapped in DashboardLayout
    app/reports/        │
    app/settings/      ─┘
         │
         ▼
    app/api/[[...path]]/route.js   ← Backend Gateway
         │
         ├── lib/db/index.js       ← Data Layer (MongoDB singleton)
         ├── lib/gemini.js         ← Content Security Engine (AI fingerprinting)
         ├── lib/googleApis.js     ← Web scanning (Vision + Custom Search)
         └── lib/auth/             ← Identity & Access Management (sessions, RBAC)
```

### Module Responsibilities

| Module | File(s) | Role |
|---|---|---|
| **Identity & Access** | `middleware.js`, `lib/auth/session.js`, `lib/auth/rbac.js`, `lib/authContext.js` | Who can access what |
| **Data Layer** | `lib/db/index.js`, `lib/db/schemas.js` | All database operations |
| **Content Security Engine** | `lib/gemini.js`, `lib/googleApis.js` | AI fingerprinting + web detection |
| **Backend Gateway** | `app/api/[[...path]]/route.js` | REST API — handles all client requests |
| **UI** | `app/`, `components/` | Presentation only — no business logic |
| **Constants** | `lib/constants.js` | Single source of truth for strings/enums |
| **Environment** | `lib/env.js` | Validated access to `process.env` |

---

## 3. Design System: Igris (CRITICAL — never violate these rules)

### Color Rules

**NEVER** use hardcoded hex colors in JSX or CSS. Always use Tailwind semantic tokens:

| Token | Use case |
|---|---|
| `text-primary` / `bg-primary` | Brand teal — CTAs, highlights, active states |
| `text-primary-foreground` | Text ON a primary-colored background |
| `hover:bg-primary/90` | Primary button hover |
| `bg-primary/10`, `border-primary/30` | Tinted backgrounds, tinted borders |
| `text-destructive` / `bg-destructive` | Errors, danger actions |
| `text-muted-foreground` | Supporting/secondary text |
| `bg-card` / `bg-muted` | Surface backgrounds |
| `border-border` | Default borders |

**Exception:** SVG `stroke` / `stopColor` attributes where Tailwind classes don't apply
→ use `#3bbcdc` (bright Igris teal) or `#2a9db5` (mid teal)

**Exception:** Inline `style={{ color: ... }}` in data arrays (e.g., feature icon colors)
→ use `const TEAL = '#3bbcdc'` defined at the top of the file

### Dark Mode

The app is **always dark**. `html` has `class="dark"` hardcoded in `app/layout.js`.
Do not add light mode styles or `dark:` variants.

### Radius

`--radius: 10px` scale — soft, modern corners:
- `rounded-sm` (6px) inputs/badges · `rounded-md`/`rounded-lg` (8–10px) cards/buttons · `rounded-xl` (16px) panels/modals
- Use `rounded-pill` (999px) only for avatar circles and status badge pills.

### Glass elevation tiers

- `glass-subtle` — stat cards, list rows
- `glass-panel` — primary page containers
- `glass-elevated` — modals, popovers, dropdowns

### Scanner accent tokens

Each audit tool has an identity color (CSS vars + Tailwind classes), defined in `lib/scannerAccents.js`:
`scanner-security` (indigo) · `scanner-seo` (blue) · `scanner-aeo` (purple, also the app-wide "AI" accent) · `scanner-geo` (cyan) · `scanner-brand` (amber) · `scanner-health` (emerald)

Severity tokens: `severity-critical/high/medium/low`, plus `success` and `warning`.
Never construct Tailwind class names dynamically (`bg-${color}-500`) — use the static maps in `lib/scannerAccents.js`.

### Typography

- **Sans:** Inter (loaded via `next/font/google` in `app/layout.js`)
- **Mono:** Roboto Mono — use `font-mono` class for fingerprint IDs, code, hash values
- Headlines: 700 weight. Body: 400. Labels: 600 + uppercase + tracking

### Spacing

4px grid. Use Tailwind spacing utilities (`gap-4`, `p-6`, etc.). No arbitrary pixel values.

### Shadows

Use CSS variables:
- `var(--shadow-sm)` / `shadow-igris-sm`
- `var(--shadow-md)` / `shadow-igris-md`
- `var(--shadow-lg)` / `shadow-igris-lg`

### Motion

- Easing: `var(--ease)` = `cubic-bezier(0.2, 0, 0, 1)`
- Duration: `var(--duration-fast)` = 150ms
- Use `transition-colors` / `transition-all` with these values

### The Diamond ◆

The `◆` character is the Igris brand signature. Render it in `text-primary` when used
decoratively (nav logos, section labels, eyebrow text).

---

## 4. Authentication Architecture

### Current State (real auth)

- **Client:** `lib/authContext.js` — React Context, no localStorage for auth. Session restored via `GET /api?path=auth/me` on mount.
- **Session cookie:** HttpOnly, set server-side via `Set-Cookie` header. Client JS cannot read it.
- **Middleware:** Reads `provenance_session` cookie to gate protected routes.
- **Passwords:** bcrypt (bcryptjs, 12 rounds) via `lib/auth/password.js`
- **Users:** Stored in `COLLECTIONS.USERS` with `passwordHash` field (never returned to client)

### Cookie flow

```
POST /api?path=auth/signup  or  POST /api?path=auth/login
    → validate credentials / create user
    → encodeSession(user) → base64 JSON token
    → Set-Cookie: provenance_session=<token>; HttpOnly; SameSite=Lax
    → return safe user object (no passwordHash) in response body
    → authContext sets React state from response body

On page load (useEffect)
    → GET /api?path=auth/me → decodes cookie server-side → returns user
    → authContext sets React state

POST /api?path=auth/logout
    → Set-Cookie: provenance_session=; Max-Age=0
    → authContext clears React state
```

### Upgrade path (future)

1. Replace base64 session token with signed JWT (`jsonwebtoken`) or `iron-session` for tamper-proof sessions
2. Add `orgId` to session payload when org features are active
3. Add `POST /api?path=auth/refresh` for sliding session expiry

### RBAC

Use `lib/auth/rbac.js` to check permissions before any write/delete operation:

```js
import { assertPermission } from '@/lib/auth/rbac'

// In an API route handler:
const session = decodeSession(request.cookies.get('provenance_session')?.value)
assertPermission(session?.role, 'write', 'content.fingerprint')
```

---

## 5. Database Patterns

### Connection

Always import from `lib/db/index.js`. Never create a `new MongoClient()` anywhere else.

```js
import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'

const col = await getCollection(COLLECTIONS.CONTENT)
const docs = await col.find({ userId }).sort({ createdAt: -1 }).toArray()
```

### Document shape

Every document written to MongoDB must conform to the typedef in `lib/db/schemas.js`.
Always include `userId` (and `orgId` when org features are active) on every document
for future multi-tenancy isolation.

### ID generation

Use `uuid` for all document IDs (`import { v4 as uuidv4 } from 'uuid'`).
Never rely on MongoDB's `_id` ObjectId as the primary application ID.

### Timestamps

Every document must have `createdAt: new Date()`. Mutable documents also get `updatedAt`.

### Mock data fallback

The API auto-seeds realistic mock data when a collection is empty. This is intentional
for development. The seed is idempotent via the `GET /api?path=seed-mock-data` endpoint.

---

## 6. API Architecture

### Current structure

All requests go through `app/api/[[...path]]/route.js` with `?path=` query parameter.

### Path conventions

```
GET  /api?path=content           → list all protected content
POST /api?path=content           → create new content
DEL  /api?path=content/:id       → delete content

GET  /api?path=alerts            → list alerts
POST /api?path=alerts/:id/read   → mark alert as read

GET  /api?path=voice-alerts
POST /api?path=voice-alerts/:id  → update status (flagged/dismissed/mine)

GET  /api?path=stats
GET  /api?path=threat-timeline

POST /api?path=scan              → trigger web scan for content
POST /api?path=analyze           → analyze text with Gemini

GET  /api?path=auth/me           → return current session user
POST /api?path=auth/login        → (future) set HttpOnly session cookie
POST /api?path=auth/logout       → (future) clear session cookie
```

### Future: domain-based route organization

When the API grows, split into dedicated route files:

```
app/api/content/route.js
app/api/alerts/route.js
app/api/voice/route.js
app/api/auth/route.js
app/api/stats/route.js
```

### Response shape

All API responses must follow this envelope:

```js
// Success
NextResponse.json({ success: true, data: ... })

// Error
NextResponse.json({ success: false, error: 'Human-readable message' }, { status: 4xx })
```

### Error handling in API routes

```js
try {
  // ... handler logic
} catch (error) {
  const status = error.status || 500
  console.error(`[API] ${pathParts.join('/')}:`, error.message)
  return NextResponse.json({ success: false, error: error.message }, { status })
}
```

---

## 7. Component Architecture

### Layout structure

```
DashboardLayout (components/layout/DashboardLayout.js)
    ├── Sidebar (components/layout/Sidebar.js)
    │       Navigation, active state, logout
    ├── Navbar (components/layout/Navbar.js)
    │       Notifications dropdown, user menu, mobile toggle
    └── <main> {children}
```

All protected pages must be wrapped in:
```js
<AuthProvider>
  <DashboardLayout>
    <PageContent />
  </DashboardLayout>
</AuthProvider>
```

### UI components

All base UI comes from `components/ui/` (shadcn/radix). Do not install additional
component libraries. Extend existing components rather than wrapping them.

### Custom components

| Component | File | Notes |
|---|---|---|
| SecurityGauge | `components/ui/SecurityGauge.js` | SVG arc, animates score 0→100 |
| WaveformVisual | `components/ui/WaveformVisual.js` | Animated bars for audio |
| ProductDemo | `components/landing/ProductDemo.js` | Interactive landing demo |

### Data fetching in components

Use `fetch()` directly inside `useEffect` for simple cases.
Use `@tanstack/react-query` (already installed) for any data that needs caching,
refetching, or is shared across components.

```js
// Simple: useEffect + fetch
useEffect(() => { fetch('/api?path=content').then(...) }, [])

// Complex / shared: react-query
const { data } = useQuery({ queryKey: ['content'], queryFn: () => fetch(...).then(r => r.json()) })
```

---

## 8. File & Folder Conventions

```
app/
  layout.js           ← Root layout (font, metadata, dark class)
  page.js             ← Home redirect
  globals.css         ← Tailwind base + CSS variables (Igris tokens)
  [route]/
    page.js           ← Page component (always 'use client')

components/
  ui/                 ← shadcn primitives (don't edit unless overriding)
  layout/             ← App shell (Sidebar, Navbar, DashboardLayout)
  landing/            ← Landing page components

lib/
  constants.js        ← Enums, route names, limits (import from here)
  env.js              ← process.env access (never read process.env directly)
  utils.js            ← cn() and other tiny helpers
  authContext.js      ← React auth Context + cookie management
  mockData.js         ← Fingerprint ID generation, security score calc
  gemini.js           ← Gemini AI integration
  googleApis.js       ← Google Cloud Vision + Custom Search
  db/
    index.js          ← MongoDB connection singleton
    schemas.js        ← Collection names + document typedefs
  auth/
    session.js        ← Session encode/decode, cookie builders
    rbac.js           ← Permission checks

hooks/
  use-mobile.jsx
  use-toast.js

middleware.js         ← Edge middleware (route protection)
tailwind.config.js    ← Igris tokens + color palette
```

---

## 9. Environment Variables

Never read `process.env` directly in feature code. Always import from `lib/env.js`:

```js
import { env, features } from '@/lib/env'

if (features.aiFingerprinting) {
  // safe to call Gemini
}
```

Required variables:
```
MONGO_URL=mongodb://...
```

Optional (enable features when present):
```
DB_NAME=provenance
GEMINI_API_KEY=...
GOOGLE_CLOUD_VISION_API_KEY=...
GOOGLE_CUSTOM_SEARCH_API_KEY=...
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=...
SESSION_SECRET=<random 32+ char string>
CORS_ORIGINS=https://yourdomain.com
```

---

## 10. Coding Standards

### General

- All page files use `'use client'` (this is a client-rendered SPA pattern)
- No TypeScript — stay in JavaScript. Add JSDoc comments for types where helpful
- Prefer named exports. Default export only for page/layout components
- No unused variables, no dead code, no commented-out blocks left in
- No `console.log` in production code — use `console.error` for actual errors only

### Naming

| Thing | Convention | Example |
|---|---|---|
| Components | PascalCase | `DashboardLayout`, `SecurityGauge` |
| Files | camelCase or kebab-case | `authContext.js`, `use-mobile.jsx` |
| Constants | SCREAMING_SNAKE | `CONTENT_STATUS.PROTECTED` |
| Functions | camelCase | `encodeSession`, `getCollection` |
| CSS classes | Tailwind utilities only | never add custom classes |

### React patterns

- Lift state up only when needed — keep state local to the component that owns it
- `useEffect` dependencies must be complete — no suppressions
- No inline function definitions in JSX props that are expensive (memoize with `useCallback`)
- Error states and loading states must always be handled visually

### Imports

Always use the `@/` alias (maps to project root):

```js
import { Button } from '@/components/ui/button'
import { ROUTES } from '@/lib/constants'
import { getCollection } from '@/lib/db'
```

Never use relative `../` imports across module boundaries.

---

## 11. Adding a New Feature — Checklist

When adding any new feature, follow this order:

1. **Constants first** — Add any new enums/routes to `lib/constants.js`
2. **DB schema** — Add the document typedef to `lib/db/schemas.js` and the collection name to `COLLECTIONS`
3. **API route** — Add a handler in `app/api/[[...path]]/route.js` (or a new route file)
4. **lib module** — If there's complex logic, put it in a new `lib/<domain>.js` file
5. **Page/component** — Build the UI last, pulling data via `fetch` or react-query
6. **Design Preference:** Follow **Igris Design System**: Sharp corners (`--radius: 0px`), semantic Tailwind colors (no hex), `◆` brand signature.

---

## 12. What NOT To Do

- **Never** hardcode `#CCFF00`, `#00E5FF`, `#B3E600` or any hex color in JSX
- **Never** use raw Tailwind palette colors (`red-500`, `emerald-400`…) in dashboard pages — use semantic tokens (`success`, `warning`, `destructive`, `severity-*`, `scanner-*`)
- **Never** create a `new MongoClient()` outside of `lib/db/index.js`
- **Never** read `process.env.ANYTHING` outside of `lib/env.js`
- **Never** add rounded corners (`rounded-lg`, `rounded-xl`) to cards, buttons, or panels
- **Never** add a glow effect (`glow-primary`, `box-shadow`) to new components
- **Never** store sensitive data (passwords, raw API keys) in localStorage or cookies
- **Never** skip the `userId` field when writing a document to MongoDB
- **Never** import from `../` across module boundaries — use `@/` alias
- **Never** install a new UI component library — extend shadcn components instead
- **Never** write business logic in page components — it belongs in `lib/` or API routes
- **Never** duplicate scanner logic — use shared utilities from `lib/scanners/shared/`

---

## 12.5. DRY Principle — Don't Repeat Yourself (CRITICAL)

Every AI agent building code in this repo **must** follow DRY. Duplicated logic is a
bug — it guarantees inconsistency when one copy is updated and another is not.

### Scanner Architecture (SEO, AEO, Security, Performance)

All scanners share common patterns. These **must** live in shared modules:

| Shared Concern | Module | Never duplicate in |
|---|---|---|
| HTML fetching + cheerio loading | `lib/scanners/shared/fetcher.js` | Individual scanner files |
| Finding creation (with severity, remediation, aiFixPrompt) | `lib/scanners/shared/findings.js` | Individual scanner files |
| Score calculation (severity-weighted) | `lib/scanners/shared/scoring.js` | Individual scanner files |
| robots.txt parsing | `lib/scanners/shared/robotsParser.js` | seoScanner.js, aeoScanner.js |
| Schema.org / JSON-LD extraction | `lib/scanners/shared/schemaExtractor.js` | seoScanner.js, aeoScanner.js |
| Lightweight JS crawler | `lib/scanners/shared/crawler.js` | Individual scanner files |
| Gemini AI deep analysis | `lib/scanners/shared/aiAnalyzer.js` | Individual scanner files |

### UI Component Reuse (SEO, AEO, Security pages)

All audit pages share UI patterns. These **must** be shared components:

| Shared UI | Component | Never duplicate in |
|---|---|---|
| Findings list with severity + remediation + AI prompt | `components/ui/AuditFindingCard.js` | page.js files |
| Category score breakdown (bar/radar) | `components/ui/CategoryScoreBreakdown.js` | page.js files |
| SERP/AI preview card | `components/ui/SearchPreview.js` | page.js files |
| Scan history trend chart | `components/ui/ScanTrendChart.js` | page.js files |
| Competitor comparison layout | `components/ui/CompetitorCompare.js` | page.js files |
| PDF export button + generation | `components/ui/ExportReportButton.js` | page.js files |

### Rules

1. **Before writing any scanner check**, verify if the same check exists in another scanner. If so, extract it to `lib/scanners/shared/`.
2. **Before writing any UI component for audit results**, check if the same visual pattern exists on another audit page. If so, extract it to `components/ui/`.
3. **Finding shape must be uniform** across all scanners: `{ id, category, severity, title, description, passed, remediation, aiFixPrompt }`. No scanner may use a subset.
4. **Score calculation must be uniform** — all scanners use the same severity-weighted formula from `lib/scanners/shared/scoring.js`.
5. **Page components are thin** — they wire up shared components with scanner-specific data. A page.js file should never exceed ~150 lines.

---

## 13. Fingerprint ID Format

All content fingerprints follow the pattern: `CFP-YYYY-XXXXXX`

```js
import { generateFingerprintId } from '@/lib/mockData'
const id = generateFingerprintId() // "CFP-2025-A7K3M9"
```

The generator is in `lib/mockData.js`. When replacing with real AI fingerprinting,
the format must stay the same for backwards compatibility.

---

## 14. Security Score Calculation

`calculateSecurityScore(protectedContent, hasVoice, alerts)` lives in `lib/mockData.js`.

Score factors:
- Base: 30 points
- Has voice registered: +20
- Per protected content (capped at 30): +3
- Per unread high-severity alert: -10
- Per unread medium-severity alert: -5

Score thresholds (in `SecurityGauge.js`):
- ≥ 70 → Good → `#3bbcdc` (Igris teal)
- ≥ 40 → Fair → `#2a9db5` (mid teal)
- < 40 → At Risk → `#FF4444` (red)

---

## 15. Founder Thinking Mode

When asked to make product or architectural decisions, reason like a first-principles operator who has built and exited companies:

- **Lead with the actual decision** — not a list of options. Make a call.
- **State the real trade-offs** — what you gain, what you give up, what breaks at scale
- **Name the risk most people miss** — the non-obvious failure mode
- **No generic advice** — every answer must be specific to Provenance's stage, market, and stack

Start responses in this mode with: **"Here's what I'd actually do"**

Apply this lens to: pricing decisions, feature prioritization, architecture choices, go-to-market questions, hiring/build/buy decisions.

---

## 16. Running the Project

```bash
# Install
yarn install

# Development (memory-limited for constrained environments)
yarn dev

# Production build
yarn build && yarn start
```

Required before running:
- MongoDB instance (local or Atlas)
- `.env.local` with at minimum `MONGO_URL=...`

Seed mock data (first run or reset):
```
GET http://localhost:3000/api?path=seed-mock-data
```

---

## 17. Blog & Content Guidelines

When generating or editing blog articles and content for the website:
- **Dash usage:** Do NOT use 'em dashes' (—). Use 'en dashes' (–) ONLY when absolutely required (e.g., date ranges or clear parenthetical breaks). Otherwise, reword or use commas.
- **Tone:** Give the writing a "human touch". Keep it conversational, relatable, and less robotic. Use analogies and speak directly to the reader's pain points.
- **Data & First-Hand Experience:** Do not write thin, generic, AI-generated fluff (e.g., "What is AEO?"). Google's helpful-content system and AI engines reward first-hand experience. Your edge is the Igris Radar audit data. Put real screenshots, real scan outputs, and real numbers in every post (e.g., "Here is what our scanner found across XX sites").
