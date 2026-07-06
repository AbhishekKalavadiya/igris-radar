'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KeyRound, Sparkles } from 'lucide-react';

/**
 * Graceful-degradation notice for features that need an AI API key.
 * Explains exactly which env var unlocks what, instead of failing silently.
 */
export default function AiUnavailableNotice({ feature = 'AI deep analysis', envVar = 'GEMINI_API_KEY' }) {
  return (
    <Card className="glass-subtle rounded-lg border-dashed border-primary/30">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="p-2 rounded-md bg-primary/10 border border-primary/20 shrink-0">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> {feature} is not configured
          </p>
          <p className="text-muted-foreground mt-1">
            Add <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm">{envVar}</code> to your{' '}
            <code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm">.env.local</code> and restart the
            server to unlock it. All non-AI checks on this page still run at full capacity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
