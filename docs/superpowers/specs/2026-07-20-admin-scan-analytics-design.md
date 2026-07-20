# Admin Scan Analytics — Design

## Problem

The admin can see registered users but has no visibility into which audit
tools (Security, SEO, AEO, GEO, ASO, Performance/Site Health, Brand
Visibility) are actually being used. There's no way to answer "which scan
type is in demand?" to prioritize product/marketing effort.

## Goal

Add a platform-wide analytics view to the admin dashboard showing, per scan
type: total scans run (all-time) and a daily volume trend over a selectable
window (30 or 90 days).

Out of scope (deferred, not part of this spec): per-plan-tier breakdown,
unique-user counts per scanner, per-user drill-down.

## Data Source

No new collection. Scan counts are derived directly from the 7 existing
collections in `lib/db/schemas.js`:

| Scan type (SCANNERS key) | Collection             |
|---------------------------|------------------------|
| `security`                | `security_scans`       |
| `seo`                      | `seo_scans`             |
| `aeo`                      | `aeo_scans`             |
| `geo`                      | `geo_scans`             |
| `aso`                      | `aso_scans`             |
| `health`                   | `performance_scans`     |
| `brand`                    | `brand_visibility`      |

Each document has `createdAt: Date`, which is all that's needed for
counting and grouping by day.

## API

New handler in `app/api/[[...slug]]/route.js`:

```
GET /api?path=admin/scan-analytics&days=30
```

- `days` query param: `30` or `90` (default `30`). Any other value → 400.
- Requires admin auth (same guard already used by other `admin/*` routes).
- For each of the 7 collections, in parallel:
  - `col.countDocuments({})` → all-time total for that type.
  - Aggregation pipeline bucketing `createdAt` by calendar day (UTC) for
    docs where `createdAt >= now - days`, counting per day.
- Merge the 7 per-type daily series into one array of
  `{ date: 'YYYY-MM-DD', security, seo, aeo, geo, aso, health, brand }`
  objects, one per day in the requested window (days with zero scans for a
  type appear as `0`, not missing keys — needed for a clean multi-line
  chart with no gaps).

Response shape:

```js
{
  success: true,
  data: {
    totals: { security: 142, seo: 389, aeo: 201, geo: 58, aso: 34, health: 97, brand: 76 },
    series: [
      { date: '2026-06-21', security: 4, seo: 12, aeo: 6, geo: 1, aso: 0, health: 3, brand: 2 },
      // ... one entry per day in the window, ascending date order
    ],
  },
}
```

Errors follow the standard envelope (`{ success: false, error }`).

## Extracted helper

The per-collection "count total + bucket by day" logic is identical across
all 7 collections, so it must not be copy-pasted 7 times (DRY rule, section
12.5 of CLAUDE.md). Add:

```js
// lib/scanAnalytics.js
export async function getScanAnalytics(days = 30)
```

This function owns the collection-name → SCANNERS-key mapping, runs the 7
parallel aggregations, and returns the exact `{ totals, series }` shape
above. The API route handler just calls this and wraps the result in the
response envelope — no aggregation logic lives in the route file itself.

## UI

### New component: `components/admin/ScanAnalyticsPanel.js`

- `'use client'`, fetches `/api?path=admin/scan-analytics&days=${days}` in
  `useEffect`, with a `days` state (`30 | 90`) driving a small toggle
  (reuse `Select` or two `Button`s, matching the existing `ApiKeysPanel`
  style).
- **Totals row**: a ranked horizontal bar list (most-used scan type first),
  one row per `SCANNERS` entry, using that scanner's existing `icon`,
  `label`, `bg`/`text` classes, and `ring` color from
  `lib/scannerAccents.js`. Bar width proportional to
  `total / max(totals)`. This directly answers "what's in demand" at a
  glance without needing a chart library for this part.
- **Trend chart**: one `recharts` `LineChart` (same import pattern as
  `components/ui/ScanTrendChart.js`) with 7 `<Line>` series, one per
  scanner, each using that scanner's `ring` color as `stroke`. X axis is
  `date`, Y axis is scan count. Legend uses scanner `label`s.
- Loading state: spinner (matches `ApiKeysPanel` loading pattern).
- Empty state: if all totals are 0, show "No scans recorded yet."
  (matches `ScanTrendChart`'s empty-state pattern).
- No `rounded-lg`/`rounded-xl` on new cards/panels — sharp corners per
  Igris rules (section 12). Use `Card` primitives from `components/ui/`
  as-is; don't override their radius.

### Admin dashboard wiring: `app/admin/dashboard/page.js`

- Add a 4th `TabsTrigger` "Analytics" (e.g. `BarChart3` icon from
  `lucide-react`) alongside Plans/Users/API Keys.
- `{section === 'analytics' && <ScanAnalyticsPanel />}`
- Update the header subtitle switch statement to cover the new section
  ("Platform-wide scan volume by tool.").

## Error handling

- If a collection query fails, `getScanAnalytics` should not let one
  failing collection blank out the whole panel — catch per-collection
  errors, log via `console.error`, and default that type's numbers to 0
  rather than throwing. Matches the "mail failure can't break the primary
  operation" precedent already used in `lib/email/mailer.js`.
- Panel shows a toast on fetch failure, consistent with `ApiKeysPanel`.

## Testing

- Manual verification: open `/admin/dashboard`, click Analytics tab,
  confirm totals bar list renders with real counts from seeded/mock data,
  toggle 30/90 days and confirm the trend chart re-fetches and re-renders.
- No existing automated test suite covers admin panels; none added here
  (matches current project convention — no test scaffolding to introduce
  for a UI-only feature).
