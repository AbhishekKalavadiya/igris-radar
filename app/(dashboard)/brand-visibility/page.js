'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Globe, Loader2, Sparkles, Building, Target, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ScoreRing from '@/components/ui/ScoreRing';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import PageHeader from '@/components/ui/PageHeader';
import ScanProgressSteps from '@/components/ui/ScanProgressSteps';
import { PageTransition } from '@/components/ui/motion';
import { SCANNERS } from '@/lib/scannerAccents';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const LLM_PROVIDERS = [
  { id: 'openai', name: 'ChatGPT (OpenAI)' },
  { id: 'anthropic', name: 'Claude (Anthropic)' },
  { id: 'perplexity', name: 'Perplexity AI' },
  { id: 'gemini', name: 'Google Gemini' }
];

export default function BrandVisibilityPage() {
  const [brandName, setBrandName] = useState('');
  const [url, setUrl] = useState('');
  const [promptsText, setPromptsText] = useState("What is the best SEO tool?\nTop tools for Generative Engine Optimization");
  const [selectedProviders, setSelectedProviders] = useState(['openai', 'gemini']);
  // Which providers have an API key configured (admin panel or .env).
  // Providers without a key are shown as "Coming soon" and can't be selected.
  const [availableProviders, setAvailableProviders] = useState(null);

  const [allHistory, setAllHistory] = useState([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) setUrl(urlParam);
    fetchHistory();

    fetch('/api?path=ai-providers')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setAvailableProviders(data.data);
          // Drop any pre-selected provider that has no key configured
          setSelectedProviders(prev => {
            const usable = prev.filter(id => data.data[id]);
            if (usable.length > 0) return usable;
            return LLM_PROVIDERS.filter(p => data.data[p.id]).map(p => p.id);
          });
        }
      })
      .catch(() => {});
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`/api?path=brand-visibility&t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setAllHistory(data.data);
      }
    } catch (e) {
      // Silently ignore
    }
  };

  const recentScans = [];
  const seen = new Set();
  for (const scan of allHistory) {
    const key = `${scan.brandName}-${scan.url}`;
    if (!seen.has(key)) {
      seen.add(key);
      recentScans.push(scan);
    }
  }
  
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [upgradeInfo, setUpgradeInfo] = useState(null);
  const { toast } = useToast();

  const handleProviderToggle = (id) => {
    setSelectedProviders(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!brandName || !url) return;
    if (selectedProviders.length === 0) {
      toast({ title: 'Select Providers', description: 'Please select at least one LLM provider.', variant: 'destructive' });
      return;
    }

    const prompts = promptsText.split('\n').map(p => p.trim()).filter(p => p.length > 5);
    if (prompts.length === 0) {
      toast({ title: 'Invalid Prompts', description: 'Please enter at least one valid prompt.', variant: 'destructive' });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setUpgradeInfo(null);

    try {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;

      const res = await fetch('/api?path=brand-visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          brandName, 
          url: formattedUrl,
          prompts,
          providers: selectedProviders
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setScanResult(data.data);
        toast({ title: 'Tracking complete', description: `Brand Visibility Score: ${data.data.score}%` });
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

  const getSentimentColor = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'text-success';
      case 'negative': return 'text-destructive';
      default: return 'text-warning';
    }
  };

  const accent = SCANNERS.brand;

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Target}
        accent={accent}
        title="Brand Visibility Tracker"
        description="Track if your brand is being recommended by major AI engines across specific search prompts."
      />

      {upgradeInfo && (
        <UpgradePrompt currentPlan={upgradeInfo.currentPlan} reason={upgradeInfo.reason} />
      )}

      {/* Input Form */}
      <Card className="glass-panel rounded-xl border-t-2 border-t-scanner-brand/60 animate-slide-up">
        <CardContent className="pt-6">
          <form onSubmit={handleScan} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="Brand Name (e.g., Igris Radar)"
                  className="pl-10 focus-visible:ring-primary"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  disabled={isScanning}
                  required
                />
              </div>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="example.com"
                  className="pl-10 focus-visible:ring-primary"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isScanning}
                  required
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Target Prompts (One per line)</label>
              <Textarea
                placeholder="What is the best SEO tool?"
                className="font-mono text-sm min-h-[100px]"
                value={promptsText}
                onChange={(e) => setPromptsText(e.target.value)}
                disabled={isScanning}
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">LLM Providers to Query</label>
              <div className="flex flex-wrap gap-4">
                {LLM_PROVIDERS.map((provider) => {
                  // Until availability loads, only block the known-unavailable case
                  const comingSoon = availableProviders ? !availableProviders[provider.id] : false;
                  return (
                    <div key={provider.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={provider.id}
                        checked={selectedProviders.includes(provider.id)}
                        onCheckedChange={() => handleProviderToggle(provider.id)}
                        disabled={isScanning || comingSoon}
                      />
                      <label
                        htmlFor={provider.id}
                        className={`text-sm font-medium leading-none flex items-center gap-2 ${comingSoon ? 'text-muted-foreground cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {provider.name}
                        {comingSoon && (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide text-muted-foreground">Coming soon</Badge>
                        )}
                      </label>
                    </div>
                  );
                })}
              </div>
            </div>
            
            <div className="pt-2 border-t border-border flex gap-2 w-full">
              {scanResult && (
                <Button type="button" variant="outline" onClick={() => { setUrl(''); setBrandName(''); setScanResult(null); }} className="w-full sm:w-auto">
                  Clear
                </Button>
              )}
              <Button type="submit" disabled={isScanning || !brandName || !url} className="w-full sm:w-auto">
                {isScanning ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Querying AI Engines...</> : 'Run Visibility Check'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Recent Scans */}
      {!brandName && !url && !scanResult && recentScans.length > 0 && (
        <div className="animate-slide-up space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Previously Tracked Brands</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentScans.map(scan => (
              <Card 
                key={scan.id} 
                className="glass-panel cursor-pointer hover:border-primary/50 hover:bg-muted/5 transition-all"
                onClick={() => {
                  setBrandName(scan.brandName);
                  setUrl(scan.url);
                  setScanResult(scan);
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold line-clamp-1">{scan.brandName}</h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Sparkles className="h-3 w-3 text-primary" /> Visibility Score
                    </p>
                  </div>
                  <div className={`text-2xl font-bold font-mono ${scan.score >= 70 ? 'text-success' : scan.score >= 40 ? 'text-warning' : 'text-destructive'}`}>
                    {scan.score}%
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Loading State */}
      {isScanning && (
        <ScanProgressSteps
          steps={[
            'Preparing prompts…',
            'Querying selected AI engines live…',
            'Detecting brand mentions and sentiment…',
            'Building mention matrix…',
          ]}
          accent={accent}
          stepDuration={6000}
        />
      )}

      {/* Results */}
      {scanResult && !isScanning && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass-card lg:col-span-1 flex flex-col items-center justify-center py-6 animate-slide-up delay-100">
              <h3 className="text-sm font-medium text-primary/70 uppercase tracking-wider mb-4 flex items-center gap-2">
                Visibility Score
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px] text-center">
                      <p>The percentage of selected prompts and AI engines where your brand was explicitly mentioned in the response.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </h3>
              <div className="h-48 w-48 mb-4">
                <ScoreRing score={scanResult.score} size={192} />
              </div>
              <p className="text-center text-sm text-muted-foreground max-w-[200px]">
                Percentage of prompts where your brand was recommended.
              </p>
            </Card>

            <Card className="glass-card lg:col-span-2 overflow-x-auto animate-slide-up delay-200">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Mention Matrix
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[300px]">
                        <p>This matrix sends your exact prompts live to each selected AI engine and analyzes the full response to detect if your brand was recommended, as well as the sentiment of that recommendation.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
                <CardDescription>How AI engines responded to each prompt.</CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-left border-collapse">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted">
                    <tr>
                      <th className="px-4 py-3 rounded-tl-lg">Prompt</th>
                      {selectedProviders.map(pId => {
                        const pName = LLM_PROVIDERS.find(p => p.id === pId)?.name;
                        return <th key={pId} className="px-4 py-3">{pName}</th>
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {scanResult.prompts.map((prompt, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-4 font-medium max-w-[200px] truncate" title={prompt}>
                          {prompt}
                        </td>
                        {selectedProviders.map(pId => {
                          const result = scanResult.results[prompt]?.[pId];
                          if (!result) return <td key={pId} className="px-4 py-4">-</td>;
                          
                          if (result.error) {
                            return (
                              <td key={pId} className="px-4 py-4 text-destructive text-xs" title={result.error}>
                                <div className="flex items-center gap-1"><XCircle className="h-4 w-4" /> Error</div>
                              </td>
                            );
                          }
                          
                          return (
                            <td key={pId} className="px-4 py-4" title={result.preview}>
                              {result.mentioned ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle2 className="h-5 w-5 text-success" />
                                  <span className={`text-xs uppercase font-bold tracking-wider ${getSentimentColor(result.sentiment)}`}>
                                    {result.sentiment}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 text-muted-foreground opacity-50">
                                  <XCircle className="h-5 w-5" />
                                  <span className="text-xs">No Mention</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
