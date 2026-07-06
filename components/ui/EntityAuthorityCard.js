'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { User, ShieldCheck, Link2, Building, Calendar, XCircle, CheckCircle2 } from 'lucide-react';

export default function EntityAuthorityCard({ findings }) {
  if (!findings || findings.length === 0) return null;

  // Map our findings to visual checklist items based on keywords in title
  const getFindingByKeyword = (keyword) => {
    return findings.find(f => f.title.toLowerCase().includes(keyword.toLowerCase()));
  };

  const authorFinding = getFindingByKeyword('Author Byline');
  const socialFinding = getFindingByKeyword('Social / sameAs');
  const logoFinding = getFindingByKeyword('Brand Logo');
  const dateFinding = getFindingByKeyword('Publication Dates');
  const aboutFinding = getFindingByKeyword('About Page');

  const checklist = [
    { title: 'Author Identity', icon: User, finding: authorFinding },
    { title: 'Organization / Logo', icon: Building, finding: logoFinding },
    { title: 'Social & Wikipedia Links', icon: Link2, finding: socialFinding },
    { title: 'Content Freshness', icon: Calendar, finding: dateFinding },
    { title: 'About / Team Page', icon: ShieldCheck, finding: aboutFinding },
  ];

  const passedCount = checklist.filter(i => i.finding?.passed).length;
  const score = Math.round((passedCount / checklist.length) * 100);

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg text-scanner-geo">Entity Authority</CardTitle>
            <CardDescription>
              Signals that help LLMs connect this page to a real-world person or brand.
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-scanner-geo">{score}%</div>
            <div className="text-xs text-muted-foreground uppercase tracking-wider">Score</div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checklist.map((item, i) => {
            const Icon = item.icon;
            const isPassed = item.finding?.passed;
            return (
              <div 
                key={i} 
                className={`flex items-start gap-3 p-3 rounded-lg border ${
                  isPassed 
                    ? 'bg-scanner-geo/5 border-scanner-geo/20' 
                    : 'bg-destructive/5 border-destructive/20'
                }`}
              >
                <div className="mt-0.5">
                  <Icon className={`h-5 w-5 ${isPassed ? 'text-scanner-geo' : 'text-muted-foreground'}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{item.title}</span>
                    {isPassed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-scanner-geo ml-auto" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-destructive ml-auto" />
                    )}
                  </div>
                  {!isPassed && item.finding && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.finding.remediation}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
