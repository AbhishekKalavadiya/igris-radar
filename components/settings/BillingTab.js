'use client';

/**
 * components/settings/BillingTab.js
 * Full billing tab: current plan, usage meter, plan comparison, Stripe upgrade CTAs.
 */

import { useState, useEffect } from 'react';
import { CheckCircle2, XCircle, ArrowRight, Zap, Loader2, Receipt, ChevronDown, Download, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import UsageMeter from '@/components/ui/UsageMeter';
import { useToast } from '@/hooks/use-toast';
import { useBfcacheReload } from '@/hooks/use-bfcache-reload';
import { isPlanAvailable, PLAN_PROMOTIONS } from '@/lib/constants';

const PLAN_META = {
  free:       { label: 'Free',       price: '$0',    period: null,    color: 'text-muted-foreground', badge: 'bg-white/10' },
  starter:    { label: 'Starter',    price: '$5',    period: '/mo',   color: 'text-blue-400',         badge: 'bg-blue-500/10 border-blue-500/20' },
  pro:        { label: 'Pro',        price: '$20',   period: '/mo',   color: 'text-primary',          badge: 'bg-primary/10 border-primary/30' },
};
const PLANS_ORDER = ['free', 'starter', 'pro'];
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
  const { toast } = useToast();

  const [fakeUpgradeModal, setFakeUpgradeModal] = useState(false);
  const [targetPlanToUpgrade, setTargetPlanToUpgrade] = useState(null);
  const [planLimits, setPlanLimits] = useState(null);
  const [redirecting, setRedirecting] = useState(null);

  // In-app billing management (history, receipts, cancellation).
  const [showBilling, setShowBilling] = useState(false);
  const [billing, setBilling] = useState(null);        // { subscription, payments }
  const [billingLoading, setBillingLoading] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null); // subscription object pending cancel
  const [cancelling, setCancelling] = useState(false);

  const loadUsage = () =>
    fetch('/api?path=usage')
      .then(r => r.json())
      .then(data => { if (data.success) setUsage(data.data); })
      .catch(() => {});

  useEffect(() => {
    loadUsage();

    fetch('/api?path=plan-limits')
      .then(r => r.json())
      .then(data => { if (data.success) setPlanLimits(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // When the user leaves for the Dodo checkout and returns via the browser
  // back button without paying, force a fresh reload instead of trusting a
  // bfcache-restored (frozen, possibly stale) snapshot of this page. This
  // also naturally resets the "redirecting" spinner, since a fresh load never
  // had it set to begin with.
  useBfcacheReload();

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

      // In-place upgrade (existing paid subscriber): no checkout redirect.
      if (data.changed) {
        if (data.processing) {
          // Payment not yet confirmed by Dodo - the plan is granted by the
          // webhook once the charge clears, so don't claim the upgrade yet.
          toast({
            title: 'Payment processing',
            description: `Finalizing your upgrade to ${PLAN_META[data.plan]?.label || data.plan}. Your plan updates automatically once payment clears — this can take a few seconds.`,
          });
          setRedirecting(null);
          return;
        }
        // Confirmed paid: plan changed and the cycle restarted. Reload so the
        // session cookie, plan and usage all resync from the DB.
        toast({ title: 'Plan upgraded', description: `You're now on ${PLAN_META[data.plan]?.label || data.plan}. Your 30-day cycle restarts today.` });
        window.location.reload();
        return;
      }

      // New subscription (free user): redirect to the Dodo checkout session URL.
      window.location.href = data.url;
    } catch (e) {
      toast({ title: 'Error', description: 'Failed to initiate checkout.', variant: 'destructive' });
      setRedirecting(null);
    }
  };

  const loadBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await fetch('/api/billing/dodo/history');
      const data = await res.json();
      if (data.success) {
        setBilling(data.data);
      } else {
        toast({ title: 'Could not load billing', description: data.error || 'Try again shortly.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not load billing history.', variant: 'destructive' });
    } finally {
      setBillingLoading(false);
    }
  };

  const handleManageBilling = () => {
    const next = !showBilling;
    setShowBilling(next);
    if (next && !billing) loadBilling();
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch('/api/billing/dodo/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscriptionId: cancelTarget.subscriptionId }),
      });
      const data = await res.json();
      if (data.success) {
        const when = data.data?.effectiveDate
          ? new Date(data.data.effectiveDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
          : null;
        toast({
          title: 'Subscription cancelled',
          description: when ? `Your plan stays active until ${when}, then won't renew.` : 'Your subscription has been cancelled.',
        });
        setCancelTarget(null);
        loadBilling(); // refresh panel to show cancel-scheduled state
        loadUsage();   // refresh the Current Plan card banner
      } else {
        toast({ title: 'Cancellation failed', description: data.error || 'Try again shortly.', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not cancel subscription.', variant: 'destructive' });
    } finally {
      setCancelling(false);
    }
  };

  const formatMoney = (amountCents, currency = 'USD') => {
    if (amountCents == null) return '—';
    try {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amountCents / 100);
    } catch {
      return `${(amountCents / 100).toFixed(2)} ${currency}`;
    }
  };

  const formatDate = (iso) =>
    iso ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const plan = usage?.plan || currentPlan;
  const meta = PLAN_META[plan] || PLAN_META.free;
  const promo = PLAN_PROMOTIONS[plan];
  const currentIdx = PLANS_ORDER.indexOf(plan);

  // Usage resets at the end of the current 30-day cycle (anchored to plan
  // start), not the calendar month. Fall back to +30 days if not yet loaded.
  const resetDate = (() => {
    const end = usage?.cycleEnd ? new Date(usage.cycleEnd) : (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d; })();
    return end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  })();

  const pendingDowngrade = usage?.pendingDowngrade || null;
  const downgradeDate = pendingDowngrade?.effectiveDate
    ? new Date(pendingDowngrade.effectiveDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const renderComparisonRow = ({ key, label, format }) => (
    <tr key={key} className="border-b border-border/50 hover:bg-muted/50">
      <td className="py-3 pr-4 text-muted-foreground">{label}</td>
      {PLANS_ORDER.map((p) => {
        const val = planLimits?.[p]?.[key];
        const formatted = format(val);
        const isCurrent = p === plan;
        const promo = key === 'price' ? PLAN_PROMOTIONS[p] : null;
        return (
          <td key={p} className={`text-center py-3 px-3 ${isCurrent ? 'bg-muted/50' : ''}`}>
            {formatted === null ? (
              <XCircle className="h-4 w-4 text-muted-foreground/30 mx-auto" />
            ) : promo ? (
              <span className="inline-flex flex-col items-center gap-0.5">
                <span className="text-xs text-muted-foreground line-through">{formatted}</span>
                <span className="font-semibold text-success">{promo.discountedPrice}</span>
              </span>
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
          {pendingDowngrade && downgradeDate && (
            <div className="flex items-start gap-3 p-4 border border-warning/30 bg-warning/10 rounded-md">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              <p className="text-sm text-foreground">
                Plan cancelled for{' '}
                <span className="font-semibold">{PLAN_META[pendingDowngrade.plan]?.label || pendingDowngrade.plan}</span>.
                You'll switch to the <span className="font-semibold">Free</span> tier from{' '}
                <span className="font-semibold">{downgradeDate}</span>. You keep full access until then.
              </p>
            </div>
          )}
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold uppercase tracking-widest border ${meta.badge}`}>
                ◆ {meta.label}
              </span>
              {promo ? (
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground line-through">{planLimits?.[plan]?.price || meta.price}</span>
                  <span className="text-2xl font-bold text-success">{promo.discountedPrice}</span>
                  <span className="text-sm font-normal text-muted-foreground">{meta.period}</span>
                  <span className="px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase tracking-wide">{promo.badge}</span>
                </div>
              ) : (
                <div className="text-2xl font-bold">{planLimits?.[plan]?.price || meta.price}<span className="text-sm font-normal text-muted-foreground">{meta.period}</span></div>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {currentIdx < PLANS_ORDER.length - 1 && (
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
              {(plan !== 'free' || usage?.hasBillingHistory) && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 h-9 px-4"
                  onClick={handleManageBilling}
                >
                  <Receipt className="h-3.5 w-3.5" />
                  Manage Billing
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showBilling ? 'rotate-180' : ''}`} />
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

      {showBilling && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-base">Billing &amp; Invoices</CardTitle>
            <CardDescription>Your subscription, payment history and receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {billingLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading billing details...
              </div>
            ) : (
              <>
                {/* Active subscription */}
                {billing?.subscription ? (
                  <div className="p-4 border border-border bg-muted rounded-md space-y-3">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-1">
                        <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Active subscription</p>
                        <p className="text-lg font-bold">
                          {formatMoney(billing.subscription.amount, billing.subscription.currency)}
                          <span className="text-sm font-normal text-muted-foreground">/mo</span>
                        </p>
                        {billing.subscription.cancelAtNextBillingDate ? (
                          <p className="text-xs text-warning">
                            Cancels on {formatDate(billing.subscription.nextBillingDate)} — no further charges.
                          </p>
                        ) : (
                          <p className="text-xs text-muted-foreground">
                            Renews on <span className="text-foreground font-medium">{formatDate(billing.subscription.nextBillingDate)}</span>
                          </p>
                        )}
                      </div>
                      {!billing.subscription.cancelAtNextBillingDate && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-9 px-4 gap-2 text-destructive border-destructive/40 hover:bg-destructive/10"
                          onClick={() => setCancelTarget(billing.subscription)}
                        >
                          Cancel plan
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active subscription on record.</p>
                )}

                {/* Payment history */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Payment history</p>
                  {billing?.payments?.length ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm min-w-[420px]">
                        <thead>
                          <tr className="border-b border-border text-muted-foreground">
                            <th className="text-left py-2 pr-4 font-medium">Date</th>
                            <th className="text-left py-2 pr-4 font-medium">Amount</th>
                            <th className="text-left py-2 pr-4 font-medium">Status</th>
                            <th className="text-right py-2 font-medium">Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {billing.payments.map((p) => (
                            <tr key={p.paymentId} className="border-b border-border/50">
                              <td className="py-2.5 pr-4">{formatDate(p.createdAt)}</td>
                              <td className="py-2.5 pr-4">{formatMoney(p.amount, p.currency)}</td>
                              <td className="py-2.5 pr-4">
                                <span className={`text-xs font-medium ${p.status === 'succeeded' ? 'text-success' : 'text-muted-foreground'}`}>
                                  {p.status === 'succeeded' ? 'Paid' : p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                                </span>
                              </td>
                              <td className="py-2.5 text-right">
                                {p.status === 'succeeded' && p.hasInvoice ? (
                                  <a
                                    href={`/api/billing/dodo/receipt/${p.paymentId}`}
                                    className="inline-flex items-center gap-1.5 text-primary hover:underline"
                                  >
                                    <Download className="h-3.5 w-3.5" /> PDF
                                  </a>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payments yet.</p>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

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

      {/* Cancel subscription confirmation */}
      <Dialog open={!!cancelTarget} onOpenChange={(o) => { if (!o && !cancelling) setCancelTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Cancel subscription?
            </DialogTitle>
            <DialogDescription>
              Your plan stays active until{' '}
              <span className="text-foreground font-medium">{formatDate(cancelTarget?.nextBillingDate)}</span>.
              You keep full access until then, and you won't be charged again. You can re-subscribe anytime.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelling}>
              Keep plan
            </Button>
            <Button
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-2"
              onClick={handleConfirmCancel}
              disabled={cancelling}
            >
              {cancelling && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Cancel subscription
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
