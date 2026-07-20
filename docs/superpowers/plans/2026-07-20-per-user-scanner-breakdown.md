# Per-User Scanner Breakdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In the admin Users table, add a "Breakdown" popover per user showing how many times they've used each of the 7 scanner types (Security/SEO/AEO/GEO/ASO/Site Health/Brand Visibility), ranked by count, with unused types shown muted rather than hidden.

**Architecture:** The `admin/users` API route already computes per-collection scan counts per user (`secC, seoC, aeoC, geoC, asoC, perfC, brandC`) to sum into `totalScans` — it just discards the breakdown afterward. Task 1 attaches that same data to each user object as `scansByType`, keyed to match `lib/scannerAccents.js`'s `SCANNERS` keys (`security, seo, aeo, geo, aso, health, brand`). Task 2 adds a `Popover` trigger in `components/admin/UsersPanel.js`'s Scans column that renders those 7 counts using `SCANNERS` icons/labels/colors, mirroring the existing "Tracked Domains" popover already in that file.

**Tech Stack:** Next.js 14 API route (`app/api/[[...slug]]/route.js`), MongoDB aggregation (already existing, no new queries), React client component, Radix `Popover` (`@/components/ui/popover`, already imported in `UsersPanel.js`), `lib/scannerAccents.js`'s `SCANNERS` map (already used by the Analytics tab feature).

No automated test framework exists in this project. This plan uses manual verification steps, matching the convention already established for the Analytics tab feature.

---

### Task 1: Attach `scansByType` to each user in the `admin/users` API route

**Files:**
- Modify: `app/api/[[...slug]]/route.js:231-235`

- [ ] **Step 1: Make the change**

Find this block (currently at lines 231-235, inside the `if (pathParts[0] === 'admin' && pathParts[1] === 'users')` GET handler):

```js
      const usersWithStats = users.map(u => ({
        ...u,
        totalScans: (secC[u.id]||0) + (seoC[u.id]||0) + (aeoC[u.id]||0) + (geoC[u.id]||0) + (asoC[u.id]||0) + (perfC[u.id]||0) + (brandC[u.id]||0),
        companies: domainsMap[u.id] || []
      }));
```

Replace it with:

```js
      const usersWithStats = users.map(u => ({
        ...u,
        totalScans: (secC[u.id]||0) + (seoC[u.id]||0) + (aeoC[u.id]||0) + (geoC[u.id]||0) + (asoC[u.id]||0) + (perfC[u.id]||0) + (brandC[u.id]||0),
        scansByType: {
          security: secC[u.id] || 0,
          seo:      seoC[u.id] || 0,
          aeo:      aeoC[u.id] || 0,
          geo:      geoC[u.id] || 0,
          aso:      asoC[u.id] || 0,
          health:   perfC[u.id] || 0,
          brand:    brandC[u.id] || 0,
        },
        companies: domainsMap[u.id] || []
      }));
```

This is the ONLY change in this task — `totalScans` is untouched (still used elsewhere for the plan-quota display), no new queries are added (`secC`/`seoC`/etc. already exist above this line), no other route block is touched.

- [ ] **Step 2: Verify by reading the file back**

Read `app/api/[[...slug]]/route.js` lines 225-245 and confirm:
- `scansByType` object has exactly 7 keys: `security, seo, aeo, geo, aso, health, brand`.
- Each value pulls from the correct existing count map (`secC`→`security`, `seoC`→`seo`, `aeoC`→`aeo`, `geoC`→`geo`, `asoC`→`aso`, `perfC`→`health`, `brandC`→`brand` — note `perfC`/`health` and `brandC`/`brand` are the two renamed pairs, everything else matches its variable name).
- `totalScans` line is unchanged.
- No other lines in the file changed.

- [ ] **Step 3: Commit**

```bash
git add "app/api/[[...slug]]/route.js"
git commit -m "feat: include per-scanner-type breakdown in admin users API"
```

---

### Task 2: Add the "Breakdown" popover to the Users table

**Files:**
- Modify: `components/admin/UsersPanel.js`

- [ ] **Step 1: Add the import**

At the top of `components/admin/UsersPanel.js`, find:

```js
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
```

(already present — no change needed to this line). Add a new import right after the existing lucide-react import line:

```js
import { Loader2, User, Activity, Search, Calendar, Target, ShieldAlert, Trash2 } from 'lucide-react';
```

becomes:

```js
import { Loader2, User, Activity, Search, Calendar, Target, ShieldAlert, Trash2, BarChart2 } from 'lucide-react';
```

And add, right after the existing `useToast` import:

```js
import { useToast } from '@/hooks/use-toast';
```

becomes:

```js
import { useToast } from '@/hooks/use-toast';
import { SCANNERS } from '@/lib/scannerAccents';
```

- [ ] **Step 2: Add a helper to compute ranked rows**

Just above the `export default function UsersPanel({ plansMap = {} }) {` line, add:

```js
const SCANNER_KEYS = Object.keys(SCANNERS);

function rankedScanBreakdown(scansByType = {}) {
  return [...SCANNER_KEYS]
    .map((key) => ({ key, count: scansByType[key] || 0, scanner: SCANNERS[key] }))
    .sort((a, b) => b.count - a.count);
}
```

- [ ] **Step 3: Add the popover in the Scans table cell**

Find this block (in the table body, inside the Scans `<td>`):

```jsx
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span>
                            {user.totalScans || 0} / {plansMap[user.plan || 'free']?.scansPerMonth === null ? '∞' : (plansMap[user.plan || 'free']?.scansPerMonth ?? '?')}
                          </span>
                          {user.companies && user.companies.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 px-2 text-xs py-0">
                                  View list
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-4 text-sm shadow-xl" align="start">
                                <h4 className="font-semibold mb-2">Tracked Domains</h4>
                                <ul className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                  {user.companies.map((domain, i) => (
                                    <li key={i} className="text-muted-foreground truncate flex items-center gap-2">
                                      <Target className="h-3 w-3 shrink-0" />
                                      {domain}
                                    </li>
                                  ))}
                                </ul>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>
                      </td>
```

Replace it with (adds a second `Popover` for the scanner breakdown, right after the existing domains popover):

```jsx
                      <td className="px-4 py-3 font-medium">
                        <div className="flex items-center gap-2">
                          <span>
                            {user.totalScans || 0} / {plansMap[user.plan || 'free']?.scansPerMonth === null ? '∞' : (plansMap[user.plan || 'free']?.scansPerMonth ?? '?')}
                          </span>
                          {user.companies && user.companies.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 px-2 text-xs py-0">
                                  View list
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-64 p-4 text-sm shadow-xl" align="start">
                                <h4 className="font-semibold mb-2">Tracked Domains</h4>
                                <ul className="space-y-1.5 max-h-[200px] overflow-y-auto">
                                  {user.companies.map((domain, i) => (
                                    <li key={i} className="text-muted-foreground truncate flex items-center gap-2">
                                      <Target className="h-3 w-3 shrink-0" />
                                      {domain}
                                    </li>
                                  ))}
                                </ul>
                              </PopoverContent>
                            </Popover>
                          )}
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-6 px-2 text-xs py-0">
                                <BarChart2 className="h-3 w-3 mr-1" /> Breakdown
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-4 text-sm shadow-xl" align="start">
                              <h4 className="font-semibold mb-2">Scans by Type</h4>
                              <ul className="space-y-2">
                                {rankedScanBreakdown(user.scansByType).map(({ key, count, scanner }) => {
                                  const Icon = scanner.icon;
                                  const used = count > 0;
                                  return (
                                    <li
                                      key={key}
                                      className={`flex items-center justify-between gap-2 ${used ? '' : 'opacity-40'}`}
                                    >
                                      <span className="flex items-center gap-2 truncate">
                                        <Icon className={`h-3.5 w-3.5 shrink-0 ${used ? scanner.text : 'text-muted-foreground'}`} />
                                        <span className={used ? '' : 'text-muted-foreground'}>{scanner.label}</span>
                                      </span>
                                      <span className="font-mono text-xs shrink-0">{count}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </td>
```

- [ ] **Step 4: Manually verify in the browser**

1. Run `yarn dev` if not already running (port 4000 per project convention).
2. Navigate to `http://localhost:4000/admin`, log in, go to the Users tab.
3. Confirm each user row now has a "Breakdown" button next to their scan count (in addition to "View list", if they have tracked domains).
4. Click "Breakdown" for a user who has run at least one scan. Confirm the popover shows all 7 scanner types, ranked with the highest count first, using the same icons/colors as the Analytics tab (cross-check against the Analytics tab's ranked list for the same icon/color per type).
5. Confirm scanner types with a count of 0 are visually muted (dimmed icon/text) but still listed, not removed from the list.
6. Click "Breakdown" for a user who has never run any scan (if one exists, e.g. a freshly signed-up user) — confirm all 7 rows show `0` and are all muted, with no crash.
7. Check the browser console for errors — should be none.

- [ ] **Step 5: Commit**

```bash
git add components/admin/UsersPanel.js
git commit -m "feat: add per-scanner-type breakdown popover to admin Users table"
```

---

## Self-Review Notes (for the plan author, already applied above)

- Spec coverage: `scansByType` shape matches spec exactly (Task 1) ✓; popover placement next to Scans count, reusing existing Popover pattern ✓ (Task 2 Step 3); ranked by count descending ✓ (`rankedScanBreakdown`); zero-count rows shown muted not hidden ✓ (`opacity-40` + muted text/icon color, row still rendered); defensive default when `scansByType` missing ✓ (`rankedScanBreakdown(scansByType = {})` defaults to `{}`, and `scansByType[key] || 0` handles missing keys); reuses `SCANNERS` from `lib/scannerAccents.js` for icons/labels/colors, same source as Analytics tab ✓; no new DB queries ✓ (Task 1 only restructures already-computed data); popover visual style (`w-64 p-4 text-sm shadow-xl`, `align="start"`) matches existing Tracked Domains popover ✓.
- Type consistency: `scansByType` keys (`security, seo, aeo, geo, aso, health, brand`) match `SCANNERS` object keys in `lib/scannerAccents.js` exactly, and match the keys already used by `lib/scanAnalytics.js` from the prior Analytics tab feature — no naming drift introduced.
- No placeholders: both task's code blocks are complete and directly pasteable.
