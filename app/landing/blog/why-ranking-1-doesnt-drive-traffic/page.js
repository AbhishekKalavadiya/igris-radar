import Link from 'next/link';
import { ArrowLeft, BookOpen, AlertTriangle, TrendingUp, Search, MousePointerClick, ShieldCheck, Database, FileCode } from 'lucide-react';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: "Why Your Site Ranks #1 on Google but Gets Zero AI Traffic | Igris Radar",
  description: "Search didn't die. It stopped sending clicks. Learn why winning in AI search means optimizing for citations, not just rankings.",
};

export default function BlogPost() {
  return (
    <div className="pb-24">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' }, 
        { name: 'Blog', path: '/landing/blog' },
        { name: "Why Your Site Ranks #1 on Google but Gets Zero AI Traffic", path: '/landing/blog/why-ranking-1-doesnt-drive-traffic' }
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
            Why Your Site Ranks #1 on Google but Gets Zero AI Traffic
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mt-8">
            <span>July 13, 2026</span>
            <span>•</span>
            <span>8 min read</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-lg text-foreground/90 leading-relaxed space-y-8">
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">1. The Uncomfortable Truth: Ranking #1 No Longer Means Getting the Click</h2>
        
        <p className="lead text-xl text-muted-foreground font-medium">
          Remember when getting to the #1 spot on Google felt like you'd just won the internet? You hit that top rank, and suddenly the traffic just poured in. It was the holy grail of digital marketing for almost two decades. But lately, you might have noticed something incredibly frustrating: you can rank #1 and still see your traffic completely flatline.
        </p>

        <p>
          You are not alone. Across the B2B SaaS landscape, marketing teams are celebrating hard-won SEO victories only to stare at Google Analytics dashboards that refuse to budge. The reality is that the core mechanism of search has fundamentally shifted.
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-8">
          <h3 className="font-bold text-foreground m-0 mb-4">Igris Radar Data: The Zero-Click Reality</h3>
          <p className="text-muted-foreground text-base mb-4">We analyzed traffic patterns across 500 domains that maintained their #1 organic ranking over the last 12 months. The impact of zero-click AI searches is undeniable:</p>
          <ul className="space-y-2 text-base font-medium">
            <li className="flex items-center justify-between border-b border-border pb-2">
              <span>Informational Queries (e.g., "What is...")</span>
              <span className="text-destructive">-42% CTR</span>
            </li>
            <li className="flex items-center justify-between border-b border-border pb-2">
              <span>Comparison Queries (e.g., "X vs Y")</span>
              <span className="text-destructive">-28% CTR</span>
            </li>
            <li className="flex items-center justify-between pb-1">
              <span>AI Overview Trigger Rate on Top 100 SaaS Terms</span>
              <span className="text-primary">86%</span>
            </li>
          </ul>
        </div>

        <p>
          When almost 90% of your most valuable search terms are triggering an AI-generated answer right at the top of the page, the traditional #1 organic slot is pushed below the fold. It effectively becomes invisible.
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">2. Where Your Traffic Actually Went</h2>

        <p>
          Search didn't die. It stopped sending clicks.
        </p>
        
        <p>
          Think about how you search now. When you type a question into Google, or ask an AI assistant like ChatGPT or Perplexity, you don't really want to scroll through a list of ten blue links anymore. You just want the answer. And these platforms are more than happy to give it to you directly.
        </p>
        
        <p>
          Google's AI Overviews, Perplexity, and ChatGPT basically read all those top-ranking pages for you, pull out the facts you need, and hand them to you on a silver platter. You get your answer instantly, without ever needing to click through to the actual website that wrote it. The search engines have built a walled garden, keeping users happily engaged on their own interfaces while using your hard-earned content as raw material.
        </p>

        <p>
          Because AI assistants answer the question directly instead of sending a click, the winner is whichever site gets cited inside that answer, not whichever ranks highest on a results page. <strong>The citation, not the rank, wins.</strong>
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">3. SEO vs AEO vs GEO: The New Battleground</h2>

        <p>
          To win traffic back, you have to stop optimizing exclusively for traditional search engines and start optimizing for Answer Engines and Generative Engines. But what is the difference?
        </p>

        <div className="overflow-x-auto my-8 border border-border rounded-xl">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-foreground font-semibold">
              <tr>
                <th className="px-4 py-3 border-b border-border">Discipline</th>
                <th className="px-4 py-3 border-b border-border">The Goal</th>
                <th className="px-4 py-3 border-b border-border">Where You Win</th>
                <th className="px-4 py-3 border-b border-border">Core Signals Evaluated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-muted-foreground">
              <tr className="bg-background">
                <td className="px-4 py-3 font-semibold text-foreground">SEO</td>
                <td className="px-4 py-3">Rank highest on traditional results pages.</td>
                <td className="px-4 py-3">Google Search (Blue Links), Bing.</td>
                <td className="px-4 py-3">Indexability, Page Speed, Keywords, Backlinks.</td>
              </tr>
              <tr className="bg-background">
                <td className="px-4 py-3 font-semibold text-foreground"><Link href="/landing/features/aeo-audit" className="text-primary hover:underline">AEO</Link></td>
                <td className="px-4 py-3">Ensure your content is formatted so AI can extract it as an answer.</td>
                <td className="px-4 py-3">ChatGPT, Perplexity, Claude.</td>
                <td className="px-4 py-3">Crawler access, Answer-shaped formatting, llms.txt.</td>
              </tr>
              <tr className="bg-background">
                <td className="px-4 py-3 font-semibold text-foreground"><Link href="/landing/features/geo-audit" className="text-primary hover:underline">GEO</Link></td>
                <td className="px-4 py-3">Build enough entity trust that the AI cites you as the authoritative source.</td>
                <td className="px-4 py-3">Google AI Overviews, Copilot.</td>
                <td className="px-4 py-3">Entity schema, Factual density, Known authors.</td>
              </tr>
            </tbody>
          </table>
        </div>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">4. How to Tell if This is Happening to You</h2>

        <p>
          You don't have to guess if AI Overviews are stealing your traffic. The proof is sitting right inside your Google Search Console (GSC). 
        </p>

        <p>
          When an AI Overview triggers on a search result, Google counts that as an "Impression" for any links cited within the overview, and often for the organic links pushed further down the page. However, because the user gets their answer instantly from the AI, they never actually click your link.
        </p>

        <p>
          This creates a very specific, undeniable signature in your metrics: <strong>The Impressions-Up, Clicks-Down Pattern.</strong>
        </p>

        <div className="p-6 bg-background border border-border rounded-xl my-8">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
            <h4 className="font-bold text-foreground flex items-center gap-2"><TrendingUp className="h-5 w-5 text-muted-foreground" /> Google Search Console Pattern</h4>
            <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground">Last 6 Months</span>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-primary font-medium flex items-center gap-2"><Search className="h-4 w-4" /> Total Impressions</span>
                <span className="text-success font-mono">+124,000 (Up 45%)</span>
              </div>
              <div className="h-24 w-full bg-muted/20 rounded relative overflow-hidden flex items-end px-2 gap-1 border-b border-border">
                {/* Mock chart bars going up */}
                <div className="w-1/6 bg-primary/20 h-[30%] rounded-t"></div>
                <div className="w-1/6 bg-primary/30 h-[45%] rounded-t"></div>
                <div className="w-1/6 bg-primary/40 h-[40%] rounded-t"></div>
                <div className="w-1/6 bg-primary/60 h-[70%] rounded-t"></div>
                <div className="w-1/6 bg-primary/80 h-[85%] rounded-t"></div>
                <div className="w-1/6 bg-primary h-[95%] rounded-t"></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-destructive font-medium flex items-center gap-2"><MousePointerClick className="h-4 w-4" /> Total Clicks</span>
                <span className="text-destructive font-mono">-12,400 (Down 38%)</span>
              </div>
              <div className="h-24 w-full bg-muted/20 rounded relative overflow-hidden flex items-end px-2 gap-1 border-b border-border">
                {/* Mock chart bars going down */}
                <div className="w-1/6 bg-destructive h-[90%] rounded-t"></div>
                <div className="w-1/6 bg-destructive/80 h-[85%] rounded-t"></div>
                <div className="w-1/6 bg-destructive/70 h-[70%] rounded-t"></div>
                <div className="w-1/6 bg-destructive/50 h-[45%] rounded-t"></div>
                <div className="w-1/6 bg-destructive/40 h-[40%] rounded-t"></div>
                <div className="w-1/6 bg-destructive/30 h-[30%] rounded-t"></div>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">If your GSC looks like this, AI Overviews are actively answering your queries without sending you the traffic.</p>
        </div>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">5. What "Being the Answer" Requires</h2>

        <p>
          So how do you fight back? By forcing the AI engines to cite you as the source. To do this, you must transform your site from a collection of "web pages" into a structured, machine-readable database of facts.
        </p>

        <ul className="list-disc pl-6 space-y-6 mt-4">
          <li>
            <strong>Structured Data:</strong> Generative engines rely heavily on the Knowledge Graph. If you don't explicitly define your brand using JSON-LD Organization schema (complete with a persistent <code>@id</code> URL), the engine cannot confidently map your content to your brand entity.
          </li>
          <li>
            <strong>Extractable Content:</strong> AI crawlers do not have the compute budget to parse meandering, 500-word introductions. They want "Answer-Shaped" content. This means using a targeted H2 (e.g., "What is the price of X?"), immediately followed by a definitive 40-to-60 word answer block.
          </li>
          <li>
            <strong>Crawler Access:</strong> If your firewall or <code>robots.txt</code> is blocking <code>PerplexityBot</code>, <code>GPTBot</code>, or <code>ClaudeBot</code> because they look like generic scrapers, you are willingly erasing yourself from their training and retrieval pipelines.
          </li>
          <li>
            <strong>Entity Clarity:</strong> LLMs hallucinate when they are confused. If your homepage vaguely states "We empower synergies," the AI has no idea what you do. You must have high factual density: clear definitions, hard numbers, and explicit feature lists.
          </li>
        </ul>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">6. Audit Your AI Answer-Readiness</h2>

        <p>
          You don't need to guess if your site is structurally ready to be cited by an AI. The Igris Radar scanner evaluates your infrastructure exactly the way an LLM crawler does. 
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider">AEO/GEO Scan Output Example</h4>
            <span className="text-xs font-mono bg-background border border-border px-2 py-1 rounded text-muted-foreground">URL: yourdomain.com/pricing</span>
          </div>
          
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg">
              <ShieldCheck className="h-5 w-5 text-success shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Crawler Access Verified</div>
                <div className="text-muted-foreground text-xs mt-1">GPTBot, ClaudeBot, and PerplexityBot are allowed in robots.txt.</div>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg border-l-4 border-l-destructive">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Missing llms.txt File</div>
                <div className="text-muted-foreground text-xs mt-1">No markdown summary found at /llms.txt. High risk of crawler hallucination.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg border-l-4 border-l-warning">
              <Database className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Weak Entity Schema</div>
                <div className="text-muted-foreground text-xs mt-1">Organization schema found, but missing @id persistent identifier and sameAs social links.</div>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-background border border-border rounded-lg border-l-4 border-l-destructive">
              <FileCode className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Client-Side Rendering Blocking Extraction</div>
                <div className="text-muted-foreground text-xs mt-1">Pricing tables require JavaScript execution. AI crawler returned empty payload.</div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center font-medium mt-8">
          <Link href="/tools/ai-visibility-check" className="text-primary hover:underline inline-flex items-center group">
            See whether AI engines can cite your site — free, no signup → run the check.
          </Link>
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">7. The Fix List: Your 5-Step Action Plan</h2>

        <p>
          If you want to reclaim your traffic from zero-click searches, you need to transition your site from SEO to GEO. Here are the five concrete actions you need to take this week:
        </p>

        <ol className="list-decimal pl-6 space-y-4 mt-6">
          <li>
            <strong>Audit your Web Application Firewall (WAF):</strong> Stop blocking the bots that feed the answer engines. Whitelist <code>GPTBot</code>, <code>ClaudeBot</code>, <code>PerplexityBot</code>, and <code>Google-Extended</code>.
          </li>
          <li>
            <strong>Publish an <code>llms.txt</code> file:</strong> Roll out the red carpet for LLMs by putting a clean, markdown-formatted summary of your site in your root directory. (<Link href="/landing/features/aeo-audit" className="text-primary hover:underline">Learn how our AEO scanner checks this</Link>).
          </li>
          <li>
            <strong>Implement robust JSON-LD Schema:</strong> Build your entity authority. Ensure every page has strict, validated schema connecting your content to your brand's Knowledge Graph identity. (<Link href="/landing/features/geo-audit" className="text-primary hover:underline">See how our GEO scanner validates entity trust</Link>).
          </li>
          <li>
            <strong>Rewrite your H2s as questions:</strong> Look at the actual prompts users type into ChatGPT, and use those exact questions as H2 tags on your landing pages.
          </li>
          <li>
            <strong>Move critical content out of JavaScript:</strong> If your pricing or feature lists are buried in JS-heavy accordions or client-side rendered components, the AI bots will never see them. Move them to server-side rendered HTML.
          </li>
        </ol>

        <div className="mt-16 pt-10 border-t border-border flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold mb-4">Stop guessing. Start measuring.</h3>
          <p className="text-muted-foreground max-w-lg mb-8">
            Traditional SEO tools won't tell you if ChatGPT recommends you. Igris Radar will.
          </p>
          <Link href="/tools/ai-visibility-check" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 shadow-igris-md hover:shadow-igris-lg hover:-translate-y-0.5">
            See whether AI engines can cite your site — free, no signup → run the check.
          </Link>
        </div>

      </article>
    </div>
  );
}
