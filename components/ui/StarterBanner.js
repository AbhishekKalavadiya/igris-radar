'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Zap, Check, ArrowRight, X, ShieldCheck, Gauge, Globe, Smartphone, Infinity, Bot, BarChart3, FileText, Layers, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/lib/authContext';

export default function StarterBanner() {
  const [visible, setVisible] = useState(false);
  const [userPlan, setUserPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const auth = useAuth();

  useEffect(() => {
    if (auth?.user) {
      const plan = auth.user.plan || 'free';
      setUserPlan(plan);
      if (plan === 'free' || plan === 'starter') {
        setVisible(true);
      }
      setLoading(false);
      return;
    }

    // Fallback if auth context is still loading
    fetch('/api/?path=auth/me')
      .then((r) => r.json())
      .then((res) => {
        const plan = res.data?.plan || 'free';
        setUserPlan(plan);
        if (plan === 'free' || plan === 'starter') {
          setVisible(true);
        }
      })
      .catch(() => {
        setVisible(true);
      })
      .finally(() => setLoading(false));
  }, [auth?.user]);

  const handleDismiss = () => {
    setVisible(false);
  };

  if (loading || !visible || (userPlan !== 'free' && userPlan !== 'starter')) return null;

  // PRO Plan Upsell for Starter Users
  if (userPlan === 'starter') {
    return (
      <div className="relative overflow-hidden rounded-xl border border-primary/40 bg-gradient-to-r from-primary/15 via-purple-500/10 to-primary/5 p-4 sm:p-5 shadow-lg shadow-primary/5 transition-all duration-300">
        {/* Background ambient glow */}
        <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-primary/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-purple-500/20 blur-2xl pointer-events-none" />

        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-wider shadow-sm">
                <Zap className="h-3 w-3 fill-current" /> 50% OFF PROMO • PRO UNLIMITED
              </span>
              <span className="text-xs font-bold text-primary">
                <span className="line-through text-muted-foreground mr-1">$20/mo</span> $10/mo
              </span>
            </div>

            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              Supercharge Your Workflow with Pro Unlimited
            </h3>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Upgrade from Starter to Pro to unlock unlimited scanning, AI insights powered by Gemini, and white-label PDF reporting:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              {[
                { icon: Infinity, text: 'Unlimited Scans' },
                { icon: Bot, text: 'AI Deep Analysis' },
                { icon: BarChart3, text: 'Competitor Comparison' },
                { icon: FileText, text: 'White-Label Reports' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-1.5 text-xs font-medium text-foreground/90 bg-background/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-primary/20">
                  <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">{text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
            <Link href="/plans" className="w-full lg:w-auto">
              <Button
                size="lg"
                className="w-full font-bold bg-primary hover:bg-primary/90 text-primary-foreground h-10 px-5 gap-2 shadow-md shadow-primary/25"
              >
                <Zap className="h-4 w-4 fill-current" />
                Upgrade to Pro ($10/mo)
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Starter Lifetime Deal Banner for Free Users
  return (
    <div className="relative overflow-hidden rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-4 sm:p-5 shadow-lg shadow-amber-500/5 transition-all duration-300">
      {/* Background ambient glow */}
      <div className="absolute -top-12 -right-12 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-orange-500/20 blur-2xl pointer-events-none" />

      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
        aria-label="Dismiss banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-black uppercase tracking-wider shadow-sm">
              <Sparkles className="h-3 w-3" /> 100% OFF • Lifetime Deal
            </span>
            <span className="text-xs font-bold text-amber-500 dark:text-amber-400">
              $10 Value — Yours Free
            </span>
          </div>

          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            Claim Free Starter Lifetime Access
          </h3>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Pay once, own forever. Upgrade your account today to unlock higher scan limits and advanced audit tools:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            {[
              { icon: Gauge, text: '50 Scans / month' },
              { icon: Layers, text: 'Multi-Page Crawl' },
              { icon: Target, text: 'Competitor Comparison' },
              { icon: ShieldCheck, text: 'GEO, AEO & ASO Audits' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-xs font-medium text-foreground/90 bg-background/60 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-amber-500/20">
                <Check className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                <span className="truncate">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto pt-2 lg:pt-0">
          <Link href="/plans" className="w-full lg:w-auto">
            <Button
              size="lg"
              className="w-full font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-none shadow-md shadow-amber-500/25 h-10 px-5 gap-2"
            >
              <Zap className="h-4 w-4 fill-current" />
              Claim Lifetime Starter
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
