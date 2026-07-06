'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { 
  Globe, Shield, Search, Sparkles, Bot, Target, 
  ArrowLeft, Clock, AlertCircle, ArrowRight, Activity, Bell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/authContext';
import SecurityGauge from '@/components/ui/SecurityGauge';
import ScheduledAuditManager from '@/components/ui/ScheduledAuditManager';

export default function CompanyDetailsPage() {
  const { domain } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedScan, setSelectedScan] = useState(null);
  const [scanModalType, setScanModalType] = useState('');
  const [showMonitoringDialog, setShowMonitoringDialog] = useState(false);
  const [monitoringScanType, setMonitoringScanType] = useState('security');
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanyData();
  }, [domain]);

  const fetchCompanyData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api?path=companies&domain=${encodeURIComponent(domain)}&t=${Date.now()}`, { cache: 'no-store' });
      const result = await res.json();
      if (result.success) {
        setData(result.data);
      }
    } catch {
      toast({ title: 'Error loading company data', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const decodeDomain = decodeURIComponent(domain);

  const getLatestScore = (scans) => {
    if (!scans || scans.length === 0) return null;
    return scans[0].score;
  };

  const getLatestDate = (scans) => {
    if (!scans || scans.length === 0) return 'Never scanned';
    return new Date(scans[0].createdAt).toLocaleDateString();
  };

  const renderScanHistory = (scans, typeName, scanLink) => {
    if (!scans || scans.length === 0) {
      return (
        <Card className="glass-panel border-dashed text-center py-12">
          <CardContent>
            <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <h3 className="text-lg font-semibold mb-2">No {typeName} History</h3>
            <p className="text-muted-foreground text-sm max-w-sm mx-auto mb-6">
              You haven't run any {typeName}s for this domain yet.
            </p>
            <Link href={`${scanLink}?url=https://${decodeDomain}`}>
              <Button>Run first {typeName}</Button>
            </Link>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {scans.map((scan) => (
          <Card key={scan.id} className="glass-panel">
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-6 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 shrink-0 flex items-center justify-center">
                  <SecurityGauge 
                    score={scan.score} 
                    size={64} 
                    showLabel={false} 
                    valueSize="text-xl" 
                  />
                </div>
                <div>
                  <h4 className="font-semibold">{new Date(scan.createdAt).toLocaleString()}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-1">{scan.url}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => {
                  setSelectedScan(scan);
                  setScanModalType(typeName);
                }}
              >
                View full report <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/companies">
          <Button variant="ghost" size="sm" className="mb-2 -ml-3 text-muted-foreground">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Companies
          </Button>
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Globe className="h-8 w-8 text-primary" />
              {decodeDomain}
            </h1>
            <p className="text-muted-foreground mt-1">Unified view of all scans and audits for this domain.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" className="gap-2 mr-2 border-primary/20 text-primary hover:bg-primary/10" onClick={() => setShowMonitoringDialog(true)}>
              <Bell className="h-3.5 w-3.5" /> Automate Monitoring
            </Button>
            <Link href={`/security-scan?url=https://${decodeDomain}`}>
              <Button variant="outline" size="sm" className="gap-2"><Shield className="h-3.5 w-3.5" /> Security</Button>
            </Link>
            <Link href={`/seo-audit?url=https://${decodeDomain}`}>
              <Button variant="outline" size="sm" className="gap-2"><Search className="h-3.5 w-3.5" /> SEO</Button>
            </Link>
            <Link href={`/aeo-audit?url=https://${decodeDomain}`}>
              <Button variant="outline" size="sm" className="gap-2"><Sparkles className="h-3.5 w-3.5" /> AEO</Button>
            </Link>
            <Link href={`/geo-audit?url=https://${decodeDomain}`}>
              <Button variant="outline" size="sm" className="gap-2"><Bot className="h-3.5 w-3.5" /> GEO</Button>
            </Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-40 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : data ? (
        <>
          {/* Status Overview Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="glass-panel">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase flex items-center justify-between">
                  Latest Security <Shield className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{getLatestScore(data.security) ?? '-'}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> {getLatestDate(data.security)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-panel">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase flex items-center justify-between">
                  Latest SEO <Search className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{getLatestScore(data.seo) ?? '-'}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> {getLatestDate(data.seo)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-panel">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase flex items-center justify-between">
                  Latest AEO <Sparkles className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{getLatestScore(data.aeo) ?? '-'}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> {getLatestDate(data.aeo)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-panel">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-xs text-muted-foreground uppercase flex items-center justify-between">
                  Latest GEO <Bot className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <div className="text-2xl font-bold">{getLatestScore(data.geo) ?? '-'}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" /> {getLatestDate(data.geo)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Detailed History Tabs */}
          <Tabs defaultValue="security" className="space-y-4">
            <TabsList className="bg-card/50 backdrop-blur-sm border border-border w-full justify-start overflow-x-auto p-1">
              <TabsTrigger value="security" className="gap-2"><Shield className="h-4 w-4" /> Security ({data.security.length})</TabsTrigger>
              <TabsTrigger value="seo" className="gap-2"><Search className="h-4 w-4" /> SEO ({data.seo.length})</TabsTrigger>
              <TabsTrigger value="aeo" className="gap-2"><Sparkles className="h-4 w-4" /> AEO ({data.aeo.length})</TabsTrigger>
              <TabsTrigger value="geo" className="gap-2"><Bot className="h-4 w-4" /> GEO ({data.geo.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="security" className="m-0">
              {renderScanHistory(data.security, 'Security Scan', '/security-scan')}
            </TabsContent>
            <TabsContent value="seo" className="m-0">
              {renderScanHistory(data.seo, 'SEO Audit', '/seo-audit')}
            </TabsContent>
            <TabsContent value="aeo" className="m-0">
              {renderScanHistory(data.aeo, 'AEO Audit', '/aeo-audit')}
            </TabsContent>
            <TabsContent value="geo" className="m-0">
              {renderScanHistory(data.geo, 'GEO Audit', '/geo-audit')}
            </TabsContent>
          </Tabs>
        </>
      ) : null}

      {/* Scan Report Modal */}
      <Dialog open={!!selectedScan} onOpenChange={(open) => !open && setSelectedScan(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              {scanModalType} Results
            </DialogTitle>
            <CardDescription>{selectedScan?.url}</CardDescription>
          </DialogHeader>
          
          {selectedScan && (
             <div className="space-y-6 mt-4">
                {/* Score Header */}
                <div className="flex items-center gap-6 p-6 bg-muted/20 rounded-xl border border-border/50">
                  <div className="shrink-0">
                    <SecurityGauge score={selectedScan.score} size={100} valueSize="text-4xl" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-1">Overall Score</h3>
                    <p className="text-muted-foreground">Scanned on: {new Date(selectedScan.createdAt).toLocaleString()}</p>
                    
                    {selectedScan.deepAnalysis?.eeatScore !== undefined && (
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-sm font-semibold text-primary">E-E-A-T Estimation:</span>
                        <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden w-48">
                          <div className="h-full bg-primary" style={{ width: `${selectedScan.deepAnalysis.eeatScore}%` }} />
                        </div>
                        <span className="text-sm font-mono text-primary">{selectedScan.deepAnalysis.eeatScore}/100</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categories */}
                {selectedScan.categories && selectedScan.categories.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Target className="h-4 w-4" /> Score Breakdown</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {selectedScan.categories.map((cat, i) => (
                        <div key={i} className="flex justify-between items-center p-3 bg-card border rounded-lg shadow-sm">
                          <span className="text-sm font-medium">{cat.name}</span>
                          <span className={`font-mono font-bold text-sm ${cat.score >= 80 ? 'text-success' : cat.score >= 50 ? 'text-warning' : 'text-destructive'}`}>
                            {cat.score}/100
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Findings */}
                {selectedScan.findings && selectedScan.findings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Detailed Findings</h4>
                    <div className="space-y-3">
                      {selectedScan.findings.map((finding, i) => (
                        <div key={i} className="p-4 border rounded-lg bg-card shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-semibold text-foreground text-base pr-4">{finding.title}</span>
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 uppercase tracking-wider ${
                              finding.severity === 'high' ? 'bg-severity-high/10 text-severity-high border border-severity-high/20' :
                              finding.severity === 'medium' ? 'bg-severity-medium/10 text-severity-medium border border-severity-medium/20' :
                              finding.severity === 'low' ? 'bg-severity-low/10 text-severity-low border border-severity-low/20' :
                              'bg-success/10 text-success border border-success/20'
                            }`}>
                              {finding.severity || 'info'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{finding.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Deep Analysis Specifics */}
                {selectedScan.deepAnalysis && selectedScan.deepAnalysis.contentGapAnalysis && (
                  <div>
                     <h4 className="font-semibold text-lg mb-3 flex items-center gap-2"><Sparkles className="h-4 w-4 text-scanner-aeo" /> Deep Analysis Insight</h4>
                     <div className="p-5 border border-scanner-aeo/20 rounded-lg bg-scanner-aeo/5 text-sm text-foreground/90 leading-relaxed">
                        {selectedScan.deepAnalysis.contentGapAnalysis}
                     </div>
                  </div>
                )}
              </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Monitoring Modal */}
      <Dialog open={showMonitoringDialog} onOpenChange={setShowMonitoringDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Automated Monitoring</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Scan Type to Automate</label>
              <div className="flex gap-2">
                {['security', 'seo', 'aeo', 'geo'].map((type) => (
                  <Button
                    key={type}
                    type="button"
                    variant={monitoringScanType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setMonitoringScanType(type)}
                    className="capitalize min-w-[80px]"
                  >
                    {type.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
            
            <ScheduledAuditManager
              url={`https://${decodeDomain}`}
              scanType={monitoringScanType}
              userPlan={user?.plan || 'free'}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
