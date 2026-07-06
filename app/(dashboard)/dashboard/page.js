'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search,
  Loader2,
  Clock,
  ExternalLink,
  Globe,
  Zap,
  ArrowRight,
  LayoutDashboard,
  BarChart3,
  ShieldCheck,
  Gauge,
  RotateCw,
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import UsageMeter from '@/components/ui/UsageMeter';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import EmptyState from '@/components/ui/EmptyState';
import { StatRowSkeleton } from '@/components/ui/PageSkeleton';
import { PageTransition, Stagger, MotionItem } from '@/components/ui/motion';
import { SCANNERS } from '@/lib/scannerAccents';

export default function DashboardPage() {
  const router = useRouter();
  const inputRef = useRef(null);
  const [url, setUrl] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api?path=stats')
      .then(r => r.json())
      .then(data => { if (data.success) setStats(data.data); })
      .catch(err => console.error('Failed to load dashboard stats', err))
      .finally(() => setLoading(false));
  }, []);

  // "/" focuses the scan input from anywhere on the page
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const launchScan = (scanner) => {
    if (!url) return;
    let target = url.trim();
    if (!target.startsWith('http')) target = 'https://' + target;
    router.push(`${scanner.route}?url=${encodeURIComponent(target)}`);
  };

  const scannerList = Object.values(SCANNERS);

  return (
    <PageTransition className="space-y-8">
      <PageHeader
        icon={LayoutDashboard}
        title="Command Center"
        description="Monitor your web security, optimize for AI answer engines, and track site health."
      />

      {/* Quick Scan */}
      <Card className="glass-panel rounded-xl border-t-2 border-t-primary/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <CardHeader>
          <CardTitle>Launch New Scan</CardTitle>
          <CardDescription>
            Enter a URL and pick an audit. Tip: press <kbd className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm border border-border">/</kbd> to jump here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col sm:flex-row gap-4"
            onSubmit={(e) => { e.preventDefault(); launchScan(SCANNERS.security); }}
          >
            <div className="flex-1 relative focus-glow rounded-lg">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
              <Input
                ref={inputRef}
                placeholder="https://example.com"
                className="pl-10 h-12 text-lg bg-background/50"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                type="text"
                inputMode="url"
                aria-label="URL to scan"
              />
            </div>
          </form>

          <Stagger className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4" delay={0.1}>
            {scannerList.map((scanner) => {
              const Icon = scanner.icon;
              return (
                <MotionItem key={scanner.key}>
                  <Button
                    disabled={!url}
                    variant="outline"
                    className={`h-auto py-3 w-full justify-start group ${scanner.border} ${scanner.borderHover} ${scanner.bgSoftHover} accent-card`}
                    onClick={() => launchScan(scanner)}
                  >
                    <Icon className={`h-5 w-5 mr-3 shrink-0 ${scanner.text}`} />
                    <div className="text-left min-w-0">
                      <div className="font-semibold text-sm truncate">{scanner.label}</div>
                      <div className="text-xs text-muted-foreground truncate">{scanner.description}</div>
                    </div>
                  </Button>
                </MotionItem>
              );
            })}
          </Stagger>
        </CardContent>
      </Card>

      {/* Stats row */}
      {loading ? (
        <StatRowSkeleton count={4} />
      ) : (
        <Stagger className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <MotionItem>
            <StatCard label="Total Scans Run" value={stats?.totalScans || 0} icon={BarChart3} />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Avg Security Score"
              value={stats?.avgSecurityScore || 0}
              suffix="/ 100"
              icon={ShieldCheck}
              accent={SCANNERS.security}
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Avg AEO Readiness"
              value={stats?.avgAeoScore || 0}
              suffix="/ 100"
              icon={Gauge}
              accent={SCANNERS.aeo}
            />
          </MotionItem>
          <MotionItem>
            <StatCard
              label="Monthly Scans"
              value={stats?.usage?.scansUsed ?? 0}
              suffix={stats?.usage?.scansLimit !== Infinity && stats?.usage?.scansLimit != null ? `/ ${stats.usage.scansLimit}` : undefined}
              headerAction={
                <Link href="/settings?tab=billing">
                  <span className="text-xs text-primary hover:underline flex items-center gap-0.5">
                    <Zap className="h-3 w-3" /> Upgrade
                  </span>
                </Link>
              }
              footer={
                stats?.usage ? (
                  <UsageMeter used={stats.usage.scansUsed} limit={stats.usage.scansLimit} label="" />
                ) : null
              }
            />
          </MotionItem>
        </Stagger>
      )}

      {/* Recent Scans */}
      <Card className="glass-card rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg">Recent SEO Scans</CardTitle>
          <CardDescription>Your latest SEO visibility reports</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : stats?.recentScans?.length > 0 ? (
            <div className="space-y-3">
              {stats.recentScans.map((scan) => {
                const issues = scan.findings?.filter(f => !f.passed)?.length || 0;
                const scoreColor = scan.score >= 70 ? 'text-success' : scan.score >= 40 ? 'text-warning' : 'text-destructive';
                return (
                  <div key={scan.id} className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50 hover:bg-muted/50 hover:border-scanner-seo/40 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-scanner-seo/10 border border-scanner-seo/20 shrink-0">
                        <Search className="h-5 w-5 text-scanner-seo" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-medium flex items-center gap-2 truncate">
                          <span className="truncate font-mono text-sm">{scan.url}</span>
                          <a href={scan.url} target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground shrink-0" aria-label="Open site">
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDistanceToNow(new Date(scan.createdAt))} ago</span>
                          <span>•</span>
                          <span className={issues > 0 ? 'text-severity-medium' : 'text-success'}>
                            {issues > 0 ? `${issues} issues found` : 'All checks passed'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className={`text-2xl font-bold tabular-nums ${scoreColor}`}>{scan.score}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Score</div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Re-run this scan"
                        aria-label="Re-run this scan"
                        onClick={() => router.push(`/seo-audit?url=${encodeURIComponent(scan.url)}&autorun=1`)}
                      >
                        <RotateCw className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Open in SEO Audit"
                        aria-label="Open in SEO Audit"
                        onClick={() => router.push(`/seo-audit?url=${encodeURIComponent(scan.url)}`)}
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No scans yet"
              description="Launch your first SEO scan using the quick input above."
              action={<Button variant="outline" onClick={() => inputRef.current?.focus()}>Start a scan</Button>}
            />
          )}
        </CardContent>
      </Card>
    </PageTransition>
  );
}
