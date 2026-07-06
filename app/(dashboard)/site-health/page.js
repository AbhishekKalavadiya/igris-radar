'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ScoreRing from '@/components/ui/ScoreRing';
import PageHeader from '@/components/ui/PageHeader';
import ScanProgressSteps from '@/components/ui/ScanProgressSteps';
import { PageTransition } from '@/components/ui/motion';
import { SCANNERS } from '@/lib/scannerAccents';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Loader2, Target, Gauge, Accessibility, CheckCircle2, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HelpCircle } from 'lucide-react';

const A11Y_DETAILS = {
  'aria-hidden-focus': 'Focusable elements within an [aria-hidden="true"] container are hidden from screen readers but still reachable via keyboard. This creates a confusing "ghost" focus trap for disabled users.',
  'link-name': 'Links without discernible text (like icon-only links without aria-labels) are announced simply as "link" by screen readers, making their destination unclear.',
  'aria-prohibited-attr': 'Using ARIA attributes that are not permitted for an element\'s specific role can cause assistive technologies to interpret the element incorrectly.',
  'aria-roles': 'ARIA roles must use valid, standardized names. Invalid roles are ignored by browsers, stripping away the accessibility context you tried to provide.',
  'image-alt': 'Screen readers cannot analyze images. You must provide a text alternative (alt attribute) so visually impaired users understand the image content.',
  'color-contrast': 'Low contrast makes text difficult or impossible to read for users with visual impairments, color blindness, or users in bright environments.',
  'html-has-lang': 'Screen readers use the HTML lang attribute to select the correct voice profile and pronunciation rules. Without it, the text may be spoken with the wrong accent.',
  'button-name': 'Buttons without text (like icon buttons) must have an aria-label or visually hidden text so screen reader users know what action the button performs.',
  'document-title': 'The page title is the first thing a screen reader announces. Without a descriptive title, users have to read through the page just to know where they are.',
  'heading-order': 'Skipping heading levels (e.g. jumping from H1 to H3) breaks the structural outline of the page, confusing users who navigate via headings.',
  'meta-viewport': 'Disabling user scaling in the viewport meta tag prevents low-vision users from zooming in to read small text.',
  'label': 'Form inputs must have associated labels so screen readers can announce what information the user needs to enter.'
};

const SCAN_STEPS = [
  'Requesting PageSpeed analysis…',
  'Measuring Core Web Vitals (LCP, INP, CLS)…',
  'Auditing WCAG 2.2 accessibility rules…',
  'Compiling health report…',
];

export default function SiteHealthPage() {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const { toast } = useToast();

  const [allHistory, setAllHistory] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setUrl(urlParam);
      if (params.get('autorun') === '1') runScan(urlParam);
    }
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api?path=performance-scan&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAllHistory(data.data);
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

      const res = await fetch('/api?path=performance-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl })
      });
      const data = await res.json();

      if (data.success) {
        setScanResult(data.data);
        fetchHistory();
        toast({ title: 'Health check complete', description: `Accessibility scored ${data.data.accessibilityScore}%` });
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

  const getStatusColor = (status) => {
    if (status === 'good') return 'text-success bg-success/10 border-success/20';
    if (status === 'needs-improvement') return 'text-warning bg-warning/10 border-warning/20';
    return 'text-destructive bg-destructive/10 border-destructive/20';
  };

  const formatStatus = (status) => {
    return status.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const accent = SCANNERS.health;

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Activity}
        accent={accent}
        title="Site Health"
        description="Monitor Core Web Vitals performance and WCAG 2.2 accessibility compliance."
      />

      {upgradeInfo && (
        <UpgradePrompt currentPlan={upgradeInfo.currentPlan} reason={upgradeInfo.reason} />
      )}

      <Card className="glass-panel rounded-xl border-t-2 border-t-scanner-health/60">
        <CardContent className="pt-6">
          <form onSubmit={handleScan} className="flex gap-3">
            <div className="relative flex-1">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter URL to check health (e.g., https://example.com)"
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
            <div className="flex items-center gap-2">
              {scanResult && (
                <Button type="button" variant="outline" onClick={() => { setUrl(''); setScanResult(null); }}>
                  Clear
                </Button>
              )}
              <Button type="submit" disabled={isScanning || !url} className="min-w-[140px]">
                {isScanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...</> : 'Check Health'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      {!url && !scanResult && recentScans.length > 0 && (
        <div className="animate-slide-up space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Previously Checked Sites</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentScans.map(scan => (
              <Card 
                key={scan.id} 
                className="glass-panel cursor-pointer hover:border-primary/50 hover:bg-muted/5 transition-all"
                onClick={() => {
                  setUrl(scan.url);
                  setScanResult(scan);
                }}
              >
                <CardContent className="p-4 flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold line-clamp-1 truncate" title={scan.url}>{scan.url}</h4>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Performance</p>
                      <Badge variant="outline" className={
                        scan.coreWebVitals?.lcp?.status === 'good' ? 'text-success border-success/20 bg-success/5' : 
                        scan.coreWebVitals?.lcp?.status === 'needs-improvement' ? 'text-warning border-warning/20 bg-warning/5' : 
                        'text-destructive border-destructive/20 bg-destructive/5'
                      }>
                        {scan.coreWebVitals?.lcp?.value || 'N/A'} LCP
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Accessibility</p>
                      <span className={`text-sm font-bold font-mono ${scan.accessibilityScore >= 90 ? 'text-success' : scan.accessibilityScore >= 50 ? 'text-warning' : 'text-destructive'}`}>
                        {scan.accessibilityScore}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {isScanning && <ScanProgressSteps steps={SCAN_STEPS} accent={accent} stepDuration={3000} />}

      {scanResult && (
        <Tabs defaultValue="performance" className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Gauge className="h-4 w-4" /> Performance
            </TabsTrigger>
            <TabsTrigger value="accessibility" className="flex items-center gap-2">
              <Accessibility className="h-4 w-4" /> Accessibility
            </TabsTrigger>
          </TabsList>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-border bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Largest Contentful Paint (LCP)
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px]">
                          <p>Measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{scanResult.coreWebVitals.lcp.value}</div>
                  <Badge variant="outline" className={`mt-2 ${getStatusColor(scanResult.coreWebVitals.lcp.status)}`}>
                    {formatStatus(scanResult.coreWebVitals.lcp.status)}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Interaction to Next Paint (INP)
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px]">
                          <p>Measures responsiveness. A low INP (under 200ms) means the page is consistently quick to respond to all user interactions.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{scanResult.coreWebVitals.inp.value}</div>
                  <Badge variant="outline" className={`mt-2 ${getStatusColor(scanResult.coreWebVitals.inp.status)}`}>
                    {formatStatus(scanResult.coreWebVitals.inp.status)}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    Cumulative Layout Shift (CLS)
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px]">
                          <p>Measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1 or less.</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{scanResult.coreWebVitals.cls.value}</div>
                  <Badge variant="outline" className={`mt-2 ${getStatusColor(scanResult.coreWebVitals.cls.status)}`}>
                    {formatStatus(scanResult.coreWebVitals.cls.status)}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    First Contentful Paint (FCP)
                    <TooltipProvider>
                      <Tooltip delayDuration={300}>
                        <TooltipTrigger asChild>
                          <HelpCircle className="h-4 w-4 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[250px]">
                          <p>Measures how long it takes the browser to render the first piece of DOM content after a user navigates to your page (under 1.8s is ideal).</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{scanResult.coreWebVitals.fcp.value}</div>
                  <Badge variant="outline" className={`mt-2 ${getStatusColor(scanResult.coreWebVitals.fcp.status)}`}>
                    {formatStatus(scanResult.coreWebVitals.fcp.status)}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="accessibility" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-border bg-card/50 backdrop-blur md:col-span-1">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Accessibility Score</CardTitle>
                  <CardDescription>WCAG 2.2 Compliance</CardDescription>
                </CardHeader>
                <CardContent className="flex justify-center py-4">
                  <ScoreRing score={scanResult.accessibilityScore} size={180} />
                </CardContent>
              </Card>

              <Card className="border-border bg-card/50 backdrop-blur md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base font-medium">Detected Issues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {scanResult.issues.map(issue => {
                      const displayDetails = A11Y_DETAILS[issue.ruleId];
                      return (
                        <div key={issue.id} className={`flex items-start gap-3 p-3 rounded-lg border ${issue.passed ? 'bg-card border-border/70 opacity-80' : 'bg-destructive/5 border-destructive/20'}`}>
                          <div className="mt-0.5">
                            {issue.passed ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-destructive" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm flex items-center gap-1">
                                {issue.ruleId}
                                {displayDetails && (
                                  <TooltipProvider>
                                    <Tooltip delayDuration={300}>
                                      <TooltipTrigger asChild>
                                        <HelpCircle className="h-3 w-3 text-muted-foreground cursor-help" />
                                      </TooltipTrigger>
                                      <TooltipContent side="top" className="max-w-[250px]">
                                        <p className="text-xs">{displayDetails}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </span>
                              {!issue.passed && (
                                <Badge variant="outline" className="text-[10px] py-0 text-destructive border-destructive/30">
                                  {issue.severity}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{issue.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </PageTransition>
  );
}
