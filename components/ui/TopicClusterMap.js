'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Network, Database, FileText } from 'lucide-react';

export default function TopicClusterMap({ crawlData, topicScore }) {
  if (!crawlData) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <Network className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">Topic Cluster Map</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Check the "Multi-page Crawl" box before running a scan to map out how this page connects to other topics on the domain.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Simplified visual representation using basic divs and connecting borders
  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-scanner-geo">Topic Cluster Map</CardTitle>
            <CardDescription>
              Visual representation of internal link hubs and content depth.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-black/20 border border-white/5 rounded-xl p-8 flex flex-col items-center justify-center relative min-h-[300px]">
          
          {/* Hub Node */}
          <div className="relative z-10 flex flex-col items-center z-10 bg-scanner-geo/10 border-2 border-scanner-geo rounded-full p-6 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Database className="h-8 w-8 text-scanner-geo mb-2" />
            <span className="text-sm font-bold text-foreground">Core Topic Hub</span>
            <span className="text-xs text-scanner-geo">Target URL</span>
          </div>

          {/* Connection Lines (Simulated with CSS borders) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 border border-dashed border-scanner-geo/30 rounded-[100px] z-0" />
          
          {/* Satellite Nodes */}
          <div className="absolute top-[10%] left-[20%] flex flex-col items-center">
            <div className="bg-card border border-scanner-geo/40 rounded-full p-4 mb-2">
              <FileText className="h-5 w-5 text-scanner-geo" />
            </div>
            <span className="text-xs text-muted-foreground text-center max-w-[100px]">Linked Subtopic</span>
          </div>

          <div className="absolute top-[10%] right-[20%] flex flex-col items-center">
            <div className="bg-card border border-scanner-geo/40 rounded-full p-4 mb-2">
              <FileText className="h-5 w-5 text-scanner-geo" />
            </div>
            <span className="text-xs text-muted-foreground text-center max-w-[100px]">Related Guide</span>
          </div>

          <div className="absolute bottom-[10%] left-[30%] flex flex-col items-center">
            <div className="bg-card border border-warning/40 rounded-full p-3 mb-2 opacity-70">
              <FileText className="h-4 w-4 text-yellow-400" />
            </div>
            <span className="text-[10px] text-muted-foreground text-center max-w-[80px]">Thin Subtopic</span>
          </div>
          
          <div className="absolute bottom-[10%] right-[30%] flex flex-col items-center">
            <div className="bg-card border border-destructive/40 rounded-full p-3 mb-2 opacity-50 border-dashed">
              <FileText className="h-4 w-4 text-red-400" />
            </div>
            <span className="text-[10px] text-muted-foreground text-center max-w-[80px]">Missing Pillar</span>
          </div>

        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground bg-white/5 rounded-md p-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-scanner-geo"></span> Deep Content</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning"></span> Thin Content</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive"></span> Content Gap</span>
          </div>
          <div className="font-mono">
            Pages crawled: <span className="text-foreground font-bold">{crawlData.pagesCrawled}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
