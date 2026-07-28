'use client';

import React from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lock, Sparkles, ShieldAlert, ArrowRight, Zap, FileText, Bell } from 'lucide-react';
import { getSeverityColorClass } from '@/lib/scannerAccents';

const PLAN_TITLES = {
  starter: 'Starter Plan',
  pro: 'Pro Plan',
};

const SCAN_TYPE_NAMES = {
  geo: 'GEO Audit (Generative Engine Optimization)',
  aeo: 'AEO Audit (AI Engine Optimization)',
  seo: 'SEO Audit',
  security: 'Security Scan',
  'site-health': 'Site Health & Infrastructure',
};

export default function UnlockFindingModal({ isOpen, onClose, finding, scanType = 'seo' }) {
  if (!finding) return null;

  const planKey = finding.requiredPlan || 'starter';
  const planTitle = PLAN_TITLES[planKey] || 'Starter Plan';
  const scanName = SCAN_TYPE_NAMES[scanType] || 'Audit';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden bg-card border-border/80 shadow-2xl shadow-black/50">
        {/* Top Accent Stripe */}
        <div className={`h-1.5 w-full ${getSeverityColorClass(finding.severity, false)}`} />

        <div className="p-6 space-y-5">
          {/* Header */}
          <DialogHeader className="space-y-3 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary gap-1 font-semibold">
                <Lock className="h-3 w-3" />
                {planTitle} Required
              </Badge>
              {finding.severity && (
                <Badge variant="outline" className="uppercase tracking-wider text-[10px]">
                  {finding.severity} SEVERITY
                </Badge>
              )}
              {finding.category && (
                <span className="text-xs uppercase tracking-wide text-muted-foreground font-mono">
                  {finding.category}
                </span>
              )}
            </div>

            <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary shrink-0" />
              Unlock Finding Title & 1-Click Fix
            </DialogTitle>

            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              This <span className="text-foreground font-medium">{scanName}</span> finding was detected on your domain, but the exact technical diagnostic, line locations, and 1-click resolution guide are locked for free tier users.
            </DialogDescription>
          </DialogHeader>

          {/* Explanation Box */}
          {finding.explanation && (
            <div className="rounded-xl bg-muted/40 border border-border/60 p-4 space-y-1.5">
              <div className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" />
                Why This Audit Check Matters
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {finding.explanation}
              </p>
            </div>
          )}

          {/* Feature Unlock Checklist */}
          <div className="space-y-2.5 pt-1">
            <div className="text-xs font-semibold text-foreground uppercase tracking-wider text-muted-foreground">
              What You Unlock With {planTitle}:
            </div>
            <div className="grid grid-cols-1 gap-2 text-xs text-foreground/90">
              <div className="flex items-start gap-2 bg-background/50 rounded-lg p-2.5 border border-border/40">
                <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">Exact Diagnostic & 1-Click AI Fix:</span>
                  <span className="text-muted-foreground"> Get code snippets and custom AI fix prompts formatted for your site.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-background/50 rounded-lg p-2.5 border border-border/40">
                <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">White-Label PDF Reports:</span>
                  <span className="text-muted-foreground"> Export branded audit reports for your team or clients.</span>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-background/50 rounded-lg p-2.5 border border-border/40">
                <Bell className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="font-medium text-foreground">24/7 Daily Automated Audits:</span>
                  <span className="text-muted-foreground"> Continuous monitoring with instant Slack and Email alerts.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="pt-2 flex items-center gap-3">
            <Link href="/plans" className="flex-1" onClick={onClose}>
              <Button size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-2 shadow-lg shadow-primary/20">
                <Sparkles className="h-4 w-4" />
                Upgrade to {planTitle}
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" onClick={onClose} className="border-border">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
