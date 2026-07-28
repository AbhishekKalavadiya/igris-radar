'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';

export default function LockedFindingsBanner({ lockedFindings = [], scanType = 'seo', onUnlockClick }) {
  if (!lockedFindings || lockedFindings.length === 0) return null;

  const count = lockedFindings.length;
  const categories = Array.from(
    new Set(lockedFindings.map(f => f.category).filter(Boolean))
  );

  const categoryPreview = categories.slice(0, 3).join(', ');

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-background p-4 sm:p-5 shadow-lg shadow-primary/5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-primary/20 text-primary border-primary/40 gap-1 text-xs font-semibold">
              <Lock className="h-3 w-3" />
              {count} Locked {count === 1 ? 'Finding' : 'Findings'}
            </Badge>
            {categoryPreview && (
              <span className="text-xs text-muted-foreground truncate">
                Categories: <strong className="text-foreground font-medium">{categoryPreview}</strong>
                {categories.length > 3 && ` +${categories.length - 3} more`}
              </span>
            )}
          </div>
          <h4 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            High-Impact Starter & Pro Diagnostics Detected on Your Site
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Upgrade your plan to reveal exact line code diagnostics, 1-click AI fix prompts, and export white-label reports.
          </p>
        </div>

        <div className="shrink-0 w-full sm:w-auto">
          {onUnlockClick ? (
            <Button
              onClick={() => onUnlockClick(lockedFindings[0])}
              size="sm"
              className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 shadow-md shadow-primary/20"
            >
              <Lock className="h-3.5 w-3.5" />
              Unlock All {count} Findings
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          ) : (
            <Link href="/plans">
              <Button
                size="sm"
                className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 shadow-md shadow-primary/20"
              >
                <Lock className="h-3.5 w-3.5" />
                Unlock All {count} Findings
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
