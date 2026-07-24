import Link from 'next/link';
import { Sparkles, FileText, ArrowRight, ShieldCheck, SearchCheck, Code, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Free Web & AI Developer Tools | Igris Radar',
  description: 'Free interactive developer & SEO micro-tools: llms.txt generator, canonical tag checker, security header validator, and AI search readiness checkers.',
  path: '/tools',
  keywords: ['free developer tools', 'llms.txt generator', 'SEO micro-tools', 'security header checker', 'AEO tools'],
});

const TOOLS = [
  {
    title: 'Free llms.txt Generator',
    description: 'Generate a clean, standardized llms.txt markdown file for your domain in seconds to guide ChatGPT, Claude, and Perplexity crawlers.',
    href: '/tools/llms-txt-generator',
    icon: FileText,
    badge: 'Popular',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    title: 'AI Brand Visibility Radar',
    description: 'Query live AI engines (ChatGPT, Claude, Perplexity, Gemini) with your custom buyer prompts to check if your brand is recommended.',
    href: '/landing/features/brand-visibility',
    icon: Sparkles,
    badge: 'Core Feature',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    title: 'Web Risk & Security Scanner',
    description: 'Run 90+ automated DAST security checks: HTTP headers, exposed API secrets, vulnerable dependencies, and subdomain takeover risks.',
    href: '/landing/features/security-scanner',
    icon: Lock,
    badge: 'Security',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    title: 'Technical SEO & Indexing Audit',
    description: 'Check canonical tags, sitemap validation, crawlability, and Core Web Vitals performance across your entire domain.',
    href: '/landing/features/seo-audit',
    icon: SearchCheck,
    badge: 'SEO',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
];

export default function ToolsIndexPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Free Tools', path: '/tools' },
      ])} />

      <div className="text-center max-w-3xl mx-auto space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Code className="h-3.5 w-3.5" /> Free Developer Utilities
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Free <span className="text-primary">SEO & Security</span> Micro-Tools
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Interactive micro-tools and audit engines designed for developers, founders, and SEO specialists to optimize for search engines and generative AI.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {TOOLS.map((tool) => (
          <Card key={tool.title} className="flex flex-col h-full border-border/60 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md group">
            <CardHeader>
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2.5 rounded-lg ${tool.bg}`}>
                  <tool.icon className={`h-6 w-6 ${tool.color}`} />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {tool.badge}
                </span>
              </div>
              <CardTitle className="text-2xl group-hover:text-primary transition-colors">{tool.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed mt-2">{tool.description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto pt-4 border-t border-border/40">
              <Button asChild variant="ghost" className="w-full justify-between group-hover:bg-primary/5">
                <Link href={tool.href}>
                  <span>Launch Tool</span>
                  <ArrowRight className="h-4 w-4 text-primary group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
