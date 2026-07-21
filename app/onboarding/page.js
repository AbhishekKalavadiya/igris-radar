'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Bot, Search, Sparkles, Check } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import LogoText from '@/components/ui/LogoText';
import LogoIcon from '@/components/ui/LogoIcon';

const focusAreas = [
  { id: 'aeo', label: 'LLM Brand Visibility (AEO)', icon: Bot, description: 'Track how ChatGPT, Claude, and Gemini mention your brand' },
  { id: 'geo', label: 'AI Overviews (GEO)', icon: Sparkles, description: 'Optimize for Google AI Overviews and Perplexity' },
  { id: 'seo', label: 'Traditional SEO', icon: Search, description: 'Monitor classic search engine rankings and technical SEO' },
  { id: 'security', label: 'Security & Performance', icon: Shield, description: 'Run automated security and performance audits' },
];

function OnboardingContent() {
  const [selectedGoals, setSelectedGoals] = useState([]);

  const { completeOnboarding, user } = useAuth();
  const router = useRouter();

  const toggleGoal = (id) => {
    setSelectedGoals(prev =>
      prev.includes(id)
        ? prev.filter(g => g !== id)
        : [...prev, id]
    );
  };

  const handleComplete = () => {
    completeOnboarding({
      goals: selectedGoals,
      primaryDomain: null,
      competitorDomain: null,
    });
    router.push('/dashboard');
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl space-y-8 fade-in">
        {/* Logo */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <LogoIcon className="h-7 w-7" />
            </div>
          </div>
          <h1 className="text-2xl flex flex-wrap justify-center items-center gap-1.5">
            Welcome to <LogoText className="text-2xl" />, {user?.name || 'there'}!
          </h1>
          <p className="text-muted-foreground mt-1">Let's set up your workspace</p>
        </div>

        {/* Goals */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>What is your primary focus?</CardTitle>
            <CardDescription>Select the areas you want to monitor and optimize</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {focusAreas.map((goal) => (
              <div
                key={goal.id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer ${
                  selectedGoals.includes(goal.id)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/50'
                }`}
                onClick={() => toggleGoal(goal.id)}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${
                    selectedGoals.includes(goal.id) ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <goal.icon className={`h-5 w-5 ${
                      selectedGoals.includes(goal.id) ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <p className="font-medium">{goal.label}</p>
                    <p className="text-sm text-muted-foreground">{goal.description}</p>
                  </div>
                </div>
                <Switch
                  checked={selectedGoals.includes(goal.id)}
                  onCheckedChange={() => toggleGoal(goal.id)}
                />
              </div>
            ))}

            <div className="flex justify-end pt-4">
              <Button
                onClick={handleComplete}
                disabled={selectedGoals.length === 0}
                className="gap-2"
              >
                Complete Setup <Check className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

export default function OnboardingPage() {
  return (
    <AuthProvider>
      <OnboardingContent />
    </AuthProvider>
  );
}
