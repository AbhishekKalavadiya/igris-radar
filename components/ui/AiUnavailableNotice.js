'use client';

import { Card, CardContent } from '@/components/ui/card';
import { KeyRound, Sparkles } from 'lucide-react';

/**
 * Graceful-degradation notice for features that need an AI provider key.
 * When a `reason` (the actual error from the scan) is provided it is shown so the
 * problem is diagnosable; otherwise it explains how to configure a provider key.
 */
export default function AiUnavailableNotice({ feature = 'AI deep analysis', envVar = 'GEMINI_API_KEY', reason }) {
  return (
    <Card className="glass-subtle rounded-lg border-dashed border-primary/30">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="p-2 rounded-md bg-primary/10 border border-primary/20 shrink-0">
          <KeyRound className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> {feature} could not run
          </p>
          {reason && (
            <p className="text-muted-foreground mt-1">
              Reason:{' '}
              <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm break-words">{reason}</span>
            </p>
          )}
          <p className="text-muted-foreground mt-1">
            Add an AI provider key (<code className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded-sm">{envVar}</code>)
            in <span className="font-medium text-foreground">Admin → API Keys</span> — it takes effect immediately, no
            redeploy needed — or set it as an environment variable in your hosting platform. All non-AI checks on this
            page still run at full capacity.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
