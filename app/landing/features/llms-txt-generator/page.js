'use client';

import FeaturePageTemplate from '@/components/landing/FeaturePageTemplate';
import LlmsTxtGenerator from '@/components/tools/LlmsTxtGenerator';
import { FEATURE_PAGES } from '@/lib/landingContent';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function FeaturePage() {
  return (
    <FeaturePageTemplate config={FEATURE_PAGES['llms-txt-generator']}>
      {/* Direct Interactive Generator Right After Hero */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 border-y border-border bg-card/40" id="generator-tool">
        <div className="text-center max-w-3xl mx-auto space-y-2 mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Direct Web Access • No Signup Needed
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Generate Your Free <span className="text-primary">llms.txt</span> File Live
          </h2>
          <p className="text-muted-foreground text-sm">
            Fill in your site details below to generate and download your markdown file instantly.
          </p>
        </div>

        <LlmsTxtGenerator />
      </section>
    </FeaturePageTemplate>
  );
}
