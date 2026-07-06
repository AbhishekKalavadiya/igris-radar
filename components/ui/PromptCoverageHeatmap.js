'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, XCircle, HelpCircle } from 'lucide-react';

export default function PromptCoverageHeatmap({ coverageData }) {
  if (!coverageData || !Array.isArray(coverageData) || coverageData.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur">
        <CardContent className="py-12 flex flex-col items-center justify-center text-center">
          <HelpCircle className="h-10 w-10 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-foreground mb-2">No Coverage Data</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Run a Deep Analysis scan and specify a Topic to generate an AI prompt coverage heatmap.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'covered':
        return <CheckCircle2 className="h-5 w-5 text-scanner-geo" />;
      case 'partial':
        return <AlertCircle className="h-5 w-5 text-warning" />;
      case 'missing':
        return <XCircle className="h-5 w-5 text-destructive" />;
      default:
        return <HelpCircle className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'covered':
        return 'bg-scanner-geo/10 border-scanner-geo/20 text-scanner-geo';
      case 'partial':
        return 'bg-warning/10 border-warning/20 text-yellow-300';
      case 'missing':
        return 'bg-destructive/10 border-destructive/20 text-red-300';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-lg text-scanner-geo">Prompt Coverage Heatmap</CardTitle>
        <CardDescription>
          Common questions users might ask AI engines, and how well your content answers them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {coverageData.map((item, index) => (
            <div 
              key={index} 
              className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg border ${getStatusColor(item.coverage)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(item.coverage)}
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-sm font-semibold text-foreground">
                  "{item.prompt}"
                </p>
                <p className="text-xs opacity-80 leading-relaxed">
                  {item.reason}
                </p>
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs font-mono uppercase tracking-wider opacity-60">
                  {item.coverage}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
