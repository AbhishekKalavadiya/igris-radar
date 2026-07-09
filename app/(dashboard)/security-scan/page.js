'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Shield, Loader2, Search, Lock, Sparkles, AlertCircle, Zap, Star, Crown, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ScoreRing from '@/components/ui/ScoreRing';
import AuditFindingCard from '@/components/ui/AuditFindingCard';
import CategoryScoreBreakdown from '@/components/ui/CategoryScoreBreakdown';
import dynamic from 'next/dynamic';
import ExportReportButton from '@/components/ui/ExportReportButton';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import FeatureGate from '@/components/ui/FeatureGate';
import AiUnavailableNotice from '@/components/ui/AiUnavailableNotice';
import PageHeader from '@/components/ui/PageHeader';
import ScanProgressSteps from '@/components/ui/ScanProgressSteps';
import FindingsToolbar, { filterFindings } from '@/components/ui/FindingsToolbar';
import { PageTransition } from '@/components/ui/motion';
import { SCANNERS } from '@/lib/scannerAccents';
import { useSettings } from '@/hooks/use-settings';
import { notifyScanDone } from '@/lib/browserNotify';
import { useAuth } from '@/lib/authContext';
import { usePlanLimits } from '@/hooks/use-plan-limits';

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
  const [enableDeepAnalysis, setEnableDeepAnalysis] = useState(false);
  const { toast } = useToast();
  const { settings } = useSettings();
  const { user } = useAuth();
  const userPlan = user?.plan || 'free';
  const { planLimits } = usePlanLimits();

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
        body: JSON.stringify({ url: formattedUrl, deepAnalysis: enableDeepAnalysis })
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

  const uniqueCategories = scanResult ? [...new Set(scanResult.findings.map(f => f.category))].sort() : [];

  const renderCategoryTab = (categoryName) => {
    const categoryFindings = scanResult.findings.filter(f => categoryName === 'All' ? true : f.category === categoryName);
    const ranks = { critical: 1, high: 2, medium: 3, low: 4, passed: 5 };
    const visible = filterFindings([...categoryFindings], query, severityFilter)
      .sort((a, b) => (ranks[a.severity] || 6) - (ranks[b.severity] || 6));
    
    return (
      <div className="space-y-4">
        <FindingsToolbar
          query={query}
          onQueryChange={setQuery}
          severity={severityFilter}
          onSeverityChange={setSeverityFilterState}
          counts={{
            all: categoryFindings.length,
            failed: categoryFindings.filter(f => !f.passed).length,
            passed: categoryFindings.filter(f => f.passed).length,
          }}
        />
        <div className="space-y-4">
          {visible.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No findings match the current filter in this category.</div>
          ) : (
            visible.map((finding) => (
              <AuditFindingCard key={finding.id} finding={finding} />
            ))
          )}
        </div>
      </div>
    );
  };
  const renderTierTab = (tier) => {
    let tierFindings = [];
    if (tier === 'free') {
      tierFindings = scanResult.findings.filter(f => !f.tier || f.tier === 'free');
    } else {
      tierFindings = scanResult.findings.filter(f => f.tier === tier);
    }
    const ranks = { critical: 1, high: 2, medium: 3, low: 4, passed: 5 };
    const visible = filterFindings([...tierFindings], query, severityFilter)
      .sort((a, b) => (ranks[a.severity] || 6) - (ranks[b.severity] || 6));
    
    return (
      <div className="space-y-4">
        <FindingsToolbar
          query={query}
          onQueryChange={setQuery}
          severity={severityFilter}
          onSeverityChange={setSeverityFilterState}
          counts={{
            all: tierFindings.length,
            failed: tierFindings.filter(f => !f.passed).length,
            passed: tierFindings.filter(f => f.passed).length,
          }}
        />
        <div className="space-y-4">
          {visible.length === 0 ? (
            <div className="text-muted-foreground text-center py-8">No findings match the current filter in this tier.</div>
          ) : (
            visible.map((finding) => (
              <AuditFindingCard key={finding.id} finding={finding} />
            ))
          )}
        </div>
      </div>
    );
  };


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
          <form onSubmit={handleScan} className="space-y-4">
            <div className="flex gap-3">
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
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
              <div className="flex items-center space-x-6">
                <FeatureGate currentPlan={userPlan} feature="deepAnalysis" planLimits={planLimits} minPlan="pro">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="deepAnalysis"
                      checked={enableDeepAnalysis} 
                      onCheckedChange={setEnableDeepAnalysis} 
                      disabled={isScanning}
                    />
                    <label htmlFor="deepAnalysis" className="text-sm font-medium leading-none cursor-pointer">
                      AI Deep Analysis
                    </label>
                  </div>
                </FeatureGate>
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
              <TabsTrigger value="findings" className="relative">
                All Findings
                {scanResult.findings.filter(f => f.locked).length > 0 && (
                  <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    <Lock className="h-2.5 w-2.5" />
                    {scanResult.findings.filter(f => f.locked).length}
                  </span>
                )}
              </TabsTrigger>
              <div className="w-px h-5 bg-border mx-1.5 hidden sm:block" />
              
              <TabsTrigger 
                value="tier-free" 
                className="gap-1.5 bg-muted/30 hover:bg-muted/50 data-[state=active]:border-border/50 data-[state=active]:bg-background"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-success" /> Free
              </TabsTrigger>
              <TabsTrigger 
                value="tier-starter" 
                className="gap-1.5 bg-muted/30 hover:bg-muted/50 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Zap className="w-3.5 h-3.5 text-primary" /> Starter
              </TabsTrigger>
              <TabsTrigger 
                value="tier-pro" 
                className="gap-1.5 bg-muted/30 hover:bg-muted/50 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Star className="w-3.5 h-3.5 text-warning" /> Pro
              </TabsTrigger>
              <TabsTrigger 
                value="tier-agency" 
                className="gap-1.5 bg-muted/30 hover:bg-muted/50 data-[state=active]:border-primary/20 data-[state=active]:bg-primary/10 data-[state=active]:text-primary"
              >
                <Crown className="w-3.5 h-3.5 text-destructive" /> Agency
              </TabsTrigger>

              <div className="w-px h-5 bg-border mx-1.5 hidden sm:block" />
              {uniqueCategories.map(cat => (
                <TabsTrigger key={cat} value={`cat-${cat}`}>{cat}</TabsTrigger>
              ))}
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
                  <p className="text-center text-xs text-muted-foreground/60 mt-2 max-w-[220px]">
                    Score includes results from all {scanResult.totalChecks || scanResult.findings.length} checks
                  </p>
                </Card>
                <div className="lg:col-span-2 space-y-6 animate-slide-up delay-200">
                  {/* AI Deep Analysis Section */}
                  {(enableDeepAnalysis || scanResult.ai) && (
                    <Card className="glass-card border-primary/20 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                      <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-primary" />
                          AI Security Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6">
                        {scanResult.ai ? (
                          scanResult.ai.error ? (
                            <AiUnavailableNotice reason={scanResult.ai.error} />
                          ) : (
                            <div className="space-y-6">
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-foreground">Executive Summary</h4>
                                <p className="text-sm text-muted-foreground leading-relaxed">{scanResult.ai.executiveSummary}</p>
                              </div>
                              
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                  <AlertCircle className="h-4 w-4 text-destructive" /> Top Risks
                                </h4>
                                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                                  {scanResult.ai.topRisks?.map((risk, i) => (
                                    <li key={i}>{risk}</li>
                                  ))}
                                </ul>
                              </div>

                              {scanResult.ai.remediationSummary && (
                                <div className="space-y-2 p-4 bg-muted/30 rounded-lg border border-border">
                                  <h4 className="text-sm font-semibold text-foreground">Remediation Plan</h4>
                                  <p className="text-sm text-muted-foreground">{scanResult.ai.remediationSummary}</p>
                                </div>
                              )}

                              {scanResult.ai.threatModeling && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-foreground">Threat Modeling (Attack Chains)</h4>
                                  <p className="text-sm text-muted-foreground leading-relaxed">{scanResult.ai.threatModeling}</p>
                                </div>
                              )}

                              {scanResult.ai.owaspMapping && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-semibold text-foreground">OWASP Top 10 Mapping</h4>
                                  <div className="flex flex-wrap gap-2 mt-2">
                                    {scanResult.ai.owaspMapping.map((cat, i) => (
                                      <span key={i} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md border border-border">
                                        {cat}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {scanResult.ai.remediationCodeSnippets && scanResult.ai.remediationCodeSnippets.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-foreground">Remediation Snippets</h4>
                                  {scanResult.ai.remediationCodeSnippets.map((snippet, i) => (
                                    <div key={i} className="rounded-lg overflow-hidden border border-border">
                                      <div className="bg-muted/50 px-3 py-1.5 text-xs font-mono text-muted-foreground border-b border-border">
                                        {snippet.title}
                                      </div>
                                      <pre className="p-3 bg-black/50 text-[11px] md:text-xs overflow-x-auto text-muted-foreground">
                                        <code>{snippet.code}</code>
                                      </pre>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )
                        ) : (
                          <div className="text-center py-6">
                            <Sparkles className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">AI Deep Analysis was not run for this scan.</p>
                            <Button variant="outline" size="sm" className="mt-4" onClick={() => {
                              setEnableDeepAnalysis(true);
                              runScan(url);
                            }}>
                              Run Deep Analysis Now
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card className="glass-card">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Findings Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
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
                        <button type="button" onClick={() => setSeverityFilter('low')} className="p-4 rounded-lg bg-severity-low/10 border border-severity-low/20 text-center hover:border-severity-low/50 transition-colors">
                          <div className="text-3xl font-bold text-severity-low tabular-nums">
                            {scanResult.findings.filter(f => !f.passed && f.severity === 'low').length}
                          </div>
                          <div className="text-xs text-severity-low/80 mt-1 uppercase font-semibold">Low</div>
                        </button>
                        <button type="button" onClick={() => setSeverityFilter('info')} className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center hover:border-primary/50 transition-colors">
                          <div className="text-3xl font-bold text-primary tabular-nums">
                            {scanResult.findings.filter(f => !f.passed && f.severity === 'info').length}
                          </div>
                          <div className="text-xs text-primary/80 mt-1 uppercase font-semibold">Info</div>
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
              {renderCategoryTab('All')}
            </TabsContent>

            <TabsContent value="tier-free" className="m-0 space-y-4">
              {renderTierTab('free')}
            </TabsContent>
            <TabsContent value="tier-starter" className="m-0 space-y-4">
              {renderTierTab('starter')}
            </TabsContent>
            <TabsContent value="tier-pro" className="m-0 space-y-4">
              {renderTierTab('pro')}
            </TabsContent>
            <TabsContent value="tier-agency" className="m-0 space-y-4">
              {renderTierTab('agency')}
            </TabsContent>

            {uniqueCategories.map(cat => (
              <TabsContent key={cat} value={`cat-${cat}`} className="m-0 space-y-4">
                {renderCategoryTab(cat)}
              </TabsContent>
            ))}

            <TabsContent value="trend" className="m-0">
              <ScanTrendChart scans={scanHistory} scoreKey="score" />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </PageTransition>
  );
}
