'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, RefreshCw } from 'lucide-react';

/**
 * Customer-facing notice shown when AI analysis couldn't be produced. It stays
 * intentionally general — no API-key/admin/infra details are exposed to end users.
 * The real error is logged server-side for the operator. Pass `onRetry` to show a
 * retry button.
 */
export default function AiUnavailableNotice({ onRetry }) {
  return (
    <Card className="glass-subtle rounded-lg border-dashed border-primary/30">
      <CardContent className="p-5 flex items-start gap-4">
        <div className="p-2 rounded-md bg-primary/10 border border-primary/20 shrink-0">
          <Sparkles className="h-5 w-5 text-primary" />
        </div>
        <div className="text-sm">
          <p className="font-semibold text-foreground">AI analysis is temporarily unavailable</p>
          <p className="text-muted-foreground mt-1">
            We couldn&apos;t generate the AI summary right now — this is usually a brief hiccup with the
            AI service under heavy load. Your security findings above are complete and unaffected. Please
            try again in a moment.
          </p>
          {onRetry && (
            <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={onRetry}>
              <RefreshCw className="h-3.5 w-3.5" /> Try AI analysis again
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
