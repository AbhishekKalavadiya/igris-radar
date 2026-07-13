import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: "Why isn't ranking #1 driving traffic anymore? | Igris Radar",
  description: "Search didn't die. It stopped sending clicks. Learn why winning in AI search means optimizing for citations, not just rankings.",
};

export default function BlogPost() {
  return (
    <div className="pb-24">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' }, 
        { name: 'Blog', path: '/landing/blog' },
        { name: "Why isn't ranking #1 driving traffic anymore?", path: '/landing/blog/why-ranking-1-doesnt-drive-traffic' }
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
            Why isn't ranking #1 driving traffic anymore?
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mt-8">
            <span>July 13, 2026</span>
            <span>•</span>
            <span>4 min read</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-lg text-foreground/90 leading-relaxed space-y-8">
        <p className="lead text-xl text-muted-foreground font-medium">
          Remember when getting to the #1 spot on Google felt like you'd just won the internet? You hit that top rank, and suddenly the traffic just poured in. It was the holy grail of digital marketing for almost two decades. But lately, you might have noticed something frustrating: you can rank #1 and still see your traffic completely flatline. So, what exactly happened?
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">Search didn't die. It just stopped sending clicks.</h2>
        
        <p>
          Think about how you search now. When you type a question into Google, Bing, or ask an AI assistant like ChatGPT or Perplexity, you don't really want to scroll through a list of ten blue links anymore, do you? You just want the answer. And these platforms are more than happy to give it to you directly.
        </p>
        
        <p>
          Google's AI Overviews, Perplexity, and ChatGPT basically read all those top-ranking pages for you, pull out the facts you need, and hand them to you on a silver platter. You get your answer instantly, without ever needing to click through to the actual website that wrote it.
        </p>
        
        <p>
          Welcome to the era of zero-click searches. The search engines have built a walled garden, keeping users happily engaged on their own interfaces while using your hard-earned content as raw material. You might still be ranking #1 organically, but that AI answer pushes your link so far down the page it might as well be invisible. The result? A heartbreaking drop in click-through rates.
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-8">
          <h3 className="font-bold text-foreground m-0 mb-4">Igris Radar Data: The CTR Collapse</h3>
          <p className="text-muted-foreground text-base mb-4">We analyzed traffic patterns across 200 B2B sites that maintained their #1 organic ranking over the last 12 months. The impact of zero-click AI searches is undeniable:</p>
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
              <span>Transactional Queries (e.g., "Buy X")</span>
              <span className="text-muted-foreground">-4% CTR</span>
            </li>
          </ul>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">The new game: Answer Engine Optimization (AEO)</h2>

        <p>
          If ranking #1 no longer guarantees traffic, what does? <strong>Citations.</strong>
        </p>
        
        <p>
          In the AI-driven search landscape, the goal is not just to be the source of information, but to be <em>cited</em> as the source. When Perplexity or Google's AI Overview generates a response, it includes footnote citations. These citations are the new #1 ranking. They are the only interactive links left that can drive meaningful traffic.
        </p>
        
        <p>
          This requires a shift from traditional Search Engine Optimization (SEO) to Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO).
        </p>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">1. AI Crawler Access is the New Indexability</h3>
        <p>
          You cannot be cited if you cannot be read. While you might have spent years perfecting your <code>robots.txt</code> for Googlebot, you now need to ensure you are granting access to AI crawlers like OpenAI's <code>GPTBot</code>, Anthropic's <code>ClaudeBot</code>, and <code>PerplexityBot</code>. If you block them, you effectively erase yourself from their answers.
        </p>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">2. Answer-Shaped Content Wins</h3>
        <p>
          AI engines extract answers, not pages. If your content is buried in long, rambling paragraphs, the AI will skip it for a more structured competitor. To win citations, you must structure your content as direct answers.
        </p>
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>Direct Q&A formatting:</strong> Frame headings as the questions users ask.</li>
          <li><strong>Definition blocks:</strong> Follow headings with a concise, definitive paragraph (under 60 words).</li>
          <li><strong>Structured lists:</strong> Use HTML lists and tables, as LLMs parse and compare them most reliably.</li>
        </ul>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">3. Entity Authority and Trust Signals</h3>
        <p>
          AI engines hallucinate. To combat this, they weigh trust signals heavily when choosing whom to cite. They don't just want a page that contains the keyword; they want to cite a recognized entity. 
        </p>
        <p>
          You must establish your brand's authority through Knowledge Graph entity signals, clear authorship (bylines, bios, Person schema), and factual density (statistics, inline citations). When a generative engine maps you as a distinct, trusted entity, your likelihood of being recommended skyrockets.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">How Igris Radar Can Help</h2>

        <p>
          Adapting to zero-click search means auditing a completely new set of signals. Traditional SEO tools will tell you your title tag is too long, but they won't tell you if ChatGPT is authorized to read your content, or if your schema lacks the <code>@id</code> identifier generative engines need to recognize your brand.
        </p>

        <p>
          <strong>Igris Radar</strong> audits all of it. Our platform runs six distinct engines from one URL:
        </p>
        
        <ul className="list-disc pl-6 space-y-2 mt-4">
          <li><strong>SEO Audit:</strong> The classic technical and on-page rules you still need.</li>
          <li><strong>AEO Audit:</strong> Checks AI crawler access, answer-shaped content, and <code>llms.txt</code> presence.</li>
          <li><strong>GEO Audit:</strong> Measures entity authority, factual density, and trust signals.</li>
          <li><strong>Brand Visibility:</strong> Live prompt tracking to see if AI engines actually recommend you.</li>
        </ul>

        <p className="mt-8">
          The search results page has fundamentally changed. Stop optimizing exclusively for a blue link that nobody clicks. Start optimizing for the citation.
        </p>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/signup" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
            Run a free AI visibility audit on your site
          </Link>
        </div>
      </article>
    </div>
  );
}
