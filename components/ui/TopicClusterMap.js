'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Network, Database, FileText } from 'lucide-react';

/**
 * Renders the real internal-link topic-cluster graph produced by the multi-page
 * crawl (crawlData.linkGraph). The hub is the most-linked-to page; satellites
 * are the other crawled pages, positioned radially, colored by content depth,
 * with lines drawn for the actual internal links between them.
 */
export default function TopicClusterMap({ crawlData }) {
  const graph = crawlData?.linkGraph;

  if (!crawlData || !graph || !graph.nodes?.length) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Network className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Topic Cluster Map</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Check the &quot;Multi-page Crawl&quot; box before running a scan to map how this page connects to other topics on the domain.
          </p>
        </CardContent>
      </Card>
    );
  }

  const norm = (u) => { try { const x = new URL(u); x.hash = ''; const s = x.toString(); return s.endsWith('/') ? s.slice(0, -1) : s; } catch { return u; } };
  const shortLabel = (n) => { try { const p = new URL(n.url).pathname; return p === '/' ? 'Home' : p.replace(/\/$/, '').split('/').pop() || p; } catch { return n.title; } };

  // Hub = most linked-to page. Satellites = the rest (cap for legibility).
  const sorted = [...graph.nodes].sort((a, b) => b.inbound - a.inbound);
  const hub = sorted[0];
  const satellites = sorted.slice(1, 13);
  const hubKey = norm(hub.url);

  // Radial layout in a 100x100 coordinate space (matches the SVG viewBox).
  const R = 38, cx = 50, cy = 50;
  const positioned = satellites.map((n, i) => {
    const angle = (-90 + (i * 360) / Math.max(1, satellites.length)) * (Math.PI / 180);
    return { node: n, x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle), key: norm(n.url) };
  });
  const posByKey = new Map(positioned.map(p => [p.key, p]));
  posByKey.set(hubKey, { x: cx, y: cy, key: hubKey });

  // Draw an edge only when both endpoints are on the map.
  const edgeLines = (graph.edges || [])
    .map(([from, to]) => ({ a: posByKey.get(from), b: posByKey.get(to) }))
    .filter(e => e.a && e.b && e.a.key !== e.b.key);

  const colorFor = (n) => {
    if (n.inbound === 0) return { ring: 'border-destructive/50', text: 'text-destructive', dot: 'bg-destructive' };
    if ((n.wordCount || 0) < 300) return { ring: 'border-warning/50', text: 'text-warning', dot: 'bg-warning' };
    return { ring: 'border-scanner-geo/50', text: 'text-scanner-geo', dot: 'bg-scanner-geo' };
  };

  const orphanCount = graph.nodes.filter(n => norm(n.url) !== hubKey && n.inbound === 0).length;
  const thinCount = graph.nodes.filter(n => (n.wordCount || 0) < 300).length;

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg text-scanner-geo">Topic Cluster Map</CardTitle>
        <CardDescription>Internal-link hubs and content depth across the crawled pages.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative w-full mx-auto" style={{ maxWidth: 520, aspectRatio: '1 / 1' }}>
          {/* Edges */}
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {edgeLines.map((e, i) => (
              <line key={i} x1={e.a.x} y1={e.a.y} x2={e.b.x} y2={e.b.y}
                stroke="currentColor" strokeWidth="0.3" className="text-scanner-geo/25" />
            ))}
          </svg>

          {/* Hub */}
          <div className="absolute -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center bg-scanner-geo/10 border-2 border-scanner-geo rounded-full px-4 py-3"
            style={{ left: `${cx}%`, top: `${cy}%` }}>
            <Database className="h-6 w-6 text-scanner-geo" />
            <span className="text-[11px] font-bold text-foreground mt-1 max-w-[90px] truncate" title={hub.url}>{shortLabel(hub)}</span>
            <span className="text-[9px] text-scanner-geo">Hub · {hub.inbound} links in</span>
          </div>

          {/* Satellites */}
          {positioned.map(({ node, x, y }, i) => {
            const c = colorFor(node);
            return (
              <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: `${x}%`, top: `${y}%` }}>
                <div className={`bg-card border ${c.ring} rounded-full p-2.5`}>
                  <FileText className={`h-4 w-4 ${c.text}`} />
                </div>
                <span className="text-[10px] text-muted-foreground text-center max-w-[80px] truncate mt-1" title={node.url}>{shortLabel(node)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground bg-white/5 rounded-md p-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-scanner-geo" /> Deep content</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning" /> Thin ({thinCount})</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> Orphan ({orphanCount})</span>
          </div>
          <div className="font-mono">
            {crawlData.pagesCrawled} pages · {graph.edges?.length || 0} internal links
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
