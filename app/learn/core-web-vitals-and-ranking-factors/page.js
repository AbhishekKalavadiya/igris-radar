import Link from 'next/link';
import { ArrowLeft, Gauge, Zap, SearchCheck, CheckCircle2, Clock, Layers, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Core Web Vitals Guide (LCP, INP, CLS) & Ranking Factors | Igris Radar',
  description: 'Understand Google Core Web Vitals (LCP, INP, CLS), how page speed directly impacts Google rankings, and step-by-step optimization techniques.',
  path: '/learn/core-web-vitals-and-ranking-factors',
  keywords: ['Core Web Vitals', 'LCP', 'INP', 'CLS', 'Google PageSpeed ranking factor', 'site speed optimization'],
});

const pageTitle = 'Core Web Vitals (LCP, INP, CLS) & Search Ranking Factors';
const pageDescription = 'Core Web Vitals are Google confirmed ranking signals that measure loading performance (LCP), interactivity (INP), and visual stability (CLS).';

const faqs = [
  {
    q: 'What are the target thresholds for Google Core Web Vitals in 2026?',
    a: 'Google targets: LCP (Largest Contentful Paint) under 2.5s, INP (Interaction to Next Paint) under 200ms, and CLS (Cumulative Layout Shift) under 0.1.',
  },
  {
    q: 'Does passing Core Web Vitals guarantee Page 1 rankings?',
    a: 'No single metric guarantees Page 1 rankings. Core Web Vitals act as a tie-breaker signal: if two sites have equal content relevance, Google ranks the faster, visually stable site higher.',
  },
  {
    q: 'How often does Google update Core Web Vitals field data?',
    a: 'Google CrUX (Chrome User Experience Report) updates on a 28-day rolling window based on real Chrome user data.',
  },
];

export default function CoreWebVitalsPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <JsonLd data={articleJsonLd({
        headline: pageTitle,
        description: pageDescription,
        path: '/learn/core-web-vitals-and-ranking-factors',
        datePublished: '2026-07-03',
      })} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Knowledge Base', path: '/learn' },
        { name: 'Core Web Vitals Guide', path: '/learn/core-web-vitals-and-ranking-factors' },
      ])} />
      <JsonLd data={faqPageJsonLd(faqs)} />

      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-8">
        <div className="space-y-4 border-b border-border pb-8">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold border-primary/20 bg-primary/10 text-primary">
            Google Page Experience Signal
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground">
            {pageTitle}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {pageDescription}
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-8 text-base md:text-lg text-foreground/90 leading-relaxed">
          
          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Gauge className="h-6 w-6 text-primary" />
              The Core Web Vitals Metrics Breakdown
            </h2>
            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="p-5 border border-border rounded-xl bg-card">
                <div className="flex items-center gap-2 font-bold text-lg text-foreground mb-2">
                  <Clock className="h-5 w-5 text-emerald-500" /> LCP
                </div>
                <p className="text-sm font-semibold text-emerald-500 mb-2">Good: &le; 2.5 seconds</p>
                <p className="text-xs text-muted-foreground">
                  Largest Contentful Paint measures perceived loading speed—when the main hero image or article body renders on mobile.
                </p>
              </div>
              <div className="p-5 border border-border rounded-xl bg-card">
                <div className="flex items-center gap-2 font-bold text-lg text-foreground mb-2">
                  <Zap className="h-5 w-5 text-amber-500" /> INP
                </div>
                <p className="text-sm font-semibold text-amber-500 mb-2">Good: &le; 200 milliseconds</p>
                <p className="text-xs text-muted-foreground">
                  Interaction to Next Paint measures overall page responsiveness when users tap, click, or press keys on your site.
                </p>
              </div>
              <div className="p-5 border border-border rounded-xl bg-card">
                <div className="flex items-center gap-2 font-bold text-lg text-foreground mb-2">
                  <Layers className="h-5 w-5 text-blue-500" /> CLS
                </div>
                <p className="text-sm font-semibold text-blue-500 mb-2">Good: &le; 0.1 score</p>
                <p className="text-xs text-muted-foreground">
                  Cumulative Layout Shift measures visual stability—preventing accidental clicks caused by late-loading ads or un-sized images.
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              How Core Web Vitals Impact Search Rankings & Conversions
            </h2>
            <p>
              Google integrated Page Experience metrics directly into its ranking system. If two competing pages provide similar content quality, Google's algorithm prioritizes the URL offering superior Core Web Vitals.
            </p>
            <p>
              Beyond SEO rankings, mobile conversion research shows that improving LCP by 1 second increases conversions by up to 27%, while eliminating CLS drops bounce rates significantly.
            </p>
          </section>

          <Card className="bg-primary/5 border-primary/20 my-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-foreground">
                <SearchCheck className="h-5 w-5 text-primary" />
                Monitor Core Web Vitals Continuously with Igris Radar
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Igris Radar connects directly to Google PageSpeed Insights and CrUX APIs to measure LCP, INP, FCP, and CLS across both desktop and mobile viewports automatically.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild size="sm">
                  <Link href="/landing/features/site-health">Explore Site Health Audits</Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href="/learn/what-is-a-canonical-tag">Read Canonical Tag Guide</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <section className="space-y-4 border-t border-border pt-8">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <HelpCircle className="h-6 w-6 text-primary" />
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqs.map((faq, idx) => (
                <div key={idx} className="p-4 border border-border rounded-lg bg-card/50">
                  <h3 className="font-bold text-foreground mb-1">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>

        </div>
      </div>
    </article>
  );
}
