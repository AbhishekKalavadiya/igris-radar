'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Shield,
  Search,
  Lock,
  Server,
  Key,
  Package,
  Crosshair,
  FileText,
  ArrowRight,
  ChevronRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import JsonLd from '@/components/ui/JsonLd';
import { SECURITY_CHECKS, CHECK_CATEGORIES } from '@/lib/securityChecksData';

export default function SecurityChecksDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');

  const getCategoryIcon = (catId) => {
    switch (catId) {
      case 'headers': return Shield;
      case 'transport': return Lock;
      case 'dns': return Server;
      case 'secrets': return FileText;
      case 'attack-surface': return Crosshair;
      case 'supply-chain': return Package;
      case 'client-auth': return Key;
      case 'compliance': return CheckCircle2;
      default: return Shield;
    }
  };

  const getSeverityBorder = (severity) => {
    switch (severity) {
      case 'critical':
        return 'border-l-rose-500';
      case 'high':
        return 'border-l-amber-500';
      case 'medium':
        return 'border-l-yellow-400';
      case 'low':
      case 'info':
      default:
        return 'border-l-blue-500';
    }
  };

  const filteredChecks = useMemo(() => {
    return SECURITY_CHECKS.filter((check) => {
      const matchesCategory = selectedCategory === 'all' || check.category === selectedCategory;
      const matchesSeverity = selectedSeverity === 'all' || check.severity === selectedSeverity;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        check.name.toLowerCase().includes(q) ||
        check.shortDesc.toLowerCase().includes(q) ||
        check.categoryName.toLowerCase().includes(q) ||
        check.slug.toLowerCase().includes(q);

      return matchesCategory && matchesSeverity && matchesSearch;
    });
  }, [searchQuery, selectedCategory, selectedSeverity]);

  // When viewing "all" with no search query or severity filter, group by category section like SecScanner UI
  const isGroupedView = selectedCategory === 'all' && !searchQuery && selectedSeverity === 'all';

  const categoriesToRender = useMemo(() => {
    return CHECK_CATEGORIES.filter((c) => c.id !== 'all');
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      {/* Breadcrumbs Schema */}
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://igrisradar.com/landing' },
            { '@type': 'ListItem', position: 2, name: 'Security Scanner', item: 'https://igrisradar.com/landing/features/security-scanner' },
            { '@type': 'ListItem', position: 3, name: 'Security Checks', item: 'https://igrisradar.com/landing/features/security-scanner/checks' },
          ],
        }}
      />

      <div className="max-w-6xl mx-auto space-y-12">
        {/* Navigation Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Link href="/landing" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link href="/landing/features/security-scanner" className="hover:text-foreground transition-colors">Security Scanner</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-semibold">98 Security Checks</span>
        </nav>

        {/* Hero Header - SecScanner Style */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground">
            {SECURITY_CHECKS.length} Security Checks
          </h1>
          <p className="text-muted-foreground text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Comprehensive security scanning across TLS, headers, DNS, secrets, attack surface, and supply chain. All {SECURITY_CHECKS.length} checks included on every scan.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
            <span>Need a focused test?</span>
            <Link
              href="/landing/features/security-scanner/checks/https-enforcement"
              className="text-primary hover:underline font-semibold"
            >
              Free SSL Checker &rarr;
            </Link>
            <span>or the</span>
            <Link
              href="/landing/features/security-scanner/checks/tls-version"
              className="text-primary hover:underline font-semibold"
            >
              TLS Version Checker &rarr;
            </Link>
            <span>or</span>
            <Link
              href="/landing/features/security-scanner/checks/subdomain-takeover-detection"
              className="text-primary hover:underline font-semibold"
            >
              Subdomain Takeover Radar &rarr;
            </Link>
          </div>
        </div>

        {/* Search & Filter Bar - Refined & Sleek */}
        <div className="p-4 sm:p-5 rounded-2xl bg-card border border-border/80 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all 98 security checks (e.g. CSP, HSTS, Subdomain, CORS, API keys, SSL, SPF)..."
                className="pl-10 pr-10 h-11 text-sm bg-muted/30 rounded-xl border-border/70 focus-visible:ring-1 focus-visible:ring-primary"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                aria-label="Filter checks by severity level"
                className="h-11 px-3.5 text-xs font-semibold rounded-xl bg-muted/30 border border-border/70 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical Priority (Red)</option>
                <option value="high">High Priority (Orange)</option>
                <option value="medium">Medium Priority (Yellow)</option>
                <option value="low">Low Priority (Blue)</option>
              </select>
            </div>
          </div>

          {/* Category Chips Bar */}
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-border/40">
            {CHECK_CATEGORIES.map((cat) => {
              const Icon = getCategoryIcon(cat.id);
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{cat.name}</span>
                  <span className={`text-[10px] ml-0.5 opacity-80 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                    ({cat.count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter / Filter Indicator */}
        <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>
            Showing <strong>{filteredChecks.length}</strong> of {SECURITY_CHECKS.length} checks
            {selectedCategory !== 'all' && (
              <> in <strong>{CHECK_CATEGORIES.find(c => c.id === selectedCategory)?.name}</strong></>
            )}
            {selectedSeverity !== 'all' && (
              <> with <strong>{selectedSeverity}</strong> severity</>
            )}
            {searchQuery && (
              <> matching &quot;<strong>{searchQuery}</strong>&quot;</>
            )}
          </span>

          {(selectedCategory !== 'all' || selectedSeverity !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSeverity('all');
                setSearchQuery('');
              }}
              className="text-primary hover:underline font-medium cursor-pointer"
            >
              Reset to default grouped view
            </button>
          )}
        </div>

        {/* MAIN CHECKS DISPLAY */}
        {isGroupedView ? (
          /* Grouped by Category - EXACT SecScanner UI Layout */
          <div className="space-y-12">
            {categoriesToRender.map((category) => {
              const CategoryIcon = getCategoryIcon(category.id);
              const categoryChecks = SECURITY_CHECKS.filter((c) => c.category === category.id);
              if (categoryChecks.length === 0) return null;

              return (
                <section key={category.id} className="space-y-4">
                  {/* Category Header */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl border border-border/80 bg-card flex items-center justify-center text-primary shadow-xs shrink-0 mt-0.5">
                      <CategoryIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-foreground tracking-tight">
                          {category.name}
                        </h2>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {categoryChecks.length} checks
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                        {category.desc}
                      </p>
                    </div>
                  </div>

                  {/* 3-Column Compact Card Grid - SecScanner Style */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                    {categoryChecks.map((check) => {
                      const severityBorder = getSeverityBorder(check.severity);
                      return (
                        <Link
                          key={check.slug}
                          href={`/landing/features/security-scanner/checks/${check.slug}`}
                          className={`rounded-xl border border-slate-200 dark:border-slate-800/80 bg-card p-4 sm:p-4.5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all border-l-4 ${severityBorder} group flex flex-col justify-between`}
                        >
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                              {check.name}
                            </h3>
                            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {check.shortDesc}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          /* Filtered / Search Results View - Same Compact Card Style */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredChecks.map((check) => {
              const severityBorder = getSeverityBorder(check.severity);
              return (
                <Link
                  key={check.slug}
                  href={`/landing/features/security-scanner/checks/${check.slug}`}
                  className={`rounded-xl border border-slate-200 dark:border-slate-800/80 bg-card p-4 sm:p-4.5 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all border-l-4 ${severityBorder} group flex flex-col justify-between`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {check.categoryName}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {check.severity}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors leading-snug">
                      {check.name}
                    </h3>
                    <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {check.shortDesc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {filteredChecks.length === 0 && (
          <div className="py-16 text-center rounded-2xl border border-dashed border-border bg-card/40">
            <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-base font-bold text-foreground">No matching checks found</h3>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              No security checks matched your filter query. Try searching for broader terms like &quot;TLS&quot;, &quot;header&quot;, &quot;DNS&quot;, or &quot;cookie&quot;.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedSeverity('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}

        {/* Bottom CTA Block - Standardized (NO DOMAIN INPUT) */}
        <div className="p-8 sm:p-12 rounded-3xl border border-border bg-card/90 backdrop-blur-md shadow-xl text-center space-y-6 mt-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
            <Shield className="h-3.5 w-3.5" /> All {SECURITY_CHECKS.length} Automated Checks Included
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-tight max-w-2xl mx-auto">
            Audit Your Website for All {SECURITY_CHECKS.length} Vulnerabilities
          </h2>

          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Run an instant automated scan covering TLS certificates, HTTP security headers, DNS records, API key leakage, and dangling subdomain takeovers.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/signup">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 h-12 text-base shadow-md cursor-pointer">
                Run a free scan <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
            <Link href="/landing#pricing">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base cursor-pointer">
                See pricing
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground pt-3">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              No credit card required
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Instant scan in 30 seconds
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              Remediation code for Nginx, Apache & Next.js
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
