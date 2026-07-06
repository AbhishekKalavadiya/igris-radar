'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Search, Loader2, Target, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ScoreRing from '@/components/ui/ScoreRing';
import PageHeader from '@/components/ui/PageHeader';
import ScanProgressSteps from '@/components/ui/ScanProgressSteps';
import FindingsToolbar, { filterFindings } from '@/components/ui/FindingsToolbar';
import AiUnavailableNotice from '@/components/ui/AiUnavailableNotice';
import { PageTransition } from '@/components/ui/motion';
import { SCANNERS } from '@/lib/scannerAccents';
import AuditFindingCard from '@/components/ui/AuditFindingCard';
import CategoryScoreBreakdown from '@/components/ui/CategoryScoreBreakdown';
import SearchPreview from '@/components/ui/SearchPreview';
import dynamic from 'next/dynamic';
import CompetitorCompare from '@/components/ui/CompetitorCompare';
import ExportReportButton from '@/components/ui/ExportReportButton';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import FeatureGate from '@/components/ui/FeatureGate';
import { useAuth } from '@/lib/authContext';
import { useSettings } from '@/hooks/use-settings';
import { usePlanLimits } from '@/hooks/use-plan-limits';
import { notifyScanDone } from '@/lib/browserNotify';

const ScanTrendChart = dynamic(() => import('@/components/ui/ScanTrendChart'), {
  ssr: false,
  loading: () => <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">Loading Chart...</div>
});

const SCAN_STEPS = [
  'Fetching page and parsing HTML…',
  'Checking robots.txt, sitemap and canonical signals…',
  'Auditing titles, meta tags and heading structure…',
  'Extracting Schema.org structured data…',
  'Evaluating link health and content depth…',
  'Compiling findings and calculating score…',
];

export default function SeoAuditPage() {
  const { user } = useAuth();
  const userPlan = user?.plan || 'free';
  const [url, setUrl] = useState('');
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [enableCrawl, setEnableCrawl] = useState(false);
  const [enableDeepAnalysis, setEnableDeepAnalysis] = useState(false);

  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [allHistory, setAllHistory] = useState([]);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const [query, setQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const { toast } = useToast();
  const { settings, loaded: settingsLoaded } = useSettings();
  const { planLimits } = usePlanLimits();

  // Pre-fill Audit Preferences defaults (Settings → Audit Preferences)
  useEffect(() => {
    if (!settingsLoaded) return;
    setEnableDeepAnalysis(settings.audit.enableDeepAnalysis);
    setCompetitorUrl(prev => prev || settings.audit.defaultCompetitor);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsLoaded]);

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
      const res = await fetch(`/api?path=seo-scan/history&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAllHistory(data.data);
        if (targetUrl) {
          setScanHistory(data.data.filter(s => s.url === targetUrl));
        }
      }
    } catch (e) {
      console.error('Failed to fetch history', e);
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
      const formattedCompetitor = competitorUrl ? (competitorUrl.startsWith('http') ? competitorUrl : `https://${competitorUrl}`) : undefined;

      const res = await fetch('/api?path=seo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: formattedUrl, 
          competitorUrl: formattedCompetitor,
          deepAnalysis: enableDeepAnalysis,
          crawl: enableCrawl
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setScanResult(data.data);
        fetchHistory(targetUrl);
        toast({ title: 'Audit complete', description: `Scored ${data.data.score}/100` });
        notifyScanDone(settings.notifications.pushNotifications, 'SEO audit complete', `${formattedUrl} scored ${data.data.score}/100`);
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
      scanResult.findings.filter(f => f.category === categoryName),
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

  const accent = SCANNERS.seo;

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Search}
        accent={accent}
        title="SEO Audit"
        description="Comprehensive technical, on-page, and structural SEO analysis."
        actions={scanResult && <ExportReportButton scanResult={scanResult} scanType="seo" />}
      />

      {upgradeInfo && (
        <UpgradePrompt currentPlan={upgradeInfo.currentPlan} reason={upgradeInfo.reason} />
      )}

      {/* Input Form */}
      <Card className="glass-panel rounded-xl border-t-2 border-t-scanner-seo/60 animate-slide-up">
        <CardContent className="pt-6">
          <form onSubmit={handleScan} className="space-y-4">
            <div className="flex gap-3 flex-col md:flex-row">
              <div className="relative flex-1">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
              <FeatureGate currentPlan={userPlan} feature="competitorScan" planLimits={planLimits} minPlan="pro" className="flex-1">
                <div className="relative flex-1">
                  <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-50" />
                  <Input
                    placeholder="Competitor URL (Optional)"
                    className="pl-10"
                    value={competitorUrl}
                    onChange={(e) => setCompetitorUrl(e.target.value)}
                    disabled={isScanning}
                    type="text"
                    autoCapitalize="none"
                    autoCorrect="off"
                  />
                </div>
              </FeatureGate>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="crawl" 
                    checked={enableCrawl} 
                    onCheckedChange={setEnableCrawl} 
                    disabled={isScanning}
                  />
                  <label htmlFor="crawl" className="text-sm font-medium leading-none cursor-pointer">
                    Multi-page Crawl
                  </label>
                </div>
                <FeatureGate currentPlan={userPlan} feature="deepAnalysis" planLimits={planLimits} minPlan="pro">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="deepAnalysis"
                      checked={enableDeepAnalysis} 
                      onCheckedChange={setEnableDeepAnalysis} 
                      disabled={isScanning}
                    />
                    <label htmlFor="deepAnalysis" className="text-sm font-medium leading-none cursor-pointer flex items-center gap-1">
                      <Sparkles className="h-3 w-3 text-scanner-aeo" /> AI Deep Analysis
                    </label>
                  </div>
                </FeatureGate>
              </div>
              
              <div className="flex gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                {scanResult && (
                  <Button type="button" variant="outline" onClick={() => { setUrl(''); setScanResult(null); setCompetitorUrl(''); }} className="w-full sm:w-auto">
                    Clear
                  </Button>
                )}
                <Button type="submit" disabled={isScanning || !url} className="w-full sm:w-auto min-w-[140px] bg-primary hover:bg-primary/90 text-white">
                  {isScanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Auditing...</> : 'Run SEO Audit'}
                </Button>
              </div>
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
                      <Search className="h-3 w-3" /> SEO Score
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
      {isScanning && <ScanProgressSteps steps={SCAN_STEPS} accent={accent} stepDuration={enableCrawl ? 4000 : 2200} />}

      {/* Results */}
      {scanResult && !isScanning && (
        <div className="animate-in fade-in slide-in-from-bottom-4">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-card border border-border w-full justify-start h-auto flex-wrap p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tech">Technical</TabsTrigger>
              <TabsTrigger value="onpage">On-Page</TabsTrigger>
              <TabsTrigger value="schema">Structured Data</TabsTrigger>
              <TabsTrigger value="links">Link Health</TabsTrigger>
              <TabsTrigger value="trend">Trend</TabsTrigger>
              {scanResult.deepAnalysis && <TabsTrigger value="ai" className="text-scanner-aeo data-[state=active]:text-scanner-aeo"><Sparkles className="h-3 w-3 mr-1" /> AI Insights</TabsTrigger>}
            </TabsList>

            <TabsContent value="overview" className="space-y-6 m-0">
              {enableDeepAnalysis && !scanResult.deepAnalysis && (
                <AiUnavailableNotice feature="AI Deep Analysis" envVar="GEMINI_API_KEY" />
              )}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="glass-card lg:col-span-1 flex flex-col items-center justify-center py-6 animate-slide-up delay-100">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Overall SEO Score</h3>
                  <div className="h-48 w-48 mb-4">
                    <ScoreRing score={scanResult.score} size={192} />
                  </div>
                  <p className="text-center text-sm text-muted-foreground max-w-[200px]">
                    Based on {scanResult.findings.length} checks across 4 categories.
                  </p>
                </Card>
                <div className="lg:col-span-2 animate-slide-up delay-200">
                  <CategoryScoreBreakdown categories={scanResult.categories} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SearchPreview 
                  url={scanResult.url} 
                  title={scanResult.deepAnalysis?.titleSuggestions?.[0] || 'Optimized Title Preview'} 
                  description={scanResult.deepAnalysis?.metaDescriptionRecommendation || 'Optimize your meta description to improve click-through rates.'}
                  mode="serp" 
                />
                
                {scanResult.competitorUrl ? (
                  <CompetitorCompare 
                    yourResult={scanResult} 
                    competitorResult={{
                      url: scanResult.competitorUrl,
                      score: scanResult.competitorScore,
                      categories: scanResult.competitorCategories
                    }} 
                  />
                ) : (
                  <Card className="glass-card flex items-center justify-center p-6 border-dashed animate-slide-up delay-300">
                    <div className="text-center">
                      <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h4 className="text-sm font-medium text-foreground mb-1">No Competitor Selected</h4>
                      <p className="text-xs text-muted-foreground max-w-[250px] mx-auto">
                        Add a competitor URL in your next scan to see a side-by-side performance comparison.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="tech" className="m-0">
              {renderCategoryTab('Technical SEO')}
            </TabsContent>

            <TabsContent value="onpage" className="m-0">
              {renderCategoryTab('On-Page SEO')}
            </TabsContent>

            <TabsContent value="schema" className="m-0">
              {renderCategoryTab('Structured Data')}
            </TabsContent>

            <TabsContent value="links" className="m-0">
              {renderCategoryTab('Link Health')}
            </TabsContent>

            <TabsContent value="trend" className="m-0">
              <ScanTrendChart scans={scanHistory} scoreKey="score" />
            </TabsContent>

            {scanResult.deepAnalysis && (
              <TabsContent value="ai" className="m-0 space-y-6">
                <Card className="border-scanner-aeo/30 bg-scanner-aeo/5">
                  <CardHeader>
                    <CardTitle className="text-scanner-aeo flex items-center gap-2">
                      <Sparkles className="h-5 w-5" /> Gemini Deep Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Title Suggestions</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                        {scanResult.deepAnalysis.titleSuggestions?.map((t, i) => <li key={i}>{t}</li>)}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Meta Description Strategy</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded border border-border/50">{scanResult.deepAnalysis.metaDescriptionRecommendation}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Keyword Analysis</h4>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.deepAnalysis.keywordAnalysis?.map((k, i) => (
                          <span key={i} className="bg-scanner-aeo/20 text-scanner-aeo px-2 py-1 rounded-md text-xs">{k}</span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">E-E-A-T Score Estimate</h4>
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden max-w-md">
                          <div className="h-full bg-scanner-aeo" style={{ width: `${scanResult.deepAnalysis.eeatScore || 0}%` }} />
                        </div>
                        <span className="text-sm font-mono text-scanner-aeo">{scanResult.deepAnalysis.eeatScore || 0}/100</span>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-2">Content Gap Analysis</h4>
                      <p className="text-sm text-muted-foreground">{scanResult.deepAnalysis.contentGapAnalysis}</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

          </Tabs>
        </div>
      )}

    </PageTransition>
  );
}
