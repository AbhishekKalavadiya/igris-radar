import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'How to make your site show up in Perplexity and AI Overviews | Igris Radar',
  description: 'The strategies and technical changes you need to get your content sourced in Perplexity AI and Google AI Overviews.',
};

export default function BlogPost() {
  return (
    <div className="pb-24">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' }, 
        { name: 'Blog', path: '/landing/blog' },
        { name: 'How to make your site show up in Perplexity / AI Overviews', path: '/landing/blog/how-to-show-up-in-perplexity-ai-overviews' }
      ])} />

      <section className="border-b border-border bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <Link href="/landing/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <BookOpen className="h-3.5 w-3.5" /> Tutorial
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            How to make your site show up in Perplexity / AI Overviews
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mt-8">
            <span>June 28, 2026</span>
            <span>•</span>
            <span>6 min read</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-lg text-foreground/90 leading-relaxed space-y-8">
        <p className="lead text-xl text-muted-foreground font-medium">
          Getting cited by Perplexity AI or featured in Google's AI Overviews is basically the modern equivalent of hitting the front page of Google. These engines actively scour the web, piece together answers, and drop footnote citations directly to the sources. And those citations? They drive some of the most qualified, high-intent traffic you'll ever see.
        </p>

        <p>
          But just crossing your fingers and hoping they find you isn't a strategy. Showing up in these generative responses requires making a few specific, measurable technical tweaks to your site. Here is the exact playbook you need to get your content sourced.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">1. Unblock the Crawlers (The Absolute Baseline)</h2>
        
        <p>
          Perplexity does not hallucinate answers from static training data; it crawls the live web. If your <code>robots.txt</code> file blocks <code>PerplexityBot</code>, you simply will not appear in its answers. The same goes for Google's AI Overviews, which rely heavily on <code>Googlebot</code> and the <code>Google-Extended</code> directives.
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-6">
          <h3 className="font-bold text-foreground m-0 mb-4">Igris Radar Data: The "Accidental Block" Epidemic</h3>
          <p className="text-muted-foreground text-base mb-4">In our latest scan of 1,000 tech startups, we found that a massive percentage were accidentally erasing themselves from AI search because of overly aggressive default WAF (Web Application Firewall) settings:</p>
          <ul className="space-y-2 text-base font-medium">
            <li className="flex items-center justify-between border-b border-border pb-2">
              <span>Blocking `GPTBot` (OpenAI / ChatGPT)</span>
              <span className="text-destructive">41%</span>
            </li>
            <li className="flex items-center justify-between border-b border-border pb-2">
              <span>Blocking `PerplexityBot`</span>
              <span className="text-destructive">38%</span>
            </li>
            <li className="flex items-center justify-between pb-1">
              <span>Blocking `ClaudeBot` (Anthropic)</span>
              <span className="text-destructive">44%</span>
            </li>
          </ul>
        </div>
        
        <p>
          <strong>Action item:</strong> Audit your <code>robots.txt</code> immediately. Ensure that <code>PerplexityBot</code>, <code>Google-Extended</code>, <code>GPTBot</code>, and <code>ClaudeBot</code> are explicitly allowed to crawl your informational content.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">2. Format for Extraction (Answer-Shaped Content)</h2>

        <p>
          AI models are text parsers. They struggle to extract a concise answer from a sprawling, 500-word paragraph that weaves personal anecdotes with hard facts. To get cited, you must structure your content the way an LLM expects to read it.
        </p>

        <ul className="list-disc pl-6 space-y-4 mt-4">
          <li>
            <strong>The Q&A Format:</strong> Use H2 and H3 tags that directly match user prompts (e.g., <em>"What is the pricing for X?"</em> instead of just <em>"Pricing"</em>). 
          </li>
          <li>
            <strong>The Target Paragraph:</strong> Immediately following that heading, provide a 40-to-60 word definitive answer. Do not hedge. State the facts clearly. This is the snippet the AI will lift and cite.
          </li>
          <li>
            <strong>Semantic HTML Tables:</strong> Generative engines love comparisons. If you are comparing your tool to a competitor, do not just write a paragraph about it. Put the comparison in a clean <code>&lt;table&gt;</code> element. Models parse tables flawlessly.
          </li>
        </ul>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">3. Maximize Factual Density and Freshness</h2>

        <p>
          Perplexity's core value proposition is accuracy and up-to-date information. If your content is stale, or if it consists mostly of opinion without supporting facts, the engine will bypass you for a more concrete source.
        </p>

        <ul className="list-disc pl-6 space-y-4 mt-4">
          <li>
            <strong>Date everything:</strong> Ensure your articles have clear published and "last modified" dates visible on the page and in the schema (<code>dateModified</code>). Perplexity explicitly filters for recent content on time-sensitive queries.
          </li>
          <li>
            <strong>Inject statistics:</strong> Support your claims with numbers. (e.g., instead of saying "Many users prefer our tool," say "Over 45,000 agencies switched to our tool in 2026").
          </li>
          <li>
            <strong>Use inline citations:</strong> Like Wikipedia, cite your own sources. When an LLM sees that a page references authoritative outbound links (.edu, .gov, or major publications), it assigns a higher trust score to that page.
          </li>
        </ul>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">4. Establish Entity Authority (E-E-A-T)</h2>

        <p>
          Google's AI Overviews rely heavily on the Knowledge Graph. If Google doesn't know <em>who</em> you are, it won't trust you enough to generate an overview based on your content.
        </p>
        <p>
          You must establish your brand and authors as distinct entities:
        </p>
        
        <div className="p-6 bg-muted/30 border border-border rounded-xl my-6 font-mono text-sm">
          <p className="text-muted-foreground mb-2">// Implement robust JSON-LD Schema:</p>
          <ul className="space-y-1">
            <li>- Use <strong>Organization</strong> schema with an @id property.</li>
            <li>- Use <strong>Person</strong> schema for your authors, linking to their LinkedIn or verified social profiles.</li>
            <li>- Include <strong>sameAs</strong> links in your schema to tie your website to your official social channels.</li>
          </ul>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">Audit Your Readiness</h2>

        <p>
          You don't have to guess if your site is ready for AI Overviews and Perplexity. Igris Radar's <strong>AEO (Answer Engine Optimization)</strong> and <strong>GEO (Generative Engine Optimization)</strong> audits measure these exact signals.
        </p>
        
        <p>
          We check your robots.txt against 8 different AI crawlers, validate your JSON-LD for entity completeness, and score your factual density and heading structure.
        </p>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/landing/features/geo-audit" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
            See how Igris Radar scores your GEO signals
          </Link>
        </div>
      </article>
    </div>
  );
}
