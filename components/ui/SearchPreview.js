'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Bot, Search } from 'lucide-react';

export default function SearchPreview({ title, url, description, author, date, mode = 'both' }) {
  const isSeoMode = mode === 'seo' || mode === 'both';
  const isAeoMode = mode === 'aeo' || mode === 'both';

  const defaultTab = isSeoMode ? 'serp' : 'ai';

  const serpPreview = (
    <div className="space-y-1">
      <div className="mb-2">
        <span className="text-foreground font-medium">Your Site Name</span>
        <span className="mx-2 text-muted-foreground">·</span>
        <span className="text-muted-foreground text-xs truncate max-w-[200px]">{url}</span>
      </div>
      <h3 className="text-xl text-[#8ab4f8] hover:underline cursor-pointer font-medium truncate">
        {title || 'Untitled Page'}
      </h3>
      <p className="text-sm text-muted-foreground line-clamp-2 leading-snug">
        {description || 'No description provided. Search engines will attempt to find a relevant snippet from the page content.'}
      </p>
      
      <div className="mt-4 flex flex-wrap gap-4 pt-4 border-t border-border/50">
        <div className="text-xs">
          <span className="text-muted-foreground mr-1">Title Length:</span>
          <span className={(title?.length > 60 || title?.length < 10) ? 'text-destructive' : 'text-success'}>
            {title?.length || 0}/60 chars
          </span>
        </div>
        <div className="text-xs">
          <span className="text-muted-foreground mr-1">Description Length:</span>
          <span className={(description?.length > 160 || description?.length < 50) ? 'text-destructive' : 'text-success'}>
            {description?.length || 0}/160 chars
          </span>
        </div>
      </div>
    </div>
  );

  const aiPreview = (
    <div className="space-y-3 bg-muted/30 p-4 rounded-lg border border-border">
      <div className="flex items-start gap-3">
        <div className="bg-scanner-aeo/20 p-2 rounded-lg shrink-0 mt-1">
          <Bot className="h-4 w-4 text-scanner-aeo" />
        </div>
        <div>
          <p className="text-sm text-foreground leading-relaxed">
            Based on the information provided by <span className="text-scanner-aeo">[{title || 'Source'}]</span>
            {author && <span> by {author}</span>}
            {date && <span> (published {date})</span>}, the answer is...
          </p>
          <div className="mt-3 pl-3 border-l-2 border-scanner-aeo/50">
            <p className="text-sm text-muted-foreground italic">
              {description ? `"${description}"` : 'AI engines will extract concise, factual paragraphs from the top of the content.'}
            </p>
          </div>
          <div className="mt-3 pt-3 border-t border-border/50 text-xs text-muted-foreground flex gap-3">
            <span>1. <a className="text-scanner-aeo hover:underline cursor-pointer truncate max-w-[150px] inline-block align-bottom">{url}</a></span>
          </div>
        </div>
      </div>
    </div>
  );

  if (mode !== 'both') {
    return (
      <Card className="border-border bg-card/50 backdrop-blur h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            {isSeoMode ? <><Search className="h-4 w-4" /> Google SERP Preview</> : <><Bot className="h-4 w-4" /> AI Engine Citation Preview</>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isSeoMode ? serpPreview : aiPreview}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card/50 backdrop-blur h-full flex flex-col">
      <Tabs defaultValue={defaultTab} className="flex-1 flex flex-col">
        <CardHeader className="pb-0 pt-4 flex flex-row items-center justify-between border-b border-border/50">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            Display Preview
          </CardTitle>
          <TabsList className="h-8 bg-transparent">
            <TabsTrigger value="serp" className="text-xs data-[state=active]:bg-muted">SERP</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs data-[state=active]:bg-muted">AI Chat</TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="pt-4 flex-1">
          <TabsContent value="serp" className="m-0 h-full">
            {serpPreview}
          </TabsContent>
          <TabsContent value="ai" className="m-0 h-full">
            {aiPreview}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}
