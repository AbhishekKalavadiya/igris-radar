'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, AlertTriangle, CheckCircle2, FileText } from 'lucide-react';

/**
 * Renders the multi-page crawl result: a summary strip plus a per-page table of
 * the on-page signals gathered during the site-wide audit. Shared by the SEO,
 * AEO and GEO pages (DRY).
 *
 * @param {{ crawlData: { pagesCrawled: number, errors: number, pages?: Array } }} props
 */
export default function CrawlSummary({ crawlData }) {
  if (!crawlData) {
    return (
      <Card className="glass-card">
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Enable <span className="text-foreground font-medium">Multi-page Crawl</span> before running a scan to audit your whole site.
        </CardContent>
      </Card>
    );
  }

  const pages = crawlData.pages || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="glass-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <Globe className="h-5 w-5 text-primary" />
            <div>
              <div className="text-lg font-bold text-foreground">{crawlData.pagesCrawled}</div>
              <div className="text-xs text-muted-foreground">Pages crawled</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-subtle">
          <CardContent className="p-4 flex items-center gap-3">
            <AlertTriangle className={`h-5 w-5 ${crawlData.errors > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
            <div>
              <div className="text-lg font-bold text-foreground">{crawlData.errors}</div>
              <div className="text-xs text-muted-foreground">Crawl errors</div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-subtle col-span-2 sm:col-span-1">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <div className="text-lg font-bold text-foreground">
                {pages.length ? Math.round(pages.reduce((a, p) => a + (p.wordCount || 0), 0) / pages.length) : 0}
              </div>
              <div className="text-xs text-muted-foreground">Avg. words / page</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {pages.length > 0 && (
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-sm">Crawled Pages</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground border-b border-border">
                    <th className="px-4 py-2 font-semibold">Page</th>
                    <th className="px-4 py-2 font-semibold">Status</th>
                    <th className="px-4 py-2 font-semibold">Words</th>
                    <th className="px-4 py-2 font-semibold">H1</th>
                    <th className="px-4 py-2 font-semibold">Meta</th>
                    <th className="px-4 py-2 font-semibold">Alt gaps</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p, i) => {
                    let pathLabel = p.url;
                    try { pathLabel = new URL(p.url).pathname || '/'; } catch {}
                    const ok = p.statusCode >= 200 && p.statusCode < 300;
                    return (
                      <tr key={i} className="border-b border-border/50 last:border-0">
                        <td className="px-4 py-2 max-w-[280px] truncate">
                          <span className="text-foreground" title={p.url}>{pathLabel}</span>
                          {p.title && <div className="text-xs text-muted-foreground truncate">{p.title}</div>}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant="outline" className={`text-[10px] py-0 ${ok ? 'text-success' : 'text-destructive'}`}>{p.statusCode}</Badge>
                        </td>
                        <td className={`px-4 py-2 font-mono ${p.wordCount < 300 ? 'text-warning' : 'text-muted-foreground'}`}>{p.wordCount}</td>
                        <td className="px-4 py-2 font-mono text-muted-foreground">{p.h1Count}</td>
                        <td className="px-4 py-2">
                          {p.hasMetaDescription
                            ? <CheckCircle2 className="h-4 w-4 text-success" />
                            : <AlertTriangle className="h-4 w-4 text-warning" />}
                        </td>
                        <td className={`px-4 py-2 font-mono ${p.imagesMissingAlt > 0 ? 'text-warning' : 'text-muted-foreground'}`}>{p.imagesMissingAlt}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
