'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Shield,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronRight,
  ArrowRight,
  Clock,
  ExternalLink,
  Share2,
  RefreshCw,
  BellRing,
  Lock,
  Zap,
  Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import ScoreRing from '@/components/ui/ScoreRing';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/authContext';

// Dynamically load SecurityGraphView to render domain tree
const SecurityGraphView = dynamic(() => import('@/components/ui/SecurityGraphView'), {
  ssr: false,
  loading: () => (
    <div className="h-[500px] w-full flex flex-col items-center justify-center bg-card/60 rounded-2xl border border-border text-muted-foreground gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm font-medium">Generating Domain Topology...</span>
    </div>
  ),
});

export default function DomainReportClient({ domainObj, scanResult }) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(user);
  const { toast } = useToast();
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (user) {
      setCurrentUser(user);
    } else {
      fetch('/api/?path=auth/me')
        .then((r) => r.json())
        .then((res) => {
          if (res?.success && res?.data) {
            setCurrentUser(res.data);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const handleEnableMonitoring = () => {
    const targetUrl = `/companies/${encodeURIComponent(domainObj.domain)}?monitoring=true`;
    if (currentUser) {
      router.push(targetUrl);
    } else {
      router.push(`/login?redirect=${encodeURIComponent(targetUrl)}`);
    }
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: 'Report link copied', description: 'Shareable audit URL copied to clipboard.' });
    }
  };

  const filteredFindings = scanResult.findings.filter((f) => {
    if (activeFilter === 'passed') return f.passed;
    if (activeFilter === 'failed') return !f.passed;
    return true;
  });

  return (
    <div className="space-y-10">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. BREADCRUMBS & TOP BAR
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/landing" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/landing/features/security-scanner" className="hover:text-foreground transition-colors">Security Scanner</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/landing/features/security-scanner/reports" className="hover:text-foreground transition-colors">Reports</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate">{domainObj.domain}</span>
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShare} className="h-9 gap-1.5 text-xs font-semibold">
            <Share2 className="h-3.5 w-3.5" /> Share Report
          </Button>
          <Link href={`/security-scan?url=${encodeURIComponent(domainObj.domain)}&autorun=1`}>
            <Button size="sm" className="h-9 gap-1.5 text-xs font-semibold">
              <RefreshCw className="h-3.5 w-3.5" /> Run Live Rescan
            </Button>
          </Link>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. HERO AUDIT CARD
      ────────────────────────────────────────────────────────────────────────── */}
      <Card className="p-6 sm:p-8 border-border bg-card shadow-xl rounded-3xl overflow-hidden relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-border/60">
          <div className="flex items-center gap-4">
            <img
              src={`https://www.google.com/s2/favicons?domain=${domainObj.domain}&sz=128`}
              alt={domainObj.name}
              className="h-16 w-16 rounded-2xl p-2 bg-muted/60 border border-border object-contain shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground">{domainObj.name}</h1>
                <Badge variant="outline" className="text-xs font-medium border-primary/30 text-primary">
                  Verified Audit
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{domainObj.domain}</p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                <Clock className="h-3.5 w-3.5" />
                <span>Last evaluated: September 2026</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="text-right">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Score</div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className={`text-4xl sm:text-5xl font-black ${
                  domainObj.score >= 85 ? 'text-emerald-500' : domainObj.score >= 70 ? 'text-blue-500' : 'text-amber-500'
                }`}>
                  {domainObj.score}%
                </span>
              </div>
              <Badge
                variant="secondary"
                className={`mt-1 font-bold text-xs uppercase tracking-wider ${
                  domainObj.score >= 85
                    ? 'bg-emerald-500/10 text-emerald-600'
                    : domainObj.score >= 70
                    ? 'bg-blue-500/10 text-blue-600'
                    : 'bg-amber-500/10 text-amber-600'
                }`}
              >
                Security Grade {domainObj.grade}
              </Badge>
            </div>
            <ScoreRing score={domainObj.score} size={84} strokeWidth={8} />
          </div>
        </div>

        {/* Counters Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-center">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{domainObj.summary.passed}</span>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold mt-0.5">Checks Passed</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{domainObj.summary.warning}</span>
            <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold mt-0.5">Warnings</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
            <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{domainObj.summary.failed}</span>
            <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold mt-0.5">Failed Issues</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border">
            <span className="text-2xl font-black text-foreground">{domainObj.summary.total}</span>
            <p className="text-xs text-muted-foreground font-semibold mt-0.5">Total Evaluated</p>
          </div>
        </div>
      </Card>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. CATEGORY SCORE BREAKDOWN
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-foreground">Category Score Breakdown</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Transport / TLS', val: domainObj.categoryScores.tls },
            { label: 'Security Headers', val: domainObj.categoryScores.headers },
            { label: 'Cookies & CORS', val: domainObj.categoryScores.cookies },
            { label: 'DNS & Email', val: domainObj.categoryScores.dns },
            { label: 'Secrets & Files', val: domainObj.categoryScores.secrets },
            { label: 'Attack Surface', val: domainObj.categoryScores.attackSurface },
          ].map((cat, i) => (
            <div key={i} className="p-4 rounded-2xl border border-border bg-card text-center">
              <span className="text-xs text-muted-foreground font-medium">{cat.label}</span>
              <div className={`text-2xl font-black mt-1 ${cat.val >= 85 ? 'text-emerald-500' : cat.val >= 70 ? 'text-blue-500' : 'text-amber-500'}`}>
                {cat.val}%
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className={`h-full rounded-full ${cat.val >= 85 ? 'bg-emerald-500' : cat.val >= 70 ? 'bg-blue-500' : 'bg-amber-500'}`}
                  style={{ width: `${cat.val}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. INTERACTIVE TOPOLOGY GRAPH FOR THIS DOMAIN
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Security Topology Tree — {domainObj.domain}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Interactive node visualization showing security controls, certificates, headers, and risk posture.
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-mono border-primary/30 text-primary w-fit">
            Interactive Tree Graph
          </Badge>
        </div>

        <div className="rounded-3xl border border-border bg-card shadow-lg p-4 overflow-hidden">
          <SecurityGraphView
            scanResult={scanResult}
            userPlan="pro"
            initialLayout="orbit"
          />
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. DETAILED AUDIT FINDINGS TABLE
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-foreground">
            Audited Security Controls ({scanResult.findings.length})
          </h2>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 text-xs font-semibold">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              All ({scanResult.findings.length})
            </button>
            <button
              onClick={() => setActiveFilter('passed')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'passed' ? 'bg-emerald-500/20 text-emerald-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Passed ({domainObj.summary.passed})
            </button>
            <button
              onClick={() => setActiveFilter('failed')}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeFilter === 'failed' ? 'bg-rose-500/20 text-rose-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Failed / Warnings ({domainObj.summary.failed + domainObj.summary.warning})
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card overflow-hidden divide-y divide-border/60">
          {filteredFindings.map((finding) => (
            <div key={finding.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2.5">
                  <Badge variant="outline" className="text-[10px] font-medium border-primary/20 text-primary">
                    {finding.category}
                  </Badge>
                  <h3 className="text-sm font-bold text-foreground">{finding.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {finding.description}
                </p>
                {finding.recommendation && (
                  <p className="text-xs text-primary/90 font-mono pt-1">
                    Fix: {finding.recommendation}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <Badge
                  variant="secondary"
                  className={`text-[10px] font-bold uppercase ${
                    finding.severity === 'critical'
                      ? 'bg-rose-500/10 text-rose-600'
                      : finding.severity === 'high'
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-blue-500/10 text-blue-600'
                  }`}
                >
                  {finding.severity}
                </Badge>

                <div className="flex items-center gap-1 text-xs font-semibold">
                  {finding.passed ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg">
                      <XCircle className="h-3.5 w-3.5" /> Failed
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          6. CONTINUOUS MONITORING / COMPARE CTA
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
        <div className="p-7 rounded-2xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-2 text-primary font-bold text-base">
            <BellRing className="h-5 w-5" />
            Continuous Drift Monitoring
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Protect your production site against configuration drift. Igris Radar can audit {domainObj.domain} daily and notify your team via Slack or Email if a certificate expires or headers are removed.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleEnableMonitoring}
            className="mt-2 text-xs font-semibold cursor-pointer group hover:border-primary hover:text-primary transition-all flex items-center gap-1.5"
          >
            <BellRing className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
            Enable Daily Monitoring Alerts
          </Button>
        </div>

        <div className="p-7 rounded-2xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-2 text-foreground font-bold text-base">
            <Globe className="h-5 w-5 text-emerald-500" />
            Audit Your Own Domain
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Run all 90+ security checks against your website for free. Instant results in under 30 seconds with no installation required.
          </p>
          <div className="flex items-center gap-3 pt-2">
            <Link href="/signup">
              <Button size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 h-10 text-xs">
                Run a free scan <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </Button>
            </Link>
            <Link href="/landing#pricing">
              <Button size="sm" variant="outline" className="h-10 px-4 text-xs">See pricing</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
