'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Loader2, Target, CheckCircle2, Zap, Star, Crown, Lock, Smartphone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ScoreRing from '@/components/ui/ScoreRing';
import PageHeader from '@/components/ui/PageHeader';
import ScanProgressSteps from '@/components/ui/ScanProgressSteps';
import FindingsToolbar, { filterFindings } from '@/components/ui/FindingsToolbar';
import { PageTransition } from '@/components/ui/motion';
import { SCANNERS } from '@/lib/scannerAccents';
import AuditFindingCard from '@/components/ui/AuditFindingCard';
import CategoryScoreBreakdown from '@/components/ui/CategoryScoreBreakdown';
import dynamic from 'next/dynamic';
import ExportReportButton from '@/components/ui/ExportReportButton';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import { useAuth } from '@/lib/authContext';
import { notifyScanDone } from '@/lib/browserNotify';
import { useSettings } from '@/hooks/use-settings';

const ScanTrendChart = dynamic(() => import('@/components/ui/ScanTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Loading Chart...</div>
});

const SCAN_STEPS = [
  'Detecting platform (iOS/Android)…',
  'Fetching public app store listing data…',
  'Analyzing metadata and keyword density…',
  'Evaluating visual assets and localization…',
  'Analyzing reviews and ratings…',
  'Estimating competition and downloads…',
  'Compiling findings and calculating score…',
];

export default function AsoAuditPage() {
  const { user } = useAuth();
  const userPlan = user?.plan || 'free';
  const [url, setUrl] = useState('');

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const { toast } = useToast();
  const { settings } = useSettings();

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
      const res = await fetch(`/api?path=aso-scan/history&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAllHistory(data.data);
        if (targetUrl) {
          setScanHistory(data.data.filter(s => s.url === targetUrl));
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
      const res = await fetch('/api?path=aso-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      });
      const data = await res.json();
      
      if (data.success) {
        setScanResult(data.data);
        fetchHistory(targetUrl);
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('scan-completed'));
        toast({ title: 'Audit complete', description: `Scored ${data.data.score}/100` });
        if (settings?.notifications?.pushNotifications) {
          notifyScanDone(true, 'ASO audit complete', `${data.data.appName} scored ${data.data.score}/100`);
        }
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

  const renderCategoryTab = (categoryName) => {
    if (!scanResult) return null;
    const findings = filterFindings(
      scanResult.findings.filter(f => categoryName === 'All' ? true : f.category === categoryName),
      query,
      severityFilter
    );
    // Sort failed first
    findings.sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1));

    return (
      <div className="space-y-4">
        <FindingsToolbar
          query={query}
          onQueryChange={setQuery}
          severity={severityFilter}
          onSeverityChange={setSeverityFilter}
        />
        {findings.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">No checks match the current filter.</div>
        ) : (
          findings.map((f) => <AuditFindingCard key={f.id} finding={f} />)
        )}
      </div>
    );
  };

  const renderTierTab = (tier) => {
    const tierFindings = tier === 'free'
      ? scanResult.findings.filter(f => !f.tier || f.tier === 'free')
      : scanResult.findings.filter(f => f.tier === tier);
    const visible = filterFindings([...tierFindings], query, severityFilter)
      .sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1));

    return (
      <div className="space-y-4">
        <FindingsToolbar
          query={query}
          onQueryChange={setQuery}
          severity={severityFilter}
          onSeverityChange={setSeverityFilter}
        />
        {visible.length === 0 ? (
          <div className="text-muted-foreground text-center py-8">No checks in this tier for this scan.</div>
        ) : (
          visible.map((f) => <AuditFindingCard key={f.id} finding={f} />)
        )}
      </div>
    );
  };

  const lockedCount = scanResult?.findings.filter(f => f.locked).length || 0;
  const accent = SCANNERS.aso;

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Smartphone}
        accent={accent}
        title="ASO Audit"
        description="32+ checks analyzing metadata, keywords, visuals, and reviews across Apple App Store and Google Play."
        actions={scanResult && <ExportReportButton scanResult={scanResult} scanType="aso" />}
      />

      {upgradeInfo && (
        <UpgradePrompt currentPlan={upgradeInfo.currentPlan} reason={upgradeInfo.reason} />
      )}

      {/* Input Form */}
      <Card className="glass-panel rounded-xl border-t-2 border-t-scanner-aso/60 animate-slide-up">
        <CardContent className="pt-6">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="relative flex-1">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://apps.apple.com/... or https://play.google.com/..."
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
            
            <div className="flex justify-end gap-2 pt-2">
              {scanResult && (
                <Button type="button" variant="outline" onClick={() => { setUrl(''); setScanResult(null); }} className="w-full sm:w-auto">
                  Clear
                </Button>
              )}
              <Button type="submit" disabled={isScanning || !url} className="w-full sm:w-auto min-w-[140px] bg-primary hover:bg-primary/90 text-white">
                {isScanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Auditing...</> : 'Run ASO Audit'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      {!url && !scanResult && recentScans.length > 0 && (
        <div className="animate-slide-up space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Previously Scanned Apps</h3>
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
                    <h4 className="font-semibold line-clamp-1">{scan.appName || scan.appId}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Smartphone className="h-3 w-3" /> {scan.platform === 'ios' ? 'App Store' : 'Google Play'}
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
      {isScanning && <ScanProgressSteps steps={SCAN_STEPS} accent={accent} stepDuration={1500} />}

      {/* Results */}
      {scanResult && !isScanning && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card border border-border w-full justify-start h-auto flex-wrap p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="all" className="relative">
                All Findings
                {lockedCount > 0 && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    <Lock className="h-2.5 w-2.5" />{lockedCount}
                  </span>
                )}
              </TabsTrigger>

              <div className="w-px h-5 bg-border mx-1.5 hidden sm:block" />
              <TabsTrigger value="tier-starter" className="gap-1.5 bg-muted/30 hover:bg-muted/50 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Zap className="w-3.5 h-3.5 text-primary" /> Starter
              </TabsTrigger>

              <div className="w-px h-5 bg-border mx-1.5 hidden sm:block" />
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="visuals">Visual Assets</TabsTrigger>
              <TabsTrigger value="reviews">Ratings & Reviews</TabsTrigger>
              <TabsTrigger value="keywords">Keywords</TabsTrigger>
              <TabsTrigger value="competition">Competition</TabsTrigger>
              <TabsTrigger value="localization">Localization</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 m-0">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-card lg:col-span-1 flex flex-col items-center justify-center py-6 animate-slide-up delay-100">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Overall ASO Score</h3>
                  <div className="h-48 w-48 mb-4">
                    <ScoreRing score={scanResult.score} size={192} />
                  </div>
                  <p className="text-center text-sm text-muted-foreground max-w-[200px]">
                    Based on {scanResult.findings.length} checks for {scanResult.platform === 'ios' ? 'iOS' : 'Android'}.
                  </p>
                </Card>
                <div className="lg:col-span-2 animate-slide-up delay-200">
                  <CategoryScoreBreakdown categories={scanResult.categories} />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="all" className="m-0">
              {renderCategoryTab('All')}
            </TabsContent>

            <TabsContent value="tier-starter" className="m-0">
              {renderTierTab('starter')}
            </TabsContent>

            <TabsContent value="metadata" className="m-0">
              {renderCategoryTab('metadata')}
            </TabsContent>
            <TabsContent value="visuals" className="m-0">
              {renderCategoryTab('visuals')}
            </TabsContent>
            <TabsContent value="reviews" className="m-0">
              {renderCategoryTab('reviews')}
            </TabsContent>
            <TabsContent value="keywords" className="m-0">
              {renderCategoryTab('keywords')}
            </TabsContent>
            <TabsContent value="competition" className="m-0">
              {renderCategoryTab('competition')}
            </TabsContent>
            <TabsContent value="localization" className="m-0">
              {renderCategoryTab('localization')}
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
