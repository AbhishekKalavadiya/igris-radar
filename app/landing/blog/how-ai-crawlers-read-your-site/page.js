import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'How AI Crawlers Read Your Site (GPTBot, ClaudeBot, PerplexityBot) | Igris Radar',
  description: 'An inside look at how AI agents parse your HTML, what they ignore, and how to structure your code for maximum extraction.',
};

export default function BlogPost() {
  return (
    <div className="pb-24">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' }, 
        { name: 'Blog', path: '/landing/blog' },
        { name: 'How AI Crawlers Read Your Site', path: '/landing/blog/how-ai-crawlers-read-your-site' }
      ])} />

      <section className="border-b border-border bg-muted/20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-16">
          <Link href="/landing/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Blog
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
            <BookOpen className="h-3.5 w-3.5" /> Technical
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
            How AI Crawlers Read Your Site (GPTBot, ClaudeBot, PerplexityBot)
          </h1>
          <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground mt-8">
            <span>July 13, 2026</span>
            <span>•</span>
            <span>5 min read</span>
          </div>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-12 text-lg text-foreground/90 leading-relaxed space-y-8">
        <p className="lead text-xl text-muted-foreground font-medium">
          If you want to know why ChatGPT keeps ignoring your beautifully designed pricing page while citing your competitor's ugly, text-heavy site, you need to understand one basic truth: AI bots don't "see" your website. They read your code. And frankly, they aren't very good at it.
        </p>

        <p>
          Unlike the massively sophisticated <code>Googlebot</code>, which has spent two decades learning how to render complex JavaScript and execute cascading style sheets, modern AI crawlers like <code>GPTBot</code> (OpenAI), <code>ClaudeBot</code> (Anthropic), and <code>PerplexityBot</code> are comparatively primitive. They are built for one thing only: extracting raw text as quickly as possible.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">The JavaScript Problem</h2>
        
        <p>
          Here's the biggest hurdle most modern web apps face when dealing with AI crawlers: client-side rendering. If your entire website is a single-page application built in React or Vue, and the server just sends down an empty HTML shell with a massive JavaScript bundle attached, AI bots will often just see a blank page.
        </p>
        
        <p>
          While Google will patiently wait, download the bundle, execute the scripts, and render the final DOM tree, most AI agents simply do not have the compute budget for that. They grab the initial HTML payload and immediately move on. If your core content isn't in that initial payload, you effectively don't exist to them.
        </p>

        <div className="p-6 bg-muted/30 border border-border rounded-xl my-8">
          <h3 className="font-bold text-foreground m-0 mb-4">Igris Radar Data: What the Bot Actually Sees</h3>
          <p className="text-muted-foreground text-base mb-4">When our scanner simulates a GPTBot crawl on a modern React site, here is what the raw extracted payload looks like. Notice how it strips all styling and relies entirely on semantic tags:</p>
          <div className="bg-background border border-border rounded-lg p-4 font-mono text-xs md:text-sm overflow-x-auto text-muted-foreground">
            <span className="text-primary">&lt;H1&gt;</span> Igris Radar Pricing<br/>
            <span className="text-primary">&lt;H2&gt;</span> Pro Tier<br/>
            <span className="text-primary">&lt;TEXT&gt;</span> $99/month for up to 5 domains.<br/>
            <span className="text-destructive">&lt;DROPPED&gt;</span> [SVG Icon]<br/>
            <span className="text-destructive">&lt;DROPPED&gt;</span> [CSS Animation class="fade-in"]<br/>
            <span className="text-destructive">&lt;DROPPED&gt;</span> [JavaScript tooltip showing feature details]
          </div>
          <p className="text-sm text-foreground mt-4 font-medium">
            The Fix: If your feature details only exist inside a JS-powered hover tooltip, the AI never reads them. You must use Server-Side Rendering (SSR) and put critical text directly in the DOM.
          </p>
        </div>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">What AI Crawlers Actually Care About</h2>

        <p>
          Once an AI bot has the HTML, it runs a brutal stripping process. It strips away the CSS. It drops the interactive scripts. It removes the navigation menus and footer boilerplate. It is hunting exclusively for semantic structure and text.
        </p>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">1. Semantic Headings (H1, H2, H3)</h3>
        <p>
          To an LLM, headings are the map of your content. If you use a massive, bolded <code>&lt;span&gt;</code> tag because it looks cool, the AI crawler just sees regular text. You must use proper semantic headings. The bot uses these H-tags to determine the context of the paragraphs that follow them.
        </p>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">2. Clean, Formatted Tables</h3>
        <p>
          If you are comparing two products, do not use complex flexbox grids or CSS layouts to build your comparison chart. AI crawlers struggle to understand spatial relationships defined in CSS. Instead, use boring, traditional <code>&lt;table&gt;</code> tags. Language models parse raw HTML tables incredibly well, easily mapping rows to columns to understand the structured data.
        </p>

        <h3 className="text-xl font-bold text-foreground mt-8 mb-4">3. Schema.org (JSON-LD)</h3>
        <p>
          Crawlers love structured data. If you bury your author's credentials in a quirky bio at the bottom of the page, the bot might miss it. If you explicitly declare it in a JSON-LD script block using the <code>Person</code> schema, the bot ingests it instantly with zero ambiguity. The same goes for product pricing, reviews, and FAQ sections.
        </p>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">The "Ignore" List</h2>

        <p>
          It's equally important to know what these bots completely ignore. Don't waste time optimizing these elements for Answer Engines:
        </p>

        <ul className="list-disc pl-6 space-y-4 mt-4">
          <li><strong>Images and Alt Text:</strong> While crucial for accessibility and traditional Google Image search, most text-based LLM crawlers completely drop <code>&lt;img&gt;</code> tags during the parsing phase. Don't put vital facts exclusively in infographics.</li>
          <li><strong>Accordion Menus:</strong> If the content inside an accordion or tabbed interface relies on JavaScript to be loaded into the DOM, the bot won't click the button to reveal it. Make sure the text is present in the source HTML, even if CSS hides it visually.</li>
        </ul>

        <h2 className="text-2xl md:text-3xl font-bold text-foreground mt-12 mb-6 tracking-tight">Checking Your Own Site</h2>

        <p>
          The best way to see your site through the eyes of a crawler is to disable JavaScript in your browser and view the raw source. Does it make sense? Are the headings clear? Is the text immediately accessible? 
        </p>
        
        <p>
          If you want a more comprehensive analysis, the Igris Radar AEO Audit specifically mimics the behavior of these AI agents. We strip the payload exactly how they do and score your remaining semantic structure, giving you a clear roadmap for fixing your extraction issues.
        </p>

        <div className="mt-12 pt-8 border-t border-border">
          <Link href="/signup" className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
            Run a simulated AI crawler audit on your site
          </Link>
        </div>
      </article>
    </div>
  );
}
