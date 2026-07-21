'use client';

/**
 * components/ui/UpgradePrompt.js
 * Shown when an API call returns 429 (scan limit) or 403 (feature gate).
 * Clicking "Upgrade" initiates a real Dodo Checkout session.
 */

import { useState } from 'react';
import { ArrowRight, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getUpgradeMessage } from '@/lib/plans';
import { usePlanLimits } from '@/hooks/use-plan-limits';
import { useToast } from '@/hooks/use-toast';
import { isPlanAvailable } from '@/lib/constants';

/**
 * @param {{
 *   currentPlan: string,
 *   reason: 'scanLimit'|'deepAnalysis'|'competitorScan'|'monitoring'|'whiteLabel',
 *   className?: string,
 * }} props
 */
export default function UpgradePrompt({ currentPlan = 'free', reason = 'scanLimit', className = '' }) {
  const { planLimits } = usePlanLimits();
  const { title, description, nextPlan } = getUpgradeMessage(currentPlan, reason, planLimits);
  const nextLabel = nextPlan.charAt(0).toUpperCase() + nextPlan.slice(1);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const planAvailable = isPlanAvailable(nextPlan);

  const handleUpgrade = async () => {
    if (!planAvailable) {
      toast({ title: 'Not available yet', description: `We do not offer the ${nextLabel} plan yet.`, variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/billing/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: nextPlan }),
      });
      const data = await res.json();

      if (!data.success) {
        toast({ title: 'Checkout Failed', description: data.error || 'Could not start checkout', variant: 'destructive' });
        setLoading(false);
        return;
      }

      if (data.changed) {
        toast({ title: 'Plan upgraded', description: `You're now on ${nextLabel}. Your 30-day cycle restarts today.` });
        window.location.reload();
        return;
      }

      window.location.href = data.url;
    } catch {
      toast({ title: 'Network error', description: 'Could not initiate checkout.', variant: 'destructive' });
      setLoading(false);
    }
  };

  return (
    <div className={`border border-primary/30 bg-primary/5 p-6 flex flex-col sm:flex-row sm:items-center gap-4 ${className}`}>
      <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-primary/10 border border-primary/20">
        <Zap className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-semibold text-sm leading-snug mb-1">{title}</p>
        <p className="text-muted-foreground text-xs leading-relaxed">{description}</p>
      </div>
      <div className="shrink-0">
        {planAvailable ? (
          <Button
            size="sm"
            disabled={loading}
            onClick={handleUpgrade}
            className="h-9 px-4 font-semibold text-sm bg-primary text-primary-foreground hover:bg-primary/90 whitespace-nowrap"
          >
            {loading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <>{`Upgrade to ${nextLabel}`} <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></>}
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled className="h-9 px-4 font-semibold text-sm whitespace-nowrap">
            {nextLabel} - Coming soon
          </Button>
        )}
      </div>
    </div>
  );
}
