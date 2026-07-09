import Link from 'next/link';
import { Target, Compass, Wrench, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buildMetadata, breadcrumbJsonLd, FOUNDER } from '@/lib/seo';
import { SHOW_AUTH_CTAS } from '@/lib/landingContent';
import JsonLd from '@/components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'About Igris Radar: The AI Search Visibility Platform',
  description:
    'Igris Radar exists because search changed: AI assistants now answer directly, and brands need to measure whether they get cited. Learn what we build and why.',
  path: '/landing/about',
});

const PRINCIPLES = [
  {
    icon: Compass,
    title: 'Measure what actually matters now',
    text: 'Rankings still matter, but citations decide the AI-era winner. We build audits for both worlds: the SEO fundamentals search engines reward, and the AEO and GEO signals answer engines rely on when choosing whom to cite.',
  },
  {
    icon: Target,
    title: 'No black boxes',
    text: 'Every score we produce decomposes into named, documented checks. Our feature pages list exactly what each audit inspects, because a score you can\'t interrogate is a score you can\'t improve.',
  },
  {
    icon: Wrench,
    title: 'Findings must end in fixes',
    text: 'An audit that produces a PDF and a shrug is theater. Every failed check ships with plain-language remediation and an agent-native fix prompt your AI coding assistant can act on immediately.',
  },
];

export default function AboutPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'About', path: '/landing/about' },
      ])} />
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-60"
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% -10%, hsl(var(--accent)) 0%, transparent 70%)' }}
        />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center relative">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/25 bg-primary/5 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            About Igris Radar
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            Search changed. Your measurement should too.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
            For twenty years, visibility meant ranking on a results page. Now millions of people ask
            ChatGPT, Claude, Perplexity, and Gemini instead, and those assistants answer directly,
            citing the sources they trust. Igris Radar is the platform for measuring, and winning,
            that new kind of visibility.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="border-y border-border bg-muted/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Why we built this</h2>
          <div className="mt-6 space-y-5 text-muted-foreground leading-relaxed">
            <p>
              Teams kept asking the same three questions with no good tooling to answer them:
              <em className="not-italic font-medium text-foreground"> Can AI engines even read our site? Would they trust it enough to cite?
              And when customers ask for recommendations, do we come up?</em>
            </p>
            <p>
              Answering those questions properly requires very different machinery: robots-directive
              analysis for AI crawlers, content-structure heuristics for answer extraction,
              entity-authority scoring for trust, and live queries against the actual engines for
              ground truth. It also requires the unglamorous fundamentals of security headers,
              Core Web Vitals, and structured data, because AI engines inherit their trust signals
              from the same foundations search engines built on.
            </p>
            <p>
              So we built all of it as one platform: six audit engines that share a common language
              of scores, severities, and fix prompts. Run any audit from a single URL and get an
              answer your whole team can act on the same day.
            </p>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-center mb-12">How we work</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {PRINCIPLES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-xl border border-border bg-card p-7">
              <div className="inline-flex p-2.5 rounded-lg bg-primary/10 mb-4">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-bold">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Founder */}
      <section className="border-y border-border bg-muted/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">About the author</h2>
          <div className="mt-6 flex items-start gap-5">
            <div className="h-14 w-14 shrink-0 rounded-pill bg-primary/10 border border-primary/25 flex items-center justify-center">
              <span className="text-primary font-bold text-xl">{FOUNDER.name[0]}</span>
            </div>
            <div>
              <p className="font-bold text-lg">
                {FOUNDER.name}
                <span className="ml-2 text-xs font-semibold uppercase tracking-wider text-primary">{FOUNDER.title}</span>
              </p>
              <p className="mt-2 text-muted-foreground leading-relaxed">{FOUNDER.bio}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">See it for yourself</h2>
        <p className="mt-3 text-muted-foreground text-lg">
          The fastest way to understand Igris Radar is to run your first audit.
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          {SHOW_AUTH_CTAS && (
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-12 px-7">
                Get Started Free <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          )}
          <Link href="/landing/contact">
            <Button size="lg" variant="outline" className="h-12 px-7">Contact us</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
