# Per-User Scanner Breakdown — Design

## Problem

The admin Users table (`components/admin/UsersPanel.js`) shows each user's
total scan count (`totalScans`), but not which scanner types they actually
use. The `admin/users` API route already computes per-type counts
internally (`secC`, `seoC`, `aeoC`, `geoC`, `asoC`, `perfC`, `brandC`) to
sum into `totalScans`, then discards the breakdown. There's no way to see
"this user runs SEO audits constantly but has never tried Security Scan."

## Goal

Surface the per-scanner-type count for each user in the admin Users table,
without cluttering the existing compact table layout.

Out of scope: changing what counts as a "scan" (unchanged from the
Analytics tab's Task 1 definition — one document per scan collection = one
scan), any time-range filtering (all-time counts only, matching
`totalScans`'s current all-time semantics).

## API changes

`app/api/[[...slug]]/route.js`, `admin/users` GET block (the one that
already builds `secC, seoC, aeoC, geoC, asoC, perfC, brandC` via
`getCounts()` for each of the 7 scan collections):

Currently each user object gets:
```js
totalScans: (secC[u.id]||0) + (seoC[u.id]||0) + ... ,
companies: domainsMap[u.id] || []
```

Add a `scansByType` object alongside `totalScans`, using the same key names
as `SCANNERS` in `lib/scannerAccents.js` (`security, seo, aeo, geo, aso,
health, brand`) so the frontend can reuse that map directly for
icons/labels/colors — the same convention already established for the
Analytics tab:

```js
scansByType: {
  security: secC[u.id] || 0,
  seo:      seoC[u.id] || 0,
  aeo:      aeoC[u.id] || 0,
  geo:      geoC[u.id] || 0,
  aso:      asoC[u.id] || 0,
  health:   perfC[u.id] || 0,
  brand:    brandC[u.id] || 0,
}
```

`totalScans` stays exactly as-is (still drives the plan-quota progress
display in the table). No new database query — this is purely reusing
counts already computed in that handler.

## UI changes

`components/admin/UsersPanel.js`, in the Scans table cell (currently
showing `{user.totalScans || 0} / {quota}` plus a "View list" popover for
tracked domains):

Add a small `Popover` trigger button (label: "Breakdown", same visual
weight/size as the existing "View list" button for domains — `variant="outline"
size="sm" className="h-6 px-2 text-xs py-0"`) next to the scans count.

Popover content: import `SCANNERS` from `@/lib/scannerAccents`. For each of
the 7 keys, render one row: icon (`scanner.icon`, colored via
`scanner.text`), label (`scanner.label`), and the count from
`user.scansByType[key] || 0`. Sort rows by count descending. Rows with a
count of 0 are still shown, but styled muted (`text-muted-foreground`,
icon at reduced opacity) rather than omitted — so an admin scanning the
list can see gaps (tools never tried) as easily as usage.

Popover width/style matches the existing "Tracked Domains" popover
(`w-64 p-4 text-sm shadow-xl`, `align="start"`) for visual consistency
within the same table.

If `user.scansByType` is missing or malformed (defensive default), the
popover should render all 7 rows at 0 rather than crashing — same
defensive-default convention already used elsewhere in this panel
(e.g. `user.companies && user.companies.length > 0`).

## Testing

No automated test framework in this project (matches existing convention
for admin panels). Manual verification: open `/admin/dashboard` → Users
tab, click "Breakdown" for a user with a mix of scan types, confirm the
popover shows all 7 types ranked by count with correct icons/colors
matching the Analytics tab, and zero-count types appear muted rather than
hidden.
