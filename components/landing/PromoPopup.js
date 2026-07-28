'use client';

/**
 * components/landing/PromoPopup.js
 * Promo popup announcing the current Starter/Pro discount. Shows shortly
 * after every page load and auto-dismisses after 15s if not closed sooner.
 */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, PartyPopper, Sparkles, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PLAN_PROMOTIONS } from '@/lib/constants';

const AUTO_DISMISS_MS = 15000;

export default function PromoPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const showTimer = setTimeout(() => setOpen(true), 900);
    return () => clearTimeout(showTimer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const hideTimer = setTimeout(() => setOpen(false), AUTO_DISMISS_MS);
    return () => clearTimeout(hideTimer);
  }, [open]);

  const close = () => setOpen(false);

  const starter = PLAN_PROMOTIONS.starter;
  const pro = PLAN_PROMOTIONS.pro;

  if (!open || !starter || !pro) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Limited-time pricing offer"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-primary/30 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero banner */}
        <div className="relative h-36 w-full bg-gradient-to-br from-primary/20 via-success/10 to-primary/5 flex items-center justify-center overflow-hidden">
          <div className="absolute -top-8 -left-8 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
          <div className="absolute -bottom-10 -right-6 h-36 w-36 rounded-full bg-success/20 blur-2xl" />
          <div className="relative flex items-center gap-3">
            <div className="h-14 w-14 rounded-2xl bg-primary/15 border border-primary/30 flex items-center justify-center">
              <PartyPopper className="h-7 w-7 text-primary" />
            </div>
            <span className="text-4xl text-primary">◆</span>
            <div className="h-14 w-14 rounded-2xl bg-success/15 border border-success/30 flex items-center justify-center">
              <Sparkles className="h-7 w-7 text-success" />
            </div>
          </div>

          <button
            onClick={close}
            aria-label="Close"
            className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/30 text-destructive text-[11px] font-bold uppercase tracking-wider mb-3">
            <Zap className="h-3 w-3" /> Limited time offer
          </span>
          <h2 className="text-2xl font-bold text-foreground">Launch pricing is live</h2>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            For a limited time, get started for less — or free.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 text-left">
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 relative overflow-hidden">
              <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[9px] font-black uppercase">
                LIFETIME
              </span>
              <p className="text-xs font-bold uppercase tracking-wide text-amber-500">Starter</p>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground line-through">{starter.originalPrice}</span>
                <span className="text-2xl font-black text-success">{starter.discountedPrice}</span>
                <span className="text-[10px] font-extrabold uppercase text-amber-500">One-Time</span>
              </div>
              <div className="mt-2 space-y-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-success/15 text-success text-[10px] font-bold uppercase tracking-wide">
                  {starter.badge}
                </span>
                <p className="text-[10px] font-semibold text-foreground">50 scans/mo • Pay once forever</p>
              </div>
            </div>
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Pro</p>
              <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground line-through">{pro.originalPrice}</span>
                <span className="text-2xl font-bold text-primary">{pro.discountedPrice}</span>
                <span className="text-[10px] text-muted-foreground">/mo</span>
              </div>
              <div className="mt-2 space-y-1">
                <span className="inline-block px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wide">
                  {pro.badge}
                </span>
                <p className="text-[10px] font-semibold text-muted-foreground">Unlimited scans • AI Deep</p>
              </div>
            </div>
          </div>

          <Link href="/signup" onClick={close}>
            <Button size="lg" className="w-full mt-6 font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-amber-500/25 border-none">
              Claim Lifetime Starter — Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
          <button
            onClick={close}
            className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
