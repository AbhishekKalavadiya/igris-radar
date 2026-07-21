'use client';

/**
 * components/ui/ScheduledAuditManager.js
 * Create and manage scheduled audits for a given URL + scan type.
 * Shown on SEO and AEO audit pages for authenticated users on Starter+ plans.
 *
 * Backend: POST/GET /api?path=scheduled-audit
 * Plan gate: monitoring feature flag (Starter = monthly, Pro = daily)
 */

import { useState, useEffect } from 'react';
import { Clock, Plus, Trash2, Loader2, Bell, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly',  planRequired: 'starter' },
  { value: 'daily',   label: 'Daily',    planRequired: 'pro' },
];

const THRESHOLD_OPTIONS = [50, 60, 70, 80];

/**
 * @param {{
 *   url: string,
 *   scanType: 'seo'|'aeo',
 *   userPlan: string,
 * }} props
 */
export default function ScheduledAuditManager({ url, scanType, userPlan = 'free' }) {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [frequency, setFrequency] = useState('weekly');
  const [alertThreshold, setAlertThreshold] = useState(70);
  const { toast } = useToast();

  // Plan monitoring capability
  const monitoringAllowed = ['starter', 'pro'].includes(userPlan);
  const allowedFrequencies = FREQUENCY_OPTIONS.filter(f => {
    if (userPlan === 'pro') return true;
    if (userPlan === 'starter') return f.value === 'monthly';
    return false;
  });

  const fetchAudits = async () => {
    try {
      const res = await fetch('/api?path=scheduled-audit');
      const data = await res.json();
      if (data.success) {
        setAudits(data.data.filter(a => (!url || a.url === url) && a.scanType === scanType));
      }
    } catch (e) {
      console.error('Failed to load scheduled audits', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (monitoringAllowed) fetchAudits();
    else setLoading(false);
  }, [url, scanType]);

  const handleCreate = async () => {
    if (!url) {
      toast({ title: 'Enter a URL first', description: 'Run a scan before scheduling monitoring.', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api?path=scheduled-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, scanType, frequency, alertThreshold }),
      });
      const data = await res.json();
      if (data.success) {
        setAudits(prev => [data.data, ...prev]);
        setShowForm(false);
        toast({ title: 'Monitoring scheduled', description: `${frequency.charAt(0).toUpperCase() + frequency.slice(1)} ${scanType.toUpperCase()} audit set for ${url}` });
      } else {
        toast({ title: 'Failed to schedule', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not schedule audit.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (auditId) => {
    // Optimistic remove
    setAudits(prev => prev.filter(a => a.id !== auditId));
    try {
      await fetch(`/api?path=scheduled-audit/${auditId}`, { method: 'DELETE' });
    } catch {
      // Silent - audit is already removed from UI
    }
  };

  if (!monitoringAllowed) {
    return (
      <div className="border border-border bg-muted p-4 flex items-center gap-3 text-sm text-muted-foreground">
        <Clock className="h-4 w-4 shrink-0 text-primary/50" />
        <span>Automated monitoring is available on Starter and above. <a href="/settings?tab=billing" className="text-primary hover:underline">Upgrade your plan</a></span>
      </div>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" /> Automated Monitoring
          </CardTitle>
          <CardDescription className="text-xs mt-0.5">
            Schedule recurring {scanType.toUpperCase()} audits and get alerted when scores drop.
          </CardDescription>
        </div>
        {!showForm && (
          <Button size="sm" variant="outline" className="h-7 px-3 text-xs gap-1.5 shrink-0" onClick={() => setShowForm(true)}>
            <Plus className="h-3 w-3" /> Schedule
          </Button>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Create form */}
        {showForm && (
          <div className="border border-primary/20 bg-primary/5 p-4 space-y-4 rounded-md">
            <p className="text-xs font-medium text-foreground">New scheduled audit for <span className="text-primary">{url || '(enter a URL first)'}</span></p>

            {/* Frequency */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Frequency</label>
              <div className="flex gap-2 flex-wrap">
                {allowedFrequencies.map(f => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => setFrequency(f.value)}
                    className={`px-3 py-1 text-xs font-medium border transition-colors rounded ${
                      frequency === f.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Alert threshold */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Alert me when score drops below</label>
              <div className="flex gap-2 flex-wrap">
                {THRESHOLD_OPTIONS.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setAlertThreshold(t)}
                    className={`px-3 py-1 text-xs font-medium border transition-colors rounded ${
                      alertThreshold === t
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-muted text-muted-foreground hover:border-primary/50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button size="sm" className="h-8 px-4 text-xs font-semibold" onClick={handleCreate} disabled={creating}>
                {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Confirm</>}
              </Button>
              <Button size="sm" variant="ghost" className="h-8 px-4 text-xs" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Existing audits */}
        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading scheduled audits...
          </div>
        ) : audits.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No scheduled audits yet. Click "Schedule" to set one up.</p>
        ) : (
          <div className="space-y-2">
            {audits.map(audit => (
              <div key={audit.id} className="flex items-center justify-between p-3 border border-border bg-muted rounded">
                <div className="flex items-center gap-3 min-w-0">
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{audit.url}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {audit.frequency} · alert below {audit.alertThreshold}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(audit.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
