'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Globe, 
  Lock, 
  Server, 
  Search, 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Radio, 
  Clock, 
  ArrowRight,
  ExternalLink,
  Zap,
  Star
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { PageTransition } from '@/components/ui/motion';
import DanglingDnsRadar from '@/components/ui/DanglingDnsRadar';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import ScanProgressSteps from '@/components/ui/ScanProgressSteps';

const SCAN_STEPS = [
  'Resolving DNS zone and nameservers…',
  'Enumerating Certificate Transparency logs…',
  'Testing subdomains for dangling CNAMEs & takeovers…',
  'Validating SSL/TLS certificate chain…',
  'Compiling Domain Health intelligence…',
];

export default function DomainHealthPage() {
  const [url, setUrl] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const { user } = useAuth();
  const userPlan = user?.plan || 'free';
  const isStarterOrAbove = userPlan === 'starter' || userPlan === 'pro' || user?.role === 'admin' || user?.role === 'owner';
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get('url');
    if (urlParam) {
      setUrl(urlParam);
      runAudit(urlParam);
    }
    fetchRecentScans();
  }, []);

  const fetchRecentScans = async () => {
    try {
      const res = await fetch(`/api?path=security-scan&t=${Date.now()}`);
      const j = await res.json();
      if (j.success && Array.isArray(j.data)) {
        setRecentScans(j.data.slice(0, 6));
      }
    } catch (e) {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  };

  const runAudit = async (targetDomain) => {
    if (!targetDomain) return;
    setIsScanning(true);
    try {
      let clean = targetDomain.trim();
      if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = `https://${clean}`;
      }

      const res = await fetch('/api?path=security-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: clean })
      });

      const json = await res.json();
      if (json.success && json.data) {
        setScanResult(json.data);
        fetchRecentScans();
      } else {
        toast({
          title: 'Domain Scan Failed',
          description: json.error || 'Could not complete domain audit. Please verify the domain name.',
          variant: 'destructive'
        });
      }
    } catch (err) {
      toast({
        title: 'Scan Error',
        description: err.message || 'An unexpected error occurred.',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    runAudit(url);
  };

  // Filter DNS & Attack Surface findings for summary
  const dnsFindings = scanResult?.findings?.filter(f => 
    f.category?.toLowerCase().includes('dns') ||
    f.category?.toLowerCase().includes('ssl') ||
    f.category?.toLowerCase().includes('attack surface')
  ) || [];

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Globe}
        title="Domain Health & Subdomain Radar"
        description="Monitor DNS records, SSL certificates, Certificate Transparency logs, and dangling takeover risks."
      />

      {/* Input Search Form */}
      <Card className="glass-panel rounded-xl border-t-2 border-t-primary/60">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="example.com"
                  className="pl-10"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={isScanning}
                  required
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                />
              </div>
              <div className="flex gap-2">
                {scanResult && (
                  <Button type="button" variant="outline" onClick={() => { setUrl(''); setScanResult(null); }}>
                    Clear
                  </Button>
                )}
                <Button type="submit" disabled={isScanning || !url} className="min-w-[140px] gap-2">
                  {isScanning ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Scanning…
                    </>
                  ) : (
                    <>
                      <Radio className="h-4 w-4" /> Run Radar Audit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Loading Progress */}
      {isScanning && <ScanProgressSteps steps={SCAN_STEPS} />}

      {/* Pre-Scanned Domain Quick Select */}
      {!url && !scanResult && !historyLoading && recentScans.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Quick Select Monitored Domains
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentScans.map((scan) => (
              <Card
                key={scan.id}
                className="glass-card cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => {
                  setUrl(scan.url);
                  setScanResult(scan);
                }}
              >
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="truncate pr-2">
                    <span className="font-semibold text-sm truncate block">{scan.url.replace(/^https?:\/\//, '')}</span>
                    <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3" /> {new Date(scan.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-xs font-mono font-bold">
                    Score: {scan.score}/100
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Scan Results View */}
      {scanResult && !isScanning && (
        <div className="space-y-6">
          {/* Subdomain Takeover & Dangling DNS Radar Table */}
          {isStarterOrAbove ? (
            <DanglingDnsRadar
              data={scanResult.subdomainRadar}
              targetDomain={scanResult.url ? scanResult.url.replace(/^https?:\/\//, '').split('/')[0] : ''}
            />
          ) : (
            <div className="relative">
              <div className="filter blur-md pointer-events-none select-none opacity-40">
                <DanglingDnsRadar
                  data={scanResult.subdomainRadar}
                  targetDomain={scanResult.url ? scanResult.url.replace(/^https?:\/\//, '').split('/')[0] : ''}
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                  <UpgradePrompt currentPlan={userPlan} reason="subdomainRadar" />
                </div>
              </div>
            </div>
          )}

          {/* DNS & SSL Security Check List */}
          {dnsFindings.length > 0 && (
            <Card className="glass-card border-border bg-card/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  DNS Infrastructure & SSL Security Checks
                </CardTitle>
                <CardDescription className="text-xs">
                  Evaluation of Certificate Transparency, SPF, DMARC, DNSSEC, and TLS configuration.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dnsFindings.map((finding) => (
                    <div
                      key={finding.id}
                      className={`p-3.5 rounded-lg border text-xs flex items-start gap-3 ${
                        finding.passed
                          ? 'bg-emerald-500/5 border-emerald-500/20'
                          : 'bg-destructive/5 border-destructive/20'
                      }`}
                    >
                      {finding.passed ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{finding.title}</span>
                          <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                            {finding.severity}
                          </Badge>
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {finding.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </PageTransition>
  );
}
