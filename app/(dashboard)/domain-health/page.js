'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Globe, Lock, Server, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import PageHeader from '@/components/ui/PageHeader';
import { PageTransition, Stagger, MotionItem } from '@/components/ui/motion';

const UPCOMING = [
  { icon: Lock, title: 'SSL Monitoring', text: 'Certificate chain validation and expiry warnings before they bite.' },
  { icon: Server, title: 'DNS Watch', text: 'Track record changes and catch hijacks or misconfigurations early.' },
  { icon: CalendarClock, title: 'Renewal Alerts', text: 'Never lose a domain to a missed renewal date again.' },
];

export default function DomainHealthPage() {
  const router = useRouter();

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        icon={Globe}
        title="Domain Health"
        description="Monitor DNS, SSL certificates, and domain expiration."
      />

      <Card className="glass-panel rounded-xl border-t-2 border-t-primary/50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
        <CardContent className="pt-14 pb-14 flex flex-col items-center justify-center text-center">
          <div className="relative mb-6">
            <div className="absolute -inset-4 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-background p-4 rounded-full border border-primary/30">
              <Globe className="h-10 w-10 text-primary animate-bounce-slow" />
            </div>
          </div>

          <h2 className="text-3xl font-bold mb-3">Coming Soon</h2>
          <p className="text-muted-foreground max-w-lg mb-10">
            We're putting the final touches on our domain health tools. Here's what's on the way:
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
