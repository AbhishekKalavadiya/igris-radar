'use client';

import { useState, useEffect, useCallback } from 'react';
import { KeyRound, Loader2, Save, RefreshCw, Zap, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const TESTABLE_PROVIDERS = {
  GEMINI_API_KEY: 'gemini',
  Z_AI_API_KEY: 'zai',
  OPENAI_API_KEY: 'openai',
  ANTHROPIC_API_KEY: 'anthropic',
};

function SourceBadge({ source }) {
  if (source === 'admin') return <Badge>Active · admin</Badge>;
  if (source === 'env') return <Badge variant="outline">Active · .env</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Not configured</Badge>;
}

export default function ApiKeysPanel() {
  const [statuses, setStatuses] = useState([]);
  const [edits, setEdits] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(null);
  const { toast } = useToast();

  const fetchStatuses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api?path=admin/system-keys');
      const data = await res.json();
      if (data.success) setStatuses(data.data);
      else toast({ title: 'Failed to load keys', description: data.error, variant: 'destructive' });
    } catch {
      toast({ title: 'Failed to load keys', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchStatuses(); }, [fetchStatuses]);

  const dirty = Object.keys(edits).length > 0;

  const save = async (payload) => {
    setSaving(true);
    try {
      const res = await fetch('/api?path=admin/system-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys: payload }),
      });
      const data = await res.json();
      if (data.success) {
        setStatuses(data.data);
        setEdits({});
        toast({ title: 'API keys updated', description: 'Changes are live - no restart needed.' });
      } else {
        toast({ title: 'Save failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Save failed', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const testProvider = async (provider) => {
    setTesting(provider);
    try {
      const res = await fetch('/api?path=admin/system-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success && data.data.ok) {
        toast({ title: `${provider} works`, description: 'The provider responded successfully.' });
      } else {
        toast({ title: `${provider} test failed`, description: data.data?.error || data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Test failed', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setTesting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading keys…
      </div>
    );
  }

  const groups = [...new Set(statuses.map(s => s.group))];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground max-w-2xl">
          Keys saved here are encrypted (AES-256-GCM) in the database and take effect immediately -
          they override values from <span className="font-mono">.env.local</span>. Clearing a key falls
          back to the .env value if one exists.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchStatuses} disabled={saving}>
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button onClick={() => save(edits)} disabled={!dirty || saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            Save Keys
          </Button>
        </div>
      </div>

      {groups.map(group => (
        <Card key={group}>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-primary" /> {group}
            </CardTitle>
            <CardDescription>
              {group === 'AI Providers' && 'Power Deep AI Analysis and brand visibility tracking. Any one key enables AI analysis.'}
              {group === 'Integrations' && 'Third-party APIs used by scanners.'}
              {group === 'Email' && 'Email delivery for alerts and weekly digests.'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {statuses.filter(s => s.group === group).map(({ key, label, description, source, masked }) => (
              <div key={key} className="grid gap-2 pb-4 border-b border-border last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{label}</p>
                    <SourceBadge source={source} />
                  </div>
                  <div className="flex items-center gap-2">
                    {TESTABLE_PROVIDERS[key] && source && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => testProvider(TESTABLE_PROVIDERS[key])}
                        disabled={testing !== null}
                        className="gap-1"
                      >
                        {testing === TESTABLE_PROVIDERS[key]
                          ? <Loader2 className="w-3 h-3 animate-spin" />
                          : <Zap className="w-3 h-3" />}
                        Test
                      </Button>
                    )}
                    {source === 'admin' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => save({ [key]: '' })}
                        disabled={saving}
                        className="gap-1 text-destructive hover:text-destructive"
                      >
                        <X className="w-3 h-3" /> Clear
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{description}</p>
                <div className="flex items-center gap-3">
                  <Input
                    type="password"
                    autoComplete="off"
                    className="max-w-xl font-mono"
                    placeholder={masked ? `Current: ${masked} - paste a new key to replace` : 'Paste API key…'}
                    value={edits[key] ?? ''}
                    onChange={(e) => setEdits(prev => {
                      const next = { ...prev };
                      if (e.target.value === '') delete next[key];
                      else next[key] = e.target.value;
                      return next;
                    })}
                  />
                  <span className="text-xs font-mono text-muted-foreground">{key}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
