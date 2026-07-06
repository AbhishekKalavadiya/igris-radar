'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { AnimatedNumber } from '@/components/ui/motion';

/**
 * Uniform dashboard stat tile: label, animated value, optional icon,
 * accent tint, suffix (e.g. "/ 100") and a footer slot for meters/links.
 */
export default function StatCard({ label, value, suffix, icon: Icon, accent, loading, footer, headerAction }) {
  return (
    <Card className="glass-subtle accent-card rounded-lg">
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
          {headerAction}
          {Icon && !headerAction && (
            <div className={`p-1.5 rounded-md ${accent?.bgSoft || 'bg-primary/10'}`}>
              <Icon className={`h-4 w-4 ${accent?.text || 'text-primary'}`} />
            </div>
          )}
        </div>
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="flex items-end gap-1.5">
            <AnimatedNumber value={value} className="text-3xl font-bold leading-none" />
            {suffix && <span className="text-sm text-muted-foreground mb-0.5">{suffix}</span>}
          </div>
        )}
        {footer && !loading && <div className="mt-3">{footer}</div>}
      </CardContent>
    </Card>
  );
}
