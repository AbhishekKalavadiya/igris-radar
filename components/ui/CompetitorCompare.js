'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import SecurityGauge from '@/components/ui/SecurityGauge';
import { CheckCircle2, XCircle, ShieldAlert, Sparkles, Copy, Check, ArrowRight, Layers, Target } from 'lucide-react';

export default function CompetitorCompare({ yourResult, competitorResult }) {
  const [activeFilter, setActiveFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  if (!yourResult || !competitorResult) return null;

  const yourScore = yourResult.score || 0;
  const compScore = competitorResult.score || 0;
  const delta = yourScore - compScore;

  let resultText = "It's a tie";
  let resultColor = "text-warning";
  if (delta > 0) {
    resultText = `You lead by +${delta} pts`;
    resultColor = "text-success";
  } else if (delta < 0) {
    resultText = `Competitor leads by +${Math.abs(delta)} pts`;
    resultColor = "text-destructive";
  }

  // Merge category scores
  const allCategoryNames = Array.from(new Set([
    ...(yourResult.categories ? Object.keys(yourResult.categories) : []),
    ...(competitorResult.categories ? Object.keys(competitorResult.categories) : [])
  ]));

  // Merge findings for detailed gap matrix
  const myFindings = yourResult.findings || [];
  const compFindings = competitorResult.findings || [];

  const compFindingsMap = new Map();
  compFindings.forEach(f => {
    const key = (f.title || f.name || '').toLowerCase().trim();
    if (key) compFindingsMap.set(key, f);
  });

  const matrixItems = myFindings.map(myF => {
    const key = (myF.title || myF.name || '').toLowerCase().trim();
    const compF = compFindingsMap.get(key);

    const myPassed = myF.passed ?? (myF.severity === 'passed' || myF.score === 100);
    const compPassed = compF ? (compF.passed ?? (compF.severity === 'passed' || compF.score === 100)) : false;

    let status = 'parity';
    if (myPassed && !compPassed) status = 'advantage';
    else if (!myPassed && compPassed) status = 'gap';
    else if (!myPassed && !compPassed) status = 'shared_flaw';

    return {
      id: myF.id || key,
      title: myF.title || myF.name || 'Feature Check',
      category: myF.category || 'Audit Check',
      severity: myF.severity || 'medium',
      myPassed,
      compPassed,
      status,
      prompt: myF.aiFixPrompt || myF.fixPrompt || (compF?.aiFixPrompt || compF?.fixPrompt) || `Remediate ${myF.title} to gain competitive parity.`,
      desc: myF.description || myF.desc || ''
    };
  });

  const filteredItems = matrixItems.filter(item => {
    if (activeFilter === 'gaps') return item.status === 'gap';
    if (activeFilter === 'advantages') return item.status === 'advantage';
    if (activeFilter === 'parity') return item.status === 'parity';
    return true;
  });

  const counts = {
    all: matrixItems.length,
    gaps: matrixItems.filter(i => i.status === 'gap').length,
    advantages: matrixItems.filter(i => i.status === 'advantage').length,
    parity: matrixItems.filter(i => i.status === 'parity').length,
  };

  const handleCopyPrompt = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Gauge & Category Comparison Card */}
      <Card className="glass-card border-border bg-card/50 backdrop-blur w-full overflow-hidden">
        <CardHeader className="border-b border-border/50 pb-4">
          <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex justify-between items-center">
            <span className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              Competitive Audit Benchmarking
            </span>
            <span className={`font-bold ${resultColor}`}>{resultText}</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 divide-y md:divide-y-0 md:divide-x divide-border">
            
            {/* Your Site Column */}
            <div className="flex flex-col items-center">
              <div className="text-center mb-4 w-full">
                <Badge variant="outline" className="mb-2 bg-primary/10 border-primary/20 text-primary">Your Domain</Badge>
                <h3 className="text-base font-semibold text-foreground truncate max-w-full" title={yourResult.url}>
                  {yourResult.url || 'Your Site'}
                </h3>
              </div>
              <div className="h-36 w-36 mb-4">
                <SecurityGauge score={yourScore} />
              </div>
            </div>

            {/* Competitor Column */}
            <div className="flex flex-col items-center md:pl-8 pt-6 md:pt-0">
              <div className="text-center mb-4 w-full">
                <Badge variant="outline" className="mb-2 bg-muted border-border text-muted-foreground">Target Competitor</Badge>
                <h3 className="text-base font-semibold text-foreground truncate max-w-full" title={competitorResult.url}>
                  {competitorResult.url || 'Competitor Site'}
                </h3>
              </div>
              <div className="h-36 w-36 mb-4 opacity-85">
                <SecurityGauge score={compScore} />
              </div>
            </div>
          </div>

          {/* Category breakdown bars */}
          {allCategoryNames.length > 0 && (
            <div className="mt-8 space-y-3 border-t border-border/50 pt-6">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-4 text-center">
                Category Score Alignment
              </h4>
              
              {allCategoryNames.map(catName => {
                const myCatScore = yourResult.categories?.[catName]?.score ?? 0;
                const compCatScore = competitorResult.categories?.[catName]?.score ?? 0;
                const catDelta = myCatScore - compCatScore;
                
                return (
                  <div key={catName} className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs">
                    {/* My Score Bar */}
                    <div className="flex items-center justify-end gap-2 w-full">
                      <span className="font-mono text-xs font-semibold">{Math.round(myCatScore)}%</span>
                      <div className="h-2 w-full max-w-[130px] bg-muted rounded-full flex justify-end overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(myCatScore)}%` }} />
                      </div>
                    </div>
                    
                    {/* Category Name */}
                    <div className="w-[140px] text-center font-medium truncate shrink-0 px-1 relative">
                      {catName}
                      {catDelta !== 0 && (
                        <span className={`ml-1 font-mono text-[10px] ${catDelta > 0 ? 'text-success' : 'text-destructive'}`}>
                          {catDelta > 0 ? `+${Math.round(catDelta)}` : `${Math.round(catDelta)}`}
                        </span>
                      )}
                    </div>
                    
                    {/* Comp Score Bar */}
                    <div className="flex items-center gap-2 w-full">
                      <div className="h-2 w-full max-w-[130px] bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-muted-foreground/40" style={{ width: `${Math.round(compCatScore)}%` }} />
                      </div>
                      <span className="font-mono text-xs text-muted-foreground">{Math.round(compCatScore)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Side-by-Side Matrix Table Card */}
      {matrixItems.length > 0 && (
        <Card className="glass-card border-border overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Competitive Keyword & Heuristic Matrix
                </CardTitle>
                <CardDescription className="text-xs mt-0.5">
                  Granular side-by-side gap analysis of features, schema, and signals against competitor.
                </CardDescription>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border border-border/50 text-xs">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${activeFilter === 'all' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  All ({counts.all})
                </button>
                <button
                  onClick={() => setActiveFilter('gaps')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${activeFilter === 'gaps' ? 'bg-destructive/10 text-destructive shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Gaps ({counts.gaps})
                </button>
                <button
                  onClick={() => setActiveFilter('advantages')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${activeFilter === 'advantages' ? 'bg-success/10 text-success shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Advantages ({counts.advantages})
                </button>
                <button
                  onClick={() => setActiveFilter('parity')}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium ${activeFilter === 'parity' ? 'bg-card text-muted-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Parity ({counts.parity})
                </button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="border-t border-border/50 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/40 text-muted-foreground uppercase text-[11px] border-b border-border/50">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Audit Check</th>
                    <th className="px-4 py-3 font-semibold">Category</th>
                    <th className="px-4 py-3 font-semibold text-center">Your Status</th>
                    <th className="px-4 py-3 font-semibold text-center">Competitor</th>
                    <th className="px-4 py-3 font-semibold text-center">Comparison Status</th>
                    <th className="px-4 py-3 font-semibold text-right">Action Plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-4 py-8 text-center text-muted-foreground">
                        No matrix items match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredItems.map(item => {
                      return (
                        <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-4 py-3 font-medium text-foreground">
                            <div className="font-semibold">{item.title}</div>
                            {item.desc && <div className="text-[11px] text-muted-foreground truncate max-w-[280px]" title={item.desc}>{item.desc}</div>}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                            <Badge variant="outline" className="text-[10px] py-0 px-2 font-normal">
                              {item.category}
                            </Badge>
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {item.myPassed ? (
                              <span className="inline-flex items-center gap-1 text-success font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-destructive font-medium">
                                <XCircle className="h-3.5 w-3.5" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {item.compPassed ? (
                              <span className="inline-flex items-center gap-1 text-success font-medium">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Passed
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-muted-foreground font-medium">
                                <XCircle className="h-3.5 w-3.5" /> Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center whitespace-nowrap">
                            {item.status === 'advantage' && (
                              <Badge className="bg-success/15 text-success border-success/30 text-[10px]">
                                Your Advantage
                              </Badge>
                            )}
                            {item.status === 'gap' && (
                              <Badge className="bg-destructive/15 text-destructive border-destructive/30 text-[10px]">
                                Competitor Gap
                              </Badge>
                            )}
                            {item.status === 'parity' && (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                                Parity
                              </Badge>
                            )}
                            {item.status === 'shared_flaw' && (
                              <Badge variant="outline" className="text-[10px] text-amber-500 border-amber-500/30 bg-amber-500/10">
                                Shared Issue
                              </Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap">
                            {item.status === 'gap' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[11px] px-2.5 gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
                                onClick={() => handleCopyPrompt(item.prompt, item.id)}
                              >
                                {copiedId === item.id ? (
                                  <>
                                    <Check className="h-3 w-3 text-success" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3" /> Bridge Gap
                                  </>
                                )}
                              </Button>
                            ) : (
                              <span className="text-muted-foreground text-[11px]">—</span>
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
      )}
    </div>
  );
}
