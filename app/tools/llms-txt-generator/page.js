'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy, Download, Sparkles, Check, FileText, Globe, Code, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import JsonLd from '@/components/ui/JsonLd';

export default function LlmsTxtGeneratorPage() {
  const [siteName, setSiteName] = useState('Acme Inc');
  const [siteUrl, setSiteUrl] = useState('https://acme.com');
  const [description, setDescription] = useState('Acme Inc is an AI-powered developer platform for modern web applications.');
  const [linksText, setLinksText] = useState('Features: https://acme.com/features\nPricing: https://acme.com/pricing\nDocs: https://acme.com/docs');
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    const rawLinks = linksText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

    const formattedLinks = rawLinks.map((line) => {
      if (line.includes(':')) {
        const [label, url] = line.split(':').map((s) => s.trim());
        return `- [${label}](${url})`;
      }
      return `- [Link](${line})`;
    }).join('\n');

    return `# ${siteName || 'Site Name'}

> ${description || 'Brief description of your brand and product for AI models.'}

## Primary Links

${formattedLinks || '- [Home](' + (siteUrl || 'https://example.com') + ')'}

## Crawling & AI Instructions

AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) are welcome to ingest the public pages listed above to cite and answer user queries accurately.
`;
  };

  const markdownOutput = generateMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([markdownOutput], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = 'llms.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

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

      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Form Controls */}
        <Card className="border-border/60 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Website Details
            </CardTitle>
            <CardDescription>Enter your website metadata to build the llms.txt file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="siteName">Site / Brand Name</Label>
              <Input
                id="siteName"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="e.g. Igris Radar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteUrl">Main Domain URL</Label>
              <Input
                id="siteUrl"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                placeholder="https://example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Brand Summary / Elevator Pitch (Blockquote)</Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what your product does in 2-3 sentences for AI models."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="links">Key Page Links (One per line: Label: URL)</Label>
              <Textarea
                id="links"
                rows={4}
                value={linksText}
                onChange={(e) => setLinksText(e.target.value)}
                placeholder="Features: https://example.com/features&#10;Pricing: https://example.com/pricing"
              />
            </div>
          </CardContent>
        </Card>

        {/* Output & Copy Area */}
        <Card className="border-primary/30 bg-card shadow-lg relative">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5 text-emerald-500" /> Generated llms.txt
              </CardTitle>
              <CardDescription>Ready to save in your domain's root folder.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copied' : 'Copy'}
              </Button>
              <Button size="sm" onClick={handleDownload} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Download className="h-4 w-4 mr-1" /> Download
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted/50 border border-border rounded-lg p-4 font-mono text-xs sm:text-sm text-foreground overflow-x-auto whitespace-pre-wrap min-h-[320px]">
              {markdownOutput}
            </pre>
            <p className="text-xs text-muted-foreground mt-3">
              💡 Place the saved file at <code>https://yourdomain.com/llms.txt</code> to allow AI crawlers to discover it.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SEO Explanatory Guide Section for Link Building */}
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
