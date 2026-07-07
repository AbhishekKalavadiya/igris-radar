'use client';

/**
 * components/settings/ApiKeysTab.js
 * API key management for Agency+ plan users.
 * Keys are SHA-256 hashed server-side - the raw key is shown only on creation.
 */

import { useState, useEffect } from 'react';
import { Key, Plus, Trash2, Loader2, Copy, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function ApiKeysTab({ userPlan = 'free' }) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [revealedKey, setRevealedKey] = useState(null); // { id, key } - shown once after creation
  const [showKey, setShowKey] = useState(false);
  const { toast } = useToast();

  const hasAccess = ['agency', 'enterprise'].includes(userPlan);

  useEffect(() => {
    if (!hasAccess) { setLoading(false); return; }
    fetch('/api?path=api-keys')
      .then(r => r.json())
      .then(data => { if (data.success) setKeys(data.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [hasAccess]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api?path=api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName }),
      });
      const data = await res.json();
      if (data.success) {
        setRevealedKey({ id: data.data.id, key: data.data.key });
        setShowKey(true);
        setKeys(prev => [{ id: data.data.id, name: data.data.name, createdAt: data.data.createdAt }, ...prev]);
        setNewKeyName('');
      } else {
        toast({ title: 'Failed to create key', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Network error', description: 'Could not create API key.', variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (keyId) => {
    setKeys(prev => prev.filter(k => k.id !== keyId));
    if (revealedKey?.id === keyId) setRevealedKey(null);
    try {
      await fetch(`/api?path=api-keys/${keyId}`, { method: 'DELETE' });
    } catch {
      // Silent
    }
  };

  const handleCopy = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey.key);
    toast({ title: 'Copied', description: 'API key copied to clipboard.' });
  };

  if (!hasAccess) {
    return (
      <Card className="border-border">
        <CardContent className="pt-6 flex items-start gap-4">
          <ShieldAlert className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-white text-sm mb-1">API Access is an Agency feature</p>
            <p className="text-sm text-muted-foreground">
              Integrate Igris Radar scan results directly into your own tools and pipelines with a full REST API.
              The Agency plan is not offered yet, so this isn't available to upgrade into right now.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create new key */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-4 w-4 text-primary" /> API Keys
          </CardTitle>
          <CardDescription>
            Keys authenticate requests to the Igris Radar REST API. Each key is shown once, so store it securely.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleCreate} className="flex gap-3">
            <Input
              placeholder="Key name (e.g. Production, CI/CD)"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              className="flex-1"
              disabled={creating}
            />
            <Button type="submit" disabled={creating || !newKeyName.trim()} className="gap-2 shrink-0">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create Key
            </Button>
          </form>

          {/* Newly created key reveal */}
          {revealedKey && (
            <div className="border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-warning shrink-0" />
                <p className="text-xs font-semibold text-warning">Copy this key now. It won't be shown again</p>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-black/30 px-3 py-2 overflow-hidden text-ellipsis whitespace-nowrap text-primary">
                  {showKey ? revealedKey.key : '•'.repeat(48)}
                </code>
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="p-2 text-muted-foreground hover:text-white transition-colors"
                  aria-label={showKey ? 'Hide' : 'Show'}
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-2 text-muted-foreground hover:text-white transition-colors"
                  aria-label="Copy"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Existing keys */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Keys</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading...
            </div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active API keys. Create one above.</p>
          ) : (
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className="flex items-center justify-between p-3 border border-white/10 bg-white/5">
                  <div className="flex items-center gap-3">
                    <Key className="h-3.5 w-3.5 text-primary shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-white">{k.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(k.createdAt).toLocaleDateString()}
                        {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevoke(k.id)}
                    title="Revoke key"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Revoked keys stop working immediately. There is no grace period.
      </p>
    </div>
  );
}
