'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Globe,
  Search,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ArrowRight,
  Filter,
  BarChart3,
  Award,
  Lock,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import JsonLd from '@/components/ui/JsonLd';
import { TOP_DOMAINS, DOMAIN_CATEGORIES } from '@/lib/topDomainsSecurityData';

export default function ReportsDirectoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredDomains = useMemo(() => {
    return TOP_DOMAINS.filter((d) => {
      const matchesCategory = selectedCategory === 'all' || d.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.domain.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      {/* Schema.org Breadcrumbs */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://igrisradar.com/landing' },
            { '@type': 'ListItem', position: 2, name: 'Security Scanner', item: 'https://igrisradar.com/landing/features/security-scanner' },
            { '@type': 'ListItem', position: 3, name: 'Reports', item: 'https://igrisradar.com/landing/features/security-scanner/reports' },
          ],
        }}
      />

      <div className="max-w-6xl mx-auto space-y-10">
        {/* Navigation Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/landing" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/landing/features/security-scanner" className="hover:text-foreground transition-colors">Security Scanner</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">Domain Reports</span>
        </nav>

        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            <Globe className="h-3.5 w-3.5" /> Industry Benchmarks
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Top 50 Domain Security Reports
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
            Automated external security assessments for the world's most prominent websites. See how industry leaders configure TLS, security headers, and domain trust.
          </p>
        </div>

        {/* Benchmark Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-5 border-border bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Industry Score</span>
            <div className="text-3xl font-extrabold text-foreground mt-1">84/100</div>
            <p className="text-xs text-muted-foreground mt-1">Across 50 top evaluated domains</p>
          </Card>
          <Card className="p-5 border-border bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Strongest Category</span>
            <div className="text-3xl font-extrabold text-emerald-500 mt-1">Transport/TLS</div>
            <p className="text-xs text-muted-foreground mt-1">96% of domains enforce TLS 1.3 & HTTPS</p>
          </Card>
          <Card className="p-5 border-border bg-card">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Most Common Weakness</span>
            <div className="text-3xl font-extrabold text-amber-500 mt-1">CSP Directives</div>
            <p className="text-xs text-muted-foreground mt-1">62% allow unsafe-inline in script-src</p>
          </Card>
        </div>

        {/* Search & Category Filter */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-4 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search domains (e.g. Stripe, GitHub, Google, Vercel, Shopify)..."
              className="pl-10 h-11 text-sm bg-muted/30 rounded-xl"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
            {DOMAIN_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Domain Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDomains.map((d) => (
            <Link
              key={d.slug}
              href={`/landing/features/security-scanner/reports/${d.slug}`}
              className="p-6 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={`https://www.google.com/s2/favicons?domain=${d.domain}&sz=64`}
                      alt={d.name}
                      className="h-10 w-10 rounded-xl p-1 bg-muted object-contain shrink-0"
                    />
                    <div>
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                        {d.name}
                      </h3>
                      <p className="text-xs text-muted-foreground">{d.domain}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-2xl font-black ${
                      d.score >= 85 ? 'text-emerald-500' : d.score >= 70 ? 'text-blue-500' : 'text-amber-500'
                    }`}>
                      {d.score}%
                    </span>
                    <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                      Grade {d.grade}
                    </div>
                  </div>
                </div>

                {/* Status Counters */}
                <div className="grid grid-cols-3 gap-1.5 py-2.5 px-3 rounded-xl bg-muted/30 border border-border/40 text-center mb-3 text-xs">
                  <div>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{d.summary.passed}</span>
                    <p className="text-[10px] text-muted-foreground">Passed</p>
                  </div>
                  <div>
                    <span className="font-bold text-amber-600 dark:text-amber-400">{d.summary.warning}</span>
                    <p className="text-[10px] text-muted-foreground">Warnings</p>
                  </div>
                  <div>
                    <span className="font-bold text-rose-600 dark:text-rose-400">{d.summary.failed}</span>
                    <p className="text-[10px] text-muted-foreground">Failed</p>
                  </div>
                </div>

                {/* Highlights */}
                <div className="space-y-1 text-xs text-muted-foreground">
                  {d.highlights.slice(0, 2).map((h, i) => (
                    <div key={i} className="flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      <span className="truncate">{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-primary">
                <span>View Full Audit & Topology Graph</span>
                <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* Scan Your Own Site Card */}
        <div className="p-8 rounded-2xl border border-border bg-card/80 backdrop-blur-md shadow-xl text-center space-y-4 mt-12">
          <h2 className="text-2xl font-bold text-foreground">How Does Your Website Compare?</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Scan your own domain to see your security score and complete interactive topology graph.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-7 h-12 text-base">
                Run a free scan <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/landing#pricing">
              <Button size="lg" variant="outline" className="h-12 px-7 text-base">See pricing</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
