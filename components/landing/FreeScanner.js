'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck, Search, Sparkles, ArrowRight, Loader2,
  Target, CheckCircle2, XCircle, Smartphone, Lock, Unlock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import UnlockedScanModal from '@/components/landing/UnlockedScanModal';
import { SCANNERS } from '@/lib/scannerAccents';

const SCAN_TYPES = [
  { id: 'security', label: 'Security', icon: ShieldCheck, description: 'Check headers, config & exposure' },
  { id: 'seo',      label: 'SEO',      icon: Search,      description: 'Check classic ranking signals'  },
  { id: 'aeo',      label: 'AEO',      icon: Sparkles,    description: 'Check AI assistant readiness'   },
  { id: 'aso',      label: 'ASO',      icon: Smartphone,  description: 'Check App Store Optimization'   },
];

// Poll the public-scan endpoint until the webhook has fired (max 10 retries × 2s)
async function pollForUnlockedScan(scanId, scanType, retries = 10, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, delayMs));
    try {
      const res  = await fetch(`/api?path=public-scan&id=${scanId}&type=${scanType}`);
      const data = await res.json();
      if (data.success) return data.data;
    } catch {}
  }
  return null;
}

export default function FreeScanner() {
  const searchParams  = useSearchParams();
  const router        = useRouter();

  const [url, setUrl]                   = useState('');
  const [scanType, setScanType]         = useState('security');
  const [isScanning, setIsScanning]     = useState(false);
  const [result, setResult]             = useState(null);          // preview (3 findings)
  const [showPreview, setShowPreview]   = useState(false);         // small preview dialog
  const [errorMsg, setErrorMsg]         = useState(null);
  const [isUnlocking, setIsUnlocking]   = useState(false);
  const [unlockedData, setUnlockedData] = useState(null);          // full unlocked report
  const [showUnlocked, setShowUnlocked] = useState(false);         // big full modal
  const [isPolling, setIsPolling]       = useState(false);

  // ── On mount: handle Dodo return redirect ────────────────────────────────
  useEffect(() => {
    const scanId   = searchParams.get('unlocked_scan');
    const type     = searchParams.get('type');
    if (!scanId || !type) return;

    setIsPolling(true);
    pollForUnlockedScan(scanId, type).then(data => {
      setIsPolling(false);
      if (data) {
        setUnlockedData(data);
        setShowUnlocked(true);
        setScanType(type);
        
        // Clean the URL params ONLY after successfully loading the report
        // so if the user needs to refresh due to a delayed webhook, they
        // don't lose their purchase URL.
        const clean = new URL(window.location.href);
        clean.searchParams.delete('unlocked_scan');
        clean.searchParams.delete('type');
        router.replace(clean.pathname + clean.search, { scroll: false });
      } else {
        setErrorMsg('Payment received! Waiting for final confirmation from the billing provider — please refresh the page in a few seconds to view your unlocked report.');
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Run the scan ─────────────────────────────────────────────────────────
  const handleScan = async (e) => {
    e.preventDefault();
    if (!url) return;
    setIsScanning(true);
    setResult(null);
    setErrorMsg(null);

    try {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
      const res  = await fetch(`/api?path=${scanType}-scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formattedUrl }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        setShowPreview(true);
      } else {
        setErrorMsg(data.error || 'Failed to complete scan. Please try again.');
      }
    } catch {
      setErrorMsg('Network error occurred. Please check your connection and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  // ── Unlock button handler ─────────────────────────────────────────────────
  const handleUnlock = async () => {
    if (!result?.id) return;
    setIsUnlocking(true);
    try {
      const res  = await fetch('/api/billing/dodo/unlock-checkout', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ scanId: result.id, scanType }),
      });
      const data = await res.json();
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        setErrorMsg(data.error || 'Could not create checkout. Please try again.');
        setIsUnlocking(false);
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setIsUnlocking(false);
    }
  };

  const accent     = SCANNERS[scanType] || SCANNERS.security;
  const activeType = SCAN_TYPES.find(t => t.id === scanType);

  return (
    <>
      {/* ── Polling overlay ─────────────────────────────────────────────── */}
      {isPolling && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl border border-border bg-card shadow-2xl">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-base font-semibold">Loading your full report…</p>
            <p className="text-sm text-muted-foreground">This takes just a moment.</p>
          </div>
        </div>
      )}

      {/* ── Full unlocked report modal ───────────────────────────────────── */}
      <UnlockedScanModal
        open={showUnlocked}
        onClose={() => setShowUnlocked(false)}
        scanData={unlockedData}
        scanType={scanType}
      />

      {/* ── Main scanner card ─────────────────────────────────────────────── */}
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
                onChange={e => setUrl(e.target.value)}
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
                {SCAN_TYPES.map(type => {
                  const Icon = type.icon;
                  const isSelected = scanType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      disabled={isScanning}
                      onClick={() => setScanType(type.id)}
                      className={`flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 h-full rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                        isSelected
                          ? 'bg-background shadow-sm text-primary ring-1 ring-border'
                          : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{type.label}</span>
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
                <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Scanning…</>
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

        {/* ── Preview panel (3 findings + unlock CTA) ─────────────────────── */}
        {showPreview && result && (
          <div className="border-t border-border bg-muted/20 p-5 md:p-6 space-y-5">
            {/* Score row */}
            <div className="flex items-center gap-5 p-4 rounded-xl border border-border bg-background/60 shadow-sm">
              <div className={`flex flex-col items-center justify-center h-20 w-20 rounded-full border-4 ${accent.border} bg-background shadow-inner shrink-0`}>
                <span className={`text-3xl font-bold leading-none ${accent.text}`}>{result.score}</span>
                <span className="text-[10px] text-muted-foreground mt-0.5">/ 100</span>
              </div>
              <div>
                <h4 className="font-semibold text-lg text-foreground">Overall Score</h4>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Based on {result.totalChecks || result.findings?.length || 0} checks — preview showing 3 of {result.findings?.length || 0} findings.
                </p>
              </div>
            </div>

            {/* Sample findings */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                Sample Findings (3 of {result.findings?.length || 0})
              </h4>
              <div className="space-y-2.5">
                {result.findings?.slice(0, 3).map(finding => (
                  <div
                    key={finding.id}
                    className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card shadow-sm"
                  >
                    {finding.passed ? (
                      <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground/90 leading-snug">{finding.title}</p>
                      {finding.severity && !finding.passed && (
                        <span className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border bg-destructive/10 border-destructive/20 text-destructive">
                          {finding.severity} Severity
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA row */}
            <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-card p-6 text-center shadow-[0_0_24px_hsl(var(--primary)/0.06)]">
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
              <h4 className="font-bold text-foreground text-xl mb-2">See the full report</h4>
              <p className="text-sm text-muted-foreground mb-5 max-w-sm mx-auto">
                Unlock all <strong>{result.findings?.length || '40+'} findings</strong> with severity rankings
                and AI-ready fix prompts — or create a free account for 10 full scans/month.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button
                  onClick={handleUnlock}
                  disabled={isUnlocking}
                  className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-7"
                  size="lg"
                >
                  {isUnlocking ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Redirecting…</>
                  ) : (
                    <><Unlock className="h-4 w-4 mr-2" /> Unlock Full Report — $2</>
                  )}
                </Button>
                <Link href="/signup">
                  <Button size="lg" variant="outline" className="font-semibold">
                    Signup for 10 Free Scans <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">One-time payment · No account needed for the $2 report</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
