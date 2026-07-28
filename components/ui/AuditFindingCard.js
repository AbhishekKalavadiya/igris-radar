'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, Copy, Check, Sparkles, ChevronDown, ChevronUp, Lock, Search } from 'lucide-react';
import { SEVERITY_STYLES, getSeverityColorClass } from '@/lib/scannerAccents';
import { getFindingExplanation, FINDING_EXPLANATIONS } from '@/lib/scannerExplanations';
import Link from 'next/link';

// Finding explanations now live in lib/scannerExplanations.js (single source of
// truth, shared with the server-side locked-finding resolver). Kept as an alias
// so the existing usage below is unchanged.
const FALLBACK_DETAILS = FINDING_EXPLANATIONS;

const PLAN_LABELS = {
  starter: 'Starter',
  pro: 'Pro',
};

// "How we test this" - a plain-language description of the scan METHOD, keyed by the
// finding's category. Explains WHAT the scanner actually does to produce the result,
// complementing the per-finding "why it matters" (details) text. Categories not listed
// simply omit this section (e.g. SEO/AEO/GEO findings render as before).
const CATEGORY_METHODOLOGY = {
  'Headers': 'We send a standard HTTPS request to your site and inspect the HTTP response headers your server returns - no header on the response means the protection is not active.',
  'SSL/TLS': 'We open a live TLS connection to your server to read its certificate and negotiated protocol, and cross-check public Certificate Transparency logs.',
  'DNS Security': 'We perform live DNS lookups for your domain (TXT/SPF/DMARC, MX, CAA, DKIM selectors, and DNSSEC via a validating resolver).',
  'Secrets': 'We scan your page\'s raw HTML and inline scripts for text patterns that match known API-key, token, and private-key formats.',
  'Active Probing': 'We send targeted requests to commonly-exposed paths (e.g. /.env, /admin, /backup, /.git) and inspect the responses for exposure signatures.',
  'Info Disclosure': 'We inspect your response headers, a triggered error page, and linked source files for details that reveal your technology stack.',
  'Infrastructure': 'We probe network-level properties of your host - DNS records, response timing, protocol support, and open ports.',
  'Domain Reputation': 'We check your domain against Cloudflare\'s public threat-intelligence resolver and read your registration record via RDAP.',
  'Attack Surface': 'We enumerate your public subdomains from Certificate Transparency logs and test each for dangling-CNAME takeover risk.',
  'Auth & Session': 'We inspect login forms, password fields, and Set-Cookie attributes on the page for authentication weaknesses.',
  'Content & Data': 'We scan the page content and HTML source (including comments) for exposed personal or sensitive data.',
  'Client-Side': 'We analyze the JavaScript and external resources your page loads, including inline scripts and Subresource Integrity.',
  'Client-Side / JS': 'We analyze the JavaScript and external resources your page loads, including inline scripts and dangerous DOM sinks.',
  'Supply Chain': 'We inventory the third-party domains and libraries your site depends on and assess their risk.',
  'Dependencies': 'We fingerprint the JavaScript libraries your page loads and check each version against the public OSV vulnerability database.',
  'Compliance': 'We aggregate signals from the other checks and map them to the relevant compliance framework.',
  'Best Practices': 'We check for the presence of recommended security files and configurations (e.g. security.txt).',
};

export default function AuditFindingCard({ finding, scanType, scanId, cachedFix, isPro = false, onUnlockClick }) {
  const [copiedId, setCopiedId] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [fix, setFix] = useState(cachedFix || null);
  const [fixLoading, setFixLoading] = useState(false);
  const [fixError, setFixError] = useState(null);

  // ─── LOCKED FINDING (plan-gated) ──────────────────────────────────────────
  if (finding.locked) {
    const planLabel = PLAN_LABELS[finding.requiredPlan] || 'Starter';
    // Explanation comes from the server (resolved from the real title, which is
    // never sent to the client). Fall back to the local resolver if absent.
    const explanation = finding.explanation || getFindingExplanation(finding);
    // The name is blurred: use a decoy string derived from already-visible
    // context so no real finding name is present in the DOM, while the blur still
    // has natural, varied-length text to render.
    const decoyName = `${finding.category || 'Advanced'} ${finding.severity || ''} diagnostic finding`;

    const handleUnlockTrigger = (e) => {
      e.stopPropagation();
      if (onUnlockClick) {
        onUnlockClick(finding);
      }
    };

    return (
      <Card 
        onClick={handleUnlockTrigger}
        className="glass-card overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 cursor-pointer group"
      >
        <div className={`h-1 w-full ${getSeverityColorClass(finding.severity, false)}`} />
        <CardContent className="p-0">
          <div className="p-5 flex items-start gap-4">
            <div className="mt-0.5 opacity-80 group-hover:scale-110 transition-transform">
              {getSeverityIcon(finding.severity)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <Lock className="h-3.5 w-3.5 text-primary shrink-0 animate-pulse" />
                <h4 className="text-sm font-semibold text-foreground blur-[6px] select-none pointer-events-none" aria-hidden="true">
                  {decoyName}
                </h4>
                <span className="sr-only">Locked finding — upgrade to {planLabel} to view</span>
                <Badge variant="outline" className="text-[10px] py-0 bg-muted/50 font-mono">
                  {finding.passed ? 'Passed' : finding.severity?.toUpperCase()}
                </Badge>
                {finding.category && (
                  <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-mono">{finding.category}</span>
                )}
              </div>

              {/* The site-specific result is blurred/redacted; the check's purpose is explained. */}
              <p className="mt-2 text-xs text-muted-foreground select-none pointer-events-none">
                <span className="blur-sm">Specific technical diagnostic & 1-click AI fix are locked on free tier.</span>
              </p>

              {isExpanded && explanation && (
                <div className="mt-3 rounded-md bg-muted/40 border border-border/50 p-3" onClick={(e) => e.stopPropagation()}>
                  <p className="text-xs text-muted-foreground leading-relaxed">{explanation}</p>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {explanation && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs h-7 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                  >
                    {isExpanded ? <ChevronUp className="h-3 w-3 mr-1.5" /> : <ChevronDown className="h-3 w-3 mr-1.5" />}
                    More information
                  </Button>
                )}
                {onUnlockClick ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-xs h-7 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 font-medium"
                    onClick={handleUnlockTrigger}
                  >
                    <Lock className="h-3 w-3 mr-1.5 text-primary" />
                    Unlock Title & 1-Click Fix ({planLabel})
                  </Button>
                ) : (
                  <Link href="/plans" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" className="text-xs h-7 border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 font-medium">
                      <Lock className="h-3 w-3 mr-1.5 text-primary" />
                      Upgrade to {planLabel} to unlock
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── NORMAL FINDING ───────────────────────────────────────────────────────

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const canGenerate = !!(fix || (scanType && scanId && finding.id));

  const generateFix = async (regenerate = false) => {
    if (fixLoading) return;
    setFixLoading(true);
    setFixError(null);
    try {
      const res = await fetch('/api?path=generate-fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scanType, scanId, findingId: finding.id, regenerate }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Generation failed');
      setFix(json.data.fix);
    } catch (e) {
      setFixError(e.message);
    } finally {
      setFixLoading(false);
    }
  };

  const isPassed = finding.passed || finding.severity === 'passed';
  const displayDetails = finding.details || FALLBACK_DETAILS[finding.title];
  // Methodology: prefer a per-finding override, else the category-level description.
  const methodology = finding.methodology || CATEGORY_METHODOLOGY[finding.category];
  // The dropdown is available whenever we have any deeper content to show.
  const hasMoreInfo = !!(displayDetails || methodology);

  return (
    <Card className={`glass-card premium-hover overflow-hidden ${isPassed ? 'opacity-75 bg-card/30' : ''}`}>
      <div className={`h-1 w-full ${getSeverityColorClass(finding.severity, isPassed)}`} />
      <CardContent className="p-0">
        <div className="p-5 flex items-start gap-4">
          <div className="mt-1">
            {getSeverityIcon(finding.severity)}
          </div>
          <div className="flex-1 min-w-0">
            <div
              className={`flex items-center gap-2 mb-1 flex-wrap ${hasMoreInfo ? 'cursor-pointer' : ''}`}
              onClick={() => hasMoreInfo && setIsExpanded(!isExpanded)}
            >
              <h4 className={`font-medium ${isPassed ? 'text-muted-foreground' : 'text-foreground'}`}>{finding.title}</h4>
              <Badge variant="outline" className="text-[10px] py-0">{finding.category}</Badge>
              {finding.tier && finding.tier !== 'free' && (
                <Badge variant="outline" className="text-[10px] py-0 bg-primary/10 text-primary border-primary/30">
                  {PLAN_LABELS[finding.tier] || finding.tier}
                </Badge>
              )}
              {finding.approximate && (
                <Badge 
                  variant="outline" 
                  className="text-[10px] py-0 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 cursor-help"
                  title="⚠️ Estimated — This data is approximate via public sources and may differ from actual store metrics."
                >
                  Estimated
                </Badge>
              )}
              {hasMoreInfo && (
                <div className="ml-auto flex items-center text-xs text-muted-foreground hover:text-foreground transition-colors">
                  {isExpanded ? 'Hide details' : 'More information'}
                  {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                </div>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">{finding.description}</p>

            {isExpanded && hasMoreInfo && (
              <div className="bg-muted/30 border border-border rounded-md p-4 mb-4 space-y-4 animate-in fade-in slide-in-from-top-2">
                {methodology && (
                  <div className="text-sm text-foreground/90">
                    <div className="font-semibold mb-1 flex items-center gap-2">
                      <Search className="h-4 w-4 text-primary" /> How we test this
                    </div>
                    <p className="leading-relaxed text-muted-foreground">{methodology}</p>
                  </div>
                )}

                <div className="text-sm text-foreground/90">
                  <div className="font-semibold mb-1 flex items-center gap-2">
                    {isPassed
                      ? <CheckCircle2 className="h-4 w-4 text-success" />
                      : <AlertCircle className="h-4 w-4 text-severity-medium" />} What we found
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    {isPassed ? 'This check passed. ' : 'This check needs attention. '}{finding.description}
                  </p>
                </div>

                {displayDetails && (
                  <div className="text-sm text-foreground/90">
                    <div className="font-semibold mb-1 flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" /> Why this matters
                    </div>
                    <p className="leading-relaxed text-muted-foreground">{displayDetails}</p>
                  </div>
                )}

                {/* For FAILED findings the remediation + fix prompt already render below
                    the card, so we only surface it here for PASSED findings. */}
                {isPassed && finding.remediation && (
                  <div className="text-sm text-foreground/90">
                    <div className="font-semibold mb-1 flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" /> How to keep it that way
                    </div>
                    <p className="leading-relaxed text-muted-foreground">{finding.remediation}</p>
                  </div>
                )}
              </div>
            )}
            
            {!isPassed && (
              <div className="space-y-4">
                {finding.remediation && (
                  <div className="text-sm">
                    <span className="font-semibold text-foreground">Remediation:</span> {finding.remediation}
                  </div>
                )}
                
                {finding.aiFixPrompt && (
                  <div className="bg-muted/50 rounded-lg border border-border p-4 relative group overflow-hidden">
                    <div className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
                      <Sparkles className="h-3 w-3" /> Agent-Native Fix Prompt
                    </div>
                    <code className="text-sm text-foreground/80 block pr-10 break-words whitespace-pre-wrap">
                      {finding.aiFixPrompt}
                    </code>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                      onClick={() => copyToClipboard(finding.aiFixPrompt, finding.id)}
                      title="Copy Prompt"
                    >
                      {copiedId === finding.id ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                )}

                {canGenerate && (
                  <div className="pt-1">
                    {!fix && !isPro && (
                      <Link href="/plans">
                        <Button size="sm" variant="outline" className="text-xs h-8 border-primary/30 text-primary hover:bg-primary/10">
                          <Lock className="h-3 w-3 mr-1.5" /> Generate Fix — Pro
                        </Button>
                      </Link>
                    )}

                    {!fix && isPro && (
                      <Button
                        size="sm"
                        className="text-xs h-8 bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => generateFix(false)}
                        disabled={fixLoading}
                      >
                        <Sparkles className="h-3 w-3 mr-1.5" />
                        {fixLoading ? 'Generating fix…' : 'Generate Fix'}
                      </Button>
                    )}

                    {fixError && (
                      <div className="mt-2 text-xs text-destructive flex items-center gap-2">
                        {fixError}
                        <button className="underline cursor-pointer" onClick={() => generateFix(false)}>Try again</button>
                      </div>
                    )}

                    {fix && (
                      <div className="mt-2 glass-card rounded-lg border border-border p-4 space-y-3">
                        <div className="text-xs font-semibold text-primary flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Generated Fix
                        </div>
                        <p className="text-sm text-foreground font-medium">{fix.summary}</p>

                        <div className="text-xs">
                          <span className="font-semibold text-foreground">Where to apply: </span>
                          <span className="text-muted-foreground">{fix.whereToApply}</span>
                        </div>

                        <div className="bg-muted/50 rounded-md border border-border p-3 relative group overflow-hidden">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">{fix.language}</div>
                          <code className="text-sm text-foreground/80 block pr-10 break-words whitespace-pre-wrap">
                            {fix.fixContent}
                          </code>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            onClick={() => copyToClipboard(fix.fixContent, `${finding.id}-fix`)}
                            title="Copy Fix"
                          >
                            {copiedId === `${finding.id}-fix` ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </div>

                        <div className="text-xs">
                          <span className="font-semibold text-foreground">Verification: </span>
                          <span className="text-muted-foreground">{fix.verifyStep}</span>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs h-7 text-muted-foreground hover:text-foreground"
                          onClick={() => generateFix(true)}
                          disabled={fixLoading}
                        >
                          {fixLoading ? 'Regenerating…' : 'Regenerate'}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSeverityIcon(severity) {
  switch (severity) {
    case 'critical': return <AlertTriangle className="h-5 w-5 text-severity-critical" />;
    case 'high': return <AlertCircle className="h-5 w-5 text-severity-high" />;
    case 'medium': return <AlertCircle className="h-5 w-5 text-severity-medium" />;
    case 'low': return <Info className="h-5 w-5 text-severity-low" />;
    case 'passed': return <CheckCircle2 className="h-5 w-5 text-success" />;
    default: return <Info className="h-5 w-5 text-severity-low" />;
  }
}

