'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function CategoryScoreBreakdown({ categories }) {
  const [animatedScores, setAnimatedScores] = useState({});

  useEffect(() => {
    if (!categories) return;
    
    // Animate the scores after a short delay
    const timer = setTimeout(() => {
      const targetScores = {};
      Object.entries(categories).forEach(([key, data]) => {
        targetScores[key] = Math.max(0, Math.min(100, Math.round(data.score)));
      });
      setAnimatedScores(targetScores);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [categories]);

  if (!categories || Object.keys(categories).length === 0) return null;

  const getColor = (score) => {
    if (score >= 70) return 'bg-[#3bbcdc]'; // Igris teal
    if (score >= 40) return 'bg-[#2a9db5]'; // Mid teal
    return 'bg-destructive'; // At risk
  };

  return (
    <Card className="glass-card premium-hover h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Category Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-center gap-4">
        {Object.entries(categories).map(([name, data]) => {
          const score = Math.max(0, Math.min(100, Math.round(data.score)));
          return (
            <div key={name} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium truncate pr-4">{name}</span>
                <span className="text-muted-foreground shrink-0">{score}/100</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-[1500ms] ease-out ${getColor(score)}`}
                  style={{ width: `${animatedScores[name] !== undefined ? animatedScores[name] : 0}%` }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
