import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertCircle, Globe, Search, BarChart3, Clock, Link as LinkIcon, Bot, CheckSquare, SearchX, FileX, ArrowRight, CheckCircle2 } from 'lucide-react';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'Why Is My New Website Not Getting Any Organic Traffic? | Igris Radar',
  description: "Frustrated that your new domain isn't ranking? Learn the top 5 reasons new websites fail to get organic traffic and the exact 7-day checklist to fix it.",
};

export default function BlogPost() {
  return (
    <div className="pb-24">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' }, 
        { name: 'Blog', path: '/landing/blog' },
        { name: 'Why Is My New Website Not Getting Any Organic Traffic?', path: '/landing/blog/why-is-my-new-website-not-getting-traffic' }
      ])} />

      <section className="border-b border-border bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <Link href="/landing/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <BookOpen className="h-3.5 w-3.5" /> Guide
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            Why Is My New Website Not Getting Any Organic Traffic?
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mt-8">
            <span>July 15, 2026</span>
            <span>•</span>
            <span>8 min read</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-lg text-foreground/90 leading-relaxed space-y-8">
        
        <p className="lead text-xl text-muted-foreground font-medium">
          You spent months designing the perfect website. The copy is crisp, the branding is flawless, and the performance is lightning fast. You hit "Publish," expecting a wave of visitors. And then... crickets. Your Google Analytics dashboard is a flatline. So, why is your new website not getting any organic traffic?
        </p>

        <p>
          It's the most frustrating, demoralizing phase of launching a new business. But the truth is, a lack of organic traffic on a new domain is rarely a failure of your product or your design. It is almost always a failure of technical signaling. Search engines don't know you exist, don't know what you do, or don't trust you yet.
        </p>

        <p>
          Here is exactly why your site isn't ranking, and the actionable checklist to fix it.
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">1. First, rule out the deal-breaker: are you even indexed?</h2>
        
        <p>
          Before we talk about keywords, backlinks, or content strategies, we have to address the elephant in the room. You can't rank if you aren't indexed. This is where 80% of new founders' problems actually lie. They think they have a traffic problem when they actually have an <em>indexing</em> problem.
        </p>

        <p>
          To check this instantly, go to Google and type <code>site:yourdomain.com</code>.
        </p>

        <div className="p-6 bg-background border border-border rounded-xl my-8 shadow-igris-sm">
          <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground border-b border-border pb-2">
            <Globe className="h-4 w-4" /> Google Search
          </div>
          <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-full border border-border mb-6">
            <Search className="h-5 w-5 text-muted-foreground ml-2" />
            <span className="font-mono text-foreground">site:yournewstartup.com</span>
          </div>
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <SearchX className="h-10 w-10 text-destructive mx-auto mb-3" />
            <h4 className="font-bold text-destructive text-lg">Your search - site:yournewstartup.com - did not match any documents.</h4>
            <p className="text-muted-foreground text-sm mt-2">Suggestions: Make sure all words are spelled correctly. Try different keywords. Try more general keywords.</p>
          </div>
        </div>

        <p>
          If you see something like the image above, stop reading articles about SEO strategy. You have a technical blockage. Google's crawler (Googlebot) has either not found your site yet, or it is explicitly being blocked from reading it.
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">2. The new-domain reality: Authority takes time</h2>

        <p>
          If you <em>are</em> indexed but still not ranking, you need to understand the "Google Sandbox" effect (though Google officially denies it exists, SEOs know better). 
        </p>
        
        <p>
          When you register a brand new domain, you have zero domain authority. Search engines are inherently skeptical of new websites because the internet is flooded with millions of spam domains every single day. Google isn't going to risk its own reputation by sending users to a 3-day-old website they know nothing about.
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-6">
          <h3 className="font-bold text-foreground m-0 mb-2">What the first 90 days actually look like:</h3>
          <ul className="list-disc pl-6 space-y-2 mt-4 text-base">
            <li><strong>Days 1-30:</strong> Discovery phase. Crawlers are just finding your sitemap and slowly parsing your HTML. Expect zero organic traffic.</li>
            <li><strong>Days 31-60:</strong> Indexing phase. Your pages appear in the index, but they are buried on page 8 or 9 of the search results. You might get 1-2 accidental clicks.</li>
            <li><strong>Days 61-90:</strong> Testing phase. Google occasionally pushes a page to page 2 or 3 to test user engagement (CTR, bounce rate). If your content is good, you start slowly climbing.</li>
          </ul>
        </div>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">3. Reason 1: You're not indexed (and how to fix it)</h2>

        <p>
          Let's go back to the deal-breaker. If you failed the <code>site:</code> search test, you need to check your Google Search Console (GSC) immediately.
        </p>

        <div className="p-6 bg-background border border-border rounded-xl my-8 shadow-igris-sm overflow-hidden">
          <div className="flex justify-between items-center bg-muted/50 p-3 border-b border-border text-sm font-medium">
            <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Google Search Console</span>
            <span className="text-muted-foreground">Pages Report</span>
          </div>
          <div className="p-6">
            <h4 className="text-lg font-bold mb-4">Why pages aren't indexed</h4>
            <div className="space-y-4 font-mono text-sm">
              <div className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <span className="flex items-center gap-2"><FileX className="h-4 w-4 text-destructive" /> Excluded by 'noindex' tag</span>
                <span className="font-bold text-destructive">12 pages</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-lg text-muted-foreground">
                <span className="flex items-center gap-2"><Clock className="h-4 w-4" /> Discovered - currently not indexed</span>
                <span className="font-bold">4 pages</span>
              </div>
            </div>
            <p className="text-sm text-foreground mt-6 font-medium">
              If your developer left a `&lt;meta name="robots" content="noindex"&gt;` tag on your site from the staging environment, you will never rank.
            </p>
          </div>
        </div>

        <p>
          <strong>The Fix:</strong> Run a <Link href="/landing/features/site-health" className="text-primary hover:underline font-medium">site health audit to check indexability and Core Web Vitals</Link>. Ensure your <code>robots.txt</code> is clear. Submit a clean XML sitemap to Google Search Console and Bing Webmaster Tools. Use the "Request Indexing" tool in GSC for your homepage.
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">4. Reason 2: You're targeting keywords you can't win yet</h2>

        <p>
          It's tempting to launch your new accounting startup and immediately try to rank for "best accounting software." But you are competing against Intuit, Xero, and massive software review sites with Domain Authorities of 90+. A brand new site mathematically cannot outrank them.
        </p>

        <p>
          You are fighting a heavyweight battle as a featherweight. You need to target long-tail, low-competition keywords first.
        </p>

        <ul className="list-disc pl-6 space-y-2 mt-4 text-base">
          <li><strong>Bad Target (Head Keyword):</strong> "CRM software" (Search Volume: 100,000 | Difficulty: 95/100)</li>
          <li><strong>Good Target (Long-Tail):</strong> "affordable CRM software for solo roofers" (Search Volume: 150 | Difficulty: 12/100)</li>
        </ul>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">5. Reason 3: Thin content and no topical depth</h2>

        <p>
          Having a beautiful homepage, an "About Us" page, and a "Pricing" page is not a content strategy. That is a brochure. 
        </p>

        <p>
          Search engines rank sites that demonstrate topical authority. If you want to rank for "B2B SaaS Security," you can't just have one landing page about it. You need a cluster of content: 10-15 deep-dive articles covering every facet of that topic, all interlinking with each other. This proves to the search engine that you are a genuine authority on the subject, not just a thin brochure site.
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">6. Reason 4: Zero backlinks</h2>

        <p>
          Google still heavily relies on backlinks (links from other websites pointing to yours) as a primary signal of trust. If no one on the internet is linking to your new site, Google assumes your site isn't very important. 
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-6">
          <h3 className="font-bold text-foreground m-0 mb-4 flex items-center gap-2"><LinkIcon className="h-5 w-5 text-primary" /> The First 5 Links You Should Get</h3>
          <ol className="list-decimal pl-6 space-y-2 mt-4 text-base text-muted-foreground">
            <li><strong>Your social profiles:</strong> LinkedIn company page, Twitter, YouTube channel.</li>
            <li><strong>Startup directories:</strong> ProductHunt, Crunchbase, BetaList.</li>
            <li><strong>Local citations:</strong> Google Business Profile, Yelp (if applicable).</li>
            <li><strong>Partner networks:</strong> Ask vendors or agencies you work with for a link.</li>
            <li><strong>Guest posts:</strong> Write a high-quality article for a medium-tier blog in your niche.</li>
          </ol>
        </div>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">7. Reason 5: You optimized the page but ignored AI visibility</h2>

        <p>
          Here is the modern twist that most SEO advice completely misses. You might be perfectly optimized for Google, but you are getting zero traffic because <strong>AI Answer Engines are stealing your clicks.</strong>
        </p>

        <p>
          When users search for informational queries, Google's AI Overviews, ChatGPT, and Perplexity are answering the question directly. If you only optimized for traditional SEO, you are losing out on the new citation economy. You need <Link href="/landing/features/aeo-audit" className="text-primary hover:underline font-medium">Answer Engine Optimization (AEO)</Link>.
        </p>

        <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl my-8 text-center">
          <h4 className="font-bold text-foreground text-lg mb-2">Igris Radar AEO Scan Example</h4>
          <p className="text-muted-foreground mb-6">Our scanner checks if AI bots can actually read your site.</p>
          <div className="inline-flex flex-col items-start gap-3 bg-background p-4 rounded-lg border border-border text-left w-full max-w-md mx-auto shadow-igris-md">
            <div className="flex items-center gap-3 w-full border-b border-border pb-2">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" /> <span className="font-mono text-sm">GPTBot Access: ALLOWED</span>
            </div>
            <div className="flex items-center gap-3 w-full border-b border-border pb-2">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" /> <span className="font-mono text-sm">llms.txt File: MISSING</span>
            </div>
            <div className="flex items-center gap-3 w-full">
              <AlertCircle className="h-5 w-5 text-warning shrink-0" /> <span className="font-mono text-sm">Extractable Q&A: POOR</span>
            </div>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">8. Your 7-Day Action Checklist</h2>

        <p>
          Stop staring at Google Analytics hoping the line goes up. Execute this checklist.
        </p>

        <div className="p-8 bg-muted border border-border rounded-xl my-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none"><CheckSquare className="h-32 w-32" /></div>
          <h3 className="font-bold text-foreground text-2xl m-0 mb-6 relative z-10">The 7-Day Traffic Fix</h3>
          
          <ul className="space-y-4 relative z-10 text-base font-medium">
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">1</div>
              <div><strong className="text-foreground block">Day 1: Run a full SEO audit</strong><span className="text-muted-foreground font-normal text-sm">Find and remove any rogue noindex tags or blocking robots.txt directives. <Link href="/landing/features/seo-audit" className="text-primary hover:underline">Run a full SEO audit here.</Link></span></div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">2</div>
              <div><strong className="text-foreground block">Day 2: Submit your sitemap</strong><span className="text-muted-foreground font-normal text-sm">Submit XML sitemaps to Google Search Console and Bing Webmaster Tools.</span></div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">3</div>
              <div><strong className="text-foreground block">Day 3: Target low-hanging fruit</strong><span className="text-muted-foreground font-normal text-sm">Identify 5 long-tail, low-competition keywords you actually have a chance of winning.</span></div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">4</div>
              <div><strong className="text-foreground block">Day 4: Build foundational links</strong><span className="text-muted-foreground font-normal text-sm">Set up your Crunchbase, LinkedIn, and local directory profiles.</span></div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">5</div>
              <div><strong className="text-foreground block">Day 5: Format for Answer Engines</strong><span className="text-muted-foreground font-normal text-sm">Add clear H2 questions and 50-word answer blocks to your key pages.</span></div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">6</div>
              <div><strong className="text-foreground block">Day 6: Publish llms.txt</strong><span className="text-muted-foreground font-normal text-sm">Create a markdown summary of your site to feed the AI crawlers.</span></div>
            </li>
            <li className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs shrink-0 mt-0.5">7</div>
              <div><strong className="text-foreground block">Day 7: Scan your visibility</strong><span className="text-muted-foreground font-normal text-sm">Use Igris Radar to ensure your technical base is solid.</span></div>
            </li>
          </ul>
        </div>


        <div className="mt-16 pt-10 border-t border-border flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold mb-4">Don't launch into the void.</h3>
          <p className="text-muted-foreground max-w-lg mb-8">
            Ensure your site is technically flawless and ready for both Google and modern AI answer engines.
          </p>
          <Link href="/tools/ai-visibility-check" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 shadow-igris-md hover:shadow-igris-lg hover:-translate-y-0.5 group">
            Find out exactly what's blocking your traffic — run a free full-site audit <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

      </article>
    </div>
  );
}
