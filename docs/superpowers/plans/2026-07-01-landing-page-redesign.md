# Landing Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the Provenance landing page into a 9-section, content-driven, problem-first page using SEO/AEO/GEO intelligence vocabulary from competitor analysis Excel files, plus update all 6 feature detail pages with intelligence-sourced copy.

**Architecture:** New shared components under `components/landing/` are composed by a thin `app/landing/page.js`. Feature pages are updated in place with intelligence vocabulary. A ticker animation is added to `globals.css`.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS, shadcn/ui (Accordion), Lucide icons, Igris design system (0px radius, semantic tokens only)

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Modify | `app/globals.css` | Add `@keyframes ticker` + `.animate-ticker` |
| Create | `components/landing/HeroTicker.js` | Scrolling AI engine name strip |
| Create | `components/landing/PainCards.js` | 3-card problem agitation row |
| Create | `components/landing/TriadCards.js` | SEO/AEO/GEO 3-card solution grid |
| Create | `components/landing/FeatureGrid.js` | 6-card feature showcase grid |
| Create | `components/landing/StepsFlow.js` | 3-step How It Works |
| Create | `components/landing/StatBar.js` | 4-stat social proof block |
| Create | `components/landing/FaqAccordion.js` | FAQ accordion + JSON-LD FAQPage schema |
| Create | `components/landing/PricingCards.js` | 3-tier pricing preview |
| Rewrite | `app/landing/page.js` | Thin composition of all 9 sections |
| Update | `app/landing/features/seo-audit/page.js` | Intelligence vocabulary + content depth |
| Update | `app/landing/features/aeo-audit/page.js` | Intelligence vocabulary + content depth |
| Update | `app/landing/features/geo-audit/page.js` | Intelligence vocabulary + content depth |
| Update | `app/landing/features/brand-visibility/page.js` | Intelligence vocabulary + content depth |
| Update | `app/landing/features/site-health/page.js` | Intelligence vocabulary + content depth |
| Update | `app/landing/features/security-scanner/page.js` | Intelligence vocabulary + content depth |

---

## Task 1: Add ticker animation to globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] Add the following block before the final closing of the file (after the last `@keyframes` block):

```css
/* Hero ticker — scrolling AI engine name strip */
@keyframes ticker {
  from { transform: translateX(0); }
  to   { transform: translateX(-50%); }
}

.animate-ticker {
  animation: ticker 25s linear infinite;
  display: flex;
  width: max-content;
}
```

---

## Task 2: Create HeroTicker component

**Files:**
- Create: `components/landing/HeroTicker.js`

- [ ] Create file with:

```js
'use client';

const ENGINES = [
  'ChatGPT', 'Gemini', 'Perplexity', 'Claude', 'Google AI Overviews', 'Bing Chat',
];

export default function HeroTicker() {
  const doubled = [...ENGINES, ...ENGINES];
  return (
    <div className="mt-16 pt-8 border-t border-white/5 overflow-hidden">
      <p className="text-xs text-muted-foreground uppercase tracking-widest text-center mb-5 font-medium">
        Monitoring your brand across
      </p>
      <div className="relative overflow-hidden">
        <div className="animate-ticker gap-10 flex">
          {doubled.map((engine, i) => (
            <span key={i} className="flex items-center gap-2 shrink-0 text-sm font-medium text-gray-400 px-4">
              <span className="text-primary">◆</span>
              <span className="text-white">{engine}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Task 3: Create PainCards component

**Files:**
- Create: `components/landing/PainCards.js`

- [ ] Create file with:

```js
import { TrendingDown, Eye, AlertTriangle } from 'lucide-react';

const PAINS = [
  {
    icon: Eye,
    stat: '67%',
    label: 'of search journeys now start in an AI engine — not Google',
    note: '* placeholder — replace with sourced figure before launch',
  },
  {
    icon: AlertTriangle,
    stat: '0',
    label: 'visibility into which AI engines cite your brand — or your competitors\'',
    note: null,
  },
  {
    icon: TrendingDown,
    stat: '↓',
    label: 'organic traffic as zero-click AI answers replace ten blue links',
    note: null,
  },
];

export default function PainCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {PAINS.map(({ icon: Icon, stat, label, note }) => (
        <div
          key={stat + label}
          className="p-6 bg-card border border-border flex flex-col gap-4"
        >
          <Icon className="h-6 w-6 text-destructive" />
          <div className="text-4xl font-bold text-white">{stat}</div>
          <p className="text-gray-400 text-sm leading-relaxed">{label}</p>
          {note && <p className="text-xs text-muted-foreground italic">{note}</p>}
        </div>
      ))}
    </div>
  );
}
```

---

## Task 4: Create TriadCards component

**Files:**
- Create: `components/landing/TriadCards.js`

- [ ] Create file with:

```js
import Link from 'next/link';
import { Search, Sparkles, Bot, ChevronRight, CheckCircle2 } from 'lucide-react';

const CARDS = [
  {
    icon: Search,
    color: 'text-primary',
    borderHover: 'hover:border-primary/50',
    checkColor: 'text-primary',
    title: 'Technical SEO',
    body: 'The foundation every AI engine reads first. Site audit, rank tracker, keywords explorer, and content gap analysis — all in one dashboard.',
    features: ['Site Audit (638 checks)', 'Rank Tracker — 190 countries', 'Content Gap Analysis'],
    href: '/landing/features/seo-audit',
    linkColor: 'text-primary',
    linkLabel: 'Explore SEO Tools',
  },
  {
    icon: Sparkles,
    color: 'text-indigo-400',
    borderHover: 'hover:border-indigo-500/50',
    checkColor: 'text-indigo-400',
    title: 'AEO — Answer Engine Optimization',
    body: 'Optimize your content to be cited by ChatGPT, Claude, and Perplexity when users ask conversational questions. Measure citation likelihood with Citation Analytics.',
    features: ['Citation Analytics Dashboard', 'ChatGPT & Gemini Tracking', 'AI Content Recommendations'],
    href: '/landing/features/aeo-audit',
    linkColor: 'text-indigo-400',
    linkLabel: 'Explore AEO Tools',
  },
  {
    icon: Bot,
    color: 'text-emerald-400',
    borderHover: 'hover:border-emerald-500/50',
    checkColor: 'text-emerald-400',
    title: 'GEO — Generative Engine Optimization',
    body: 'Track your pixel share in Google AI Overviews, monitor AI Mode, and reclaim zero-click traffic. The GEO Checker gives you an instant brand visibility score.',
    features: ['GEO Checker — free tool', 'AI Overview Tracker', 'Zero-Click Analytics'],
    href: '/landing/features/geo-audit',
    linkColor: 'text-emerald-400',
    linkLabel: 'Explore GEO Tools',
  },
];

export default function TriadCards() {
  return (
    <div className="grid md:grid-cols-3 gap-8">
      {CARDS.map(({ icon: Icon, color, borderHover, checkColor, title, body, features, href, linkColor, linkLabel }) => (
        <div
          key={title}
          className={`group p-8 bg-card border border-border ${borderHover} transition-colors flex flex-col gap-6`}
        >
          <Icon className={`h-7 w-7 ${color}`} />
          <div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
          </div>
          <ul className="space-y-2 flex-1">
            {features.map((f) => (
              <li key={f} className={`flex items-center gap-2 text-sm text-gray-300`}>
                <CheckCircle2 className={`h-4 w-4 shrink-0 ${checkColor}`} />
                {f}
              </li>
            ))}
          </ul>
          <Link href={href} className={`flex items-center text-sm font-medium ${linkColor} hover:underline mt-auto`}>
            {linkLabel} <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
      ))}
    </div>
  );
}
```

---

## Task 5: Create FeatureGrid component

**Files:**
- Create: `components/landing/FeatureGrid.js`

- [ ] Create file with:

```js
import Link from 'next/link';
import { Globe, BarChart2, LineChart, FileSearch, Activity, Shield, ChevronRight } from 'lucide-react';

const FEATURES = [
  {
    icon: Globe,
    title: 'GEO Checker',
    tagline: 'Check your brand\'s GEO score instantly — free',
    href: '/landing/features/geo-audit',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
  {
    icon: BarChart2,
    title: 'AI Overview Tracker',
    tagline: 'Know exactly when Google features your brand in AI Overviews',
    href: '/landing/features/brand-visibility',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: LineChart,
    title: 'Citation Analytics',
    tagline: 'Count and track your AI engine brand citations over time',
    href: '/landing/features/aeo-audit',
    color: 'text-indigo-400',
    bg: 'bg-indigo-400/10',
  },
  {
    icon: FileSearch,
    title: 'Site Audit',
    tagline: 'Find and fix every technical SEO issue — 638 checks per scan',
    href: '/landing/features/seo-audit',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Activity,
    title: 'Rank Tracker',
    tagline: 'Monitor your keyword rankings across 190 countries daily',
    href: '/landing/features/seo-audit',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
  },
  {
    icon: Shield,
    title: 'Site Health & Security',
    tagline: 'Core Web Vitals monitoring plus continuous security scanning',
    href: '/landing/features/site-health',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10',
  },
];

export default function FeatureGrid() {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {FEATURES.map(({ icon: Icon, title, tagline, href, color, bg }) => (
        <Link
          key={title}
          href={href}
          className="group p-6 bg-card border border-border hover:border-white/20 transition-colors flex flex-col gap-4"
        >
          <div className={`h-10 w-10 flex items-center justify-center ${bg}`}>
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white mb-1">{title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{tagline}</p>
          </div>
          <span className={`flex items-center text-sm font-medium ${color} mt-auto`}>
            Learn more <ChevronRight className="h-4 w-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </Link>
      ))}
    </div>
  );
}
```

---

## Task 6: Create StepsFlow component

**Files:**
- Create: `components/landing/StepsFlow.js`

- [ ] Create file with:

```js
const STEPS = [
  {
    number: '01',
    title: 'Connect your site',
    body: 'Enter your URL. Provenance crawls your site, checks your AI visibility score, and identifies content gaps in minutes — no setup required.',
  },
  {
    number: '02',
    title: 'Monitor your brand',
    body: 'Track your brand citations across ChatGPT, Gemini, Perplexity, and Google AI Overviews in real time. Know who mentions you, why, and when.',
  },
  {
    number: '03',
    title: 'Optimize and outrank',
    body: 'Get actionable fixes for every finding. AI content recommendations improve your citation likelihood and help you outrank competitors in generative search.',
  },
];

export default function StepsFlow() {
  return (
    <div className="grid md:grid-cols-3 gap-8 relative">
      {/* Connector line — desktop only */}
      <div className="hidden md:block absolute top-8 left-1/6 right-1/6 h-px bg-border" style={{ left: '16.67%', right: '16.67%' }} />
      {STEPS.map(({ number, title, body }) => (
        <div key={number} className="flex flex-col gap-4 relative">
          <div className="h-16 w-16 bg-primary/10 border border-primary/30 flex items-center justify-center">
            <span className="text-primary font-mono font-bold text-lg">{number}</span>
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">{body}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Task 7: Create StatBar component

**Files:**
- Create: `components/landing/StatBar.js`

- [ ] Create file with:

```js
const STATS = [
  { value: '190+', label: 'countries tracked for rank monitoring' },
  { value: '5',    label: 'AI engines monitored in real time' },
  { value: '638',  label: 'technical SEO checks per site audit' },
  { value: '14',   label: 'day free trial — no credit card needed' },
];

const LOGOS = ['Acme Corp', 'GLOBALTECH', 'Innovate.io', 'Nexus', 'Orbit'];

export default function StatBar() {
  return (
    <div className="flex flex-col gap-12">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {STATS.map(({ value, label }) => (
          <div key={value} className="flex flex-col gap-2 border-l border-primary/30 pl-6">
            <span className="text-4xl font-bold text-primary">{value}</span>
            <span className="text-sm text-gray-400 leading-snug">{label}</span>
          </div>
        ))}
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6 font-medium">
          Used by growth teams at
        </p>
        <div className="flex flex-wrap gap-8 sm:gap-16 opacity-40">
          {LOGOS.map((name) => (
            <span key={name} className="text-lg font-bold text-white">{name}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
```

---

## Task 8: Create FaqAccordion component

**Files:**
- Create: `components/landing/FaqAccordion.js`

- [ ] Create file with:

```js
'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const FAQS = [
  {
    q: 'What is AEO (Answer Engine Optimization)?',
    a: 'AEO is the practice of optimizing your content to be cited by AI answer engines like ChatGPT, Gemini, and Perplexity when users ask conversational questions. Unlike traditional SEO which targets Google\'s ten blue links, AEO targets the AI-generated answers that now appear above them. Provenance\'s Citation Analytics tool measures your AEO performance across every major AI engine in real time.',
  },
  {
    q: 'What is GEO (Generative Engine Optimization)?',
    a: 'GEO is the discipline of optimizing your brand\'s presence in generative AI search results — specifically Google AI Overviews, Google AI Mode, and Bing Chat. Where AEO focuses on conversational AI engines, GEO focuses on AI-powered features inside traditional search engines. Provenance\'s GEO Checker gives you an instant brand visibility score across all generative search surfaces.',
  },
  {
    q: 'What is the difference between AEO and SEO?',
    a: 'Traditional SEO optimizes pages for keyword rankings in the ten blue links. AEO optimizes your content to be selected as the authoritative answer when AI engines respond to conversational questions. Both matter — which is why Provenance covers SEO, AEO, and GEO in a single platform.',
  },
  {
    q: 'How do I check if ChatGPT mentions my brand?',
    a: 'Provenance\'s Citation Analytics dashboard tracks your brand mentions across ChatGPT, Gemini, Perplexity, Claude, and Google AI Overviews. You\'ll see which queries trigger a mention, how frequently, and how you compare against competitors — updated daily.',
  },
  {
    q: 'What is an AI visibility score?',
    a: 'Your AI visibility score is a single metric that measures how often and prominently your brand appears across AI search engines when users ask questions in your category. Provenance calculates this score from citation frequency, prompt coverage, and brand mention share across all five major AI engines.',
  },
  {
    q: 'How do I appear in Google AI Overviews?',
    a: 'Google AI Overviews pull from pages with strong E-E-A-T signals, structured data (schema markup), clear question-and-answer formatting, and high-quality backlinks. Provenance\'s AEO Audit identifies exactly which optimizations your pages are missing and provides step-by-step remediation guidance.',
  },
  {
    q: 'What is a GEO checker?',
    a: 'A GEO checker is a free tool that scans your website URL and returns a Generative Engine Optimization score — measuring how visible your brand is across AI-powered search surfaces including Google AI Overviews, Google AI Mode, and Bing Chat. Provenance\'s GEO Checker is available free with no account required.',
  },
  {
    q: 'How do I track brand citations in AI search?',
    a: 'Provenance\'s Citation Analytics feature monitors a comprehensive set of prompts across ChatGPT, Gemini, Perplexity, Claude, and Bing Chat — tracking when and how your brand is cited in AI-generated answers. You receive daily reports, trend charts, and competitor benchmarking.',
  },
];

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
};

export default function FaqAccordion() {
  return (
    <>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {FAQS.map(({ q, a }, i) => (
          <AccordionItem
            key={i}
            value={`faq-${i}`}
            className="border border-border bg-card px-6"
          >
            <AccordionTrigger className="text-white font-medium text-left hover:no-underline py-5">
              {q}
            </AccordionTrigger>
            <AccordionContent className="text-gray-400 text-sm leading-relaxed pb-5">
              {a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
```

---

## Task 9: Create PricingCards component

**Files:**
- Create: `components/landing/PricingCards.js`

- [ ] Create file with:

```js
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TIERS = [
  {
    name: 'Free',
    price: '$0',
    tagline: 'Get started at no cost',
    features: [
      'GEO Checker — instant brand score',
      'Basic site audit (50 checks)',
      '1 site',
      'Weekly AI visibility snapshot',
    ],
    cta: 'Start for Free',
    href: '/signup',
    variant: 'outline',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/mo',
    tagline: 'The full SEO + AEO + GEO suite',
    features: [
      'Full site audit — 638 checks',
      'Rank Tracker — 190 countries',
      'Citation Analytics dashboard',
      'AI Overview Tracker',
      'Unlimited sites',
      'Daily AI visibility reports',
    ],
    cta: 'Start Free Trial',
    href: '/signup',
    variant: 'default',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    tagline: 'Built for teams and agencies',
    features: [
      'Everything in Pro',
      'White label — resell under your brand',
      'Custom prompts & AI configuration',
      'SLA + dedicated support',
      'SSO & team management',
      'Book a demo to get a quote',
    ],
    cta: 'Book a Demo',
    href: '/landing/contact',
    variant: 'outline',
    highlight: false,
  },
];

export default function PricingCards() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {TIERS.map(({ name, price, period, tagline, features, cta, href, variant, highlight }) => (
        <div
          key={name}
          className={`flex flex-col p-8 border ${highlight ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
        >
          {highlight && (
            <div className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
              ◆ Most Popular
            </div>
          )}
          <div className="mb-6">
            <div className="text-sm font-medium text-muted-foreground mb-1">{name}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-white">{price}</span>
              {period && <span className="text-muted-foreground text-sm">{period}</span>}
            </div>
            <div className="text-sm text-gray-400 mt-1">{tagline}</div>
          </div>
          <ul className="space-y-3 mb-8 flex-1">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-gray-300">
                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
          <Link href={href}>
            <Button
              variant={variant}
              className={`w-full h-11 font-semibold ${highlight ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border-border text-white hover:bg-white/5'}`}
            >
              {cta}
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
```

---

## Task 10: Rewrite app/landing/page.js

**Files:**
- Rewrite: `app/landing/page.js`

- [ ] Replace entire file with:

```js
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HeroTicker from '@/components/landing/HeroTicker';
import PainCards from '@/components/landing/PainCards';
import TriadCards from '@/components/landing/TriadCards';
import FeatureGrid from '@/components/landing/FeatureGrid';
import StepsFlow from '@/components/landing/StepsFlow';
import StatBar from '@/components/landing/StatBar';
import FaqAccordion from '@/components/landing/FaqAccordion';
import PricingCards from '@/components/landing/PricingCards';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">

      {/* ── Section 1: Hero ── */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/15 via-background to-background" />
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 border border-primary/20 mb-8">
            <span className="text-primary text-sm font-semibold">◆ The SEO + AEO + GEO Platform</span>
          </div>
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-8 text-white">
            Your brand is invisible<br className="hidden sm:block" /> to ChatGPT.{' '}
            <span className="text-primary">Let&apos;s fix that.</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Provenance gives you the AI search visibility tools to monitor, measure, and grow your
            brand&apos;s presence across ChatGPT, Gemini, Perplexity, and Google AI Overviews —
            before your competitors do.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-8 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground w-full sm:w-auto">
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="#features">
              <Button size="lg" variant="outline" className="h-14 px-8 text-base font-semibold border-border text-white hover:bg-white/5 w-full sm:w-auto">
                Explore Features
              </Button>
            </Link>
          </div>
          <HeroTicker />
        </div>
      </section>

      {/* ── Section 2: Problem Agitation ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              ◆ The New Search Reality
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Traditional SEO is no longer enough.
            </h2>
            <p className="text-gray-400 max-w-2xl">
              AI engines are replacing ten blue links. Your organic traffic is shrinking while your
              competitors&apos; brands get cited in AI-generated answers. The companies that adapt
              now will own the next decade of search.
            </p>
          </div>
          <PainCards />
        </div>
      </section>

      {/* ── Section 3: Solution Triad ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              ◆ The Provenance Platform
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              One platform. Three disciplines. Total AI search visibility.
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Monitor your rankings, optimize your content for AI answers, and track your brand
              across every generative engine — all in one place.
            </p>
          </div>
          <TriadCards />
        </div>
      </section>

      {/* ── Section 4: Feature Showcase ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              ◆ Tools &amp; Features
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Every tool your brand needs to dominate AI search.
            </h2>
            <p className="text-gray-400 max-w-2xl">
              From a free GEO Checker to a full citation analytics dashboard — everything you need
              to monitor, measure, and grow your AI search visibility.
            </p>
          </div>
          <FeatureGrid />
        </div>
      </section>

      {/* ── Section 5: How It Works ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              ◆ How It Works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              From invisible to cited — in 3 steps.
            </h2>
          </div>
          <StepsFlow />
        </div>
      </section>

      {/* ── Section 6: Stats & Social Proof ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              ◆ By the Numbers
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Trusted by marketing and SEO teams who take AI search seriously.
            </h2>
          </div>
          <StatBar />
        </div>
      </section>

      {/* ── Section 7: FAQ ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              ◆ Frequently Asked Questions
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to know about AI search visibility.
            </h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Section 8: Pricing Preview ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/30 border-y border-border">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">
              ◆ Simple Pricing
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Start free. Scale when you&apos;re ready.
            </h2>
            <p className="text-gray-400">No credit card required for the free plan or 14-day Pro trial.</p>
          </div>
          <PricingCards />
        </div>
      </section>

      {/* ── Section 9: Final CTA ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden border-t border-border">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/5" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Your competitors are already optimizing for AI search.
          </h2>
          <p className="text-xl text-gray-400 mb-10 leading-relaxed">
            Join the marketing teams using Provenance to monitor their brand visibility, track AI
            citations, and dominate generative search — before it&apos;s too late.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 text-base font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/landing/contact">
              <Button size="lg" variant="outline" className="h-14 px-10 text-base font-semibold border-border text-white hover:bg-white/5">
                Book a Demo
              </Button>
            </Link>
          </div>
          <p className="text-sm text-muted-foreground mt-6">
            No credit card required · 14-day free trial · Cancel anytime
          </p>
        </div>
      </section>

    </div>
  );
}
```

---

## Tasks 11–16: Update Feature Pages

Each feature page update follows the same pattern: update H1, subheadline, feature list items, and stat cards with intelligence vocabulary. No structural redesign of these pages — content/copy only.

### Task 11: seo-audit/page.js — key copy updates
- H1: "Site Audit, Rank Tracker & Content Gap Analysis"  
- Sub: "Run 638 technical SEO checks in minutes. Track keyword rankings across 190 countries. Find the content gaps your competitors are exploiting — and fix them before AI engines do."
- Feature bullets: add "Content Gap Analysis", "Keyword Research & Explorer", "Backlink Analysis", "Broken Link Checker", "Organic Traffic Monitoring"
- Stat cards: 638 checks, 190 countries, content gap analysis, organic traffic

### Task 12: aeo-audit/page.js — key copy updates
- H1: "Answer Engine Optimization — Get Cited by ChatGPT & Gemini"
- Sub: "AEO is the new SEO. Optimize your content so ChatGPT, Gemini, Perplexity, and Claude cite your brand when users ask conversational questions. Measure citation likelihood with Citation Analytics."
- Feature bullets: Citation Analytics Dashboard, AI Overview Tracker, Schema Markup Generator, ChatGPT Visibility, Gemini Brand Tracking, AEO vs SEO Comparison
- FAQ section: "What is AEO?", "AEO vs SEO", "How to improve citation likelihood"

### Task 13: geo-audit/page.js — key copy updates
- H1: "GEO Checker — Measure Your Brand's Generative Engine Optimization Score"
- Sub: "GEO is the discipline of optimizing your brand presence in Google AI Overviews, Google AI Mode, and Bing Chat. The GEO Checker gives you an instant brand visibility score — free, no account required."
- Feature bullets: GEO Checker (free), AI Overview Tracker, AI Mode Tracker, Zero-Click Analytics, Pixel Share Analysis, Perplexity Visibility

### Task 14: brand-visibility/page.js — key copy updates
- H1: "Brand Visibility in AI Search — Monitor Your AI Citations"
- Sub: "Track your brand visibility score across ChatGPT, Gemini, Perplexity, Claude, and Google AI Overviews. Know when AI engines mention you, how often, and how you compare to competitors."
- Feature bullets: AI Brand Mentions Dashboard, Brand Citations Over Time, Competitor Brand Monitoring, AI Visibility Score, Brand Radar

### Task 15: site-health/page.js — key copy updates
- H1: "Site Health — Core Web Vitals, Performance & Security"
- Sub: "A healthy site is a prerequisite for AI search visibility. Monitor Core Web Vitals, identify performance bottlenecks, and run continuous security scans — all from one dashboard."
- Feature bullets: Core Web Vitals Monitoring, Performance Score, Security Vulnerability Scanner, CI/CD Pipeline Integration, OWASP Top 10 Checks

### Task 16: security-scanner/page.js — key copy updates
- H1: "Continuous Security Scanner — Zero False Positives"
- Sub: "Before you can optimize your AI search visibility, your platform must be secure. Provenance automates continuous pentesting directly into your CI/CD pipeline — finding critical vulnerabilities before they reach production."
- Feature bullets: OWASP Top 10 Scans, CI/CD Integration (GitHub/GitLab), SOC2 / ISO 27001 Reporting, Zero False Positives, Automated Remediation Guidance
