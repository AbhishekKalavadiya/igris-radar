'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Check,
  X,
  Minus,
  ArrowRight,
  Sparkles,
  Shield,
  Search,
  Bot,
  Target,
  Activity,
  Smartphone,
  ChevronDown,
  ChevronUp,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, Stagger, MotionItem } from '@/components/ui/motion';
import { SHOW_AUTH_CTAS } from '@/lib/landingContent';
import { useState } from 'react';
import FeatureFaqAccordion from '@/components/landing/FeatureFaqAccordion';

// ─── Plan definitions ────────────────────────────────────────────────────────

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    highlight: false,
    cta: 'Start free',
    ctaHref: '/signup',
    tagline: 'For individuals exploring AI search visibility',
  },
  {
    key: 'starter',
    name: 'Starter',
    price: '$5',
    period: '/month',
    highlight: false,
    cta: 'Get Starter',
    ctaHref: '/signup',
    tagline: 'For founders and solo marketers with apps',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$20',
    period: '/month',
    highlight: true,
    cta: 'Go Pro',
    ctaHref: '/signup',
    tagline: 'For teams that need monitoring and deep analysis',
  },
  {
    key: 'agency',
    name: 'Agency',
    price: '$100',
    period: '/month',
    highlight: false,
    cta: 'Coming soon',
    ctaHref: null,
    comingSoon: true,
    tagline: 'For agencies managing unlimited client sites',
  },
];

// ─── Platform-level features (not per-scan) ──────────────────────────────────

const PLATFORM_FEATURES = [
  {
    label: 'Scans per month',
    free: '10',
    starter: '25',
    pro: '100',
    agency: 'Unlimited',
  },
  {
    label: 'Tracked sites',
    free: '2',
    starter: '5',
    pro: '10',
    agency: 'Unlimited',
  },
  {
    label: 'Team members',
    free: 'Unlimited',
    starter: 'Unlimited',
    pro: 'Unlimited',
    agency: 'Unlimited',
  },
  {
    label: 'Scan history & trends',
    free: false,
    starter: true,
    pro: true,
    agency: true,
  },
  {
    label: 'Scheduled monitoring',
    free: false,
    starter: false,
    pro: 'Weekly',
    agency: 'Daily',
  },
  {
    label: 'Multi-page crawl',
    free: false,
    starter: false,
    pro: true,
    agency: true,
  },
  {
    label: 'Competitor comparison scans',
    free: false,
    starter: false,
    pro: true,
    agency: true,
  },
  {
    label: 'AI deep analysis (Gemini)',
    free: false,
    starter: false,
    pro: true,
    agency: true,
  },
  {
    label: 'White-label PDF reports',
    free: false,
    starter: false,
    pro: false,
    agency: true,
  },
  {
    label: 'API access',
    free: false,
    starter: false,
    pro: false,
    agency: true,
  },
];

// ─── Per-scan feature tables ──────────────────────────────────────────────────

const SCAN_TABLES = [
  {
    key: 'security',
    icon: Shield,
    label: 'Security Scanner',
    accent: 'text-scanner-security',
    accentBg: 'bg-scanner-security/10',
    href: '/landing/features/security-scanner',
    summary: '90+ checks across headers, TLS, secrets, CVEs, DNS & domain reputation',
    features: [
      { label: 'HTTPS & HSTS enforcement', free: true, starter: true, pro: true, agency: true },
      { label: 'Content-Security-Policy analysis', free: true, starter: true, pro: true, agency: true },
      { label: 'SSL certificate health', free: true, starter: true, pro: true, agency: true },
      { label: 'Cookie hardening checks', free: true, starter: true, pro: true, agency: true },
      { label: 'Cross-origin & clickjacking checks', free: true, starter: true, pro: true, agency: true },
      { label: 'Information disclosure detection', free: true, starter: true, pro: true, agency: true },
      { label: 'Exposed API keys & tokens', free: true, starter: true, pro: true, agency: true },
      { label: 'Exposed files & repositories', free: true, starter: true, pro: true, agency: true },
      { label: 'Source map exposure', free: true, starter: true, pro: true, agency: true },
      { label: 'Known-vulnerable JS libraries (CVEs)', free: true, starter: true, pro: true, agency: true },
      { label: 'SPF & DMARC strength', free: true, starter: true, pro: true, agency: true },
      { label: 'Subdomain enumeration & takeover', free: true, starter: true, pro: true, agency: true },
      { label: 'Malware / phishing blocklist', free: true, starter: true, pro: true, agency: true },
      { label: 'Severity-ranked findings (5 levels)', free: true, starter: true, pro: true, agency: true },
      { label: 'AI-ready fix prompt per finding', free: true, starter: true, pro: true, agency: true },
      { label: 'Streaming AI security analysis', free: false, starter: true, pro: true, agency: true },
      { label: 'Attack-chain threat modeling', free: false, starter: false, pro: false, agency: true },
      { label: 'OWASP Top 10 mapping', free: false, starter: false, pro: false, agency: true },
      { label: 'GDPR / PCI compliance readiness', free: false, starter: false, pro: false, agency: true },
    ],
  },
  {
    key: 'seo',
    icon: Search,
    label: 'SEO Audit',
    accent: 'text-scanner-seo',
    accentBg: 'bg-scanner-seo/10',
    href: '/landing/features/seo-audit',
    summary: '30+ checks across technical, on-page, schema, links & Core Web Vitals',
    features: [
      { label: 'HTTPS enforcement', free: true, starter: true, pro: true, agency: true },
      { label: 'robots.txt & XML sitemap', free: true, starter: true, pro: true, agency: true },
      { label: 'Canonical URLs & meta robots', free: true, starter: true, pro: true, agency: true },
      { label: 'Mobile friendliness & viewport', free: true, starter: true, pro: true, agency: true },
      { label: 'Title tag & meta description', free: true, starter: true, pro: true, agency: true },
      { label: 'H1 hierarchy & keyword alignment', free: true, starter: true, pro: true, agency: true },
      { label: 'Image alt text checks', free: true, starter: true, pro: true, agency: true },
      { label: 'Schema.org JSON-LD detection', free: true, starter: true, pro: true, agency: true },
      { label: 'Open Graph & Twitter Card tags', free: true, starter: true, pro: true, agency: true },
      { label: 'Broken internal links', free: true, starter: true, pro: true, agency: true },
      { label: 'SERP preview', free: false, starter: true, pro: true, agency: true },
      { label: 'Core Web Vitals (LCP, CLS, FCP)', free: false, starter: false, pro: true, agency: true },
      { label: 'Redirect chains detection', free: false, starter: false, pro: true, agency: true },
      { label: 'Local SEO NAP consistency', free: false, starter: false, pro: true, agency: true },
      { label: 'Multi-page crawl', free: false, starter: false, pro: true, agency: true },
      { label: 'AI deep analysis (titles, keywords, E-E-A-T)', free: false, starter: false, pro: true, agency: true },
      { label: 'Competitor SEO comparison', free: false, starter: false, pro: true, agency: true },
    ],
  },
  {
    key: 'aeo',
    icon: Sparkles,
    label: 'AEO Audit',
    accent: 'text-scanner-aeo',
    accentBg: 'bg-scanner-aeo/10',
    href: '/landing/features/aeo-audit',
    summary: '28+ checks across 8 AI crawlers — get cited by ChatGPT & Perplexity',
    features: [
      { label: 'GPTBot (ChatGPT) crawler access', free: true, starter: true, pro: true, agency: true },
      { label: 'ClaudeBot & PerplexityBot access', free: true, starter: true, pro: true, agency: true },
      { label: 'Google-Extended & Googlebot access', free: true, starter: true, pro: true, agency: true },
      { label: 'llms.txt & ai.txt presence', free: true, starter: true, pro: true, agency: true },
      { label: 'Q&A formatting & direct answers', free: true, starter: true, pro: true, agency: true },
      { label: 'FAQ & HowTo schema validation', free: true, starter: true, pro: true, agency: true },
      { label: 'Author & freshness signals', free: true, starter: true, pro: true, agency: true },
      { label: 'Bytespider, CCBot, Applebot coverage', free: false, starter: true, pro: true, agency: true },
      { label: 'Answer box formatting score', free: false, starter: true, pro: true, agency: true },
      { label: 'Code examples & snippets check', free: false, starter: true, pro: true, agency: true },
      { label: 'Internal link context analysis', free: false, starter: true, pro: true, agency: true },
      { label: 'JavaScript rendering dependency', free: false, starter: false, pro: true, agency: true },
      { label: 'Structured data completeness', free: false, starter: false, pro: true, agency: true },
      { label: 'AI answer preview simulation', free: false, starter: false, pro: true, agency: true },
      { label: 'Competitor AEO comparison', free: false, starter: false, pro: true, agency: true },
      { label: 'Answer-engine simulation (Agency AI)', free: false, starter: false, pro: false, agency: true },
      { label: 'Question-coverage gap analysis', free: false, starter: false, pro: false, agency: true },
    ],
  },
  {
    key: 'geo',
    icon: Bot,
    label: 'GEO Audit',
    accent: 'text-scanner-geo',
    accentBg: 'bg-scanner-geo/10',
    href: '/landing/features/geo-audit',
    summary: '33 checks + AI citation simulation: entity authority & citation-worthiness',
    features: [
      { label: 'Author bylines & bios', free: true, starter: true, pro: true, agency: true },
      { label: 'Knowledge Graph entity signals', free: true, starter: true, pro: true, agency: true },
      { label: 'Contact & trust signals', free: true, starter: true, pro: true, agency: true },
      { label: 'Content depth (word count)', free: true, starter: true, pro: true, agency: true },
      { label: 'FAQ schema & sections', free: true, starter: true, pro: true, agency: true },
      { label: 'Definition format detection', free: true, starter: true, pro: true, agency: true },
      { label: 'External citations & authority links', free: true, starter: true, pro: true, agency: true },
      { label: 'Paragraph chunking & readability', free: true, starter: true, pro: true, agency: true },
      { label: 'Content uniqueness indicators', free: false, starter: true, pro: true, agency: true },
      { label: 'Statistic freshness', free: false, starter: true, pro: true, agency: true },
      { label: 'Wikipedia-style inline citations', free: false, starter: true, pro: true, agency: true },
      { label: 'Entity disambiguation score', free: false, starter: false, pro: true, agency: true },
      { label: 'Topical cluster detection', free: false, starter: false, pro: true, agency: true },
      { label: 'Comparison & "best of" optimization', free: false, starter: false, pro: true, agency: true },
      { label: 'Prompt coverage heatmap', free: false, starter: false, pro: true, agency: true },
      { label: 'Competitor GEO comparison', free: false, starter: false, pro: true, agency: true },
      { label: 'Citation simulation (Agency AI)', free: false, starter: false, pro: false, agency: true },
      { label: 'Knowledge Graph gap analysis', free: false, starter: false, pro: false, agency: true },
      { label: 'Topical-authority depth map', free: false, starter: false, pro: false, agency: true },
    ],
  },
  {
    key: 'aso',
    icon: Smartphone,
    label: 'ASO Audit',
    accent: 'text-scanner-aso',
    accentBg: 'bg-scanner-aso/10',
    href: '/landing/features/aso-audit',
    summary: '30+ checks: metadata, visual assets, ratings & competitive signals',
    planNote: 'ASO scanning requires Starter plan or above',
    features: [
      { label: 'App title length & keyword presence', free: false, starter: true, pro: true, agency: true },
      { label: 'Subtitle / short description', free: false, starter: true, pro: true, agency: true },
      { label: 'Long description quality', free: false, starter: true, pro: true, agency: true },
      { label: 'App category selection', free: false, starter: true, pro: true, agency: true },
      { label: 'Content rating accuracy', free: false, starter: true, pro: true, agency: true },
      { label: 'IAP disclosure check', free: false, starter: true, pro: true, agency: true },
      { label: 'Last-updated freshness', free: false, starter: true, pro: true, agency: true },
      { label: 'Keyword stuffing detection', free: false, starter: true, pro: true, agency: true },
      { label: 'Localization coverage', free: false, starter: true, pro: true, agency: true },
      { label: 'Icon quality & presence', free: false, starter: true, pro: true, agency: true },
      { label: 'Screenshot count & dimensions', free: false, starter: true, pro: true, agency: true },
      { label: 'Feature graphic (Android)', free: false, starter: true, pro: true, agency: true },
      { label: 'Preview video presence', free: false, starter: true, pro: true, agency: true },
      { label: 'Average rating score', free: false, starter: true, pro: true, agency: true },
      { label: 'Review count & recency', free: false, starter: true, pro: true, agency: true },
      { label: 'Review sentiment signals', free: false, starter: true, pro: true, agency: true },
      { label: 'Download / install estimate bracket', free: false, starter: true, pro: true, agency: true },
      { label: 'Category rank signals', free: false, starter: true, pro: true, agency: true },
      { label: 'Competitor keyword gap', free: false, starter: true, pro: true, agency: true },
      { label: 'Universal app flag (iOS)', free: false, starter: true, pro: true, agency: true },
      { label: 'Scan history & trend tracking', free: false, starter: true, pro: true, agency: true },
    ],
  },
  {
    key: 'brand',
    icon: Target,
    label: 'Brand Visibility',
    accent: 'text-scanner-brand',
    accentBg: 'bg-scanner-brand/10',
    href: '/landing/features/brand-visibility',
    summary: 'Live prompt tracking across ChatGPT, Claude, Perplexity & Gemini',
    features: [
      { label: 'Custom prompt set tracking', free: true, starter: true, pro: true, agency: true },
      { label: 'ChatGPT live querying', free: true, starter: true, pro: true, agency: true },
      { label: 'Claude live querying', free: true, starter: true, pro: true, agency: true },
      { label: 'Perplexity live querying', free: true, starter: true, pro: true, agency: true },
      { label: 'Gemini live querying', free: true, starter: true, pro: true, agency: true },
      { label: 'Brand mention detection (yes/no)', free: true, starter: true, pro: true, agency: true },
      { label: 'Sentiment classification', free: true, starter: true, pro: true, agency: true },
      { label: 'Response previews', free: true, starter: true, pro: true, agency: true },
      { label: 'Prompt × engine visibility matrix', free: true, starter: true, pro: true, agency: true },
      { label: 'AI visibility score (share of voice)', free: true, starter: true, pro: true, agency: true },
      { label: 'Historical run comparison', free: false, starter: true, pro: true, agency: true },
    ],
  },
  {
    key: 'health',
    icon: Activity,
    label: 'Site Health',
    accent: 'text-scanner-health',
    accentBg: 'bg-scanner-health/10',
    href: '/landing/features/site-health',
    summary: 'Core Web Vitals & WCAG 2.2 accessibility in one report',
    features: [
      { label: 'Largest Contentful Paint (LCP)', free: true, starter: true, pro: true, agency: true },
      { label: 'Interaction to Next Paint (INP)', free: true, starter: true, pro: true, agency: true },
      { label: 'Cumulative Layout Shift (CLS)', free: true, starter: true, pro: true, agency: true },
      { label: 'First Contentful Paint (FCP)', free: true, starter: true, pro: true, agency: true },
      { label: 'Color contrast (WCAG 2.2)', free: true, starter: true, pro: true, agency: true },
      { label: 'Image alt text (accessibility)', free: true, starter: true, pro: true, agency: true },
      { label: 'Button & link names', free: true, starter: true, pro: true, agency: true },
      { label: 'Form labels', free: true, starter: true, pro: true, agency: true },
      { label: 'Heading order', free: true, starter: true, pro: true, agency: true },
      { label: 'ARIA correctness', free: true, starter: true, pro: true, agency: true },
      { label: 'Accessibility score (0–100)', free: true, starter: true, pro: true, agency: true },
      { label: 'Scan history for regression tracking', free: false, starter: true, pro: true, agency: true },
      { label: 'Scheduled performance monitoring', free: false, starter: false, pro: true, agency: true },
    ],
  },
];

const PRICING_FAQS = [
  { q: 'What counts as one scan?', a: 'One scan = one audit run on one URL. Running a Security scan and an SEO scan on the same URL counts as two scans. Competitor comparison adds one additional scan per competitor URL.' },
  { q: 'Do unused scans roll over to the next month?', a: 'No. Scan limits reset at the start of each billing calendar month. Unused scans do not carry forward.' },
  { q: 'Can I switch plans at any time?', a: 'Yes. You can upgrade or downgrade at any time. Upgrades take effect immediately; downgrades take effect at the next billing cycle.' },
  { q: 'Why is ASO not on the Free plan?', a: 'ASO audits require live calls to App Store and Google Play APIs, which carry higher infrastructure costs than web-only scans. Starter plan ($5/month) includes full ASO access with no separate feature gate.' },
  { q: 'What does "unlimited team members" mean?', a: 'Every plan allows you to invite as many teammates as you want to your workspace. Scan limits are per workspace, not per seat.' },
  { q: 'Is there an Enterprise plan?', a: 'Enterprise plans are not offered yet. Agency ($100/month) is currently the highest tier, with unlimited scans, sites, daily monitoring, white-label reports, and API access.' },
  { q: 'What is included in AI deep analysis?', a: 'On Pro and Agency plans, Gemini-powered AI analysis reviews your scan results and produces an executive summary, risk prioritization, keyword and intent mapping, E-E-A-T scoring, and copyable remediation snippets — depending on the audit type.' },
];

// ─── Helper: cell value renderer ─────────────────────────────────────────────

function Cell({ value, planKey }) {
  if (value === true) {
    return (
      <td className="px-4 py-3 text-center">
        <Check className="h-4 w-4 text-success mx-auto" aria-label="Included" />
      </td>
    );
  }
  if (value === false) {
    return (
      <td className="px-4 py-3 text-center">
        <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" aria-label="Not included" />
      </td>
    );
  }
  // String value (e.g. "Weekly", "10", "Unlimited")
  return (
    <td className="px-4 py-3 text-center text-sm font-medium text-foreground">
      {value}
    </td>
  );
}

// ─── Collapsible scan table ───────────────────────────────────────────────────

function ScanTable({ scan }) {
  const [open, setOpen] = useState(false);
  const Icon = scan.icon;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden" id={`scan-${scan.key}`}>
      {/* Header row — always visible */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 hover:bg-muted/40 transition-colors text-left"
        aria-expanded={open}
        id={`scan-toggle-${scan.key}`}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl ${scan.accentBg}`}>
            <Icon className={`h-5 w-5 ${scan.accent}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold">{scan.label}</h3>
              {scan.planNote && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                  Starter+
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{scan.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={scan.href}
            className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            Learn more <ArrowRight className="h-3 w-3" />
          </Link>
          {open ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded feature table */}
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="border-t border-border overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[560px]">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[45%]">
                    Feature
                  </th>
                  {PLANS.map((p) => (
                    <th
                      key={p.key}
                      scope="col"
                      className={`px-4 py-3 text-center text-xs font-bold uppercase tracking-wider ${
                        p.highlight ? 'text-primary' : 'text-muted-foreground'
                      }`}
                    >
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scan.features.map((feature, i) => (
                  <tr
                    key={feature.label}
                    className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium">{feature.label}</td>
                    {PLANS.map((p) => (
                      <Cell key={p.key} value={feature[p.key]} planKey={p.key} />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% -12%, hsl(var(--accent)) 0%, transparent 65%)' }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-14 text-center relative">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-7">
              <Zap className="h-3.5 w-3.5" /> Simple, transparent pricing
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-4xl sm:text-5xl lg:text-[60px] font-bold tracking-tight leading-[1.06]">
              Pricing that scales with you
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Start free with 10 full scans a month across all 7 audit types. Upgrade when
              you need more scans, monitoring, AI deep analysis, or app store auditing.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <p className="mt-3 text-xs text-muted-foreground">No credit card required on Free or Starter</p>
          </Reveal>
        </div>
      </section>

      {/* ── Plan cards ───────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <MotionItem key={plan.name}>
              <div
                className={`h-full rounded-2xl border p-6 flex flex-col ${
                  plan.highlight
                    ? 'border-primary bg-primary/[0.04] shadow-lg relative'
                    : 'border-border bg-card'
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider">
                    Most popular
                  </span>
                )}
                <div>
                  <h2 className="font-bold text-lg">{plan.name}</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{plan.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                <div className="flex-1" />
                {plan.comingSoon ? (
                  <Button className="w-full font-semibold mt-6" variant="outline" disabled>
                    {plan.cta}
                  </Button>
                ) : SHOW_AUTH_CTAS ? (
                  <Link href={plan.ctaHref} className="mt-6">
                    <Button
                      className={`w-full font-semibold ${plan.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                      variant={plan.highlight ? 'default' : 'outline'}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                ) : null}
              </div>
            </MotionItem>
          ))}
        </Stagger>

        {/* Anchor links to scan tables */}
        <Reveal className="mt-10 text-center">
          <p className="text-sm text-muted-foreground mb-4">Jump to a specific scanner</p>
          <div className="flex flex-wrap justify-center gap-2">
            {SCAN_TABLES.map((scan) => {
              const Icon = scan.icon;
              return (
                <a
                  key={scan.key}
                  href={`#scan-${scan.key}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-muted transition-colors ${scan.accent}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {scan.label}
                </a>
              );
            })}
          </div>
        </Reveal>
      </section>

      {/* ── Platform features table ───────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <Reveal className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Platform features</h2>
          <p className="text-muted-foreground mt-2 text-base">Limits and capabilities that apply across all scan types.</p>
        </Reveal>
        <Reveal>
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th scope="col" className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground w-[40%]">
                      Feature
                    </th>
                    {PLANS.map((p) => (
                      <th
                        key={p.key}
                        scope="col"
                        className={`px-4 py-4 text-center text-xs font-bold uppercase tracking-wider ${
                          p.highlight ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {p.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {PLATFORM_FEATURES.map((feature, i) => (
                    <tr
                      key={feature.label}
                      className={`border-b border-border last:border-0 ${i % 2 === 0 ? '' : 'bg-muted/20'}`}
                    >
                      <td className="px-5 py-3.5 font-medium">{feature.label}</td>
                      {PLANS.map((p) => (
                        <Cell key={p.key} value={feature[p.key]} planKey={p.key} />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── Per-scan feature comparison ───────────────────────────── */}
      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <Reveal className="mb-10">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">What&apos;s included in each scan</h2>
            <p className="text-muted-foreground mt-2 text-base">
              Click any scanner below to see exactly which checks are available on each plan.
            </p>
          </Reveal>

          <div className="space-y-4">
            {SCAN_TABLES.map((scan) => (
              <Reveal key={scan.key}>
                <ScanTable scan={scan} />
              </Reveal>
            ))}
          </div>

          {/* Legend */}
          <Reveal className="mt-8 flex flex-wrap items-center gap-5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-success" /> Included on this plan</span>
            <span className="flex items-center gap-1.5"><Minus className="h-3.5 w-3.5 text-muted-foreground/40" /> Not included</span>
            <span className="flex items-center gap-1.5 font-medium text-foreground">Text value = specific detail (e.g. &ldquo;Weekly&rdquo;)</span>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <Reveal className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Pricing FAQ</h2>
        </Reveal>
        <Reveal>
          <FeatureFaqAccordion faqs={PRICING_FAQS} />
        </Reveal>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground px-8 py-16 text-center">
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 120%, rgba(255,255,255,0.35), transparent)' }}
            />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight relative">
              Start with 10 free scans — no credit card
            </h2>
            <p className="mt-3 text-primary-foreground/85 text-lg relative">
              Run Security, SEO, AEO, GEO, Brand Visibility, and Site Health audits for free.
              Upgrade to Starter for ASO and more.
            </p>
            {SHOW_AUTH_CTAS && (
              <div className="mt-8 relative flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold">
                    Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/landing/features/aso-audit">
                  <Button size="lg" variant="outline" className="h-12 px-8 text-base font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Learn about ASO Audit
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </Reveal>
      </section>
    </div>
  );
}
