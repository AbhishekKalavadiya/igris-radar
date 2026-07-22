'use client';

import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/**
 * Small inline "what is this?" marker: an info icon that reveals a plain-language
 * explanation on hover, focus, or tap. Self-contained (ships its own
 * TooltipProvider) so it drops in next to any label without extra setup.
 *
 * @param {object} props
 * @param {string} props.label   Accessible label announced to screen readers.
 * @param {React.ReactNode} props.children  The explanation shown in the tooltip.
 */
export default function InfoHint({ label = 'More information', children, className }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            className={cn(
              'inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors',
              className
            )}
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-card text-foreground border border-border shadow-igris-md text-xs leading-relaxed font-normal">
          {children}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
