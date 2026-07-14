'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Search, Sparkles, ArrowRight, Loader2, Target, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import ScanProgressSteps from '@/components/ui/ScanProgressSteps';
import { useToast } from '@/hooks/use-toast';
import ScoreRing from '@/components/ui/ScoreRing';
import { SCANNERS } from '@/lib/scannerAccents';

const SCAN_TYPES = [
  { id: 'security', label: 'Security', icon: ShieldCheck, description: 'Check headers, config & exposure' },
  { id: 'seo', label: 'SEO', icon: Search, description: 'Check classic ranking signals' },
  { id: 'aeo', label: 'AEO', icon: Sparkles, description: 'Check AI assistant readiness' },
];

export default function FreeScanner() {
  const [url, setUrl] = useState('');
  const [scanType, setScanType] = useState('security');
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;

    setIsScanning(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      
      const res = await fetch(`/api?path=${scanType}-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl })
      });
      
      const data = await res.json();
      
      if (data.success) {
        setResult(data.data);
        setShowModal(true);
      } else {
        setErrorMsg(data.error || 'Failed to complete scan. Please try again.');
      }
    } catch (error) {
      setErrorMsg('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const getAccent = () => {
    if (scanType === 'security') return SCANNERS.security;
    if (scanType === 'seo') return SCANNERS.seo;
    return SCANNERS.aeo;
  };

  const accent = getAccent();
  const activeType = SCAN_TYPES.find(t => t.id === scanType);

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl border border-border bg-card/60 backdrop-blur-md shadow-xl overflow-hidden mt-8 text-left">
      <div className="p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4 ml-1">
          <Target className="h-5 w-5 text-primary" />
          <h3 className="text-base md:text-lg font-bold">Try Igris Radar Free</h3>
        </div>
        
        <form onSubmit={handleScan} className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 w-full flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-2">
              Website URL
            </label>
            <Input
              type="text"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isScanning}
              className="h-16 text-lg px-6 bg-background focus-visible:ring-primary w-full rounded-2xl shadow-inner"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5 shrink-0">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground ml-2">
              Type of Scan
            </label>
            <div className="flex gap-2 p-1.5 bg-muted/40 rounded-2xl border border-border/50 h-16 items-center">
            {SCAN_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = scanType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  disabled={isScanning}
                  onClick={() => setScanType(type.id)}
                  className={`flex items-center justify-center gap-2 px-5 h-full rounded-xl text-sm font-semibold transition-all ${
                    isSelected 
                      ? 'bg-background shadow-sm text-primary ring-1 ring-border' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{type.label}</span>
                </button>
              );
            })}
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={isScanning || !url} 
            className="h-16 px-8 text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl shrink-0 group w-full lg:w-auto mt-2 lg:mt-0"
          >
            {isScanning ? (
              <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Scanning...</>
            ) : (
              <>Run Scan <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" /></>
            )}
          </Button>
        </form>

        {errorMsg && (
          <div className="mt-4 flex items-start gap-2 p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-in fade-in slide-in-from-top-2">
            <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>{errorMsg}</p>
          </div>
        )}
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-card border-border shadow-2xl">
          <div className={`h-2 w-full ${accent?.bgSoft || 'bg-primary/20'}`} />
          <div className="p-6">
            <DialogHeader className="mb-6 text-left">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <activeType.icon className={`h-6 w-6 ${accent?.text || 'text-primary'}`} />
                {activeType.label} Scan Results
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground mt-1">
                Preview of findings for <strong className="text-foreground">{url}</strong>
              </DialogDescription>
            </DialogHeader>

            {result && (
              <div className="space-y-6">
                <div className="flex items-center gap-6 p-5 rounded-xl border border-border bg-muted/30">
                  <div className="flex flex-col items-center justify-center h-20 w-20 rounded-full border-4 border-primary/20 bg-background shadow-inner shrink-0 relative overflow-hidden">
                    <span className="text-3xl font-bold text-primary leading-none">
                      {result.score}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg text-foreground">Overall Score</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Based on {result.totalChecks || result.findings?.length || 0} security & performance checks.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex justify-between items-center">
                    <span>Sample Findings</span>
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{Math.min(3, result.findings?.length || 0)} shown</span>
                  </h4>
                  <div className="space-y-3">
                    {result.findings?.slice(0, 3).map((finding) => (
                      <div key={finding.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 transition-colors">
                        {finding.passed ? (
                          <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-foreground/90 leading-snug">{finding.title}</p>
                          {finding.severity && !finding.passed && (
                            <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-destructive/10 border-destructive/20 text-destructive shrink-0">
                              {finding.severity} Severity
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-primary/5 p-6 text-center mt-6 shadow-[0_0_20px_hsl(var(--primary)/0.05)]">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                  <h4 className="font-bold text-foreground mb-2 text-xl">Unlock Full Report</h4>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                    Sign up free to view all {result.findings?.length || '40+'} findings, full severity rankings, and get AI-ready fix prompts.
                  </p>
                  <Link href="/signup">
                    <Button className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg" size="lg">
                      Create Free Account <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
