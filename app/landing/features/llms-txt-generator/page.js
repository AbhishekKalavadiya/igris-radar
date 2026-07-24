'use client';

import FeaturePageTemplate from '@/components/landing/FeaturePageTemplate';
import LlmsTxtGenerator from '@/components/tools/LlmsTxtGenerator';
import { FEATURE_PAGES } from '@/lib/landingContent';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

export default function FeaturePage() {
  return (
    <div>
      <FeaturePageTemplate config={FEATURE_PAGES['llms-txt-generator']} />

      {/* Direct Interactive Generator Section — No Signup Required */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-12 border-t border-border" id="generator-tool">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="h-3.5 w-3.5" /> Direct Web Access • No Signup Needed
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Generate Your Free <span className="text-primary">llms.txt</span> File Now
          </h2>
          <p className="text-muted-foreground text-base">
            Use our interactive tool below to generate your standardized markdown file live in your browser.
          </p>
        </div>

        <LlmsTxtGenerator />
      </section>
    </div>
  );
}
