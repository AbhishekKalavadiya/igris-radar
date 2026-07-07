'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Bot, Search, Globe, Building2, Check, ChevronRight, ChevronLeft, Sparkles, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import LogoText from '@/components/ui/LogoText';
import LogoIcon from '@/components/ui/LogoIcon';

const focusAreas = [
  { id: 'aeo', label: 'LLM Brand Visibility (AEO)', icon: Bot, description: 'Track how ChatGPT, Claude, and Gemini mention your brand' },
  { id: 'geo', label: 'AI Overviews (GEO)', icon: Sparkles, description: 'Optimize for Google AI Overviews and Perplexity' },
  { id: 'seo', label: 'Traditional SEO', icon: Search, description: 'Monitor classic search engine rankings and technical SEO' },
  { id: 'security', label: 'Security & Performance', icon: Shield, description: 'Run automated security and performance audits' },
];

function OnboardingContent() {
  const [step, setStep] = useState(1);
  const [selectedGoals, setSelectedGoals] = useState([]);
  const [domain, setDomain] = useState('');
  const [competitor, setCompetitor] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  const { completeOnboarding, user } = useAuth();
  const router = useRouter();

  const toggleGoal = (id) => {
    setSelectedGoals(prev => 
      prev.includes(id) 
        ? prev.filter(g => g !== id)
        : [...prev, id]
    );
  };

  const handleComplete = async () => {
    setIsScanning(true);
    completeOnboarding({
      goals: selectedGoals,
      primaryDomain: domain,
      competitorDomain: competitor,
    });

    try {
      await fetch('/api/?path=seo-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          url: domain, 
          competitorUrl: competitor || undefined,
          isOnboarding: true 
        })
      });
    } catch (e) {
      // Silently ignore
    }
    
    router.push('/dashboard');
  };

  const handleSkip = () => {
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
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                s <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

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

        {/* Step 1: Goals */}
        {step === 1 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">1</span>
                What is your primary focus?
              </CardTitle>
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
                  onClick={() => setStep(2)}
                  disabled={selectedGoals.length === 0}
                  className="gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Domain Setup */}
        {step === 2 && (
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="h-6 w-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm">2</span>
                Set up your domains
              </CardTitle>
              <CardDescription>Enter the domains you want to track for visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="domain" className="flex items-center gap-2">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Primary Domain
                  </Label>
                  <Input 
                    id="domain" 
                    placeholder="e.g., yourcompany.com" 
                    value={domain}
                    onChange={(e) => setDomain(e.target.value)}
                  />
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-xs text-muted-foreground">The main website you want to track across AI engines.</p>
                    <p className="text-xs font-medium text-primary">🎁 We'll run a comprehensive analysis for this domain for free! (Does not count against your tier limits)</p>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2">
                  <Label htmlFor="competitor" className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    Main Competitor (Optional)
                  </Label>
                  <Input 
                    id="competitor" 
                    placeholder="e.g., competitor.com" 
                    value={competitor}
                    onChange={(e) => setCompetitor(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">We'll compare your brand visibility against this competitor.</p>
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip for now
                  </Button>
                  <Button 
                    onClick={handleComplete} 
                    className="gap-2"
                    disabled={!domain || isScanning}
                  >
                    {isScanning ? (
                      <>Running Free Analysis... <Loader2 className="h-4 w-4 animate-spin" /></>
                    ) : (
                      <>Complete Setup <Check className="h-4 w-4" /></>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
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
