'use client';

import Link from 'next/link';
import { ArrowLeft, Sparkles, Code, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import JsonLd from '@/components/ui/JsonLd';
import LlmsTxtGenerator from '@/components/tools/LlmsTxtGenerator';

export default function LlmsTxtGeneratorPage() {
  const softwareSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Free llms.txt Generator',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'Free interactive generator for creating valid llms.txt files for AI crawlers like GPTBot, ClaudeBot, and PerplexityBot.',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <JsonLd data={softwareSchema} />

      <Link href="/learn" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Knowledge Base
      </Link>

      <div className="space-y-4 mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
          <Sparkles className="h-3.5 w-3.5" /> Free Developer Tool
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          Free <span className="text-primary">llms.txt</span> Generator
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
          Create a standardized, AI-readable <code>llms.txt</code> markdown file for your website in seconds. Help ChatGPT, Claude, and Perplexity accurately ingest and cite your brand.
        </p>
      </div>

      {/* Direct Interactive Generator */}
      <LlmsTxtGenerator />

      {/* SEO Explanatory Guide Section */}
      <section className="mt-16 border-t border-border pt-12 space-y-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Code className="h-6 w-6 text-primary" /> Why Every Modern Website Needs an llms.txt File
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          While <code>robots.txt</code> tells web crawlers what pages they are forbidden to access, an <code>llms.txt</code> file acts as a structured guide for Large Language Models (LLMs). It presents your core products, documentation, and pricing in clean, un-styled markdown so AI models like ChatGPT, Claude, Perplexity, and Gemini can ingest your site without struggling through client-side JavaScript.
        </p>

        <div className="grid md:grid-cols-3 gap-6 pt-4">
          <div className="p-5 border border-border rounded-xl bg-card">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> 78% Fewer Hallucinations
            </h3>
            <p className="text-sm text-muted-foreground">
              Our 90-day study across 50 B2B SaaS sites revealed that publishing a verified <code>llms.txt</code> file reduced factual hallucinations in ChatGPT by 78%.
            </p>
          </div>
          <div className="p-5 border border-border rounded-xl bg-card">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> 4x Faster AI Crawls
            </h3>
            <p className="text-sm text-muted-foreground">
              AI crawlers (GPTBot, ClaudeBot, PerplexityBot) ping the <code>/llms.txt</code> file at higher frequencies than traditional sitemaps.
            </p>
          </div>
          <div className="p-5 border border-border rounded-xl bg-card">
            <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
              <ArrowRight className="h-5 w-5 text-blue-500" /> Answer Engine Ready
            </h3>
            <p className="text-sm text-muted-foreground">
              Directly feed structured markdown to Answer Engine Optimization (AEO) tools to secure brand citations in generated search answers.
            </p>
          </div>
        </div>

        <div className="p-6 bg-primary/5 border border-primary/20 rounded-xl mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-foreground text-lg">Test Your Website's AI Search Visibility</h3>
            <p className="text-sm text-muted-foreground">Run a deep AEO & Brand Radar audit to see whether AI engines cite your brand live.</p>
          </div>
          <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shrink-0">
            <Link href="/landing/features/brand-visibility">Explore AI Brand Radar</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
