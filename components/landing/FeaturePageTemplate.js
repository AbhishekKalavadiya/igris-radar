'use client';

import Link from 'next/link';
import { CheckCircle2, ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, Stagger, MotionItem, AnimatedNumber } from '@/components/ui/motion';
import { HOW_IT_WORKS, SHOW_AUTH_CTAS } from '@/lib/landingContent';
import FeatureFaqAccordion from '@/components/landing/FeatureFaqAccordion';

/**
 * Long-form feature page rendered from a FEATURE_PAGES config object.
 * Structure mirrors modern SaaS feature pages: hero → stats → capability
 * deep-dives → report contents → how it works → FAQ (with JSON-LD) → CTA.
 */
export default function FeaturePageTemplate({ config }) {
  const Icon = config.icon;

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{
            background:
              'radial-gradient(ellipse 60% 50% at 50% -10%, hsl(var(--accent)) 0%, transparent 70%)',
          }}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center relative">
          <Reveal>
            <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${config.accentBorder} ${config.accentBgSoft} mb-6`}>
              <Icon className={`h-4 w-4 ${config.accentText}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${config.accentText}`}>{config.eyebrow}</span>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.08]">
              {config.h1}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              {config.sub}
            </p>
          </Reveal>
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
              {config.heroBullets.map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 text-success" /> {b}
                </span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Stats band */}
      <section className="border-y border-border bg-muted/40">
        <Stagger className="max-w-5xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
          {config.stats.map((s) => (
            <MotionItem key={s.label} className="text-center">
              <div className={`text-4xl font-bold tabular-nums ${config.accentText}`}>
                <AnimatedNumber value={s.value} />{s.suffix}
              </div>
              <p className="text-sm text-muted-foreground mt-2">{s.label}</p>
            </MotionItem>
          ))}
        </Stagger>
      </section>

      {/* Capability deep-dives */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20 space-y-20">
        <Reveal className="text-center max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What this audit actually checks</h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Every check below runs on every scan. No black boxes: this is the exact coverage you get.
          </p>
        </Reveal>

        {/* Coverage summary table */}
        <Reveal className="max-w-3xl mx-auto">
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Category</th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Checks</th>
                </tr>
              </thead>
              <tbody>
                {config.categories.map((cat) => (
                  <tr key={cat.title} className="border-b border-border last:border-0">
                    <th scope="row" className="px-5 py-3.5 font-semibold">{cat.title}</th>
                    <td className={`px-5 py-3.5 text-right font-mono font-bold ${config.accentText}`}>{cat.checks.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {config.categories.map((cat, i) => (
          <div key={cat.title} className={`grid lg:grid-cols-5 gap-10 items-start ${i % 2 === 1 ? 'lg:[direction:rtl]' : ''}`}>
            <Reveal className="lg:col-span-2 [direction:ltr]">
              <div className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${config.accentBgSoft} ${config.accentText} mb-4`}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <h3 className="text-2xl font-bold tracking-tight">{cat.title}</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">{cat.blurb}</p>
            </Reveal>
            <Stagger className="lg:col-span-3 grid sm:grid-cols-2 gap-3 [direction:ltr]">
              {cat.checks.map((check) => (
                <MotionItem key={check.name}>
                  <div className="h-full rounded-xl border border-border bg-card p-4 hover:shadow-md hover:border-primary/25 transition-all duration-300">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-4 w-4 shrink-0 ${config.accentText}`} />
                      <h4 className="text-sm font-semibold">{check.name}</h4>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{check.detail}</p>
                  </div>
                </MotionItem>
              ))}
            </Stagger>
          </div>
        ))}
      </section>

      {/* What's in the report */}
      <section className="bg-muted/40 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <Reveal>
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${config.accentBgSoft} mb-5`}>
              <FileText className={`h-3.5 w-3.5 ${config.accentText}`} />
              <span className={`text-xs font-semibold uppercase tracking-wider ${config.accentText}`}>The report</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Everything your team needs to act</h2>
            <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
              A score without a fix list is trivia. Every report pairs measurement with prioritized,
              copy-ready remediation, including AI-native fix prompts for your coding assistant.
            </p>
          </Reveal>
          <Stagger className="space-y-4">
            {config.reportPoints.map((point) => (
              <MotionItem key={point}>
                <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                  <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{point}</p>
                </div>
              </MotionItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <Reveal className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">From URL to fix list in three steps</h2>
        </Reveal>
        <Stagger className="grid md:grid-cols-3 gap-6">
          {HOW_IT_WORKS.map((step) => (
            <MotionItem key={step.step}>
              <div className="h-full rounded-xl border border-border bg-card p-6">
                <div className={`text-sm font-mono font-bold ${config.accentText}`}>{step.step}</div>
                <h3 className="text-lg font-bold mt-3">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.text}</p>
              </div>
            </MotionItem>
          ))}
        </Stagger>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
        <Reveal className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Frequently asked questions</h2>
        </Reveal>
        <Reveal>
          <FeatureFaqAccordion faqs={config.faqs} />
        </Reveal>
      </section>

      {/* Sources & further reading */}
      {config.references?.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20">
          <Reveal>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Sources &amp; further reading
            </h2>
            <ul className="space-y-2.5">
              {config.references.map((ref) => (
                <li key={ref.href} className="text-sm text-muted-foreground">
                  <cite className="not-italic">
                    <a
                      href={ref.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-primary/40 underline-offset-2 hover:text-foreground transition-colors"
                    >
                      {ref.label}
                    </a>
                  </cite>
                  <span className="ml-2 text-xs text-muted-foreground/70">— {ref.source}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </section>
      )}

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-2xl bg-primary text-primary-foreground px-8 py-16 text-center">
            <div
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{ background: 'radial-gradient(ellipse 70% 80% at 50% 120%, rgba(255,255,255,0.35), transparent)' }}
            />
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight relative">{config.ctaTitle}</h2>
            <p className="mt-3 text-primary-foreground/85 text-lg relative">{config.ctaSub}</p>
            {SHOW_AUTH_CTAS && (
              <div className="mt-8 relative">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" className="h-12 px-8 text-base font-semibold">
                    Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
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
