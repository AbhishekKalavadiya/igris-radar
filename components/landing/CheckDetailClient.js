'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Lock,
  Server,
  Key,
  Package,
  Crosshair,
  FileText,
  Copy,
  Check,
  ArrowRight,
  Globe,
  ChevronRight,
  AlertTriangle,
  HelpCircle,
  Code,
  Terminal,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function CheckDetailClient({ check, relatedChecks }) {
  const router = useRouter();
  const { toast } = useToast();
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopyCode = (key, code) => {
    navigator.clipboard.writeText(code);
    setCopiedKey(key);
    toast({ title: 'Copied to clipboard', description: `${key.toUpperCase()} configuration copied.` });
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="space-y-12">
      {/* ──────────────────────────────────────────────────────────────────────────
          1. HEADER & BREADCRUMBS
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/landing" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/landing/features/security-scanner" className="hover:text-foreground transition-colors">Security Scanner</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/landing/features/security-scanner/checks" className="hover:text-foreground transition-colors">Checks</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground truncate">{check.name}</span>
        </nav>

        <div className="flex flex-wrap items-center gap-2.5 pt-2">
          <Badge variant="outline" className="text-xs font-semibold border-primary/30 text-primary">
            {check.categoryName}
          </Badge>
          <Badge
            variant="secondary"
            className={`text-xs font-bold uppercase tracking-wider ${
              check.severity === 'critical'
                ? 'bg-rose-500/10 text-rose-600'
                : check.severity === 'high'
                ? 'bg-amber-500/10 text-amber-600'
                : 'bg-blue-500/10 text-blue-600'
            }`}
          >
            {check.severity} Severity
          </Badge>
          <Badge variant="secondary" className="text-xs font-medium bg-emerald-500/10 text-emerald-600">
            Free Check
          </Badge>
        </div>

        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground">
          {check.name}
        </h1>
        <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-3xl">
          {check.shortDesc}
        </p>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          2. STANDARDIZED CTAs
      ────────────────────────────────────────────────────────────────────────── */}
      <Card className="p-6 border-border/80 bg-card/60 backdrop-blur-md shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Test Your Website for {check.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Run this check along with 90+ automated tests across your domain.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link href="/signup" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6 h-11 text-sm">
                Run a free scan <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/landing#pricing" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 px-5 text-sm">See pricing</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* ──────────────────────────────────────────────────────────────────────────
          3. WHY IT MATTERS & HOW WE CHECK
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-7 rounded-2xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-500">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-lg font-bold">Why It Matters</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {check.whyItMatters}
          </p>
        </div>

        <div className="p-7 rounded-2xl border border-border bg-card space-y-3">
          <div className="flex items-center gap-2.5 text-primary">
            <Shield className="h-5 w-5" />
            <h2 className="text-lg font-bold">How We Check This</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {check.howWeCheck}
          </p>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          4. TABBED COPY-PASTE CODE REMEDIATION
      ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              How to Fix & Implement
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Copy-paste configuration blocks tailored for your web server or edge proxy.
            </p>
          </div>
        </div>

        <Tabs defaultValue="nginx" className="w-full">
          <TabsList className="p-1 rounded-xl bg-muted/60 mb-3">
            <TabsTrigger value="nginx" className="rounded-lg text-xs font-semibold px-4">Nginx</TabsTrigger>
            <TabsTrigger value="apache" className="rounded-lg text-xs font-semibold px-4">Apache</TabsTrigger>
            <TabsTrigger value="cloudflare" className="rounded-lg text-xs font-semibold px-4">Cloudflare</TabsTrigger>
            <TabsTrigger value="nextjs" className="rounded-lg text-xs font-semibold px-4">Next.js / Node</TabsTrigger>
          </TabsList>

          {['nginx', 'apache', 'cloudflare', 'nextjs'].map((platform) => (
            <TabsContent key={platform} value={platform}>
              <div className="relative rounded-2xl border border-border bg-[#0B1120] text-slate-200 p-5 shadow-xl font-mono text-xs overflow-x-auto">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3 text-slate-400">
                  <div className="flex items-center gap-2">
                    <Terminal className="h-3.5 w-3.5" />
                    <span className="uppercase text-[10px] font-bold tracking-wider">{platform} snippet</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyCode(platform, check.fixes[platform])}
                    className="h-7 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                  >
                    {copiedKey === platform ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <Check className="h-3 w-3" /> Copied
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Copy className="h-3 w-3" /> Copy Code
                      </span>
                    )}
                  </Button>
                </div>
                <pre className="text-emerald-400 whitespace-pre-wrap leading-relaxed">
                  {check.fixes[platform]}
                </pre>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* ──────────────────────────────────────────────────────────────────────────
          5. CONTEXTUAL FREQUENTLY ASKED QUESTIONS
      ────────────────────────────────────────────────────────────────────────── */}
      {check.faqs && check.faqs.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" />
            Frequently Asked Questions
          </h2>

          <div className="space-y-3">
            {check.faqs.map((faq, idx) => (
              <Card key={idx} className="p-5 border-border">
                <h3 className="text-sm font-bold text-foreground mb-1.5">{faq.q}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────────
          6. RELATED SECURITY CHECKS
      ────────────────────────────────────────────────────────────────────────── */}
      {relatedChecks && relatedChecks.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-border/60">
          <h2 className="text-xl font-bold text-foreground">Related Security Checks</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedChecks.map((rel) => (
              <Link
                key={rel.slug}
                href={`/landing/features/security-scanner/checks/${rel.slug}`}
                className="p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-all flex flex-col justify-between group"
              >
                <div>
                  <Badge variant="outline" className="text-[10px] mb-2 font-medium border-primary/20 text-primary">
                    {rel.categoryName}
                  </Badge>
                  <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {rel.name}
                  </h4>
                </div>
                <div className="mt-3 text-xs font-semibold text-primary flex items-center gap-1">
                  <span>View check</span>
                  <ChevronRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
