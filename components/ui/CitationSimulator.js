'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Quote, Target, AlertTriangle, CheckCircle2, Database, Layers, Award, Sparkles, XCircle, HelpCircle } from 'lucide-react';

export default function CitationSimulator({ analysis }) {
  if (!analysis) return null;

  const {
    entityConfidence,
    citationSimulation,
    citationSimulationDetails,
    knowledgeGraphGapAnalysis,
    topicalAuthorityDepthMap,
    competitivePositioning,
    topicalAuthorityScore,
    uniquenessScore,
    recommendations,
  } = analysis;

  const getConfidenceColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l.includes('high')) return 'text-scanner-geo bg-scanner-geo/10 border-scanner-geo/20';
    if (l.includes('medium')) return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-destructive/10 border-destructive/20';
  };

  const isPositive = citationSimulationDetails
    ? citationSimulationDetails.wouldCite
    : (citationSimulation || '').toLowerCase().includes('yes');

  return (
    <div className="space-y-6">
      {/* Header Overview Card */}
      <Card className="glass-card border-scanner-geo/30 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-scanner-geo" />
                GEO Deep AI Intelligence
              </CardTitle>
              <CardDescription className="mt-1">
                Generative Engine Optimization assessment of entity trust, Knowledge Graph signals, and citation simulation.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className={`px-3 py-1 text-xs font-semibold ${getConfidenceColor(entityConfidence)}`}>
                Entity Confidence: {entityConfidence || 'Unknown'}
              </Badge>
              {topicalAuthorityScore != null && (
                <Badge variant="outline" className="px-3 py-1 text-xs font-semibold text-primary bg-primary/10 border-primary/20">
                  Topical Authority: {topicalAuthorityScore}/100
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-0">
          {/* Main Simulation Bubble */}
          <div className="bg-muted/50 border border-border rounded-xl p-5 relative overflow-hidden">
            <Quote className="absolute top-3 left-3 h-10 w-10 text-foreground/5 pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-scanner-geo" />
                  <span className="font-semibold text-sm text-foreground">
                    AI Citation Simulation
                  </span>
                </div>
                <Badge className={isPositive ? 'bg-success/20 text-success border-success/30' : 'bg-warning/20 text-warning border-warning/30'}>
                  {isPositive ? 'Would Cite' : 'Needs Optimization'}
                </Badge>
              </div>

              {citationSimulationDetails?.targetQuery && (
                <div className="text-xs text-muted-foreground bg-background/60 p-2.5 rounded-lg border border-border/50">
                  <span className="font-semibold text-foreground">Simulated User Query: </span>
                  &ldquo;{citationSimulationDetails.targetQuery}&rdquo;
                </div>
              )}

              <p className="text-foreground text-sm leading-relaxed">
                {citationSimulationDetails?.reasoning || citationSimulation || "No simulation data available."}
              </p>

              {citationSimulationDetails?.extractedSnippet && (
                <div className="mt-3 p-3 bg-scanner-geo/5 border border-scanner-geo/20 rounded-lg text-xs space-y-1">
                  <span className="font-semibold text-scanner-geo flex items-center gap-1">
                    <Quote className="h-3 w-3" /> Extracted Citation Snippet:
                  </span>
                  <p className="text-foreground/90 italic">&ldquo;{citationSimulationDetails.extractedSnippet}&rdquo;</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Knowledge Graph Gaps & Competitive Positioning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Knowledge Graph Gap Analysis */}
        {knowledgeGraphGapAnalysis && (
          <Card className="glass-card flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Database className="h-4 w-4 text-scanner-geo" />
                  Knowledge Graph Gap Analysis
                </CardTitle>
                {knowledgeGraphGapAnalysis.score != null && (
                  <Badge variant="outline" className="text-xs font-mono bg-scanner-geo/10 text-scanner-geo border-scanner-geo/30">
                    Score: {knowledgeGraphGapAnalysis.score}/100
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Structural Schema & entity completeness for Google Knowledge Graph resolution.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              {knowledgeGraphGapAnalysis.missingProperties?.length > 0 ? (
                <div className="space-y-2">
                  <span className="font-semibold text-foreground block">Missing Entity Properties:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {knowledgeGraphGapAnalysis.missingProperties.map((prop, idx) => (
                      <Badge key={idx} variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 font-mono text-[11px]">
                        <XCircle className="h-3 w-3 mr-1" /> {prop}
                      </Badge>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Entity properties are well-defined in JSON-LD schema.</span>
                </div>
              )}

              {knowledgeGraphGapAnalysis.recommendations && (
                <div className="bg-muted/40 p-3 rounded-lg border border-border text-muted-foreground leading-relaxed">
                  <span className="font-semibold text-foreground block mb-1">Recommendation:</span>
                  {knowledgeGraphGapAnalysis.recommendations}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Competitive Positioning & Trust Hierarchy */}
        {competitivePositioning && (
          <Card className="glass-card flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-scanner-geo" />
                  Competitive Positioning
                </CardTitle>
                {competitivePositioning.trustHierarchyRank && (
                  <Badge variant="outline" className="text-xs font-medium bg-primary/10 text-primary border-primary/30">
                    {competitivePositioning.trustHierarchyRank}
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                Brand placement in LLM trust hierarchy compared to market competitors.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <p className="text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border border-border">
                {competitivePositioning.positioningAnalysis}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Topical Authority Depth Map */}
      {topicalAuthorityDepthMap && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-4 w-4 text-scanner-geo" />
              Topical Authority Depth Map
            </CardTitle>
            <CardDescription className="text-xs">
              Subtopics covered vs. missing subtopics required to be the definitive source on this subject.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-xs">
            {topicalAuthorityDepthMap.depthAssessment && (
              <p className="text-muted-foreground leading-relaxed bg-muted/40 p-3 rounded-lg border border-border">
                {topicalAuthorityDepthMap.depthAssessment}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {topicalAuthorityDepthMap.coveredSubtopics?.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-success" /> Subtopics Covered ({topicalAuthorityDepthMap.coveredSubtopics.length}):
                  </span>
                  <ul className="space-y-1.5">
                    {topicalAuthorityDepthMap.coveredSubtopics.map((sub, i) => (
                      <li key={i} className="bg-success/5 border border-success/20 rounded p-2 text-foreground/90 flex items-center gap-2">
                        <span className="text-success font-mono">•</span> {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {topicalAuthorityDepthMap.missingSubtopics?.length > 0 && (
                <div className="space-y-2">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-warning" /> Missing Subtopics to Add ({topicalAuthorityDepthMap.missingSubtopics.length}):
                  </span>
                  <ul className="space-y-1.5">
                    {topicalAuthorityDepthMap.missingSubtopics.map((sub, i) => (
                      <li key={i} className="bg-warning/5 border border-warning/20 rounded p-2 text-foreground/90 flex items-center gap-2">
                        <span className="text-warning font-mono">•</span> {sub}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* General Recommendations */}
      {recommendations && recommendations.length > 0 && (
        <Card className="glass-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-scanner-geo" />
              Optimization Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 border border-border">
                  <span className="text-scanner-geo font-mono mt-0.5">•</span>
                  <span className="text-foreground/90">{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
