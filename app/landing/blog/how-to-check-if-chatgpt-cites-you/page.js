import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'How to check if ChatGPT cites your website | Igris Radar',
  description: 'Millions of users ask ChatGPT for recommendations. Here is how you can check if your brand is the one it recommends, and how to improve your Answer Engine Optimization.',
};

export default function BlogPost() {
  return (
    <div className="pb-24">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' }, 
        { name: 'Blog', path: '/landing/blog' },
        { name: 'How to check if ChatGPT cites your website', path: '/landing/blog/how-to-check-if-chatgpt-cites-you' }
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
            How to check if ChatGPT cites your website
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mt-8">
            <span>July 10, 2026</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-lg text-foreground/90 leading-relaxed space-y-8">
        <p className="lead text-xl text-muted-foreground font-medium">
          ChatGPT has hundreds of millions of weekly active users. Think about that for a second. A huge chunk of those users aren't even opening traditional search engines anymore. When they want product recommendations, tool comparisons, or service providers, they just ask ChatGPT. If ChatGPT doesn't bring up your website, you're essentially invisible to a massive, highly motivated audience.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">The problem with checking manually</h2>
        
        <p>
          We've all done it. You open up ChatGPT, type in a prompt like <em>"What are the best SEO audit tools?"</em>, and scroll eagerly through the answer hoping to spot your brand name.
        </p>
        
        <p>
          But here's why that manual approach doesn't actually give you the real picture:
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>Personalization bias:</strong> ChatGPT tailors its responses based on your past chat history and custom instructions. What you see on your screen is not necessarily what your prospective customers are seeing.</li>
          <li><strong>Rolling the dice:</strong> Large Language Models are probabilistic by design. Ask the exact same question three times, and you might get three entirely different answers. You need to look at aggregate data, not just one lucky spin.</li>
          <li><strong>It doesn't scale:</strong> Manually typing out dozens of high-value prompts every single week across ChatGPT, Claude, and Perplexity is going to burn you out fast.</li>
        </ul>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">How to track AI Brand Visibility the right way</h2>

        <p>
          If you want to accurately measure whether ChatGPT is citing your website, you need an automated, clean-room approach. That means querying the AI models directly via their APIs, completely stripping away any user-level personalization bias.
        </p>

        <p>
          Here's how you can finally establish a true baseline for your AI visibility.
        </p>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Step 1: Identify your high-intent prompts</h3>
        <p>
          Start by mapping out the exact questions your buyers are asking. These are not just traditional SEO keywords; they are conversational prompts. Instead of targeting "b2b accounting software," target prompts like:
        </p>
        <div className="p-6 bg-muted/30 border border-border rounded-xl my-6 font-mono text-sm space-y-2">
          <div>&gt; "What is the best accounting software for a B2B SaaS startup?"</div>
          <div>&gt; "Compare Xero and QuickBooks for a mid-sized agency."</div>
          <div>&gt; "Which accounting tools integrate best with Stripe and HubSpot?"</div>
        </div>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Step 2: Use an AI Brand Tracking Tool</h3>
        <p>
          Instead of manual queries, use a dedicated tracking platform like <strong>Igris Radar</strong>. Our Brand Visibility scanner allows you to input your exact prompt list and configure which AI engines to track (ChatGPT, Claude, Gemini, Perplexity).
        </p>
        <p>
          The platform sends these queries live to the engines, reads the generated responses, and programmatically searches for your brand name and your competitors.
        </p>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">Step 3: Analyze Mention Detection and Sentiment</h3>
        <p>
          Being mentioned is only half the battle. If ChatGPT cites your brand but says, <em>"Brand X is an older, legacy tool that struggles with modern integrations,"</em> that is a negative citation.
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-6">
          <h4 className="font-bold text-foreground m-0 mb-3 text-sm uppercase tracking-wider text-muted-foreground">Scanner Output Example: Sentiment Analysis</h4>
          <div className="space-y-3 font-mono text-sm">
            <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
              <span className="truncate pr-4">"Best affordable CRM?"</span>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-success/20 text-success">Positive Mention</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
              <span className="truncate pr-4">"Brand X vs HubSpot"</span>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-destructive/20 text-destructive">Negative Mention</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-background border border-border rounded-lg">
              <span className="truncate pr-4">"Enterprise CRM for healthcare"</span>
              <span className="flex-shrink-0 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-muted text-muted-foreground">Omission (Not Cited)</span>
            </div>
          </div>
        </div>

        <p>
          When you automate this tracking, ensure you are also running sentiment analysis on the mention. You need to classify every citation as positive, neutral, or negative. Igris Radar handles this out of the box, giving you a clear visibility score that penalizes negative sentiment.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">What to do if ChatGPT isn't citing you</h2>

        <p>
          If your tracking reveals that ChatGPT recommends your competitors but ignores you, you have an Answer Engine Optimization (AEO) problem. Here is how to fix it:
        </p>

        <ul className="list-disc pl-6 space-y-4 mt-4">
          <li>
            <strong>Check your robots.txt:</strong> Ensure you are not inadvertently blocking <code>GPTBot</code>. If OpenAI's crawler cannot ingest your website, ChatGPT's underlying models will lack the necessary context to recommend you.
          </li>
          <li>
            <strong>Publish an llms.txt file:</strong> The <code>llms.txt</code> standard is an emerging convention that provides language models with a clean, markdown-formatted summary of your site's content and documentation.
          </li>
          <li>
            <strong>Improve Factual Density:</strong> ChatGPT prefers to cite sources that are dense with verifiable facts. Add clear definitions, structured comparisons (X vs Y), and concrete statistics to your landing pages.
          </li>
        </ul>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/landing/features/brand-visibility" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
            Learn more about the AI Brand Visibility Tracker
          </Link>
        </div>
      </article>
    </div>
  );
}
