'use client';

import { useState } from 'react';
import { Copy, Download, Sparkles, Check, FileText, Globe, Code, ShieldCheck, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export default function LlmsTxtGenerator() {
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

  return (
    <div className="space-y-8 my-8">
      <div className="grid lg:grid-cols-2 gap-8 items-start">
        {/* Form Controls */}
        <Card className="border-border/60 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" /> Instant Generator (No Signup Required)
            </CardTitle>
            <CardDescription>Fill in your website details below to build your llms.txt file live.</CardDescription>
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
                <FileText className="h-5 w-5 text-emerald-500" /> Live llms.txt Markdown Output
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
              💡 Save this file as <code>llms.txt</code> and upload it to <code>https://yourdomain.com/llms.txt</code>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
