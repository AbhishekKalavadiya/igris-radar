'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, Loader2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ScoreRing from '@/components/ui/ScoreRing';
import AuditFindingCard from '@/components/ui/AuditFindingCard';
import CategoryScoreBreakdown from '@/components/ui/CategoryScoreBreakdown';
import dynamic from 'next/dynamic';
import ExportReportButton from '@/components/ui/ExportReportButton';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import PageHeader from '@/components/ui/PageHeader';
import ScanProgressSteps from '@/components/ui/ScanProgressSteps';
import FindingsToolbar, { filterFindings } from '@/components/ui/FindingsToolbar';
import { PageTransition } from '@/components/ui/motion';
import { SCANNERS } from '@/lib/scannerAccents';
import { useSettings } from '@/hooks/use-settings';
import { notifyScanDone } from '@/lib/browserNotify';

const SCAN_STEPS = [
  'Resolving target and fetching page…',
  'Inspecting HTTP security headers…',
  'Scanning for exposed secrets and sensitive files…',
  'Checking cookies, CORS and email records…',
  'Compiling findings and calculating score…',
];

const ScanTrendChart = dynamic(() => import('@/components/ui/ScanTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Loading Chart...</div>
});

export default function SecurityScanPage() {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilterState] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const { toast } = useToast();
  const { settings } = useSettings();

  // Selecting a severity from the summary tiles jumps to the findings list
  const setSeverityFilter = (sev) => {
    setSeverityFilterState(sev);
    setActiveTab('findings');
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setUrl(urlParam);
      if (params.get('autorun') === '1') runScan(urlParam);
    }
    fetchHistory(urlParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async (targetUrl) => {
    try {
      const res = await fetch(`/api?path=security-scan&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAllHistory(data.data);
        if (targetUrl) {
          const urlHistory = data.data.filter(s => s.url === targetUrl);
          setScanHistory(urlHistory);
        }
      }
    } catch (e) {
      // Silently ignore
    }
  };

  const recentScans = [];
  const seen = new Set();
  for (const scan of allHistory) {
    if (!seen.has(scan.url)) {
      seen.add(scan.url);
      recentScans.push(scan);
    }
  }

  const runScan = async (targetUrl) => {
    if (!targetUrl) return;

    setIsScanning(true);
    setScanResult(null);
    setUpgradeInfo(null);

    try {
      const formattedUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;

      const res = await fetch('/api?path=security-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl })
      });
      const data = await res.json();

      if (data.success) {
        setScanResult(data.data);
        fetchHistory(targetUrl);
        toast({ title: 'Scan complete', description: `Scored ${data.data.score}/100` });
        notifyScanDone(settings.notifications.pushNotifications, 'Security scan complete', `${formattedUrl} scored ${data.data.score}/100`);
      } else if (data.upgradeRequired) {
        setUpgradeInfo({ currentPlan: data.currentPlan || 'free', reason: data.upgradeReason || 'scanLimit' });
      } else {
        toast({ title: 'Scan failed', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Scan failed', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setIsScanning(false);
    }
  };

  const handleScan = (e) => {
    e.preventDefault();
    runScan(url);
  };

  const accent = SCANNERS.security;

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Shield}
        accent={accent}
        title="Security Scanner"
        description="Run automated security checks to catch critical vulnerabilities."
        actions={scanResult && <ExportReportButton scanResult={scanResult} scanType="security" />}
      />

      {upgradeInfo && (
        <UpgradePrompt currentPlan={upgradeInfo.currentPlan} reason={upgradeInfo.reason} />
      )}

      {/* Input Form */}
      <Card className={`glass-panel rounded-xl border-t-2 border-t-scanner-security/60 animate-slide-up`}>
        <CardContent className="pt-6">
          <form onSubmit={handleScan} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="example.com"
                className="pl-10"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isScanning}
                required
                type="text"
                autoCapitalize="none"
                autoCorrect="off"
              />
            </div>
            <div className="flex gap-2">
              {scanResult && (
                <Button type="button" variant="outline" onClick={() => { setUrl(''); setScanResult(null); }}>
                  Clear
                </Button>
              )}
              <Button type="submit" disabled={isScanning || !url} className="min-w-[120px]">
                {isScanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Scanning...</> : 'Scan Now'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      {!url && !scanResult && recentScans.length > 0 && (
        <div className="animate-slide-up space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Previously Scanned Domains</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentScans.map(scan => (
              <Card 
                key={scan.id} 
                className="glass-panel cursor-pointer hover:border-primary/50 hover:bg-muted/5 transition-all"
                onClick={() => {
                  setUrl(scan.url);
                  setScanResult(scan);
                  const urlHistory = allHistory.filter(s => s.url === scan.url);
                  setScanHistory(urlHistory);
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold line-clamp-1">{scan.url}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Shield className="h-3 w-3" /> Security Score
                    </p>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${scan.score >= 70 ? 'text-success' : scan.score >= 40 ? 'text-warning' : 'text-destructive'}`}>
                    {scan.score}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isScanning && <ScanProgressSteps steps={SCAN_STEPS} accent={accent} />}

      {/* Results */}
      {scanResult && !isScanning && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card border border-border w-full justify-start h-auto flex-wrap p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="findings">All Findings</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 m-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-card lg:col-span-1 flex flex-col items-center justify-center py-6 animate-slide-up delay-100">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Security Score</h3>
                  <div className="h-48 w-48 mb-4">
                    <ScoreRing score={scanResult.score} size={192} />
                  </div>
                  <p className="text-center text-sm text-muted-foreground max-w-[200px]">
                    Target: {scanResult.url}
                  </p>
                </Card>
                <div className="lg:col-span-2 space-y-6 animate-slide-up delay-200">
                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Findings Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <button type="button" onClick={() => setSeverityFilter('critical')} className="p-4 rounded-lg bg-severity-critical/10 border border-severity-critical/20 text-center hover:border-severity-critical/50 transition-colors">
                          <div className="text-3xl font-bold text-severity-critical tabular-nums">
                            {scanResult.findings.filter(f => !f.passed && f.severity === 'critical').length}
                          </div>
                          <div className="text-xs text-severity-critical/80 mt-1 uppercase font-semibold">Critical</div>
                        </button>
                        <button type="button" onClick={() => setSeverityFilter('high')} className="p-4 rounded-lg bg-severity-high/10 border border-severity-high/20 text-center hover:border-severity-high/50 transition-colors">
                          <div className="text-3xl font-bold text-severity-high tabular-nums">
                            {scanResult.findings.filter(f => !f.passed && f.severity === 'high').length}
                          </div>
                          <div className="text-xs text-severity-high/80 mt-1 uppercase font-semibold">High</div>
                        </button>
                        <button type="button" onClick={() => setSeverityFilter('medium')} className="p-4 rounded-lg bg-severity-medium/10 border border-severity-medium/20 text-center hover:border-severity-medium/50 transition-colors">
                          <div className="text-3xl font-bold text-severity-medium tabular-nums">
                            {scanResult.findings.filter(f => !f.passed && f.severity === 'medium').length}
                          </div>
                          <div className="text-xs text-severity-medium/80 mt-1 uppercase font-semibold">Medium</div>
                        </button>
                        <button type="button" onClick={() => setSeverityFilter('passed')} className="p-4 rounded-lg bg-success/10 border border-success/20 text-center hover:border-success/50 transition-colors">
                          <div className="text-3xl font-bold text-success tabular-nums">
                            {scanResult.findings.filter(f => f.passed).length}
                          </div>
                          <div className="text-xs text-success/80 mt-1 uppercase font-semibold">Passed</div>
                        </button>
                      </div>
                    </CardContent>
                  </Card>

                  <CategoryScoreBreakdown categories={scanResult.categories} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="findings" className="m-0 space-y-4">
              <FindingsToolbar
                query={query}
                onQueryChange={setQuery}
                severity={severityFilter}
                onSeverityChange={setSeverityFilterState}
                counts={{
                  all: scanResult.findings.length,
                  failed: scanResult.findings.filter(f => !f.passed).length,
                  passed: scanResult.findings.filter(f => f.passed).length,
                }}
              />
              <div className="space-y-4">
                {(() => {
                  const ranks = { critical: 1, high: 2, medium: 3, low: 4, passed: 5 };
                  const visible = filterFindings([...scanResult.findings], query, severityFilter)
                    .sort((a, b) => (ranks[a.severity] || 6) - (ranks[b.severity] || 6));
                  if (visible.length === 0) {
                    return <div className="text-muted-foreground text-center py-8">No findings match the current filter.</div>;
                  }
                  return visible.map((finding) => (
                    <AuditFindingCard key={finding.id} finding={finding} />
                  ));
                })()}
              </div>
            </TabsContent>

            <TabsContent value="trend" className="m-0">
              <ScanTrendChart scans={scanHistory} scoreKey="score" />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PageTransition>
  );
}
