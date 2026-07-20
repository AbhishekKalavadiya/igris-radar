'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckCircle2, XCircle, Lock, ArrowRight, Sparkles,
  ShieldCheck, Search, Smartphone, BarChart2, Filter, X, Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import ScoreRing from '@/components/ui/ScoreRing';
import CategoryScoreBreakdown from '@/components/ui/CategoryScoreBreakdown';
import AuditFindingCard from '@/components/ui/AuditFindingCard';
import { filterFindings } from '@/components/ui/FindingsToolbar';
import { SCANNERS, SEVERITY_STYLES } from '@/lib/scannerAccents';

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3, passed: 4 };

const SCANNER_ICON = {
  security: ShieldCheck,
  seo: Search,
  aeo: Sparkles,
  aso: Smartphone,
};

export default function UnlockedScanModal({ open, onClose, scanData, scanType }) {
  const [severityFilter, setSeverityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const accent = SCANNERS[scanType] || SCANNERS.security;
  const Icon = SCANNER_ICON[scanType] || ShieldCheck;

  const findings = useMemo(() => {
    if (!scanData?.findings) return [];
    return [...scanData.findings].sort((a, b) => {
      const ao = SEVERITY_ORDER[a.severity] ?? 5;
      const bo = SEVERITY_ORDER[b.severity] ?? 5;
      return ao - bo;
    });
  }, [scanData]);

  const filtered = useMemo(
    () => filterFindings(findings, searchQuery, severityFilter),
    [findings, searchQuery, severityFilter]
  );

  const counts = useMemo(() => {
    const c = { all: findings.length, failed: 0, passed: 0, critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of findings) {
      if (f.passed || f.severity === 'passed') c.passed++;
      else {
        c.failed++;
        if (f.severity in c) c[f.severity]++;
      }
    }
    return c;
  }, [findings]);

  const lockedCount = findings.filter(f => f.locked).length;
  const unlockedCount = findings.length - lockedCount;

  if (!scanData) return null;

  const SEVERITY_FILTERS = ['all', 'failed', 'critical', 'high', 'medium', 'low', 'passed'];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[92vh] p-0 flex flex-col bg-card border-border shadow-2xl overflow-hidden">
        {/* Accent top bar */}
        <div className={`h-1.5 w-full shrink-0 ${accent.bg}`} />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${accent.bgSoft}`}>
                <Icon className={`h-6 w-6 ${accent.text}`} />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold leading-tight">
                  {accent.label} — Full Report
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground mt-0.5 truncate max-w-md">
                  {scanData.url}
                </DialogDescription>
              </div>
            </div>
            {/* Unlocked badge */}
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" /> Report Unlocked
              </span>
              <a
                href={`/api?path=export/pdf-public&scanType=${scanType}&scanId=${scanData.id}`}
                download
              >
                <Button size="sm" variant="outline" className="font-semibold">
                  <Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF
                </Button>
              </a>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-muted/60 transition-colors text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Score + stats row */}
          <div className="mt-5 flex flex-wrap items-center gap-6">
            <ScoreRing score={scanData.score} size={100} accent={accent.ring} />
            <div className="flex flex-wrap gap-4">
              {[
                { label: 'Total Checks', value: counts.all },
                { label: 'Issues Found', value: counts.failed, className: counts.failed > 0 ? 'text-destructive' : 'text-success' },
                { label: 'Passed', value: counts.passed, className: 'text-success' },
                { label: 'Critical', value: counts.critical, className: counts.critical > 0 ? 'text-severity-critical' : 'text-muted-foreground' },
                { label: 'High', value: counts.high, className: counts.high > 0 ? 'text-severity-high' : 'text-muted-foreground' },
              ].map(({ label, value, className }) => (
                <div key={label} className="text-center min-w-[56px]">
                  <div className={`text-2xl font-bold tabular-nums ${className || ''}`}>{value}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{label}</div>
                </div>
              ))}
            </div>
            {scanData.categories && (
              <div className="ml-auto hidden lg:block w-64">
                <CategoryScoreBreakdown categories={scanData.categories} />
              </div>
            )}
          </div>
        </div>

        {/* Filter toolbar */}
        <div className="px-6 py-3 border-b border-border bg-muted/30 shrink-0 flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              className="pl-9 pr-3 h-8 text-sm rounded-lg border border-border bg-background/60 focus:outline-none focus:ring-1 focus:ring-primary/50 w-52"
              placeholder="Search findings…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {SEVERITY_FILTERS.map(f => {
              const active = severityFilter === f;
              const cnt = counts[f];
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setSeverityFilter(f)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md border transition-colors capitalize
                    ${active
                      ? `bg-primary/15 border-primary/50 text-primary`
                      : 'bg-background/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/30'}`}
                >
                  {f}
                  {typeof cnt === 'number' && <span className="ml-1 opacity-60">{cnt}</span>}
                </button>
              );
            })}
          </div>
          <div className="ml-auto text-xs text-muted-foreground">
            Showing {filtered.length} of {findings.length} findings
          </div>
        </div>

        {/* Findings list */}
        <ScrollArea className="flex-1 px-6 py-4">
          <div className="space-y-3 pb-6">
            {filtered.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground text-sm">
                No findings match your filters.
              </div>
            ) : (
              filtered.map(finding => (
                <AuditFindingCard key={finding.id} finding={finding} />
              ))
            )}

            {/* Pro/Agency upsell CTA — always shown when there are locked findings */}
            {lockedCount > 0 && (
              <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-7 text-center mt-4 shadow-[0_0_32px_hsl(var(--primary)/0.08)]">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold mb-4">
                  <Lock className="h-3 w-3" />
                  {lockedCount} Pro &amp; Agency findings locked
                </div>
                <h4 className="text-xl font-bold text-foreground mb-2">
                  Unlock everything — free for 10 scans
                </h4>
                <p className="text-sm text-muted-foreground max-w-md mx-auto mb-6 leading-relaxed">
                  You&apos;re seeing <strong>Free + Starter</strong> tier findings. Create a free account to unlock
                  all <strong>{lockedCount} Pro &amp; Agency-level insights</strong>, AI deep analysis,
                  competitor comparisons, and fix prompts — 10 full scans/month, then from{' '}
                  <strong>$20/month</strong>.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg px-8"
                    >
                      Signup for 10 Free Scans <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href="/landing#pricing">
                    <Button size="lg" variant="outline" className="font-semibold">
                      See Plans &amp; Pricing
                    </Button>
                  </Link>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">No credit card required for the free plan.</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
