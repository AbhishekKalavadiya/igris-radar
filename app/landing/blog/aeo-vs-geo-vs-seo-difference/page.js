import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: "AEO vs GEO vs SEO, what's the difference? | Igris Radar",
  description: 'SEO earns rankings, AEO earns the extracted answer, and GEO earns the citation. We break down the differences and signals for each.',
};

export default function BlogPost() {
  return (
    <div className="pb-24">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' }, 
        { name: 'Blog', path: '/landing/blog' },
        { name: "AEO vs GEO vs SEO, what's the difference", path: '/landing/blog/aeo-vs-geo-vs-seo-difference' }
      ])} />

      <section className="border-b border-border bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <Link href="/landing/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <BookOpen className="h-3.5 w-3.5" /> Strategy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            AEO vs GEO vs SEO, what's the difference?
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mt-8">
            <span>July 5, 2026</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-lg text-foreground/90 leading-relaxed space-y-8">
        <p className="lead text-xl text-muted-foreground font-medium">
          The landscape of organic discovery has totally fractured. Ten years ago, Search Engine Optimization (SEO) was the only acronym you really needed to care about. Throw up some keywords, build some links, and you were good. Today, with AI assistants intercepting billions of queries, two new disciplines have crashed the party: Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).
        </p>

        <p>
          So what do these buzzwords actually mean, and how do they differ? More importantly, which one should your marketing team actually be prioritizing right now?
        </p>
        
        <p>
          The short answer: <strong>SEO earns rankings, AEO earns the extracted answer, and GEO earns the citation.</strong> They reward different signals, and you need to audit all three.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">1. SEO: Search Engine Optimization</h2>
        
        <p>
          SEO is the foundation. It is the practice of optimizing your website so that traditional search engines (Google, Bing) can crawl, index, and rank your pages in a list of organic results.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>Optimizes for:</strong> Ranking highest on traditional Search Engine Results Pages (SERPs).</li>
          <li><strong>Where you win:</strong> Google Search, Bing Search.</li>
          <li><strong>Core signals:</strong> Crawlability (sitemaps, canonical tags), on-page keywords (title tags, H1s), Core Web Vitals, and backlink authority.</li>
          <li><strong>Success metric:</strong> Higher organic rankings and click-through rates.</li>
        </ul>
        <p className="mt-4">
          If your technical SEO is broken, like if your server is too slow or your meta robots tags block indexation, you fail the baseline test. Neither AEO nor GEO matters if the crawler can't parse your HTML.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">2. AEO: Answer Engine Optimization</h2>

        <p>
          AEO is the next layer. It focuses on structuring your content so that AI crawlers can extract precise answers. When a user asks an AI assistant a question, the assistant does not return a list of links; it returns a synthesized paragraph. AEO ensures your content is the raw material used to generate that paragraph.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>Optimizes for:</strong> Being the extracted answer.</li>
          <li><strong>Where you win:</strong> ChatGPT, Perplexity, Claude.</li>
          <li><strong>Core signals:</strong> AI crawler access (allowing <code>GPTBot</code>, <code>ClaudeBot</code>), answer-shaped content formatting (Q&A blocks, definition paragraphs), and the presence of <code>llms.txt</code>.</li>
          <li><strong>Success metric:</strong> Answer inclusion. Your content forms the basis of the AI's response.</li>
        </ul>
        <p className="mt-4">
          AEO requires a shift in copywriting. Walls of beautifully written prose are often ignored by LLMs because they are hard to extract. Concise, 50-word definition blocks, structured data tables, and bulleted lists are what an LLM grabs first.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">3. GEO: Generative Engine Optimization</h2>

        <p>
          GEO goes beyond extraction; it is about <em>trust and authority</em>. GEO measures whether generative engines see your site as a trustworthy entity worth citing. It is the AI equivalent of off-page SEO, but instead of counting backlinks, the engine is evaluating your entity footprint.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>Optimizes for:</strong> Being the cited authority.</li>
          <li><strong>Where you win:</strong> Google AI Overviews, Perplexity citations, generative recommendations.</li>
          <li><strong>Core signals:</strong> Entity authority (Knowledge Graph identifiers, Author schema), factual density (statistics, inline citations), and unique value propositions.</li>
          <li><strong>Success metric:</strong> Brand mentions and explicit footnote citations.</li>
        </ul>
        <p className="mt-4">
          An LLM might use your content (AEO), but if it doesn't trust you as an entity, it won't cite you (GEO). GEO requires you to explicitly connect your brand to verifiable trust signals: verifiable addresses, clearly identified authors with expertise, and structured schema that disambiguates your brand from others.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">How to balance the three</h2>

        <p>
          The mistake most companies make is treating these as mutually exclusive. They aren't. They are a hierarchy.
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-6">
          <p className="font-semibold text-foreground m-0">The Hierarchy of Visibility:</p>
          <ol className="list-decimal pl-5 mt-2 space-y-1 text-muted-foreground">
            <li><strong>SEO:</strong> "Can the machine find and read me?"</li>
            <li><strong>AEO:</strong> "Can the machine extract a clean answer from me?"</li>
            <li><strong>GEO:</strong> "Does the machine trust me enough to cite me?"</li>
          </ol>
        </div>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-8">
          <h3 className="font-bold text-foreground m-0 mb-4">Igris Radar Data: The Authority Drop-off</h3>
          <p className="text-muted-foreground text-base mb-4">When we scan enterprise domains, we almost always see them pass technical SEO. But as we move up the hierarchy, the pass rate plummets:</p>
          <ul className="space-y-2 text-base font-medium">
            <li className="flex items-center justify-between border-b border-border pb-2">
              <span>Pass Technical SEO (Indexable, Fast, Mobile-Ready)</span>
              <span className="text-success">82%</span>
            </li>
            <li className="flex items-center justify-between border-b border-border pb-2">
              <span>Pass AEO (Answer-formatted, LLM-accessible)</span>
              <span className="text-warning">28%</span>
            </li>
            <li className="flex items-center justify-between pb-1">
              <span>Pass GEO (Strong entity schema, high factual density)</span>
              <span className="text-destructive">Only 9%</span>
            </li>
          </ul>
        </div>

        <p>
          To win in today's multi-engine landscape, you need a holistic audit. Traditional tools only scan for SEO. Igris Radar scans for all three, independently scoring your technical foundation, your answer-readiness, and your generative entity authority. 
        </p>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/signup" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
            Run an SEO, AEO, and GEO audit simultaneously
          </Link>
        </div>
      </article>
    </div>
  );
}
