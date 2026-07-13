import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Sparkles, Search, Globe, Activity, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Igris Radar Knowledge Base | Igris',
  description: 'Explore our comprehensive knowledge base covering Security, AEO, GEO, and Technical SEO to optimize your digital presence.',
};

const CATEGORIES = [
  {
    title: 'Security & Integrity',
    description: 'Learn about domain reputation, DMARC, SSL, and keeping your web properties secure.',
    icon: Shield,
    color: 'text-igris-teal',
    bg: 'bg-igris-teal-light/20',
    articles: [
      {
        title: 'Understanding Domain Reputation for Email Security',
        href: '/learn/understanding-domain-reputation-for-email-security',
      },
      {
        title: 'What is a DMARC Policy and Why is it Critical?',
        href: '/learn/what-is-a-dmarc-policy',
      },
      {
        title: 'Glossary: What is an SPF Record?',
        href: '/learn/what-is-an-spf-record',
      },
      {
        title: 'Glossary: What is an SSL Certificate?',
        href: '/learn/what-is-an-ssl-certificate',
      }
    ]
  },
  {
    title: 'AI Engine Optimization (AEO)',
    description: 'Master the strategies needed to rank your content in AI-driven search engines like ChatGPT and Gemini.',
    icon: Sparkles,
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
    articles: [
      {
        title: 'How 404 Errors Impact AI Engine Optimization (AEO)',
        href: '/learn/what-is-a-404-error-and-how-it-affects-aeo',
      },
      {
        title: 'Optimizing Content for LLM Crawlers',
        href: '/learn/optimizing-content-for-llm-crawlers',
      },
      {
        title: 'Glossary: What is a Knowledge Graph?',
        href: '/learn/what-is-a-knowledge-graph',
      }
    ]
  },
  {
    title: 'Generative Engine Optimization (GEO)',
    description: 'Techniques for ensuring your brand is accurately represented in generative AI responses.',
    icon: Globe,
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
    articles: [
      {
        title: 'Brand Entity Recognition in Generative AI',
        href: '/learn/brand-entity-recognition-in-generative-ai',
      }
    ]
  },
  {
    title: 'Technical SEO',
    description: 'Deep dive into traditional search engine optimization, crawling, and indexing.',
    icon: Search,
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
    articles: [
      {
        title: 'Core Web Vitals and Ranking Factors',
        href: '/learn/core-web-vitals-and-ranking-factors',
      },
      {
        title: 'Glossary: What is a Canonical Tag?',
        href: '/learn/what-is-a-canonical-tag',
      }
    ]
  }
];

export default function LearnIndexPage() {
  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Igris Radar <span className="text-igris-primary">Knowledge Base</span>
        </h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about Security, AEO, GEO, and Technical SEO to build a resilient and highly visible digital presence.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
        {CATEGORIES.map((category) => (
          <Card key={category.title} className="flex flex-col h-full border-border/50 hover:border-primary/50 transition-colors shadow-sm hover:shadow-md">
            <CardHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${category.bg}`}>
                  <category.icon className={`h-6 w-6 ${category.color}`} />
                </div>
                <CardTitle className="text-xl">{category.title}</CardTitle>
              </div>
              <CardDescription className="text-base">{category.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <ul className="space-y-3">
                {category.articles.map((article, index) => (
                  <li key={index}>
                    {article.href !== '#' ? (
                      <Link 
                        href={article.href}
                        className="group flex items-start gap-2 text-sm font-medium hover:text-primary transition-colors"
                      >
                        <ArrowRight className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="leading-tight">{article.title}</span>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-muted-foreground/60 cursor-not-allowed">
                        <ArrowRight className="h-4 w-4 mt-0.5 shrink-0" />
                        <span className="leading-tight">{article.title} (Coming Soon)</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rules Dictionary Link */}
      <div className="pt-8">
        <Card className="bg-primary/5 border-primary/20 hover:border-primary/50 transition-colors shadow-sm">
          <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
            <div>
              <h3 className="text-2xl font-bold mb-2">Rules Dictionary</h3>
              <p className="text-muted-foreground">
                Browse our complete A-Z database of over 100 security vulnerabilities, SEO technical issues, and AI optimization rules detected by Igris Radar.
              </p>
            </div>
            <Link 
              href="/learn/rules" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 shrink-0"
            >
              Browse Dictionary
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
