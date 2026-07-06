'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, Quote, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function CitationSimulator({ analysis }) {
  if (!analysis) return null;

  const { entityConfidence, citationSimulation, recommendations } = analysis;

  const getConfidenceColor = (level) => {
    const l = (level || '').toLowerCase();
    if (l.includes('high')) return 'text-scanner-geo bg-scanner-geo/10 border-scanner-geo/20';
    if (l.includes('medium')) return 'text-yellow-400 bg-warning/10 border-warning/20';
    return 'text-red-400 bg-destructive/10 border-destructive/20';
  };

  const isPositive = (citationSimulation || '').toLowerCase().includes('yes');

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-scanner-geo" />
              AI Citation Simulator
            </CardTitle>
            <CardDescription className="mt-1">
              Simulated response from an LLM evaluating if it would cite your content.
            </CardDescription>
          </div>
          <Badge variant="outline" className={getConfidenceColor(entityConfidence)}>
            Entity Confidence: {entityConfidence || 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Simulation Bubble */}
        <div className="bg-muted border border-border/50 rounded-xl p-6 relative">
          <Quote className="absolute top-4 left-4 h-8 w-8 text-foreground/5" />
          <div className="pl-6 relative z-10">
            <div className="flex items-center gap-2 mb-3">
              {isPositive ? (
                <CheckCircle2 className="h-5 w-5 text-scanner-geo" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-warning" />
              )}
              <span className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                Simulated Output
              </span>
            </div>
            <p className="text-foreground text-sm leading-relaxed">
              {citationSimulation || "No simulation data available."}
            </p>
          </div>
        </div>

        {/* Recommendations */}
        {recommendations && recommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="h-4 w-4 text-scanner-geo" />
              Optimization Recommendations
            </h4>
            <ul className="space-y-2">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground bg-muted rounded-md p-3">
                  <span className="text-scanner-geo font-mono mt-0.5">•</span>
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
