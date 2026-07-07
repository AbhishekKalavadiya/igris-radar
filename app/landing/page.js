'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Sparkles,
  Terminal,
  Gauge,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, Stagger, MotionItem, AnimatedNumber } from '@/components/ui/motion';
import { NAV_PLATFORM, AI_ENGINES, HOW_IT_WORKS } from '@/lib/landingContent';
import FeatureFaqAccordion from '@/components/landing/FeatureFaqAccordion';
import JsonLd from '@/components/ui/JsonLd';
import { faqPageJsonLd, softwareApplicationJsonLd, breadcrumbJsonLd, howToJsonLd, SITE_PUBLISHED, FOUNDER } from '@/lib/seo';

/* Real plan data - mirrors PLAN_LIMITS in lib/constants.js and BillingTab pricing. */
const PLANS = [
  {
    name: 'Free', price: '$0', period: 'forever', highlight: false,
    features: ['10 scans / month', '2 tracked sites', 'Unlimited team members', 'All 6 audit types', 'Severity-ranked findings', 'AI-ready fix prompts'],
    cta: 'Start free',
  },
  {
    name: 'Starter', price: '$5', period: '/month', highlight: false,
    features: ['25 scans / month', '5 tracked sites', 'Unlimited team members', 'Scan history & trends', 'Everything in Free'],
    cta: 'Start with Starter',
  },
  {
    name: 'Pro', price: '$20', period: '/month', highlight: true,
    features: ['100 scans / month', '10 tracked sites', 'Unlimited team members', 'Weekly scheduled monitoring', 'AI deep analysis', 'Competitor comparison scans'],
    cta: 'Go Pro',
  },
  {
    name: 'Agency', price: '$100', period: '/month', highlight: false,
    features: ['Unlimited scans', 'Unlimited tracked sites', 'Unlimited team members', 'Daily scheduled monitoring', 'White-label PDF reports', 'API access'],
    cta: 'Scale with Agency',
  },
];

const HOME_FAQS = [
  { q: 'What is Igris Radar?', a: 'Igris Radar is an AI search visibility and web audit platform. From a single URL it runs six audits: website security, SEO, AEO (answer engine optimization), GEO (generative engine optimization), live AI brand visibility tracking, and site health. Every audit returns severity-ranked findings with AI-ready fix prompts.' },
  { q: 'What is AI search visibility?', a: 'AI search visibility is how often AI assistants like ChatGPT, Claude, Perplexity, and Gemini mention or cite your brand when users ask relevant questions. Igris Radar measures it two ways: audits that score whether your site is technically citable (AEO and GEO), and live brand tracking that queries the real engines with your prompts.' },
  { q: 'Do I need to install anything on my site?', a: 'No. Every audit runs from the outside, exactly the way crawlers and attackers see your site. Enter a URL and results arrive in seconds to minutes depending on the audit.' },
  { q: 'What makes the fix workflow different?', a: 'Every failed check ships with plain-language remediation and an agent-native fix prompt: a ready-to-paste instruction for your AI coding assistant with the full context of the finding. You go from "we have an issue" to a merged fix without writing the ticket.' },
  { q: 'Can I compare my site against competitors?', a: 'Yes. SEO, AEO, and GEO audits accept a competitor URL and run the identical checks on both sites, showing a category-by-category gap analysis. Brand visibility tracking shows whether AI engines recommend you or them.' },
  { q: 'How much does it cost?', a: 'The Free plan includes 10 full scans a month across all six audit types, no credit card required. Paid plans start at $5/month for 25 scans and 4 tracked sites; Pro at $25/month adds AI deep analysis and competitor scans; Agency at $100/month is unlimited with white-label reports and API access.' },
];

/** Rotating AI engine name in the hero headline. */
function RotatingEngines() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % AI_ENGINES.length), 2200);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="relative inline-block text-primary" style={{ minWidth: '9ch' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={AI_ENGINES[index]}
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.3 }}
          className="inline-block"
        >
          {AI_ENGINES[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Static product mockup: a stylized scan report card. */
function ReportMockup() {
  const rows = [
    { name: 'Content-Security-Policy', status: 'fail', sev: 'High' },
    { name: 'GPTBot crawler access', status: 'pass', sev: null },
    { name: 'FAQ schema (JSON-LD)', status: 'fail', sev: 'Medium' },
    { name: 'Largest Contentful Paint', status: 'pass', sev: null },
    { name: 'Direct answer paragraphs', status: 'fail', sev: 'Medium' },
  ];
  return (
    <div className="rounded-2xl border border-border bg-card shadow-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/60">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
        </div>
        <span className="text-xs font-mono text-muted-foreground ml-2">igris-radar :: audit report</span>
      </div>
      <div className="p-5 grid sm:grid-cols-[auto_1fr] gap-6 items-center">
        <div className="flex flex-col items-center justify-center mx-auto">
          <div className="relative h-28 w-28 rounded-full flex items-center justify-center">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 112 112">
              <circle cx="56" cy="56" r="52" fill="none" stroke="currentColor" strokeWidth="8" className="text-primary/15" />
              <circle 
                cx="56" cy="56" r="52" fill="none" stroke="currentColor" strokeWidth="8" 
                className="text-primary" 
                strokeDasharray={2 * Math.PI * 52} 
                strokeDashoffset={(2 * Math.PI * 52) * (1 - 0.72)} 
                strokeLinecap="round" 
              />
            </svg>
            <div className="text-3xl font-bold tabular-nums text-primary"><AnimatedNumber value={72} /></div>
          </div>
          <span className="text-xs text-muted-foreground mt-2 font-semibold uppercase tracking-wider">Overall score</span>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.name} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="flex items-center gap-2 min-w-0">
                {row.status === 'pass'
                  ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                  : <XCircle className="h-4 w-4 text-destructive shrink-0" />}
                <span className="text-sm font-medium truncate">{row.name}</span>
              </div>
              {row.sev && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-severity-high/10 border border-severity-high/30 text-foreground shrink-0">
                  {row.sev}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div>
      <JsonLd data={softwareApplicationJsonLd()} />
      <JsonLd data={faqPageJsonLd(HOME_FAQS)} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/landing' }])} />
      <JsonLd data={howToJsonLd('How Igris Radar audits a site', HOW_IT_WORKS)} />
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 55% at 50% -12%, hsl(var(--accent)) 0%, transparent 65%)' }}
        />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-14 text-center relative">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-7">
              <Sparkles className="h-3.5 w-3.5" /> SEO · AEO · GEO in one platform
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-bold tracking-tight leading-[1.06]">
              Win the AI search answer in<br />
              <RotatingEngines />
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Your buyers ask AI assistants for recommendations. Igris Radar audits everything that
              decides whether the answer is you: security, SEO, answer engine readiness, generative
              engine authority, live brand visibility, and site health.
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 text-base h-12">
                  Analyze my site free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
              <Link href="/landing/features/aeo-audit">
                <Button size="lg" variant="outline" className="h-12 px-8 text-base">What is AEO?</Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Free plan · 10 full scans a month · No credit card</p>
          </Reveal>
          <Reveal delay={0.34} className="mt-14">
            <ReportMockup />
          </Reveal>
        </div>

        {/* Engine ticker */}
        <div className="border-y border-border bg-muted/40 py-5 overflow-hidden">
          <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Optimize for every engine your customers ask
          </p>
          <div className="animate-ticker gap-14 px-8">
            {[...AI_ENGINES, ...AI_ENGINES, 'Google Search', 'Bing', ...AI_ENGINES].map((engine, i) => (
              <span key={`${engine}-${i}`} className="text-lg font-semibold text-foreground/40 whitespace-nowrap">
                {engine}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── The shift ────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
              Why doesn't ranking #1 guarantee traffic anymore?
            </h3>
            <p className="mt-2 text-base text-foreground/90 leading-relaxed max-w-xl">
              Because AI assistants answer the question directly instead of sending a click. The
              winner is whichever site gets cited inside that answer, not whichever ranks highest
              on a results page.
            </p>
            <h2 className="mt-8 text-3xl md:text-4xl font-bold tracking-tight leading-tight">
              Search didn't die.<br />It stopped sending clicks.
            </h2>
            <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
              When ChatGPT, Perplexity, and Google's AI Overviews answer the question directly,
              the winner isn't whoever ranks #1. It's whoever gets <em className="not-italic font-semibold text-foreground">cited in the answer</em>.
              That's a different game with different rules: AI crawler access, answer-shaped content,
              entity authority, and machine-readable trust signals.
            </p>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Igris Radar measures all of it: the classic{' '}
              <cite className="not-italic">
                <a
                  href="https://en.wikipedia.org/wiki/Search_engine_optimization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-primary/40 underline-offset-2 hover:text-foreground transition-colors"
                >
                  search engine optimization
                </a>
              </cite>{' '}
              fundamentals you still need, and the AEO and{' '}
              <cite className="not-italic">
                <a
                  href="https://en.wikipedia.org/wiki/Generative_engine_optimization"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-primary/40 underline-offset-2 hover:text-foreground transition-colors"
                >
                  generative engine optimization
                </a>
              </cite>{' '}
              signals that decide who AI engines recommend. Security matters here too: sites that
              fail basic hardening recommended by{' '}
              <cite className="not-italic">
                <a
                  href="https://www.cisa.gov/topics/cybersecurity-best-practices"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-primary/40 underline-offset-2 hover:text-foreground transition-colors"
                >
                  CISA's cybersecurity best practices
                </a>
              </cite>{' '}
              erode the trust signals AI engines use to decide who to cite.
            </p>
            <blockquote
              cite="https://en.wikipedia.org/wiki/Generative_engine_optimization"
              className="mt-5 border-l-2 border-primary/40 pl-4 text-base italic text-muted-foreground"
            >
              "Generative engine optimization (GEO) is one of the names given to the practice of
              structuring digital content and managing online presence to improve visibility in
              responses generated by generative artificial intelligence (AI) systems."
              <footer className="mt-1.5 not-italic text-xs text-muted-foreground/80">
                —{' '}
                <cite className="not-italic">
                  <a
                    href="https://en.wikipedia.org/wiki/Generative_engine_optimization"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-primary/40 underline-offset-2 hover:text-foreground transition-colors"
                  >
                    Wikipedia, "Generative engine optimization"
                  </a>
                </cite>
              </footer>
            </blockquote>
          </Reveal>
          <Stagger className="grid grid-cols-2 gap-4">
            {[
              { value: 6, suffix: '', label: 'audit engines: security, SEO, AEO, GEO, brand, health' },
              { value: 80, suffix: '+', label: 'individual checks across a full platform run' },
              { value: 4, suffix: '', label: 'AI engines queried live for brand tracking' },
              { value: 100, suffix: '', label: 'point score per audit, tracked over time' },
            ].map((s) => (
              <MotionItem key={s.label}>
                <div className="rounded-xl border border-border bg-card p-6 h-full">
                  <div className="text-4xl font-bold text-primary tabular-nums">
                    <AnimatedNumber value={s.value} />{s.suffix}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 leading-snug">{s.label}</p>
                </div>
              </MotionItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── SEO vs AEO vs GEO ────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            SEO, AEO, GEO — what&apos;s the difference?
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            SEO earns rankings, AEO earns the extracted answer, and GEO earns the citation.
            They reward different signals, so Igris Radar audits and scores each one separately.
          </p>
        </Reveal>
        <Reveal>
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground"></th>
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-foreground">SEO</th>
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-foreground">AEO</th>
                  <th scope="col" className="px-5 py-4 text-xs font-semibold uppercase tracking-wider text-foreground">GEO</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border">
                  <th scope="row" className="px-5 py-4 font-semibold whitespace-nowrap">Optimizes for</th>
                  <td className="px-5 py-4 text-muted-foreground">Ranking on results pages</td>
                  <td className="px-5 py-4 text-muted-foreground">Being the extracted answer</td>
                  <td className="px-5 py-4 text-muted-foreground">Being the cited authority</td>
                </tr>
                <tr className="border-b border-border">
                  <th scope="row" className="px-5 py-4 font-semibold whitespace-nowrap">Where you win</th>
                  <td className="px-5 py-4 text-muted-foreground">Google &amp; Bing search results</td>
                  <td className="px-5 py-4 text-muted-foreground">ChatGPT &amp; Perplexity answers</td>
                  <td className="px-5 py-4 text-muted-foreground">AI Overviews &amp; generative responses</td>
                </tr>
                <tr className="border-b border-border">
                  <th scope="row" className="px-5 py-4 font-semibold whitespace-nowrap">Core signals</th>
                  <td className="px-5 py-4 text-muted-foreground">Crawlability, on-page, links</td>
                  <td className="px-5 py-4 text-muted-foreground">AI crawler access, answer-shaped content, llms.txt</td>
                  <td className="px-5 py-4 text-muted-foreground">Entity authority, factual density, freshness</td>
                </tr>
                <tr>
                  <th scope="row" className="px-5 py-4 font-semibold whitespace-nowrap">Success metric</th>
                  <td className="px-5 py-4 text-muted-foreground">Rankings &amp; organic clicks</td>
                  <td className="px-5 py-4 text-muted-foreground">Answer inclusion &amp; citations</td>
                  <td className="px-5 py-4 text-muted-foreground">Brand mentions &amp; recommendations</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Reveal>
      </section>

      {/* ── Platform grid ────────────────────────────────────── */}
      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
              What does Igris Radar actually audit?
            </h3>
            <p className="mt-2 text-base text-foreground/90 leading-relaxed">
              Six purpose-built engines: website security, SEO, AEO, GEO, live AI brand visibility,
              and site health. Each runs independently and returns its own 0–100 score.
            </p>
            <h2 className="mt-8 text-3xl md:text-4xl font-bold tracking-tight">Six audits. One picture of your visibility.</h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Each engine is purpose-built and independently scored. Run one, or run the full battery.
            </p>
          </Reveal>
          <Stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {NAV_PLATFORM.map((feature) => {
              const Icon = feature.icon;
              return (
                <MotionItem key={feature.href}>
                  <Link href={feature.href} className="group block h-full">
                    <div className="h-full rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30">
                      <div className={`inline-flex p-2.5 rounded-lg ${feature.bgSoft} mb-4`}>
                        <Icon className={`h-5 w-5 ${feature.accent}`} />
                      </div>
                      <h3 className="text-lg font-bold flex items-center gap-1.5">
                        {feature.title}
                        <ArrowRight className="h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{feature.description}</p>
                    </div>
                  </Link>
                </MotionItem>
              );
            })}
          </Stagger>
        </div>
      </section>

      {/* ── Differentiator: fix prompts ──────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
        <Reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-5">
            <Terminal className="h-3.5 w-3.5" /> Agent-native remediation
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
            Findings your AI coding assistant can fix directly
          </h2>
          <p className="mt-5 text-lg text-muted-foreground leading-relaxed">
            Most audit tools stop at "here's what's wrong." Every Igris Radar finding includes an
            agent-native fix prompt: a complete, context-rich instruction you copy into Claude,
            Cursor, or Copilot. The issue, the impact, and the fix specification, ready to paste.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              'One-click copy on every finding',
              'Plain-language "why this matters" for the humans',
              'Precise fix specification for the agents',
            ].map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm font-medium">
                <CheckCircle2 className="h-5 w-5 text-success" /> {item}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="rounded-2xl border border-border bg-foreground text-background shadow-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-background/15 flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold">Agent-Native Fix Prompt</span>
            </div>
            <pre className="p-5 text-xs leading-relaxed font-mono whitespace-pre-wrap opacity-90">
{`Add a Content-Security-Policy header to
this Next.js app. Requirements:
- default-src 'self'
- allow our analytics + font origins
- report-only first, then enforce
The header is currently missing, which
leaves the site exposed to XSS and data
injection. Apply in next.config.js
headers() and verify on /.`}
            </pre>
          </div>
        </Reveal>
      </section>

      {/* ── How it works ─────────────────────────────────────── */}
      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From URL to fix list in three steps</h2>
            <p className="text-muted-foreground mt-4 text-lg">No installs, no code snippets, no DNS changes.</p>
          </Reveal>
          <Stagger className="grid md:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((step) => (
              <MotionItem key={step.step}>
                <div className="h-full rounded-xl border border-border bg-card p-7">
                  <div className="text-sm font-mono font-bold text-primary">{step.step}</div>
                  <h3 className="text-xl font-bold mt-3">{step.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{step.text}</p>
                </div>
              </MotionItem>
            ))}
          </Stagger>

          <Stagger className="grid sm:grid-cols-3 gap-5 mt-12">
            {[
              { icon: Gauge, title: 'Scored & tracked', text: 'Every audit produces a 0–100 score with per-category breakdowns and a trend chart across scans.' },
              { icon: ShieldCheck, title: 'Severity-ranked', text: 'Critical, high, medium, and low, plus passed checks listed, so you always see the full coverage.' },
              { icon: Terminal, title: 'Competitor-aware', text: 'Point the same audit at a rival URL and get a side-by-side gap analysis in the same report.' },
            ].map(({ icon: Icon, title, text }) => (
              <MotionItem key={title}>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0"><Icon className="h-4 w-4 text-primary" /></div>
                  <div>
                    <h4 className="text-sm font-bold">{title}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{text}</p>
                  </div>
                </div>
              </MotionItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ── Pricing ──────────────────────────────────────────── */}
      <section id="pricing" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 scroll-mt-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Simple pricing that scales with you</h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Start free. Upgrade when you need more scans, monitoring, or AI analysis.
          </p>
        </Reveal>
        <Stagger className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {PLANS.map((plan) => (
            <MotionItem key={plan.name}>
              <div className={`h-full rounded-2xl border p-6 flex flex-col ${
                plan.highlight
                  ? 'border-primary bg-primary/[0.04] shadow-lg relative'
                  : 'border-border bg-card'
              }`}>
                {plan.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-wider">
                    Most popular
                  </span>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-sm text-muted-foreground">{plan.period}</span>
                </div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className="mt-6">
                  <Button
                    className={`w-full font-semibold ${plan.highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
                    variant={plan.highlight ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            </MotionItem>
          ))}
        </Stagger>
        <Reveal className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Need unlimited sites, custom terms, or procurement?{' '}
            <Link href="/landing/contact" className="text-primary font-semibold hover:underline">Talk to us about Enterprise</Link>
          </p>
        </Reveal>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────── */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
        <Reveal className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently asked questions</h2>
          <p className="mt-2 text-xs text-muted-foreground">
            Written by{' '}
            <Link href="/landing/about" rel="author" className="text-primary hover:underline font-medium">
              {FOUNDER.name}
            </Link>
            {' '}· Content last reviewed{' '}
            <time dateTime={SITE_PUBLISHED}>{new Date(SITE_PUBLISHED).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</time>
          </p>
        </Reveal>
        <Reveal>
          <FeatureFaqAccordion faqs={HOME_FAQS} />
        </Reveal>
      </section>

      {/* ── Final CTA ────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground px-8 py-16 text-center">
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 120%, rgba(255,255,255,0.35), transparent)' }}
            />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight relative">
              Find out what AI engines think of your site
            </h2>
            <p className="mt-3 text-primary-foreground/85 text-lg relative">
              Your first full audit takes about a minute. Free plan, no credit card.
            </p>
            <div className="mt-8 relative">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold">
                  Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
