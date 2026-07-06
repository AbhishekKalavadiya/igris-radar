'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import SecurityGauge from '@/components/ui/SecurityGauge';

export default function CompetitorCompare({ yourResult, competitorResult, categories }) {
  if (!yourResult || !competitorResult) return null;

  const yourScore = yourResult.score || 0;
  const compScore = competitorResult.score || 0;
  const delta = yourScore - compScore;
  
  let resultText = "It's a tie";
  let resultColor = "text-warning";
  if (delta > 0) {
    resultText = `You beat them by ${delta} points`;
    resultColor = "text-success";
  } else if (delta < 0) {
    resultText = `They beat you by ${Math.abs(delta)} points`;
    resultColor = "text-destructive";
  }

  // Merge categories from both to align rows
  const allCategoryNames = new Set([
    ...(yourResult.categories ? Object.keys(yourResult.categories) : []),
    ...(competitorResult.categories ? Object.keys(competitorResult.categories) : [])
  ]);

  return (
    <Card className="border-border bg-card/50 backdrop-blur w-full">
      <CardHeader className="border-b border-border/50 pb-4">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex justify-between items-center">
          <span>Competitor Comparison</span>
          <span className={`font-bold ${resultColor}`}>{resultText}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        <div className="grid grid-cols-2 gap-8 divide-x divide-border">
          
          {/* Your Site Column */}
          <div className="flex flex-col items-center">
            <div className="text-center mb-6 w-full">
              <h3 className="text-lg font-semibold text-foreground mb-1 truncate max-w-full" title={yourResult.url}>Your Site</h3>
              <p className="text-xs text-muted-foreground truncate max-w-full">{yourResult.url || 'Current'}</p>
            </div>
            
            <div className="h-40 w-40 mb-8">
              <SecurityGauge score={yourScore} />
            </div>
          </div>

          {/* Competitor Column */}
          <div className="flex flex-col items-center pl-8">
            <div className="text-center mb-6 w-full">
              <h3 className="text-lg font-semibold text-foreground mb-1 truncate max-w-full" title={competitorResult.url}>Competitor</h3>
              <p className="text-xs text-muted-foreground truncate max-w-full">{competitorResult.url || 'Target'}</p>
            </div>
            
            <div className="h-40 w-40 mb-8 grayscale-[30%] opacity-80">
              <SecurityGauge score={compScore} />
            </div>
          </div>
        </div>

        {/* Category breakdown rows */}
        {allCategoryNames.size > 0 && (
          <div className="mt-8 space-y-4 border-t border-border/50 pt-6">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-4 text-center">Category Breakdown</h4>
            
            {Array.from(allCategoryNames).map(catName => {
              const myCatScore = yourResult.categories?.[catName]?.score ?? 0;
              const compCatScore = competitorResult.categories?.[catName]?.score ?? 0;
              const catDelta = myCatScore - compCatScore;
              
              return (
                <div key={catName} className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 text-sm">
                  {/* My Score Bar (Right aligned) */}
                  <div className="flex items-center justify-end gap-3 w-full">
                    <span className="font-mono text-xs">{Math.round(myCatScore)}</span>
                    <div className="h-2 w-full max-w-[150px] bg-muted rounded-full flex justify-end overflow-hidden">
                      <div className={`h-full rounded-full bg-primary`} style={{ width: `${Math.round(myCatScore)}%` }} />
                    </div>
                  </div>
                  
                  {/* Category Name */}
                  <div className="w-[140px] text-center font-medium truncate shrink-0 px-2 relative group">
                    {catName}
                    {catDelta !== 0 && (
                      <span className={`absolute -top-1.5 -right-1 text-[9px] font-bold ${catDelta > 0 ? 'text-success' : 'text-destructive'}`}>
                        {catDelta > 0 ? '▲' : '▼'} {Math.abs(Math.round(catDelta))}
                      </span>
                    )}
                  </div>
                  
                  {/* Comp Score Bar (Left aligned) */}
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-2 w-full max-w-[150px] bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full bg-muted-foreground/50`} style={{ width: `${Math.round(compCatScore)}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{Math.round(compCatScore)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
