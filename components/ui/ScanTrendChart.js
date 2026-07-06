'use client';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function ScanTrendChart({ scans, scoreKey = 'score', strokeColor = '#3bbcdc' }) {
  if (!scans || scans.length === 0) {
    return (
      <Card className="border-border bg-card/50 backdrop-blur h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">No historical data available.</p>
      </Card>
    );
  }

  // Ensure scans are sorted by date ascending
  const sortedScans = [...scans].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  const data = sortedScans.map(scan => ({
    date: format(new Date(scan.createdAt), 'MMM dd, yyyy'),
    score: scan[scoreKey] || 0,
    fullDate: new Date(scan.createdAt).toLocaleString()
  }));

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-igris-md">
          <p className="text-sm font-medium mb-1">{payload[0].payload.fullDate}</p>
          <p className="text-sm" style={{ color: strokeColor }}>
            Score: <span className="font-bold">{payload[0].value}</span>/100
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Score Trend
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] w-full pt-0">
        {data.length === 1 ? (
          <div className="h-full w-full flex items-center justify-center flex-col text-center">
            <div className="text-4xl font-bold mb-2" style={{ color: strokeColor }}>{data[0].score}</div>
            <p className="text-muted-foreground text-sm max-w-[250px]">
              This is your first scan. Run more scans over time to see your trend here.
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis 
                dataKey="date" 
                stroke="#666" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                minTickGap={30}
              />
              <YAxis 
                stroke="#666" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false} 
                domain={[0, 100]} 
                ticks={[0, 25, 50, 75, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke={strokeColor} 
                strokeWidth={3} 
                dot={{ r: 4, fill: '#1f1f22', stroke: strokeColor, strokeWidth: 2 }}
                activeDot={{ r: 6, fill: strokeColor }}
                animationDuration={1500}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
