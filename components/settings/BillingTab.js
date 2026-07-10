'use client';

/**
 * components/settings/BillingTab.js
 * Full billing tab: current plan, usage meter, plan comparison, Stripe upgrade CTAs.
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Zap, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import UsageMeter from '@/components/ui/UsageMeter';
import { useToast } from '@/hooks/use-toast';
import { isPlanAvailable } from '@/lib/constants';

const PLAN_META = {
  free:       { label: 'Free',       price: '$0',    period: null,    color: 'text-muted-foreground', badge: 'bg-white/10' },
  starter:    { label: 'Starter',    price: '$49',   period: '/mo',   color: 'text-blue-400',         badge: 'bg-blue-500/10 border-blue-500/20' },
  pro:        { label: 'Pro',        price: '$149',  period: '/mo',   color: 'text-primary',          badge: 'bg-primary/10 border-primary/30' },
  agency:     { label: 'Agency',     price: '$399',  period: '/mo',   color: 'text-purple-400',       badge: 'bg-purple-500/10 border-purple-500/20' },
  enterprise: { label: 'Enterprise', price: 'Custom', period: null,   color: 'text-yellow-400',       badge: 'bg-yellow-500/10 border-yellow-500/20' },
};
const PLANS_ORDER = ['free', 'starter', 'pro', 'agency'];
// Every plan includes the full audit suite - the scanners are the core product,
// so gating them behind higher tiers would block free users from experiencing
// the value. Plans are differentiated by quota + power features below, not by
// which scanners you can run. Surfacing them here makes that explicit.
const AUDIT_TOOLS = [
  'Security scan',
  'SEO audit',
  'AEO audit (AI answer engines)',
  'GEO audit (generative engines)',
  'Brand visibility tracking',
  'Site health & performance',
];

const COMPARISON_ROWS = [
  { key: 'price',          label: 'Price',                  format: (v) => v ?? null },
  { key: 'scansPerMonth',  label: 'Scans / month',         format: (v) => v === undefined ? null : (v === Infinity || v === null) ? 'Unlimited' : String(v) },
  { key: 'sites',          label: 'Sites',                  format: (v) => v === undefined ? null : (v === Infinity || v === null) ? 'Unlimited' : String(v) },
  { key: 'teamMembers',    label: 'Team members',           format: (v) => v === undefined ? null : (v === Infinity || v === null) ? 'Unlimited' : String(v) },
  { key: 'monitoring',     label: 'Monitoring',             format: (v) => !v || v === 'false' ? null : (v === true ? 'Yes' : String(v).charAt(0).toUpperCase() + String(v).slice(1)) },
  { key: 'deepAnalysis',   label: 'AI deep analysis',       format: (v) => v ? 'Included' : null },
  { key: 'competitorScan', label: 'Competitor comparison',  format: (v) => v ? 'Included' : null },
  { key: 'whiteLabel',     label: 'White-label reports',    format: (v) => v ? 'Included' : null },
];



export default function BillingTab({ currentPlan = 'free' }) {
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(null); // plan key being processed
  const { toast } = useToast();

  const [fakeUpgradeModal, setFakeUpgradeModal] = useState(false);
  const [targetPlanToUpgrade, setTargetPlanToUpgrade] = useState(null);
  const [planLimits, setPlanLimits] = useState(null);
  const [redirecting, setRedirecting] = useState(null);

  useEffect(() => {
    fetch('/api?path=usage')
      .then(r => r.json())
      .then(data => { if (data.success) setUsage(data.data); })
      .catch(() => {});
      
    fetch('/api?path=plan-limits')
      .then(r => r.json())
      .then(data => { if (data.success) setPlanLimits(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleUpgrade = async (targetPlan) => {
    if (!isPlanAvailable(targetPlan)) {
      toast({ title: 'Not available yet', description: `We do not offer the ${PLAN_META[targetPlan]?.label || targetPlan} plan yet.`, variant: 'destructive' });
      return;
    }

    setRedirecting(targetPlan);
    
    try {
      // Create a dynamic checkout session
      const res = await fetch('/api/billing/dodo/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan }),
      });
      
      const data = await res.json();

      if (!data.success) {
        toast({ title: 'Checkout Failed', description: data.error || 'Could not start checkout', variant: 'destructive' });
        setRedirecting(null);
        return;
      }
      
      // Redirect to the newly generated Dodo checkout session URL
      window.location.href = data.url;
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to initiate checkout.', variant: 'destructive' });
      setRedirecting(null);
    }
  };

  const handleManageBilling = async () => {
    setUpgrading('portal');
    try {
      const res = await fetch('/api/billing/dodo/portal', { method: 'POST' });
      const data = await res.json();
      if (data.success && data.data?.url) {
        window.location.href = data.data.url;
      } else {
        toast({ title: 'Portal unavailable', description: data.error || 'No active subscription found.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not open billing portal.', variant: 'destructive' });
    } finally {
      setUpgrading(null);
    }
  };

  const plan = usage?.plan || currentPlan;
  const meta = PLAN_META[plan] || PLAN_META.free;
  const currentIdx = PLANS_ORDER.indexOf(plan);

  const resetDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  })();

  const renderComparisonRow = ({ key, label, format }) => (
    <tr key={key} className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-3 pr-4 text-muted-foreground">{label}</td>
      {PLANS_ORDER.map((p) => {
        const val = planLimits?.[p]?.[key];
        const formatted = format(val);
        const isCurrent = p === plan;
        return (
          <td key={p} className={`text-center py-3 px-3 ${isCurrent ? 'bg-muted/50' : ''}`}>
            {formatted === null ? (
              <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
            ) : (
              <span className={`font-medium ${isCurrent ? PLAN_META[p].color : 'text-foreground/80'}`}>
                {formatted === 'Included' ? <CheckCircle2 className="h-4 w-4 mx-auto text-primary" /> : formatted}
              </span>
            )}
          </td>
        );
      })}
    </tr>
  );

  return (
    <div className="space-y-6">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
          <CardDescription>Your active subscription and this month's usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-widest border ${meta.badge}`}>
                ◆ {meta.label}
              </span>
              <div className="text-2xl font-bold">{planLimits?.[plan]?.price || meta.price}<span className="text-sm font-normal text-muted-foreground">{meta.period}</span></div>
            </div>
            <div className="flex gap-2 flex-wrap">
              {plan !== 'enterprise' && currentIdx < PLANS_ORDER.indexOf('enterprise') && (
                isPlanAvailable(PLANS_ORDER[currentIdx + 1]) ? (
                  <Button
                    size="sm"
                    className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 font-semibold"
                    onClick={() => handleUpgrade(PLANS_ORDER[currentIdx + 1])}
                    disabled={!!redirecting}
                  >
                    {redirecting === PLANS_ORDER[currentIdx + 1]
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Zap className="h-3.5 w-3.5" />}
                    Upgrade to {PLAN_META[PLANS_ORDER[currentIdx + 1]]?.label}
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="gap-2 h-9 px-4 font-semibold" disabled>
                    {PLAN_META[PLANS_ORDER[currentIdx + 1]]?.label} - Coming soon
                  </Button>
                )
              )}
              {plan !== 'free' && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 h-9 px-4"
                  onClick={handleManageBilling}
                  disabled={!!upgrading}
                >
                  {upgrading === 'portal'
                    ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    : <ExternalLink className="h-3.5 w-3.5" />}
                  Manage Billing
                </Button>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading usage...
            </div>
          ) : usage && planLimits ? (
            <div className="space-y-3 p-4 border border-border bg-muted rounded-md">
              <UsageMeter
                used={usage.scansUsed}
                limit={usage.scansLimit}
                label="Scans used this month"
              />
              <p className="text-xs text-muted-foreground">
                Usage resets on <span className="text-foreground font-medium">{resetDate}</span>
              </p>
            </div>
          ) : null}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Sites',         value: usage?.limits?.sites === Infinity || usage?.limits?.sites === null ? 'Unlimited' : (usage?.limits?.sites ?? planLimits?.[plan]?.sites ?? 1) },
              { label: 'Team members',  value: usage?.limits?.teamMembers === Infinity || usage?.limits?.teamMembers === null ? 'Unlimited' : (usage?.limits?.teamMembers ?? planLimits?.[plan]?.teamMembers ?? 1) },
              { label: 'Monitoring',    value: usage?.limits?.monitoring ? (usage.limits.monitoring === true ? 'Yes' : usage.limits.monitoring.charAt(0).toUpperCase() + usage.limits.monitoring.slice(1)) : 'Off' },
              { label: 'Deep analysis', value: (usage?.limits?.deepAnalysis ?? planLimits?.[plan]?.deepAnalysis) ? 'Included' : 'Not included' },
            ].map(({ label, value }) => (
              <div key={label} className="p-3 border border-border bg-muted space-y-1 rounded-md">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-semibold text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base">Plan Comparison</CardTitle>
          <CardDescription>See what's included across all plans</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 pr-4 text-muted-foreground font-medium w-40">Feature</th>
                {PLANS_ORDER.map((p) => (
                  <th key={p} className={`text-center py-3 px-3 font-semibold ${p === plan ? PLAN_META[p].color : 'text-muted-foreground'}`}>
                    {PLAN_META[p].label}
                    {p === plan && <span className="block text-xs font-normal opacity-70">Current</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renderComparisonRow(COMPARISON_ROWS[0])}
              <tr className="border-b border-border/50">
                <td colSpan={PLANS_ORDER.length + 1} className="py-2.5 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Limits &amp; features
                </td>
              </tr>
              {COMPARISON_ROWS.slice(1).map(renderComparisonRow)}
              <tr className="border-b border-border/50">
                <td colSpan={PLANS_ORDER.length + 1} className="py-2.5 pt-4 text-xs font-semibold uppercase tracking-wider text-primary">
                  Audit tools · included on every plan
                </td>
              </tr>
              {AUDIT_TOOLS.map((tool) => (
                <tr key={tool} className="border-b border-border/50 hover:bg-muted/50">
                  <td className="py-3 pr-4 text-muted-foreground">{tool}</td>
                  {PLANS_ORDER.map((p) => (
                    <td key={p} className={`text-center py-3 px-3 ${p === plan ? 'bg-muted/50' : ''}`}>
                      <CheckCircle2 className="h-4 w-4 mx-auto text-primary" />
                    </td>
                  ))}
                </tr>
              ))}
              <tr>
                <td className="py-4"></td>
                {PLANS_ORDER.map((p, i) => (
                  <td key={p} className="text-center py-4 px-2">
                    {i > currentIdx && isPlanAvailable(p) ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-3 text-xs font-semibold gap-1.5 w-full justify-center"
                        onClick={() => handleUpgrade(p)}
                        disabled={!!redirecting}
                      >
                        {redirecting === p
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <ArrowRight className="h-3 w-3" />}
                        Upgrade
                      </Button>
                    ) : i > currentIdx && !isPlanAvailable(p) ? (
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block text-center mt-2">Not offered yet</span>
                    ) : null}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
