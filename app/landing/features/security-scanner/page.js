'use client';

import { useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Shield,
  ShieldCheck,
  Lock,
  Server,
  Key,
  Package,
  Crosshair,
  FileText,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Zap,
  Activity,
  BellRing,
  Award,
  ChevronRight,
  Globe,
  Radio,
  Clock,
  Code,
  FileCode2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Reveal, Stagger, MotionItem, AnimatedNumber } from '@/components/ui/motion';
import ScoreRing from '@/components/ui/ScoreRing';
import JsonLd from '@/components/ui/JsonLd';
import { SAMPLE_SECURITY_SCAN_RESULT } from '@/lib/sampleSecurityGraphData';
import { TOP_DOMAINS } from '@/lib/topDomainsSecurityData';
import { SECURITY_CHECKS, CHECK_CATEGORIES } from '@/lib/securityChecksData';
import { SHOW_AUTH_CTAS, FEATURE_PAGES } from '@/lib/landingContent';

// Dynamically load the heavy SVG/Canvas Security Graph View
const SecurityGraphView = dynamic(() => import('@/components/ui/SecurityGraphView'), {
  ssr: false,
  loading: () => (
    <div className="h-[550px] w-full flex flex-col items-center justify-center bg-card/60 backdrop-blur-md rounded-2xl border border-border text-muted-foreground gap-3">
      <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      <span className="text-sm font-medium">Rendering Interactive Security Graph...</span>
    </div>
  ),
});

export default function SecurityScannerFeaturePage() {
  const router = useRouter();
  const [selectedCategoryTab, setSelectedCategoryTab] = useState('headers');
  const heroBullets = FEATURE_PAGES['security-scanner'].heroBullets;

  // Preview 6 featured domains
  const featuredDomains = TOP_DOMAINS.filter((d) =>
    ['stripe-com', 'github-com', 'cloudflare-com', 'vercel-com', 'apple-com', 'google-com'].includes(d.slug)
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary">
      {/* Structured SEO Schema */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Igris Radar Security Scanner',
          applicationCategory: 'SecurityApplication',
          operatingSystem: 'Web',
          description:
            'Free website security scanner with 90+ automated checks for SSL/TLS, HTTP headers, CORS, cookies, DNS authentication, and exposed secrets.',
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        }}
      />

      {/* ──────────────────────────────────────────────────────────────────────────
          1. HERO SECTION WITH INSTANT SCAN BAR
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="relative pt-24 pb-16 overflow-hidden border-b border-border/40">
        {/* Subtle Ambient Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[400px] bg-primary/10 rounded-full blur-[140px] pointer-events-none -z-10" />
        <div className="absolute top-40 right-10 w-[350px] h-[350px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Continuous Monitoring · 90+ Automated Checks · Instant DAST
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.08]">
              Website Security Scanner <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-emerald-400">
                That Never Stops Watching
              </span>
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 text-lg sm:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Scan free in seconds. Uncover TLS vulnerabilities, missing security headers, exposed API secrets,
              known-vulnerable JS libraries, and dangling subdomain takeovers — with step-by-step fix code and
              continuous drift alerts.
            </p>
          </Reveal>

          {/* Standardized CTAs */}
          <Reveal delay={0.24}>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              {SHOW_AUTH_CTAS && (
                <Link href="/signup">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-7 h-12 text-base">
                    Run a free scan <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              )}
              <Link href="/landing#pricing">
                <Button size="lg" variant="outline" className="h-12 px-7 text-base">See pricing</Button>
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {heroBullets.map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> {b}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. INTERACTIVE TREE / TOPOLOGY GRAPH SHOWCASE DEMO
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20 border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <Badge variant="outline" className="mb-3 px-3 py-1 font-mono text-xs border-primary/30 text-primary">
              Exclusive Visual Feature
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Interactive Security Topology & Tree Graph
            </h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
              Unlike traditional scanners that just print flat text checklists, Igris Radar maps your application's
              complete security topology into an interactive, drill-down graph view.
            </p>
          </div>

          <div className="rounded-3xl border border-border/80 bg-card/80 backdrop-blur-xl shadow-2xl p-4 sm:p-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-border/60 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Radio className="h-5 w-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-foreground">Live Topology Preview: acme-cloud.io</h3>
                    <Badge variant="secondary" className="text-xs font-semibold bg-emerald-500/10 text-emerald-600">
                      Score: 86/100
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Click any node to inspect severity, details, and exact remediation advice.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Passed
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Warning
                </span>
                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-rose-600 font-medium">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Critical
                </span>
              </div>
            </div>

            {/* Embedded Interactive Graph */}
            <div className="mt-4 rounded-2xl overflow-hidden border border-border/50">
              <SecurityGraphView
                scanResult={SAMPLE_SECURITY_SCAN_RESULT}
                userPlan="pro"
                initialLayout="orbit"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. REAL STATS COUNTER BAND
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-14 border-b border-border/40 bg-card/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-primary tabular-nums">
              <AnimatedNumber value={90} />+
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Automated Security Checks</p>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-foreground tabular-nums">
              <AnimatedNumber value={15} />
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Audit Categories</p>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-emerald-500 tabular-nums">
              0
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Agents / Installs Required</p>
          </div>
          <div>
            <div className="text-4xl sm:text-5xl font-extrabold text-blue-500 tabular-nums">
              &lt;<AnimatedNumber value={30} />s
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-medium">Average Full Scan Time</p>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. TOP 50 DOMAIN SHOWCASE PREVIEW
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                <Globe className="h-3.5 w-3.5" /> Industry Benchmarks
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                How Do Leading Tech Platforms Score?
              </h2>
              <p className="mt-2 text-muted-foreground text-base max-w-xl">
                We continuously scan the world's most popular platforms for TLS hardening, security headers, and domain trust.
              </p>
            </div>
            <Link href="/landing/features/security-scanner/reports">
              <Button variant="outline" className="group">
                View All 50 Public Domain Reports
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredDomains.map((item) => (
              <Link
                key={item.slug}
                href={`/landing/features/security-scanner/reports/${item.slug}`}
                className="group p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://www.google.com/s2/favicons?domain=${item.domain}&sz=64`}
                        alt={item.name}
                        className="h-9 w-9 rounded-xl p-1 bg-muted object-contain"
                      />
                      <div>
                        <h4 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground">{item.domain}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-xl font-black ${item.score >= 85 ? 'text-emerald-500' : item.score >= 70 ? 'text-blue-500' : 'text-amber-500'}`}>
                        {item.score}%
                      </span>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        Grade {item.grade}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border/40 pt-3">
                    {item.highlights.slice(0, 2).map((h, i) => (
                      <div key={i} className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                  <span>Explore Full Report & Graph</span>
                  <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. 3-STEP "HOW IT WORKS"
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">How It Works</h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
              Three frictionless steps from raw URL to an interactive security report with instant remediation code.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="p-8 rounded-2xl bg-card border border-border relative flex flex-col">
              <div className="h-12 w-12 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Paste Your Domain</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                One URL is all it takes. No agents, no plugins, no DNS modifications. Works on any public web application or API.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border relative flex flex-col">
              <div className="h-12 w-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">We Run 90+ Checks</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We analyze TLS protocols, headers, DNS authentication, CORS, cookies, sensitive files, JS library CVEs, and discover subdomains.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-card border border-border relative flex flex-col">
              <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center text-xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Get Visual Fixes & Alerts</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Explore the interactive topology tree, copy ready-to-paste Nginx/Cloudflare patches, and enable continuous drift monitoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          6. EXHAUSTIVE SECURITY CAPABILITIES BY CATEGORY
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-3">
                <CheckCircle2 className="h-3.5 w-3.5" /> Full Spectrum Audit
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                90+ Checks. Exact Remediation Snippets.
              </h2>
              <p className="mt-2 text-muted-foreground text-base max-w-xl">
                Browse our automated test methodology across the core security layers.
              </p>
            </div>
            <Link href="/landing/features/security-scanner/checks">
              <Button className="group">
                View All Security Checks Directory
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Interactive Category Tabs */}
          <Tabs defaultValue="headers" onValueChange={setSelectedCategoryTab} className="w-full">
            <TabsList className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 h-auto p-1.5 rounded-2xl bg-muted/60 mb-8 gap-1">
              <TabsTrigger value="headers" className="rounded-xl text-xs py-2.5">HTTP Headers</TabsTrigger>
              <TabsTrigger value="transport" className="rounded-xl text-xs py-2.5">TLS / Transport</TabsTrigger>
              <TabsTrigger value="dns" className="rounded-xl text-xs py-2.5">DNS & Email</TabsTrigger>
              <TabsTrigger value="secrets" className="rounded-xl text-xs py-2.5">Secrets & Files</TabsTrigger>
              <TabsTrigger value="attack-surface" className="rounded-xl text-xs py-2.5">Attack Surface</TabsTrigger>
              <TabsTrigger value="supply-chain" className="rounded-xl text-xs py-2.5">Supply Chain</TabsTrigger>
              <TabsTrigger value="client-auth" className="rounded-xl text-xs py-2.5">Client & Auth</TabsTrigger>
              <TabsTrigger value="compliance" className="rounded-xl text-xs py-2.5">Compliance</TabsTrigger>
            </TabsList>

            {['headers', 'transport', 'dns', 'secrets', 'attack-surface', 'supply-chain', 'client-auth', 'compliance'].map((catId) => {
              const catChecks = SECURITY_CHECKS.filter(c => c.category === catId);
              return (
                <TabsContent key={catId} value={catId} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {catChecks.map((check) => {
                      const sevBorder =
                        check.severity === 'critical'
                          ? 'border-l-rose-500'
                          : check.severity === 'high'
                          ? 'border-l-amber-500'
                          : check.severity === 'medium'
                          ? 'border-l-yellow-400'
                          : 'border-l-blue-500';

                      return (
                        <Link
                          key={check.slug}
                          href={`/landing/features/security-scanner/checks/${check.slug}`}
                          className={`rounded-xl border border-slate-200 dark:border-slate-800/80 bg-card p-4 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all border-l-4 ${sevBorder} group flex flex-col justify-between`}
                        >
                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors leading-snug">
                              {check.name}
                            </h4>
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {check.shortDesc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </TabsContent>
              );
            })}
          </Tabs>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          7. CONTINUOUS MONITORING & REGRESSION ALERTING
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-semibold uppercase tracking-wider mb-4">
                <BellRing className="h-3.5 w-3.5" /> Automated Regressions Guard
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
                A Fix Today Can Break on Your Next Deploy
              </h2>
              <p className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
                Developers frequently drop headers in staging, rotate DNS records, or accidentally commit .env files.
                With continuous monitoring, Igris Radar re-scans your domain on a schedule and notifies your team the moment a security regression appears.
              </p>

              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>Slack, Discord, Email, and Webhook instant alerts</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>Subdomain takeover early-warning radar</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-foreground">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                  <span>SSL certificate expiration alerts (30, 14, and 3 days out)</span>
                </div>
              </div>

              <div className="pt-6">
                <Link href="/login?redirect=%2Fcompanies%3Fmonitoring%3Dtrue">
                  <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 text-sm cursor-pointer">
                    <BellRing className="h-4 w-4 mr-2" /> Enable Daily Monitoring Alerts
                  </Button>
                </Link>
              </div>
            </div>

            {/* Simulated Slack/Webhook Alert Notification Card */}
            <div className="p-6 rounded-2xl bg-[#0F172A] text-slate-200 border border-slate-800 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-xs font-bold text-slate-400">#security-alerts (Slack)</span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">Just now</span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-wider">
                    Regression Detected
                  </Badge>
                  <span className="text-sm font-semibold text-white">api.acme-cloud.io</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Daily automated scan found that <strong>Strict-Transport-Security (HSTS)</strong> header was removed after recent deploy #149.
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-emerald-400">
                  + Suggested Nginx fix: add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          8. COMPLIANCE FRAMEWORK MAPPING
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <Badge variant="outline" className="mb-3 px-3 py-1 font-mono text-xs border-primary/30 text-primary">
            Audit-Ready Reporting
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Map Scan Results to Regulatory Frameworks
          </h2>
          <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto">
            Our findings map directly to controls across major compliance mandates, allowing you to export audit-ready reports for clients and auditors.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {['SOC 2 Type II', 'ISO 27001', 'PCI-DSS v4.0', 'HIPAA Security', 'GDPR Article 32', 'NIS2 Directive'].map((badge) => (
              <div
                key={badge}
                className="px-5 py-3 rounded-xl border border-border bg-card text-sm font-bold text-foreground shadow-sm flex items-center gap-2.5"
              >
                <Award className="h-4 w-4 text-primary" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          9. FREQUENTLY ASKED QUESTIONS
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 bg-muted/20 border-b border-border/40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="mt-3 text-muted-foreground text-base">
              Common questions about Igris Radar's website security scanner and audit methodology.
            </p>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-border">
              <h3 className="text-base font-bold text-foreground mb-2">How does this scanner differ from SecScanner or Mozilla Observatory?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Most scanners only check basic HTTP headers. Igris Radar runs a comprehensive 90+ check audit:
                TLS handshake validation, active Certificate Transparency subdomain enumeration, dangling CNAME takeover detection,
                live CVE lookups for frontend JavaScript libraries, exposed secrets scanning (.env, API keys), and an interactive topology tree graph.
              </p>
            </Card>

            <Card className="p-6 border-border">
              <h3 className="text-base font-bold text-foreground mb-2">Is the scan completely non-intrusive and safe for production?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Yes, 100%. Our scanner performs passive analysis of headers, certificates, DNS records, and standard HTTP GET requests.
                We never execute denial-of-service tests, exploit payloads, or invasive penetration attacks.
              </p>
            </Card>

            <Card className="p-6 border-border">
              <h3 className="text-base font-bold text-foreground mb-2">Do I need to install any code snippets or software?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                No installation, agents, or API keys required. You just enter your URL, and the scanner evaluates the site from the perspective of an external visitor or attacker.
              </p>
            </Card>

            <Card className="p-6 border-border">
              <h3 className="text-base font-bold text-foreground mb-2">What does the AI Remediation Engine provide?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Following each scan, our AI analyst streams an executive summary, threat model attack chains, OWASP Top 10 mappings,
                and copy-paste code patches tailored specifically to your detected web server (Nginx, Apache, Cloudflare, Next.js).
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          10. FINAL BOTTOM CTA
      ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-20 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4">
            Audit Your Website Security in 30 Seconds
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Free forever for single scans. Discover vulnerabilities before attackers do.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {SHOW_AUTH_CTAS && (
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-7 h-12 text-base">
                  Run a free scan <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            )}
            <Link href="/landing#pricing">
              <Button size="lg" variant="outline" className="h-12 px-7 text-base">See pricing</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
