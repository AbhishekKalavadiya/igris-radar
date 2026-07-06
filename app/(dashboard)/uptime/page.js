'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Signal, Bell, Timer, Globe2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { PageTransition, Stagger, MotionItem } from '@/components/ui/motion';

const UPCOMING = [
  { icon: Globe2, title: 'Global Probes', text: 'Latency checks from multiple regions around the world.' },
  { icon: Timer, title: 'Incident Timeline', text: 'A full history of every outage with duration and root signal.' },
  { icon: Bell, title: 'Instant Alerts', text: 'Email and webhook notifications the moment your service goes down.' },
];

export default function UptimeMonitorPage() {
  const router = useRouter();

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Signal}
        title="Uptime Monitor"
        description="Global synthetic monitoring for your critical endpoints."
      />

      <Card className="glass-panel rounded-xl border-t-2 border-t-primary/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <CardContent className="pt-14 pb-14 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-background p-4 rounded-full border border-primary/30">
              <Signal className="h-10 w-10 text-primary animate-bounce-slow" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-3">Coming Soon</h2>
          <p className="text-muted-foreground max-w-lg mb-10">
            We're building a powerful uptime monitor. Here's what's on the way:
          </p>

          <Stagger className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-3xl mb-10">
            {UPCOMING.map(({ icon: Icon, title, text }) => (
              <MotionItem key={title}>
                <div className="glass-subtle rounded-lg p-5 h-full text-left">
                  <Icon className="h-5 w-5 text-primary mb-3" />
                  <h3 className="font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </div>
              </MotionItem>
            ))}
          </Stagger>

          <Button variant="outline" className="min-w-[180px]" onClick={() => router.push('/dashboard')}>
            Back to Dashboard
          </Button>
        </CardContent>
      </Card>
    </PageTransition>
  );
}
