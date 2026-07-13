import Link from 'next/link';
import { ArrowRight, BookOpen, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Reveal, Stagger, MotionItem } from '@/components/ui/motion';
import JsonLd from '@/components/ui/JsonLd';
import { breadcrumbJsonLd } from '@/lib/seo';

export const metadata = {
  title: 'Blog | Igris Radar',
  description: 'Insights on AI search visibility, Answer Engine Optimization (AEO), and website security.',
};

const POSTS = [
  {
    slug: 'why-is-my-new-website-not-getting-traffic',
    title: 'Why Is My New Website Not Getting Any Organic Traffic?',
    excerpt: "Frustrated that your new domain isn't ranking? Learn the top 5 reasons new websites fail to get organic traffic and the exact 7-day checklist to fix it.",
    date: 'July 15, 2026',
    readTime: '8 min read',
    category: 'Guide'
  },
  {
    slug: 'what-is-answer-engine-optimization',
    title: "What Is AEO? Here's What Our Scanner Found Across 500 Sites",
    excerpt: "Everything you need to know about AEO, why it matters in the age of AI search, and how to get started.",
    date: 'July 14, 2026',
    readTime: '6 min read',
  },
  {
    slug: 'does-llms-txt-actually-do-anything',
    title: 'Does llms.txt Actually Do Anything? What We Found',
    excerpt: "We analyzed the impact of publishing an llms.txt file on AI crawler ingestion rates and visibility. Here is what the data says.",
    date: 'July 14, 2026',
    readTime: '7 min read',
  },
  {
    slug: 'how-ai-crawlers-read-your-site',
    title: 'How AI Crawlers Read Your Site (GPTBot, ClaudeBot, PerplexityBot)',
    excerpt: 'An inside look at how AI agents parse your HTML, what they ignore, and how to structure your code for maximum extraction.',
    date: 'July 13, 2026',
    readTime: '5 min read',
  },
  {
    slug: 'why-ranking-1-doesnt-drive-traffic',
    title: "Why isn't ranking #1 driving traffic anymore?",
    excerpt: "Search didn't die. It stopped sending clicks. Learn why winning in AI search means optimizing for citations, not just rankings.",
    date: 'July 13, 2026',
    readTime: '4 min read',
  },
  {
    slug: 'how-to-check-if-chatgpt-cites-you',
    title: 'How to check if ChatGPT cites your website',
    excerpt: "Millions of users ask ChatGPT for recommendations. Here is how you can check if your brand is the one it recommends.",
    date: 'July 10, 2026',
    readTime: '5 min read',
  },
  {
    slug: 'aeo-vs-geo-vs-seo-difference',
    title: "AEO vs GEO vs SEO, what's the difference?",
    excerpt: 'SEO earns rankings, AEO earns the extracted answer, and GEO earns the citation. We break down the differences and signals for each.',
    date: 'July 5, 2026',
    readTime: '5 min read',
  },
  {
    slug: 'how-to-show-up-in-perplexity-ai-overviews',
    title: 'How to make your site show up in Perplexity / AI Overviews',
    excerpt: 'The strategies and technical changes you need to get your content sourced in Perplexity AI and Google AI Overviews.',
    date: 'June 28, 2026',
    readTime: '6 min read',
  },
];

export default function BlogIndexPage() {
  return (
    <div>
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', path: '/landing' }, { name: 'Blog', path: '/landing/blog' }])} />
      
      <section className="relative overflow-hidden border-b border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
              <BookOpen className="h-3.5 w-3.5" /> Igris Radar Blog
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
              Insights on AI Search Visibility
            </h1>
            <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              Expert guides, strategies, and technical insights on optimizing your website for answer engines, generative AI, and traditional search.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <Stagger className="grid md:grid-cols-2 gap-6">
          {POSTS.map((post) => (
            <MotionItem key={post.slug}>
              <Link href={`/landing/blog/${post.slug}`} className="group block h-full">
                <div className="h-full rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 flex flex-col">
                  <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground mb-4">
                    <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> {post.date}</span>
                    <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {post.readTime}</span>
                  </div>
                  <h2 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground mt-4 leading-relaxed flex-1">
                    {post.excerpt}
                  </p>
                  <div className="mt-6 inline-flex items-center text-sm font-semibold text-primary">
                    Read article <ArrowRight className="h-4 w-4 ml-1.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </div>
                </div>
              </Link>
            </MotionItem>
          ))}
        </Stagger>
      </section>
    </div>
  );
}
