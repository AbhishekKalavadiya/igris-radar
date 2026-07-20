'use client';

import { useState, useEffect, useCallback } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { SCANNERS } from '@/lib/scannerAccents';

const SCANNER_KEYS = Object.keys(SCANNERS);

export default function ScanAnalyticsPanel() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api?path=admin/scan-analytics&days=${days}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        toast({ title: 'Failed to load analytics', description: json.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Failed to load analytics', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [days, toast]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading analytics…
      </div>
    );
  }

  const totals = data?.totals || {};
  const series = data?.series || [];
  const maxTotal = Math.max(1, ...SCANNER_KEYS.map((k) => totals[k] || 0));
  const rankedKeys = [...SCANNER_KEYS].sort((a, b) => (totals[b] || 0) - (totals[a] || 0));
  const allZero = SCANNER_KEYS.every((k) => !totals[k]);

  const chartData = series.map((entry) => ({
    ...entry,
    label: format(new Date(entry.date), 'MMM dd'),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Scan volume across every audit tool. Use this to see which scanner is in demand.
        </p>
        <div className="flex gap-2">
          <Button variant={days === 30 ? 'default' : 'outline'} size="sm" onClick={() => setDays(30)}>30d</Button>
          <Button variant={days === 90 ? 'default' : 'outline'} size="sm" onClick={() => setDays(90)}>90d</Button>
          <Button variant="outline" size="sm" onClick={fetchAnalytics} disabled={loading}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>
      </div>

      {allZero ? (
        <Card className="border-border bg-card/50 backdrop-blur h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground text-sm">No scans recorded yet.</p>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Total Scans by Type</CardTitle>
              <CardDescription>All-time count, ranked by demand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankedKeys.map((key) => {
                const scanner = SCANNERS[key];
                const Icon = scanner.icon;
                const total = totals[key] || 0;
                const widthPct = Math.max(2, Math.round((total / maxTotal) * 100));
                return (
                  <div key={key} className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${scanner.text} shrink-0`} />
                    <span className="text-sm w-40 shrink-0">{scanner.label}</span>
                    <div className="flex-1 h-2 bg-muted overflow-hidden">
                      <div className={`h-full ${scanner.bg}`} style={{ width: `${widthPct}%` }} />
                    </div>
                    <span className="text-sm font-mono w-12 text-right">{total}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="border-border bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Volume Trend ({days}d)
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[350px] w-full pt-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="label" stroke="#666" fontSize={12} tickLine={false} axisLine={false} minTickGap={30} />
                  <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)' }} />
                  <Legend />
                  {SCANNER_KEYS.map((key) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={SCANNERS[key].label}
                      stroke={SCANNERS[key].ring}
                      strokeWidth={2}
                      dot={false}
                      animationDuration={800}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
