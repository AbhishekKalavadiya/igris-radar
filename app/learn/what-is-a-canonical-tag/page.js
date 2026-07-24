import Link from 'next/link';
import { ArrowLeft, Link as LinkIcon, SearchCheck, CheckCircle2, AlertTriangle, Code, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, articleJsonLd, breadcrumbJsonLd, faqPageJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'What is a Canonical Tag (rel="canonical")? SEO Guide | Igris Radar',
  description: 'Learn what a canonical tag is, how rel="canonical" prevents duplicate content penalties in Google, canonical tag vs 301 redirects, and Next.js implementation.',
  path: '/learn/what-is-a-canonical-tag',
  keywords: ['canonical tag', 'rel canonical', 'duplicate content SEO', 'canonical URL Next.js', 'technical SEO guide'],
});

const pageTitle = 'What is a Canonical Tag? Complete Technical SEO Guide';
const pageDescription = 'A canonical tag (rel="canonical") is an HTML element that tells search engines which version of a URL is the authoritative master copy, preventing duplicate content indexing.';

const faqs = [
  {
    q: 'What is the difference between a canonical tag and a 301 redirect?',
    a: 'A 301 redirect automatically routes both users and search engines to a new URL. A canonical tag allows users to stay on the original URL (such as URL parameters like ?color=red) while signaling to search engines to consolidate ranking signals to the master URL.',
  },
  {
    q: 'Should every page have a self-referencing canonical tag?',
    a: 'Yes. Google recommends that every indexable page include a self-referencing canonical tag. This prevents tracking parameters (like ?utm_source=twitter) from creating unintended duplicate pages in Google Search.',
  },
  {
    q: 'How do I add canonical tags in Next.js App Router?',
    a: 'In Next.js App Router, export an alternates object in your metadata configuration: export const metadata = { alternates: { canonical: "/your-path" } }.',
  },
];

export default function CanonicalTagPage() {
  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <JsonLd data={articleJsonLd({
        headline: pageTitle,
        description: pageDescription,
        path: '/learn/what-is-a-canonical-tag',
        datePublished: '2026-07-03',
      })} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Knowledge Base', path: '/learn' },
        { name: 'What is a Canonical Tag', path: '/learn/what-is-a-canonical-tag' },
      ])} />
      <JsonLd data={faqPageJsonLd(faqs)} />

      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-8">
        <div className="space-y-4 border-b border-border pb-8">
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold border-primary/20 bg-primary/10 text-primary">
            Technical SEO & Indexation
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
              <LinkIcon className="h-6 w-6 text-primary" />
              How Canonical Tags Work
            </h2>
            <p>
              When search crawlers discover multiple URLs returning identical or near-identical content—such as product filters (<code>example.com/shoes?color=red</code> vs <code>example.com/shoes</code>)—Google must decide which page to display in search results.
            </p>
            <p>
              Without an explicit canonical directive, search engines split ranking metrics (link equity, CTR, and trust) across multiple URLs or mark your pages as duplicate content, which depresses overall domain rankings.
            </p>
            <div className="bg-muted/40 border border-border rounded-lg p-5 font-mono text-sm overflow-x-auto text-foreground">
              <span className="text-muted-foreground">&lt;!-- Place inside the &lt;head&gt; section of your HTML --&gt;</span><br />
              &lt;<span className="text-primary">link</span> rel="<span className="text-emerald-500">canonical</span>" href="<span className="text-amber-500">https://example.com/shoes</span>" /&gt;
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              Canonical Tag vs 301 Redirect: When to Use Which?
            </h2>
            <div className="grid md:grid-cols-2 gap-4 my-4">
              <div className="p-5 border border-border rounded-xl bg-card">
                <h3 className="text-lg font-bold text-foreground mb-2">Use a Canonical Tag when:</h3>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                  <td>Multiple valid URLs exist for legitimate user experience (e.g. sorting, filtering, pagination).</td>
                  <td>You cross-post content on Medium or LinkedIn and want search engines to rank your primary website.</td>
                  <td>You want both URLs accessible to visitors, but consolidated for Google Search.</td>
                </ul>
              </div>
              <div className="p-5 border border-border rounded-xl bg-card">
                <h3 className="text-lg font-bold text-foreground mb-2">Use a 301 Redirect when:</h3>
                <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-4">
                  <td>A page has permanently moved to a new URL structure.</td>
                  <td>You are consolidating HTTP to HTTPS or non-www to www domains.</td>
                  <td>The old URL should no longer be accessible to human users.</td>
                </ul>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <Code className="h-6 w-6 text-primary" />
              Implementing Canonical Tags in Next.js (App Router)
            </h2>
            <p>
              In modern Next.js applications, canonical links are configured directly inside page or layout metadata objects using the <code>alternates</code> key:
            </p>
            <div className="bg-muted/40 border border-border rounded-lg p-5 font-mono text-sm overflow-x-auto text-foreground">
              <span className="text-purple-400">export</span> <span className="text-purple-400">const</span> metadata = &#123;<br />
              &nbsp;&nbsp;title: <span className="text-emerald-400">'My Canonical Page Title'</span>,<br />
              &nbsp;&nbsp;alternates: &#123;<br />
              &nbsp;&nbsp;&nbsp;&nbsp;canonical: <span className="text-amber-400">'/learn/what-is-a-canonical-tag'</span>,<br />
              &nbsp;&nbsp;&#125;,<br />
              &#125;;
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-bold flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Common Canonical Tag Mistakes to Avoid
            </h2>
            <ul className="space-y-3 text-base text-muted-foreground">
              <li className="flex items-start gap-2">
                <strong className="text-foreground">1. Relative URLs:</strong> Always use absolute URLs (e.g. <code>https://example.com/page</code>) rather than relative paths inside raw HTML links to prevent crawl resolution errors.
              </li>
              <li className="flex items-start gap-2">
                <strong className="text-foreground">2. Canonicalizing to a 404 or Redirect:</strong> Points a canonical tag at a URL that returns a 404 error or a redirect loop causes Google to ignore the signal entirely.
              </li>
              <li className="flex items-start gap-2">
                <strong className="text-foreground">3. Conflicting Signals:</strong> Putting <code>noindex</code> tags on a page while canonicalizing it to another master page confuses search algorithms.
              </li>
            </ul>
          </section>

          <Card className="bg-primary/5 border-primary/20 my-8">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-foreground">
                <SearchCheck className="h-5 w-5 text-primary" />
                Audit Missing & Conflicting Canonicals with Igris Radar
              </h3>
              <p className="text-muted-foreground text-sm mb-4">
                Missing or improperly configured canonical tags can quietly bleed ranking authority from your top pages. Igris Radar scans 30+ technical SEO factors—including canonical self-references, redirect chains, and indexability rules—in seconds.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" asChild size="sm">
                  <Link href="/landing/features/seo-audit">Explore SEO Audit Feature</Link>
                </Button>
                <Button variant="outline" asChild size="sm">
                  <Link href="/learn/core-web-vitals-and-ranking-factors">Read Core Web Vitals Guide</Link>
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
