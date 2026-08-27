'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Globe, 
  Server, 
  Search, 
  Download, 
  ExternalLink, 
  ArrowRight, 
  Copy, 
  Check, 
  Info, 
  HelpCircle,
  Cloud,
  CheckCircle2,
  XCircle,
  Radio,
  FileCode2,
  ChevronDown
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function DanglingDnsRadar({ data, targetDomain = '' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const assets = data?.assets || [];
  const totalScanned = data?.totalScanned || assets.length;
  const vulnerableCount = data?.vulnerableCount ?? assets.filter(a => a.isVulnerable).length;
  const danglingCount = data?.danglingCount ?? assets.filter(a => a.isDangling && !a.isVulnerable).length;
  const secureCount = data?.secureCount ?? assets.filter(a => !a.isVulnerable && !a.isDangling).length;

  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = (asset.host || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.target || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.provider || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (statusFilter === 'vulnerable') return asset.isVulnerable;
      if (statusFilter === 'dangling') return asset.isDangling && !asset.isVulnerable;
      if (statusFilter === 'cname') return asset.recordType === 'CNAME';
      if (statusFilter === 'secure') return !asset.isVulnerable && !asset.isDangling;

      return true;
    });
  }, [assets, searchTerm, statusFilter]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(data || { assets }, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subdomain-radar-${targetDomain || 'domain'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCsv = () => {
    const headers = ['Host', 'Record Type', 'Target', 'Provider', 'Status', 'Severity', 'Evidence', 'Remediation'];
    const rows = assets.map(a => [
      `"${a.host || ''}"`,
      `"${a.recordType || ''}"`,
      `"${a.target || ''}"`,
      `"${a.provider || ''}"`,
      `"${a.status || ''}"`,
      `"${a.severity || ''}"`,
      `"${(a.evidence || '').replace(/"/g, '""')}"`,
      `"${(a.remediation || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subdomain-radar-${targetDomain || 'domain'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!data || assets.length === 0) {
    return (
      <Card className="glass-card border-border bg-card/40">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <div className="p-3 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Globe className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-1">Subdomain & DNS Radar</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Run a security scan to enumerate public Certificate Transparency logs, probe high-risk DNS prefixes, and test for dangling takeover vulnerabilities.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Overview Tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Hosts */}
        <Card className="glass-card border-border bg-card/40 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Discovered Hosts
              </span>
              <Globe className="h-4 w-4 text-primary" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{totalScanned}</span>
              <span className="text-xs text-muted-foreground">CT logs + DNS</span>
            </div>
          </CardContent>
        </Card>

        {/* Takeover Vulnerabilities */}
        <Card className={`glass-card border-border bg-card/40 relative overflow-hidden ${vulnerableCount > 0 ? 'border-destructive/50 bg-destructive/5' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Takeover Vulnerable
              </span>
              <ShieldAlert className={`h-4 w-4 ${vulnerableCount > 0 ? 'text-destructive animate-pulse' : 'text-muted-foreground'}`} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${vulnerableCount > 0 ? 'text-destructive' : 'text-foreground'}`}>
                {vulnerableCount}
              </span>
              {vulnerableCount > 0 && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Dangling CNAMEs */}
        <Card className={`glass-card border-border bg-card/40 relative overflow-hidden ${danglingCount > 0 ? 'border-amber-500/50 bg-amber-500/5' : ''}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Dangling Records
              </span>
              <AlertTriangle className={`h-4 w-4 ${danglingCount > 0 ? 'text-amber-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className={`text-2xl font-bold ${danglingCount > 0 ? 'text-amber-500' : 'text-foreground'}`}>
                {danglingCount}
              </span>
              {danglingCount > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-amber-500 border-amber-500/30">NXDOMAIN</Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Secure & Verified */}
        <Card className="glass-card border-border bg-card/40 relative overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Secure & Verified
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-500">{secureCount}</span>
              <span className="text-xs text-muted-foreground">verified active</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Asset Table & Search Controls */}
      <Card className="glass-card border-border bg-card/40">
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                Subdomain & DNS Attack Surface Radar
              </CardTitle>
              <CardDescription className="mt-1">
                Continuous inventory of discovered hosts, CNAME destinations, and 40+ cloud service fingerprint verifications.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportJson} className="h-8 gap-1.5 text-xs">
                <FileCode2 className="h-3.5 w-3.5" /> JSON
              </Button>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-border/50">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subdomains, CNAMEs, or providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 bg-background/50 text-xs"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                All ({assets.length})
              </Button>
              {vulnerableCount > 0 && (
                <Button
                  variant={statusFilter === 'vulnerable' ? 'destructive' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('vulnerable')}
                  className="h-7 text-xs px-2.5 rounded-full gap-1"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                  Vulnerable ({vulnerableCount})
                </Button>
              )}
              {danglingCount > 0 && (
                <Button
                  variant={statusFilter === 'dangling' ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('dangling')}
                  className="h-7 text-xs px-2.5 rounded-full text-amber-500 border-amber-500/30"
                >
                  Dangling ({danglingCount})
                </Button>
              )}
              <Button
                variant={statusFilter === 'cname' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('cname')}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                Cloud CNAMEs ({assets.filter(a => a.recordType === 'CNAME').length})
              </Button>
              <Button
                variant={statusFilter === 'secure' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter('secure')}
                className="h-7 text-xs px-2.5 rounded-full"
              >
                Secure ({secureCount})
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30 text-muted-foreground uppercase tracking-wider font-semibold">
                  <th className="py-3 px-4">Subdomain Host</th>
                  <th className="py-3 px-4">DNS Record & Target</th>
                  <th className="py-3 px-4">Cloud Provider</th>
                  <th className="py-3 px-4">Takeover Status</th>
                  <th className="py-3 px-4 text-right">Remediation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono">
                {filteredAssets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground font-sans">
                      No subdomains match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredAssets.map((asset, idx) => {
                    const isVuln = asset.isVulnerable;
                    const isDang = asset.isDangling && !isVuln;

                    return (
                      <tr 
                        key={`${asset.host}-${idx}`}
                        className={`hover:bg-muted/30 transition-colors ${isVuln ? 'bg-destructive/5' : isDang ? 'bg-amber-500/5' : ''}`}
                      >
                        {/* Host Column */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{asset.host}</span>
                            <a
                              href={`https://${asset.host}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-muted-foreground hover:text-primary transition-colors"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </td>

                        {/* DNS Record & Target */}
                        <td className="py-3 px-4 max-w-xs truncate">
                          <div className="flex items-center gap-1.5 font-mono">
                            <Badge variant="outline" className="text-[10px] px-1 py-0 font-bold border-border/70">
                              {asset.recordType || 'A'}
                            </Badge>
                            <span className="text-muted-foreground truncate" title={asset.target}>
                              {asset.target || '—'}
                            </span>
                          </div>
                        </td>

                        {/* Provider */}
                        <td className="py-3 px-4 font-sans">
                          <div className="flex items-center gap-1.5">
                            <Cloud className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-foreground">{asset.provider || 'Direct'}</span>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3 px-4 font-sans">
                          {isVuln ? (
                            <Badge variant="destructive" className="gap-1 text-[11px] py-0.5 animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-white" />
                              Takeover Vulnerable
                            </Badge>
                          ) : isDang ? (
                            <Badge variant="outline" className="gap-1 text-[11px] py-0.5 text-amber-500 border-amber-500/40 bg-amber-500/10">
                              <AlertTriangle className="h-3 w-3 text-amber-500" />
                              Dangling CNAME
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-[11px] py-0.5 text-emerald-500 border-emerald-500/30 bg-emerald-500/10">
                              <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                              Secure
                            </Badge>
                          )}
                        </td>

                        {/* Remediation Action */}
                        <td className="py-3 px-4 text-right font-sans">
                          {asset.remediation ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedAsset(asset)}
                              className="h-7 text-xs px-2.5 border-primary/30 hover:border-primary text-primary"
                            >
                              Fix Guide <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground/60">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Remediation Guide Dialog */}
      <Dialog open={!!selectedAsset} onOpenChange={(open) => !open && setSelectedAsset(null)}>
        <DialogContent className="max-w-md glass-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              {selectedAsset?.isVulnerable ? (
                <ShieldAlert className="h-5 w-5 text-destructive" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              )}
              Takeover Remediation: {selectedAsset?.host}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Follow these steps to remediate the dangling DNS record and prevent unauthorized hijacking.
            </DialogDescription>
          </DialogHeader>

          {selectedAsset && (
            <div className="space-y-4 pt-2 text-xs">
              {/* Vulnerability Evidence */}
              <div className="p-3 bg-muted/40 rounded-lg border border-border space-y-1">
                <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                  Diagnostic Evidence:
                </span>
                <p className="text-foreground font-mono">{selectedAsset.evidence}</p>
              </div>

              {/* Target & Cloud Service Details */}
              <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                <div className="p-2.5 bg-card/60 rounded border border-border/50">
                  <span className="block text-[10px] font-semibold text-muted-foreground uppercase">Cloud Provider:</span>
                  <span className="font-semibold text-foreground">{selectedAsset.provider}</span>
                </div>
                <div className="p-2.5 bg-card/60 rounded border border-border/50">
                  <span className="block text-[10px] font-semibold text-muted-foreground uppercase">Target CNAME:</span>
                  <span className="font-mono text-foreground truncate block">{selectedAsset.target}</span>
                </div>
              </div>

              {/* Step-by-Step Fix Action */}
              <div className="p-3.5 bg-primary/10 rounded-lg border border-primary/20 space-y-1.5">
                <span className="font-semibold text-primary flex items-center gap-1.5 text-xs">
                  <CheckCircle2 className="h-4 w-4" /> Recommended Remediation:
                </span>
                <p className="text-foreground leading-relaxed">{selectedAsset.remediation}</p>
              </div>

              {/* Copy DNS Deletion Command / Note */}
              <div className="space-y-1">
                <span className="text-muted-foreground text-[11px]">DNS Record to Remove:</span>
                <div className="flex items-center justify-between p-2 bg-background font-mono rounded border border-border">
                  <span className="truncate">{selectedAsset.host} CNAME {selectedAsset.target}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(`${selectedAsset.host} CNAME ${selectedAsset.target}`, 'dns-rec')}
                    className="h-6 w-6 p-0"
                  >
                    {copiedId === 'dns-rec' ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
