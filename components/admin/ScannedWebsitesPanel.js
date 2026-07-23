'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Loader2, RefreshCw, Search, Globe, Flame, ShieldCheck, Sparkles,
  Smartphone, BarChart2, ExternalLink, ArrowUpRight, CheckCircle2,
  AlertTriangle, XCircle, UserCheck, Eye, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SCANNERS } from '@/lib/scannerAccents';

function formatTimestamp(isoStr) {
  if (!isoStr) return '—';
  try {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function getScoreBadge(score) {
  if (score === null || score === undefined) {
    return <Badge variant="outline" className="text-muted-foreground">N/A</Badge>;
  }
  if (score >= 80) {
    return <Badge className="bg-success/15 text-success border-success/30 font-mono font-bold">{score}/100</Badge>;
  }
  if (score >= 50) {
    return <Badge className="bg-warning/15 text-warning border-warning/30 font-mono font-bold">{score}/100</Badge>;
  }
  return <Badge className="bg-destructive/15 text-destructive border-destructive/30 font-mono font-bold">{score}/100</Badge>;
}

export default function ScannedWebsitesPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('websites'); // 'websites' | 'feed'
  const [feedFilter, setFeedFilter] = useState('all'); // 'all' | 'landing' | 'user'
  const { toast } = useToast();

  const fetchScannedWebsites = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api?path=admin/scanned-websites');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast({ title: 'Failed to load data', description: json.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error loading data', description: 'Network error occurred', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScannedWebsites();
  }, []);

  const summary = data?.summary || {};
  const topWebsites = data?.topWebsites || [];
  const recentScans = data?.recentScans || [];
  const landingCounts = summary.landingCounts || {};

  // Filter top websites by search term
  const filteredWebsites = useMemo(() => {
    if (!searchQuery) return topWebsites;
    const q = searchQuery.toLowerCase().trim();
    return topWebsites.filter(w =>
      w.domain.toLowerCase().includes(q) || (w.sampleUrl && w.sampleUrl.toLowerCase().includes(q))
    );
  }, [topWebsites, searchQuery]);

  // Filter recent scans
  const filteredRecentScans = useMemo(() => {
    let scans = recentScans;
    if (feedFilter === 'landing') {
      scans = scans.filter(s => s.isLandingPage);
    } else if (feedFilter === 'user') {
      scans = scans.filter(s => !s.isLandingPage);
    }
    if (!searchQuery) return scans;
    const q = searchQuery.toLowerCase().trim();
    return scans.filter(s =>
      s.domain.toLowerCase().includes(q) ||
      s.url.toLowerCase().includes(q) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(q))
    );
  }, [recentScans, feedFilter, searchQuery]);

  // Ranking of landing page scanners
  const landingScannersRanked = useMemo(() => {
    const totalLanding = summary.totalLandingScans || 1;
    return Object.keys(SCANNERS).map(key => {
      const count = landingCounts[key] || 0;
      const pct = Math.round((count / totalLanding) * 100);
      return {
        key,
        scanner: SCANNERS[key],
        count,
        pct,
      };
    }).sort((a, b) => b.count - a.count);
  }, [summary, landingCounts]);

  const topLandingScanner = landingScannersRanked[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading scanned websites data…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Header Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Scanned Websites & Landing Page Activity</h2>
          <p className="text-sm text-muted-foreground">
            Track which scanners are used most on the landing page and monitor all scanned domains.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchScannedWebsites} disabled={loading} className="shrink-0">
          <RefreshCw className="w-4 h-4 mr-2" /> Refresh Data
        </Button>
      </div>

      {/* ── Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Total Scans Run</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">{summary.totalScans || 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            <span className="text-primary font-semibold">{summary.totalLandingScans || 0} landing</span> • {summary.totalUserScans || 0} registered
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Landing Page Scans</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono text-primary">{summary.totalLandingScans || 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {summary.totalScans ? Math.round(((summary.totalLandingScans || 0) / summary.totalScans) * 100) : 0}% of all platform scans
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
              <Flame className="h-3.5 w-3.5 text-amber-500" /> Most Used Landing Tool
            </CardDescription>
            <CardTitle className="text-2xl font-bold flex items-center gap-2">
              {topLandingScanner ? (
                <>
                  <topLandingScanner.scanner.icon className={`h-6 w-6 ${topLandingScanner.scanner.text}`} />
                  <span>{topLandingScanner.scanner.label}</span>
                </>
              ) : 'None'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {topLandingScanner ? `${topLandingScanner.count} scans (${topLandingScanner.pct}% of free landing scans)` : 'No scans yet'}
          </CardContent>
        </Card>

        <Card className="border-border bg-card/60 backdrop-blur">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs uppercase tracking-wider font-semibold">Unique Websites Scanned</CardDescription>
            <CardTitle className="text-3xl font-bold font-mono">{summary.uniqueWebsitesCount || 0}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Distinct domain names scanned
          </CardContent>
        </Card>
      </div>

      {/* ── Landing Page Scanner Popularity Section ── */}
      <Card className="border-border bg-card/60 backdrop-blur">
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-primary" />
            Landing Page Free Scanner Popularity
          </CardTitle>
          <CardDescription>
            Which scanner tools are prospective customers trying out on the landing page the most?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {landingScannersRanked.map((item, idx) => {
              const Icon = item.scanner.icon;
              return (
                <div
                  key={item.key}
                  className="p-3.5 rounded-xl border border-border bg-background/50 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${item.scanner.bgSoft}`}>
                        <Icon className={`h-4 w-4 ${item.scanner.text}`} />
                      </div>
                      <span className="font-semibold text-sm">{item.scanner.label}</span>
                    </div>
                    <Badge variant="outline" className="text-xs font-mono">
                      #{idx + 1}
                    </Badge>
                  </div>
                  <div>
                    <div className="flex justify-between items-baseline text-xs mb-1">
                      <span className="text-muted-foreground">Landing Scans</span>
                      <span className="font-bold font-mono">{item.count} ({item.pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.scanner.bg} transition-all duration-500`}
                        style={{ width: `${Math.max(item.pct, 3)}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Main Data View (Top Websites & Live Scan Feed) ── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
            <TabsList className="h-10">
              <TabsTrigger value="websites" className="gap-2 px-4 text-xs font-semibold">
                <Globe className="h-3.5 w-3.5" /> Top Scanned Websites ({topWebsites.length})
              </TabsTrigger>
              <TabsTrigger value="feed" className="gap-2 px-4 text-xs font-semibold">
                <Layers className="h-3.5 w-3.5" /> Recent Scans Feed ({recentScans.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 w-full sm:w-72">
            <div className="relative w-full">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search domain or URL…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 h-10 text-sm bg-background/50 rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* ── Tab 1: Top Scanned Websites ── */}
        {activeTab === 'websites' && (
          <Card className="border-border bg-card/60 backdrop-blur overflow-hidden">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold">Top Scanned Websites</CardTitle>
              <CardDescription>
                Domains receiving the highest volume of scans across landing page previews and registered accounts.
              </CardDescription>
            </CardHeader>
            <div className="overflow-x-auto">
              {filteredWebsites.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No websites matching your search query.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
                    <tr>
                      <th className="py-3 px-4">Website / Domain</th>
                      <th className="py-3 px-4 text-center">Total Scans</th>
                      <th className="py-3 px-4 text-center">Landing Scans</th>
                      <th className="py-3 px-4 text-center">User Scans</th>
                      <th className="py-3 px-4 text-center">Avg Score</th>
                      <th className="py-3 px-4">Scanners Used</th>
                      <th className="py-3 px-4 text-right">Last Scanned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredWebsites.map((item, i) => (
                      <tr key={item.domain + i} className="hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4 text-primary shrink-0" />
                            <span className="font-semibold text-foreground">{item.domain}</span>
                            <a
                              href={item.sampleUrl?.startsWith('http') ? item.sampleUrl : `https://${item.domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{item.totalScans}</td>
                        <td className="py-3 px-4 text-center font-mono">
                          {item.landingScans > 0 ? (
                            <Badge variant="outline" className="bg-primary/10 border-primary/20 text-primary">
                              {item.landingScans}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {item.userScans > 0 ? (
                            <Badge variant="outline" className="bg-secondary/20 text-foreground">
                              {item.userScans}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {getScoreBadge(item.avgScore)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {item.scannerTypes?.map(t => (
                              <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                {t}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-xs text-muted-foreground font-mono">
                          {formatTimestamp(item.lastScanned)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}

        {/* ── Tab 2: Recent Scans Live Feed ── */}
        {activeTab === 'feed' && (
          <Card className="border-border bg-card/60 backdrop-blur overflow-hidden">
            <CardHeader className="pb-3 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base font-bold">Recent Scans Activity Feed</CardTitle>
                <CardDescription>
                  Real-time log of the latest scans triggered across the platform.
                </CardDescription>
              </div>

              <div className="flex gap-1.5 p-1 bg-muted/40 rounded-lg border border-border/50 self-start sm:self-auto">
                <button
                  onClick={() => setFeedFilter('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    feedFilter === 'all' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFeedFilter('landing')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    feedFilter === 'landing' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Landing Page Only
                </button>
                <button
                  onClick={() => setFeedFilter('user')}
                  className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                    feedFilter === 'user' ? 'bg-background shadow text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Registered Users
                </button>
              </div>
            </CardHeader>

            <div className="overflow-x-auto">
              {filteredRecentScans.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  No scan activities match the current filter.
                </div>
              ) : (
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-border">
                    {filteredRecentScans.map(scan => {
                      const scanner = SCANNERS[scan.type] || SCANNERS.security;
                      const Icon = scanner.icon;
                      return (
                        <tr key={scan.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl shrink-0 ${scanner.bgSoft}`}>
                                <Icon className={`h-4 w-4 ${scanner.text}`} />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground leading-snug">{scan.url}</p>
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${scanner.text}`}>
                                  {scan.typeLabel}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            {scan.isLandingPage ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
                                <Eye className="h-3 w-3" /> Landing Page Visitor
                              </span>
                            ) : (
                              <div className="flex flex-col">
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-foreground">
                                  <UserCheck className="h-3 w-3 text-success shrink-0" /> {scan.userName || 'Registered User'}
                                </span>
                                <span className="text-[11px] text-muted-foreground">{scan.userEmail}</span>
                              </div>
                            )}
                          </td>

                          <td className="py-3 px-4 text-center">
                            {getScoreBadge(scan.score)}
                          </td>

                          <td className="py-3 px-4 text-right text-xs text-muted-foreground font-mono">
                            {formatTimestamp(scan.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
