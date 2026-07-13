import Link from 'next/link';
import { ArrowLeft, Gauge, Zap, SearchCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export const metadata = {
  title: 'Core Web Vitals & Technical SEO | Igris Radar Knowledge Base',
  description: 'Learn what Core Web Vitals are and how site speed and technical performance directly impact your search engine rankings.',
  alternates: {
    canonical: '/learn/core-web-vitals-and-ranking-factors',
  },
};

export default function CoreWebVitalsPage() {
  return (
    <article className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Knowledge Base
      </Link>

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-orange-500/10 text-orange-600 hover:bg-orange-500/20">
            Technical SEO
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight lg:text-6xl text-foreground">
            Core Web Vitals
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Google uses real-world user data to measure how fast and smooth your website is. If you fail these tests, your rankings will suffer.
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none space-y-6 text-base md:text-lg text-foreground/90 leading-relaxed pt-8">
          
          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Gauge className="h-5 w-5 text-orange-500" />
              The Big Three Metrics
            </h2>
            <p>
              Core Web Vitals boil down to three specific measurements of user experience:
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>LCP (Largest Contentful Paint):</strong> Loading speed. How long it takes for the largest image or text block to become visible.</li>
              <li><strong>FID / INP (Interaction to Next Paint):</strong> Interactivity. How quickly the page responds when a user clicks a button.</li>
              <li><strong>CLS (Cumulative Layout Shift):</strong> Visual stability. Does the page content jump around as images load?</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2 flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              Why It Matters
            </h2>
            <p>
              Search engines want to send users to sites that provide a good experience. Even if your content is perfect, a slow, jumpy site will be outranked by a faster competitor.
            </p>
          </section>

          <Card className="bg-orange-500/5 border-orange-500/20 my-6">
            <CardContent className="p-5">
              <h3 className="text-md font-bold mb-2 flex items-center gap-2">
                <SearchCheck className="h-4 w-4 text-orange-500" />
                Audit Performance with Igris Radar
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                The Igris Radar Technical Scanner simulates Lighthouse audits continuously, alerting you the moment a code change hurts your Core Web Vitals.
              </p>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white" asChild size="sm">
                <Link href="/">Run Performance Scan</Link>
              </Button>
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-xl font-bold border-b pb-2">How to Fix It</h2>
            <ol className="list-decimal pl-6 space-y-1">
              <li><strong>Optimize Images:</strong> Compress and serve images in modern formats like WebP.</li>
              <li><strong>Minimize JavaScript:</strong> Defer non-critical scripts so the main content loads first.</li>
              <li><strong>Set Dimensions:</strong> Always specify width and height on images to prevent layout shifts (CLS).</li>
            </ol>
          </section>

        </div>
      </div>
    </article>
  );
}
