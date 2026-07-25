'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe, Sparkles, Search, ShieldCheck, Smartphone, CheckCircle2, AlertTriangle, ArrowRight, Loader2, Target, Code, Copy, Check, RotateCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import ScoreRing from '@/components/ui/ScoreRing';
import { SCANNERS } from '@/lib/scannerAccents';

const SCANNER_TABS = [
  {
    id: 'geo',
    name: 'GEO Audit',
    icon: Globe,
    accent: 'geo',
    score: 84,
    description: 'Generative Engine Optimization assessment for LLM citation likelihood and entity trust.',
    findings: [
      { id: 'geo-1', title: 'Knowledge Graph Organization @id Schema', severity: 'high', passed: true, category: 'Entity Authority', desc: 'Canonical entity URI fragment correctly resolved in JSON-LD.' },
      { id: 'geo-2', title: 'Wikipedia-Style Inline Citations', severity: 'medium', passed: true, category: 'Factual Density', desc: '14 inline citations located directly next to factual claims.' },
      { id: 'geo-3', title: 'TL;DR / Key Takeaways Summary Block', severity: 'medium', passed: false, category: 'AI Readability', desc: 'Missing structured summary block near top of content.', prompt: 'Write a 3-bullet Key Takeaways summary block for this page.' }
    ]
  },
  {
    id: 'aeo',
    name: 'AEO Audit',
    icon: Sparkles,
    accent: 'aeo',
    score: 78,
    description: 'Answer Engine Optimization scoring content extractability by ChatGPT, Claude, and Perplexity.',
    findings: [
      { id: 'aeo-1', title: 'FAQPage Structured Schema Data', severity: 'high', passed: true, category: 'Structured Data', desc: 'Valid FAQPage JSON-LD schema parsed with 6 questions.' },
      { id: 'aeo-2', title: 'Direct Answer Sentence Structure', severity: 'medium', passed: true, category: 'Answer Format', desc: 'Headings immediately followed by concise 40-word answers.' },
      { id: 'aeo-3', title: 'Unambiguous Pronoun Antecedents', severity: 'low', passed: false, category: 'Entity Clarity', desc: '4 paragraphs contain ambiguous pronouns ("it", "they") as sentence subjects.', prompt: 'Replace ambiguous subject pronouns with explicit entity names.' }
    ]
  },
  {
    id: 'seo',
    name: 'SEO Audit',
    icon: Search,
    accent: 'seo',
    score: 92,
    description: 'Technical SEO and search indexability checks across canonicals, headers, and meta tags.',
    findings: [
      { id: 'seo-1', title: 'Canonical Tag Consistency', severity: 'high', passed: true, category: 'Indexing', desc: 'Fully qualified absolute canonical tag matches page URL.' },
      { id: 'seo-2', title: 'OpenGraph & Twitter Card Metadata', severity: 'medium', passed: true, category: 'Social SEO', desc: 'Complete title, description, and preview images configured.' },
      { id: 'seo-3', title: 'XML Sitemap Entry Presence', severity: 'high', passed: true, category: 'Technical SEO', desc: 'Page listed in sitemap.xml with real lastmod timestamp.' }
    ]
  },
  {
    id: 'security',
    name: 'Security Scan',
    icon: ShieldCheck,
    accent: 'security',
    score: 88,
    description: 'Cybersecurity, SSL/TLS certificates, and HTTP response header exposure analysis.',
    findings: [
      { id: 'sec-1', title: 'HTTPS & SSL Certificate Validity', severity: 'critical', passed: true, category: 'Transport Layer', desc: 'TLS 1.3 encryption active with valid 256-bit certificate.' },
      { id: 'sec-2', title: 'Content-Security-Policy Header', severity: 'high', passed: false, category: 'HTTP Headers', desc: 'CSP header missing script source directives.', prompt: 'Configure Content-Security-Policy header restricting script-src to trusted origins.' },
      { id: 'sec-3', title: 'Strict-Transport-Security (HSTS)', severity: 'high', passed: true, category: 'HTTP Headers', desc: 'HSTS max-age set to 31536000 with includeSubDomains.' }
    ]
  },
  {
    id: 'aso',
    name: 'ASO Audit',
    icon: Smartphone,
    accent: 'aso',
    score: 81,
    description: 'App Store Optimization for iOS App Store and Google Play Store listings.',
    findings: [
      { id: 'aso-1', title: 'App Title Keyword Density', severity: 'high', passed: true, category: 'Metadata', desc: 'Title includes primary target keywords within 30 character limit.' },
      { id: 'aso-2', title: 'Subtitle Value Proposition', severity: 'medium', passed: true, category: 'Metadata', desc: 'Clear UVP tagline present in app subtitle field.' },
      { id: 'aso-3', title: 'Screenshot Caption Overlay Coverage', severity: 'medium', passed: false, category: 'Visual Assets', desc: 'First 2 screenshots lack descriptive text captions.', prompt: 'Add bold feature benefit captions to the top 2 App Store screenshots.' }
    ]
  }
];

export default function InteractiveScannerDemo() {
  const [activeTabId, setActiveTabId] = useState('geo');
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [liveResults, setLiveResults] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  const activeTab = SCANNER_TABS.find(t => t.id === activeTabId) || SCANNER_TABS[0];
  const accent = SCANNERS[activeTab.accent];

  const currentResult = liveResults[activeTab.id];
  const displayScore = currentResult ? currentResult.score : activeTab.score;
  const isLive = !!currentResult;

  const displayFindings = currentResult
    ? currentResult.findings.slice(0, 5).map((f, i) => ({
        id: `live-${i}`,
        title: f.title || f.name || 'Check Finding',
        severity: f.severity || 'medium',
        passed: f.passed ?? (f.score === 100 || f.status === 'pass'),
        category: f.category || f.type || 'Audit Check',
        desc: f.description || f.desc || f.recommendation || 'No detailed description available.',
        prompt: f.aiFixPrompt || f.fixPrompt || null
      }))
    : activeTab.findings;

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      const res = await fetch(`/api?path=${activeTab.id}-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setLiveResults(prev => ({
          ...prev,
          [activeTab.id]: {
            score: data.data.score ?? 0,
            findings: data.data.findings || [],
            scannedUrl: formattedUrl,
          }
        }));
      } else {
        setErrorMsg(data.error || 'Failed to complete scan. Please check the URL.');
      }
    } catch {
      setErrorMsg('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const resetToSample = () => {
    setLiveResults(prev => {
      const next = { ...prev };
      delete next[activeTab.id];
      return next;
    });
  };

  return (
    <div className="space-y-8">
      {/* Scanner Selector Tabs */}
      <div className="flex justify-center flex-wrap gap-2">
        {SCANNER_TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = tab.id === activeTabId;
          const hasLive = !!liveResults[tab.id];
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
                setErrorMsg(null);
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all border relative ${
                isActive
                  ? 'bg-card border-primary text-foreground shadow-md'
                  : 'bg-muted/30 border-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              }`}
            >
              <TabIcon className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {tab.name}
              {hasLive && (
                <span className="h-2 w-2 rounded-full bg-success absolute top-1 right-1" title="Live scan available" />
              )}
            </button>
          );
        })}
      </div>

      {/* Interactive Card Preview */}
      <Card className="glass-card border-primary/20 overflow-hidden shadow-xl">
        <CardHeader className="border-b border-border/50 pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <activeTab.icon className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl text-foreground">
                  {activeTab.name} {isLive ? 'Live Scan Result' : 'Interactive Preview'}
                </CardTitle>
                <Badge variant="outline" className={isLive ? 'bg-success/10 text-success border-success/30 text-[10px]' : 'bg-muted/50 text-muted-foreground text-[10px]'}>
                  {isLive ? `LIVE: ${currentResult.scannedUrl}` : 'SAMPLE PREVIEW'}
                </Badge>
              </div>
              <CardDescription className="text-xs">{activeTab.description}</CardDescription>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider block">
                  {isLive ? 'Live Score' : 'Sample Score'}
                </span>
                {isLive && (
                  <button
                    onClick={resetToSample}
                    className="text-[10px] text-primary hover:underline flex items-center gap-1 justify-end mt-0.5"
                  >
                    <RotateCcw className="h-2.5 w-2.5" /> Sample
                  </button>
                )}
              </div>
              <ScoreRing score={displayScore} size={96} />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Findings List */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 text-primary" /> {isLive ? 'Live Audit Findings' : 'Sample Severity-Ranked Audit Findings'}
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {displayFindings.map((finding) => (
                <div key={finding.id} className="bg-muted/40 border border-border/60 rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {finding.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
                      )}
                      <span className="text-sm font-semibold text-foreground">{finding.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="text-[10px] font-mono uppercase bg-background">
                        {finding.category}
                      </Badge>
                      <Badge variant="outline" className={finding.passed ? 'bg-success/10 text-success border-success/30 text-[10px]' : 'bg-warning/10 text-warning border-warning/30 text-[10px]'}>
                        {finding.passed ? 'PASSED' : (finding.severity || 'FAIL').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{finding.desc}</p>

                  {!finding.passed && finding.prompt && (
                    <div className="mt-2 bg-background/80 border border-primary/20 rounded p-2.5 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Code className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="font-mono text-[11px] text-foreground truncate">
                          Prompt: &ldquo;{finding.prompt}&rdquo;
                        </span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 shrink-0"
                        onClick={() => handleCopy(finding.prompt, finding.id)}
                        title="Copy AI Fix Prompt"
                      >
                        {copiedId === finding.id ? <Check className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Quick Scan Input Bar */}
          <form onSubmit={handleQuickScan} className="pt-2 border-t border-border/40 space-y-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Enter URL to audit (e.g. google.com)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="flex-1 text-sm focus-visible:ring-primary"
                disabled={isScanning}
              />
              <Button type="submit" disabled={isScanning || !url} className="bg-primary text-primary-foreground hover:bg-primary/90 shrink-0">
                {isScanning ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Running Audit...</>
                ) : (
                  <>Run Free {activeTab.name} <ArrowRight className="h-4 w-4 ml-1.5" /></>
                )}
              </Button>
            </div>
            {errorMsg && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" /> {errorMsg}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
