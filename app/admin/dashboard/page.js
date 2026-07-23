'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Loader2, Save, RefreshCw, LogOut, KeyRound, Layers, User, BarChart3, Globe } from 'lucide-react';
import ApiKeysPanel from '@/components/admin/ApiKeysPanel';
import UsersPanel from '@/components/admin/UsersPanel';
import ScanAnalyticsPanel from '@/components/admin/ScanAnalyticsPanel';
import ScannedWebsitesPanel from '@/components/admin/ScannedWebsitesPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { PageTransition } from '@/components/ui/motion';

const PLANS_ORDER = ['free', 'starter', 'pro'];

export default function AdminDashboardPage() {
  const [section, setSection] = useState('users');
  const [plansMap, setPlansMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api?path=plan-limits');
      const data = await res.json();
      if (data.success) {
        setPlansMap(data.data);
      }
    } catch (err) {
      toast({ title: 'Error loading plans', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updates = Object.values(plansMap);
      const res = await fetch('/api?path=admin/update-plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      const data = await res.json();
      
      if (data.success) {
        toast({ title: 'Plans Updated successfully', description: 'Changes are now live.' });
      } else {
        toast({ title: 'Update Failed', description: data.error, variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: 'Error saving plans', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = (planId, field, value) => {
    setPlansMap(prev => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: value
      }
    }));
  };

  const handleLogout = () => {
    document.cookie = 'provenance_admin=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/admin');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen p-8 bg-muted/20">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Shield className="w-8 h-8 text-primary" />
              {section === 'plans' ? 'Plan Configuration' : section === 'keys' ? 'API Keys' : section === 'scans' ? 'Scanned Websites' : section === 'analytics' ? 'Scan Analytics' : 'User Management'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {section === 'plans'
                ? 'Manage limits, features, and pricing for all tiers.'
                : section === 'keys'
                  ? 'Manage integration API keys - changes apply instantly across the system.'
                  : section === 'scans'
                    ? 'Track landing page scanner usage and all scanned websites.'
                    : section === 'analytics'
                      ? 'Platform-wide scan volume by tool.'
                      : 'View registered users and monitor their platform activity.'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {section === 'plans' && (
              <>
                <Button variant="outline" onClick={fetchPlans} disabled={loading || saving}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
                <Button onClick={handleSave} disabled={loading || saving}>
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Changes
                </Button>
              </>
            )}
            <Button variant="ghost" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <Tabs value={section} onValueChange={setSection} className="w-full">
          <TabsList className="h-12">
            <TabsTrigger value="users" className="gap-2 px-6">
              <User className="w-4 h-4" /> Users
            </TabsTrigger>
            <TabsTrigger value="scans" className="gap-2 px-6">
              <Globe className="w-4 h-4" /> Scanned Websites
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2 px-6">
              <Layers className="w-4 h-4" /> Plans
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2 px-6">
              <KeyRound className="w-4 h-4" /> API Keys
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2 px-6">
              <BarChart3 className="w-4 h-4" /> Analytics
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {section === 'users' && <UsersPanel plansMap={plansMap} />}

        {section === 'scans' && <ScannedWebsitesPanel />}

        {section === 'keys' && <ApiKeysPanel />}

        {section === 'analytics' && <ScanAnalyticsPanel />}

        {section === 'plans' && (
        <Tabs defaultValue="free" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-14">
            {PLANS_ORDER.map(plan => (
              <TabsTrigger key={plan} value={plan} className="capitalize text-lg">
                {plan}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {PLANS_ORDER.map(planId => {
            const planData = plansMap[planId];
            if (!planData) return null;

            return (
              <TabsContent key={planId} value={planId} className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="capitalize">{planId} Plan Settings</CardTitle>
                    <CardDescription>Adjust the thresholds and features for the {planId} tier.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-8">
                    
                    {/* Basic Limits */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold border-b pb-2">Core Limits</h3>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Price Label (e.g. $49 /mo)</label>
                        <Input 
                          value={planData.price || ''} 
                          onChange={(e) => updatePlan(planId, 'price', e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Scans / month</label>
                        <div className="flex items-center gap-4">
                          <Input 
                            type="number" 
                            min="0"
                            value={planData.scansPerMonth === null ? '' : planData.scansPerMonth}
                            onChange={(e) => updatePlan(planId, 'scansPerMonth', e.target.value === '' ? null : Number(e.target.value))}
                            disabled={planData.scansPerMonth === null}
                          />
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Switch 
                              checked={planData.scansPerMonth === null}
                              onCheckedChange={(c) => updatePlan(planId, 'scansPerMonth', c ? null : 10)}
                            />
                            <span className="text-sm">Unlimited</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">Set to Unlimited for Infinity</p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tracked Sites</label>
                        <div className="flex items-center gap-4">
                          <Input 
                            type="number" 
                            min="0"
                            value={planData.sites === null ? '' : planData.sites}
                            onChange={(e) => updatePlan(planId, 'sites', e.target.value === '' ? null : Number(e.target.value))}
                            disabled={planData.sites === null}
                          />
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Switch 
                              checked={planData.sites === null}
                              onCheckedChange={(c) => updatePlan(planId, 'sites', c ? null : 1)}
                            />
                            <span className="text-sm">Unlimited</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Team Members</label>
                        <div className="flex items-center gap-4">
                          <Input 
                            type="number" 
                            min="0"
                            value={planData.teamMembers === null ? '' : planData.teamMembers}
                            onChange={(e) => updatePlan(planId, 'teamMembers', e.target.value === '' ? null : Number(e.target.value))}
                            disabled={planData.teamMembers === null}
                          />
                          <div className="flex items-center gap-2 whitespace-nowrap">
                            <Switch 
                              checked={planData.teamMembers === null}
                              onCheckedChange={(c) => updatePlan(planId, 'teamMembers', c ? null : 1)}
                            />
                            <span className="text-sm">Unlimited</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-6">
                      <h3 className="text-lg font-semibold border-b pb-2">Features Access</h3>

                      <div className="space-y-2">
                        <label className="text-sm font-medium">Automated Monitoring</label>
                        <Select 
                          value={planData.monitoring || 'false'} 
                          onValueChange={(v) => updatePlan(planId, 'monitoring', v === 'false' ? false : v)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="false">Off (Disabled)</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div>
                          <p className="font-medium">AI Deep Analysis</p>
                          <p className="text-sm text-muted-foreground">Access to Gemini AI insights</p>
                        </div>
                        <Switch 
                          checked={!!planData.deepAnalysis}
                          onCheckedChange={(c) => updatePlan(planId, 'deepAnalysis', c)}
                        />
                      </div>

                      <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div>
                          <p className="font-medium">Competitor Comparison</p>
                          <p className="text-sm text-muted-foreground">Ability to scan competitors</p>
                        </div>
                        <Switch 
                          checked={!!planData.competitorScan}
                          onCheckedChange={(c) => updatePlan(planId, 'competitorScan', c)}
                        />
                      </div>

                      <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div>
                          <p className="font-medium">White-Label Reports</p>
                          <p className="text-sm text-muted-foreground">Custom PDF branding</p>
                        </div>
                        <Switch 
                          checked={!!planData.whiteLabel}
                          onCheckedChange={(c) => updatePlan(planId, 'whiteLabel', c)}
                        />
                      </div>

                      <div className="flex items-center justify-between border p-4 rounded-lg">
                        <div>
                          <p className="font-medium">API Access</p>
                          <p className="text-sm text-muted-foreground">Create API keys</p>
                        </div>
                        <Switch 
                          checked={!!planData.apiAccess}
                          onCheckedChange={(c) => updatePlan(planId, 'apiAccess', c)}
                        />
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
        )}
      </div>
    </PageTransition>
  );
}
