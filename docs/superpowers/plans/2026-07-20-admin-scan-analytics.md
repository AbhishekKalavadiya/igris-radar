# Admin Scan Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an "Analytics" tab to `/admin/dashboard` showing, per scan type (Security/SEO/AEO/GEO/ASO/Site Health/Brand Visibility), the all-time total scan count and a daily volume trend over the last 30 or 90 days — so the admin can see which scanner is most in demand.

**Architecture:** A new `lib/scanAnalytics.js` helper runs 7 parallel MongoDB aggregations (one per existing scan collection) to produce totals + a merged daily time series. A new admin API route (`GET /api?path=admin/scan-analytics`) calls that helper and returns it in the standard response envelope. A new `components/admin/ScanAnalyticsPanel.js` client component fetches it and renders a ranked totals bar list plus a multi-line `recharts` trend chart, reusing the existing `SCANNERS` accent map for colors/icons/labels. `app/admin/dashboard/page.js` gets a 4th tab wiring it in.

**Tech Stack:** Next.js 14 App Router API route, MongoDB aggregation pipeline (`mongodb` driver, no ORM), React client component, `recharts` (already a dependency, used by `components/ui/ScanTrendChart.js`), `date-fns` (already a dependency).

No automated test framework exists in this project (`package.json` has no `test` script, no jest/vitest). This matches the project's existing convention for admin/UI panels (e.g. `ApiKeysPanel.js`, `UsersPanel.js` have no tests). This plan uses manual verification steps (browser + direct DB checks) instead of automated tests, per the design spec's own Testing section.

---

### Task 1: `lib/scanAnalytics.js` — aggregation helper

**Files:**
- Create: `lib/scanAnalytics.js`

- [ ] **Step 1: Write the helper**

```js
/**
 * lib/scanAnalytics.js
 * Aggregates scan volume across all 7 scan collections for the admin
 * Analytics tab. No new collection - derives everything from createdAt
 * on documents that already exist.
 */
import { getCollection } from '@/lib/db'
import { COLLECTIONS } from '@/lib/db/schemas'

/** SCANNERS key -> collection name (mirrors lib/scannerAccents.js keys) */
const TYPE_COLLECTIONS = {
  security: COLLECTIONS.SECURITY_SCANS,
  seo:      COLLECTIONS.SEO_SCANS,
  aeo:      COLLECTIONS.AEO_SCANS,
  geo:      COLLECTIONS.GEO_SCANS,
  aso:      COLLECTIONS.ASO_SCANS,
  health:   COLLECTIONS.PERFORMANCE_SCANS,
  brand:    COLLECTIONS.BRAND_VISIBILITY,
}

const TYPE_KEYS = Object.keys(TYPE_COLLECTIONS)

/**
 * @param {string} typeKey
 * @param {Date} since
 * @returns {Promise<{ total: number, byDay: Record<string, number> }>}
 */
async function getTypeStats(typeKey, since) {
  try {
    const col = await getCollection(TYPE_COLLECTIONS[typeKey])
    const total = await col.countDocuments({})
    const rows = await col.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: 'UTC' } },
          count: { $sum: 1 },
        } },
    ]).toArray()

    const byDay = {}
    for (const row of rows) byDay[row._id] = row.count
    return { total, byDay }
  } catch (error) {
    console.error(`[scanAnalytics] ${typeKey} query failed:`, error.message)
    return { total: 0, byDay: {} }
  }
}

/**
 * @param {number} days - 30 or 90
 * @returns {Promise<{ totals: Record<string, number>, series: Array<Record<string, number|string>> }>}
 */
export async function getScanAnalytics(days = 30) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000)

  const results = await Promise.all(TYPE_KEYS.map((key) => getTypeStats(key, since)))

  const totals = {}
  const byDayPerType = {}
  TYPE_KEYS.forEach((key, i) => {
    totals[key] = results[i].total
    byDayPerType[key] = results[i].byDay
  })

  const series = []
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dateStr = d.toISOString().slice(0, 10)
    const entry = { date: dateStr }
    for (const key of TYPE_KEYS) entry[key] = byDayPerType[key][dateStr] || 0
    series.push(entry)
  }

  return { totals, series }
}
```

- [ ] **Step 2: Manually verify against real data**

Run: `node -e "require('dotenv').config({path:'.env.local'}); require('./lib/scanAnalytics').getScanAnalytics(30).then(r => console.log(JSON.stringify(r, null, 2))).catch(e => { console.error(e); process.exit(1) })"`

This project uses ESM (`import`/`export`) per `lib/scanAnalytics.js` above, so plain `node -e` won't work directly. Instead verify via a temporary script:

Create a throwaway file `scripts/_verify-scan-analytics.mjs`:
```js
import 'dotenv/config'
import { getScanAnalytics } from '../lib/scanAnalytics.js'

const result = await getScanAnalytics(30)
console.log(JSON.stringify(result, null, 2))
```

Run: `node scripts/_verify-scan-analytics.mjs`
Expected: prints `{ totals: { security: <number>, seo: <number>, ... }, series: [ ...30 objects, each with date + 7 numeric keys... ] }` with no thrown errors. `totals` values should be non-negative integers matching what you'd expect from the seeded/mock data (check counts against `db.seo_scans.countDocuments()` etc. in MongoDB if you want a cross-check).

Delete `scripts/_verify-scan-analytics.mjs` after confirming (it's a throwaway verification script, not part of the codebase).

- [ ] **Step 3: Commit**

```bash
git add lib/scanAnalytics.js
git commit -m "feat: add scan analytics aggregation helper for admin dashboard"
```

---

### Task 2: API route — `GET /api?path=admin/scan-analytics`

**Files:**
- Modify: `app/api/[[...slug]]/route.js`

The file already has an admin-guarded GET block for `admin/users` at line ~198 (`if (pathParts[0] === 'admin' && pathParts[1] === 'users') { ... }`). Add a new sibling block right after the `admin/user-logs` block (around line 238, right before its closing based on the current file — insert directly after that block ends).

- [ ] **Step 1: Add the import**

Find the existing imports near the top of `app/api/[[...slug]]/route.js` (where `getKeyStatuses`, `setKeys` etc. from `lib/systemConfig` are imported) and add:

```js
import { getScanAnalytics } from '@/lib/scanAnalytics';
```

- [ ] **Step 2: Add the route handler**

Insert this block immediately after the closing `}` of the `admin/user-logs` block (the block starting `if (pathParts[0] === 'admin' && pathParts[1] === 'user-logs')`):

```js
    // Admin Dashboard: Scan Analytics (which scan type is in demand)
    if (pathParts[0] === 'admin' && pathParts[1] === 'scan-analytics') {
      if (!isAdminRequest(request)) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

      const daysParam = searchParams.get('days');
      const days = daysParam === '90' ? 90 : 30;
      if (daysParam && daysParam !== '30' && daysParam !== '90') {
        return NextResponse.json({ success: false, error: 'days must be 30 or 90' }, { status: 400 });
      }

      const analytics = await getScanAnalytics(days);
      return NextResponse.json({ success: true, data: analytics });
    }
```

- [ ] **Step 3: Manually verify the route**

You need an admin session cookie to call this route. Easiest path: log into `/admin` in the browser first (this sets the `provenance_admin` HttpOnly cookie), then in the same browser tab navigate directly to:

```
http://localhost:4000/api?path=admin/scan-analytics&days=30
```

Expected JSON: `{"success":true,"data":{"totals":{...7 keys...},"series":[...30 entries...]}}`.

Then try an invalid value:
```
http://localhost:4000/api?path=admin/scan-analytics&days=7
```
Expected: `{"success":false,"error":"days must be 30 or 90"}` (HTTP 400).

Then try without logging in (open a private/incognito window) and hit the same URL:
Expected: `{"success":false,"error":"Unauthorized"}` (HTTP 401).

- [ ] **Step 4: Commit**

```bash
git add "app/api/[[...slug]]/route.js"
git commit -m "feat: add admin scan-analytics API route"
```

---

### Task 3: `components/admin/ScanAnalyticsPanel.js`

**Files:**
- Create: `components/admin/ScanAnalyticsPanel.js`

- [ ] **Step 1: Write the component**

```jsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { SCANNERS } from '@/lib/scannerAccents';

const SCANNER_KEYS = Object.keys(SCANNERS);

export default function ScanAnalyticsPanel() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api?path=admin/scan-analytics&days=${days}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast({ title: 'Failed to load analytics', description: json.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to load analytics', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [days, toast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading analytics…
      </div>
    );
  }

  const totals = data?.totals || {};
  const series = data?.series || [];
  const maxTotal = Math.max(1, ...SCANNER_KEYS.map((k) => totals[k] || 0));
  const rankedKeys = [...SCANNER_KEYS].sort((a, b) => (totals[b] || 0) - (totals[a] || 0));
  const allZero = SCANNER_KEYS.every((k) => !totals[k]);

  const chartData = series.map((entry) => ({
    ...entry,
    label: format(new Date(entry.date), 'MMM dd'),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Scan volume across every audit tool. Use this to see which scanner is in demand.
        </p>
        <div className="flex gap-2">
          <Button variant={days === 30 ? 'default' : 'outline'} size="sm" onClick={() => setDays(30)}>30d</Button>
          <Button variant={days === 90 ? 'default' : 'outline'} size="sm" onClick={() => setDays(90)}>90d</Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {allZero ? (
        <Card className="border-border bg-card/50 backdrop-blur h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No scans recorded yet.</p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Scans by Type</CardTitle>
              <CardDescription>All-time count, ranked by demand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankedKeys.map((key) => {
                const scanner = SCANNERS[key];
                const Icon = scanner.icon;
                const total = totals[key] || 0;
                const widthPct = Math.max(2, Math.round((total / maxTotal) * 100));
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${scanner.text} shrink-0`} />
                    <span className="text-sm w-40 shrink-0">{scanner.label}</span>
                    <div className="flex-1 h-2 bg-muted overflow-hidden">
                      <div className={`h-full ${scanner.bg}`} style={{ width: `${widthPct}%` }} />
                    </div>
                    <span className="text-sm font-mono w-12 text-right">{total}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Volume Trend ({days}d)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="label" stroke="#666" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)' }} />
                  <Legend />
                  {SCANNER_KEYS.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={SCANNERS[key].label}
                      stroke={SCANNERS[key].ring}
                      strokeWidth={2}
                      dot={false}
                      animationDuration={800}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manually verify rendering (after Task 4 wires it in)**

Deferred to Task 4's verification step, since this component isn't reachable from the UI until the tab is added.

- [ ] **Step 3: Commit**

```bash
git add components/admin/ScanAnalyticsPanel.js
git commit -m "feat: add ScanAnalyticsPanel component for admin dashboard"
```

---

### Task 4: Wire the Analytics tab into `app/admin/dashboard/page.js`

**Files:**
- Modify: `app/admin/dashboard/page.js:1-17` (imports), `:97-107` (header title/subtitle), `:129-141` (TabsList), `:143-146` (section rendering)

- [ ] **Step 1: Add the import**

In `app/admin/dashboard/page.js`, change:

```js
import { Shield, Loader2, Save, RefreshCw, LogOut, KeyRound, Layers, User } from 'lucide-react';
import ApiKeysPanel from '@/components/admin/ApiKeysPanel';
import UsersPanel from '@/components/admin/UsersPanel';
```

to:

```js
import { Shield, Loader2, Save, RefreshCw, LogOut, KeyRound, Layers, User, BarChart3 } from 'lucide-react';
import ApiKeysPanel from '@/components/admin/ApiKeysPanel';
import UsersPanel from '@/components/admin/UsersPanel';
import ScanAnalyticsPanel from '@/components/admin/ScanAnalyticsPanel';
```

- [ ] **Step 2: Update the header title/subtitle**

Change:

```jsx
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              {section === 'plans' ? 'Plan Configuration' : section === 'keys' ? 'API Keys' : 'User Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {section === 'plans'
                ? 'Manage limits, features, and pricing for all tiers.'
                : section === 'keys' 
                  ? 'Manage integration API keys - changes apply instantly across the system.'
                  : 'View registered users and monitor their platform activity.'}
            </p>
```

to:

```jsx
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              {section === 'plans' ? 'Plan Configuration'
                : section === 'keys' ? 'API Keys'
                : section === 'analytics' ? 'Scan Analytics'
                : 'User Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {section === 'plans'
                ? 'Manage limits, features, and pricing for all tiers.'
                : section === 'keys'
                  ? 'Manage integration API keys - changes apply instantly across the system.'
                  : section === 'analytics'
                    ? 'Platform-wide scan volume by tool.'
                    : 'View registered users and monitor their platform activity.'}
            </p>
```

- [ ] **Step 3: Add the tab trigger**

Change:

```jsx
        <Tabs value={section} onValueChange={setSection} className="w-full">
          <TabsList className="h-12">
            <TabsTrigger value="plans" className="gap-2 px-6">
              <Layers className="w-4 h-4" /> Plans
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 px-6">
              <User className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2 px-6">
              <KeyRound className="w-4 h-4" /> API Keys
            </TabsTrigger>
          </TabsList>
        </Tabs>
```

to:

```jsx
        <Tabs value={section} onValueChange={setSection} className="w-full">
          <TabsList className="h-12">
            <TabsTrigger value="plans" className="gap-2 px-6">
              <Layers className="w-4 h-4" /> Plans
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2 px-6">
              <User className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2 px-6">
              <KeyRound className="w-4 h-4" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 px-6">
              <BarChart3 className="w-4 h-4" /> Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>
```

- [ ] **Step 4: Render the panel**

Change:

```jsx
        {section === 'users' && <UsersPanel plansMap={plansMap} />}

        {section === 'keys' && <ApiKeysPanel />}
```

to:

```jsx
        {section === 'users' && <UsersPanel plansMap={plansMap} />}

        {section === 'keys' && <ApiKeysPanel />}

        {section === 'analytics' && <ScanAnalyticsPanel />}
```

- [ ] **Step 5: Manually verify end-to-end in the browser**

1. Run `yarn dev` if not already running (per CLAUDE.md, dev server runs on port 4000 for this project).
2. Navigate to `http://localhost:4000/admin`, log in with admin credentials.
3. Click the new "Analytics" tab.
4. Confirm: loading spinner appears briefly, then either the "No scans recorded yet." empty state (if no scan data exists) or the totals bar list + trend line chart render with real numbers.
5. Click "90d" then "30d" — confirm the panel re-fetches (loading spinner shows again) and the chart re-renders with the new range.
6. Click "Refresh" — confirm it re-fetches without a full page reload.
7. Resize the browser window narrower — confirm the chart and bar list stay within their containers (no horizontal overflow), matching the responsive behavior of the existing Plans/Users tabs.
8. Check the browser console for errors — should be none.

- [ ] **Step 6: Commit**

```bash
git add "app/admin/dashboard/page.js"
git commit -m "feat: wire Scan Analytics tab into admin dashboard"
```

---

## Self-Review Notes (for the plan author, already applied above)

- Spec coverage: totals ✓ (Task 1+3), 30/90-day trend ✓ (Task 1+3), all 7 scan types incl. Brand Visibility ✓ (`TYPE_COLLECTIONS`/`SCANNER_KEYS`), new "Analytics" tab placement ✓ (Task 4), platform-wide only, no plan-tier filter ✓ (no filter param added), per-collection error isolation ✓ (`getTypeStats` try/catch), reuse of `SCANNERS` colors/icons/labels ✓ (Task 3), sharp corners / no new radius overrides ✓ (uses existing `Card` primitives unmodified).
- Type consistency: `TYPE_COLLECTIONS`/`SCANNER_KEYS` in `lib/scanAnalytics.js` and `SCANNER_KEYS` (derived from `SCANNERS`) in `ScanAnalyticsPanel.js` both resolve to the same 7 keys (`security, seo, aeo, geo, aso, health, brand`) — verified they match `lib/scannerAccents.js`'s `SCANNERS` object keys exactly.
- No placeholders: all code blocks are complete and runnable as written.
