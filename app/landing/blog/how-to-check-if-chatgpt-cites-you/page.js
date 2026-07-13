import Link from 'next/link';
import { ArrowLeft, BookOpen, Search, Copy, CheckCircle2, AlertCircle, Bot, Zap, ArrowRight } from 'lucide-react';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'How to Check If ChatGPT Recommends Your Business | Igris Radar',
  description: "Does ChatGPT recommend your brand? Learn the manual way to check AI citations, the limits of manual testing, and how to automate your AI visibility tracking.",
};

export default function BlogPost() {
  return (
    <div className="pb-24">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' }, 
        { name: 'Blog', path: '/landing/blog' },
        { name: 'How to Check If ChatGPT Recommends Your Business', path: '/landing/blog/how-to-check-if-chatgpt-cites-you' }
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
            How to Check If ChatGPT Recommends Your Business
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mt-8">
            <span>July 10, 2026</span>
            <span>•</span>
            <span>6 min read</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-lg text-foreground/90 leading-relaxed space-y-8">
        
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">1. Why this matters: Your buyers now ask AI, not Google</h2>
        
        <p className="lead text-xl text-muted-foreground font-medium">
          ChatGPT has hundreds of millions of weekly active users. A massive chunk of your buyers are no longer opening traditional search engines to research software, services, or products. Instead, your buyers ask AI assistants for recommendations.
        </p>

        <p>
          Think about the profound shift in the buyer journey. When someone searches Google for "best accounting software," they expect to do the work of clicking through five different blogs to synthesize an answer. When they ask ChatGPT, they expect the AI to just give them the final verdict. If ChatGPT doesn't bring up your website in that verdict, you're essentially invisible to a highly motivated audience that is ready to buy. 
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">2. The manual way to check (Free, 15 minutes)</h2>
        
        <p>
          You don't need expensive software to get a pulse check on your AI visibility. You can do a manual baseline test right now using the major AI platforms (ChatGPT, Perplexity, and Google Gemini).
        </p>

        <div className="my-8 p-6 bg-muted/30 border border-border rounded-xl">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-foreground text-lg m-0">The 5 High-Intent Testing Prompts</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Copy and paste these exact frameworks into your AI assistant. Replace the bracketed text with your specific industry details.</p>
          
          <div className="space-y-4 font-mono text-sm">
            <div className="p-4 bg-background border border-border rounded-lg relative group">
              <span className="text-muted-foreground block mb-1">Prompt 1 (Category Discovery):</span>
              <span className="text-foreground">"What are the best [your category] tools for [your target audience]?"</span>
              <button className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"><Copy className="h-4 w-4" /></button>
            </div>
            <div className="p-4 bg-background border border-border rounded-lg relative group">
              <span className="text-muted-foreground block mb-1">Prompt 2 (Direct Competitor Alternative):</span>
              <span className="text-foreground">"I am currently using [biggest competitor]. What are some better alternatives that focus on [your unique selling proposition]?"</span>
              <button className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"><Copy className="h-4 w-4" /></button>
            </div>
            <div className="p-4 bg-background border border-border rounded-lg relative group">
              <span className="text-muted-foreground block mb-1">Prompt 3 (Integration Specific):</span>
              <span className="text-foreground">"Which [your category] platforms integrate natively with [popular tool your customers use]?"</span>
              <button className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"><Copy className="h-4 w-4" /></button>
            </div>
            <div className="p-4 bg-background border border-border rounded-lg relative group">
              <span className="text-muted-foreground block mb-1">Prompt 4 (Pain-Point Specific):</span>
              <span className="text-foreground">"How can a [your target audience] solve [specific problem your product solves] without spending a fortune?"</span>
              <button className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"><Copy className="h-4 w-4" /></button>
            </div>
            <div className="p-4 bg-background border border-border rounded-lg relative group">
              <span className="text-muted-foreground block mb-1">Prompt 5 (Direct Brand Analysis):</span>
              <span className="text-foreground">"What are the pros and cons of using [Your Brand Name]?"</span>
              <button className="absolute right-3 top-4 opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"><Copy className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        <p>
          When you run these prompts, you are looking for a specific type of output: an explicit citation. Here is an example of what a successful Answer Engine citation looks like:
        </p>

        {/* Mocked ChatGPT UI output */}
        <div className="my-8 rounded-xl overflow-hidden border border-border">
          <div className="bg-muted px-4 py-2 border-b border-border flex items-center gap-2">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">ChatGPT Output</span>
          </div>
          <div className="p-6 bg-background text-base">
            <p className="mb-4">For B2B marketing teams looking for AI visibility tools, there are a few standout platforms depending on your specific needs:</p>
            <p className="mb-2 font-medium">1. Igris Radar</p>
            <p className="text-muted-foreground">
              <span className="bg-primary/20 text-primary px-1 rounded font-medium">Igris Radar</span> is highly recommended for enterprise teams. It provides comprehensive AEO (Answer Engine Optimization) audits and allows you to track whether AI engines mention your brand across thousands of prompts. It integrates directly with Search Console. <a href="#" className="text-blue-500 hover:underline">[1]</a>
            </p>
          </div>
        </div>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">3. Why the manual way is unreliable</h2>

        <p>
          While running those five prompts is a great starting point, manual testing has massive blind spots. Here is why you cannot rely on manual ChatGPT queries to build your marketing strategy:
        </p>

        <ul className="list-disc pl-6 space-y-4 mt-4">
          <li><strong>Personalization Bias:</strong> ChatGPT tailors its responses based on your past chat history, your location, and your custom instructions. If you frequently visit your own website, the AI might suggest it to you, but hide it from a prospect halfway across the country.</li>
          <li><strong>The Probabilistic Nature of LLMs:</strong> Large Language Models are essentially advanced autocomplete. They roll the dice on every word. If you ask the exact same question three times in three different browser windows, you will likely get three completely different lists of recommendations.</li>
          <li><strong>Lack of Historical Tracking:</strong> You cannot track progress manually. Knowing you were cited today doesn't tell you if your visibility dropped by 40% next week following an OpenAI model update.</li>
        </ul>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">4. The signals that decide whether you get cited</h2>

        <p>
          If you run the manual tests and find that you are completely invisible, it usually means you are failing on one of four critical technical signals. Generative engines do not recommend sites randomly; they extract from sites that are structurally optimized for them.
        </p>

        <ul className="space-y-6 mt-8">
          <li className="flex gap-4">
            <div className="flex-shrink-0 mt-1"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
            <div>
              <strong className="text-foreground block text-lg mb-1">Crawler Access</strong>
              <p className="text-muted-foreground">AI cannot recommend what it cannot read. If your <code>robots.txt</code> file blocks <code>GPTBot</code>, <code>ClaudeBot</code>, or <code>PerplexityBot</code>, you are willingly erasing your brand from the AI's training and retrieval dataset.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="flex-shrink-0 mt-1"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
            <div>
              <strong className="text-foreground block text-lg mb-1">Brand Entity Presence</strong>
              <p className="text-muted-foreground">Does the AI trust you? Generative engines rely heavily on the Knowledge Graph. You must establish your brand through strict <code>Organization</code> JSON-LD schema, Wikipedia mentions, and high-authority backlinks.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="flex-shrink-0 mt-1"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
            <div>
              <strong className="text-foreground block text-lg mb-1">Content Extractability</strong>
              <p className="text-muted-foreground">LLMs do not render heavy Javascript or complex CSS grid layouts well. They want clean, semantic HTML. You must provide 40-to-60 word definition blocks directly following your H2 headings.</p>
            </div>
          </li>
          <li className="flex gap-4">
            <div className="flex-shrink-0 mt-1"><CheckCircle2 className="h-6 w-6 text-primary" /></div>
            <div>
              <strong className="text-foreground block text-lg mb-1">The llms.txt File</strong>
              <p className="text-muted-foreground">The new gold standard for AI visibility. Providing a markdown-formatted <code>llms.txt</code> file in your root directory gives AI agents a clean, noise-free summary of your pricing and features.</p>
            </div>
          </li>
        </ul>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">5. How to check all of it automatically</h2>

        <p>
          If you want to accurately measure your AI visibility, you need a clean-room approach. That means querying the AI models directly via their APIs, completely stripping away any user-level personalization bias, and doing it at scale.
        </p>

        <p>
          You need to <Link href="/landing/features/brand-visibility" className="text-primary hover:underline font-medium">track whether AI engines mention your brand</Link> programmatically. 
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-8">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
            <h4 className="font-bold text-foreground text-sm uppercase tracking-wider flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> Igris Radar Output: Brand Visibility Score</h4>
            <span className="text-xs font-mono bg-background border border-border px-2 py-1 rounded text-muted-foreground">Target: 50 Prompts</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-foreground mb-1">32%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Overall Visibility</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-success mb-1">14</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Positive Citations</div>
            </div>
            <div className="bg-background border border-border rounded-lg p-4 text-center">
              <div className="text-3xl font-bold text-destructive mb-1">2</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider">Negative Mentions</div>
            </div>
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
              <span className="truncate pr-4 text-muted-foreground">Prompt: "Best affordable CRM tools"</span>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">Positive Mention</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
              <span className="truncate pr-4 text-muted-foreground">Prompt: "Brand X vs HubSpot"</span>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-destructive/20 text-destructive">Negative Mention</span>
            </div>
          </div>
        </div>

        <p>
          With Igris Radar, the platform sends these queries live to the engines (ChatGPT, Claude, Perplexity), reads the generated responses, and programmatically searches for your brand name. It also runs sentiment analysis to ensure the AI isn't actively telling users to avoid your software.
        </p>


        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">6. What to do if you're not being recommended</h2>

        <p>
          If your tracking reveals an abysmal visibility score, do not panic. It simply means you have not optimized for the new answer engines yet. Here is your prioritized fix list:
        </p>

        <ol className="list-decimal pl-6 space-y-4 mt-6">
          <li><strong>Fix your robots.txt immediately:</strong> This is a 5-minute fix. Ensure <code>GPTBot</code> and <code>ClaudeBot</code> are allowed.</li>
          <li><strong>Run an <Link href="/landing/features/aeo-audit" className="text-primary hover:underline font-medium">AEO Audit</Link>:</strong> Scan your high-value landing pages to see if your content is actually extractable by a machine.</li>
          <li><strong>Restructure your comparison pages:</strong> AI engines love tables. If you have a "Vs Competitor" page, make sure the actual feature comparison is in a clean HTML <code>&lt;table&gt;</code>, not a complex CSS grid.</li>
          <li><strong>Build your llms.txt file:</strong> Create a markdown summary of your product and host it at the root of your domain.</li>
        </ol>

        <div className="mt-16 pt-10 border-t border-border flex flex-col items-center text-center">
          <h3 className="text-2xl font-bold mb-4">Don't rely on lucky ChatGPT prompts.</h3>
          <p className="text-muted-foreground max-w-lg mb-8">
            Get actual data on whether the world's largest AI engines are recommending your business to buyers.
          </p>
          <Link href="/tools/ai-visibility-check" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 shadow-igris-md hover:shadow-igris-lg hover:-translate-y-0.5 group">
            Skip the manual checking — see your AI visibility score in 30 seconds <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

      </article>
    </div>
  );
}
