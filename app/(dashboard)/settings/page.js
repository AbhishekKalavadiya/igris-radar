'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Key,
  Globe,
  Trash2,
  Save,
  Loader2,
  MailWarning,
  Palette,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import PageHeader from '@/components/ui/PageHeader';
import UpgradePrompt from '@/components/ui/UpgradePrompt';
import { PageTransition } from '@/components/ui/motion';
import { useToast } from '@/hooks/use-toast';
import { requestNotificationPermission } from '@/lib/browserNotify';

const VALID_TABS = ['profile', 'notifications', 'security', 'audit', 'branding'];
const MAX_LOGO_BYTES = 2_000_000;

const PROVIDERS = ['gemini', 'openai', 'anthropic'];
const LOCALES = ['global', 'us', 'uk', 'eu'];

function SettingsContent() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');

  const [profile, setProfile] = useState({ name: '', email: '' });
  const [settings, setSettings] = useState(null);
  const [emailTransport, setEmailTransport] = useState('console');
  const [aiProviders, setAiProviders] = useState({ gemini: false, openai: false, anthropic: false });
  const [saving, setSaving] = useState(false);

  // Change-password dialog state
  const [pwOpen, setPwOpen] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);

  // Delete-account dialog state
  const [delOpen, setDelOpen] = useState(false);
  const [delForm, setDelForm] = useState({ password: '', confirmText: '' });
  const [deleting, setDeleting] = useState(false);

  // Branding (white-label reports) state
  const [branding, setBranding] = useState(null);
  const [brandingAccess, setBrandingAccess] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);

  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && VALID_TABS.includes(tab)) setActiveTab(tab);

    fetch('/api?path=settings')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setSettings(data.data.settings);
          setProfile(data.data.profile);
          setEmailTransport(data.data.emailTransport);
          setAiProviders(data.data.aiProviders);
        }
      })
      .catch(() => {
        toast({ title: 'Failed to load settings', variant: 'destructive' });
      });

    fetch('/api?path=branding')
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setBranding(data.data.branding);
          setBrandingAccess(data.data.hasAccess);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveBranding = async () => {
    setBrandingSaving(true);
    try {
      const res = await fetch('/api?path=branding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branding),
      });
      const data = await res.json();
      if (data.success) {
        setBranding(data.data.branding);
        toast({ title: 'Branding saved', description: 'Your exported PDF reports will use this branding.' });
      } else {
        toast({ title: 'Save failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Save failed', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setBrandingSaving(false);
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      toast({ title: 'Logo too large', description: 'Please choose an image under 2MB.', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBranding(prev => ({ ...prev, logoDataUri: reader.result }));
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const saveSettings = async (next) => {
    setSaving(true);
    try {
      const res = await fetch('/api?path=settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next || settings),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Preferences saved', description: 'Your settings have been updated.' });
      } else {
        toast({ title: 'Save failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Save failed', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api?path=auth/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Profile updated', description: 'Your details have been saved.' });
      } else {
        toast({ title: 'Update failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Update failed', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const updateNotification = (key, value) =>
    setSettings(prev => ({ ...prev, notifications: { ...prev.notifications, [key]: value } }));

  const updateAudit = (key, value) =>
    setSettings(prev => ({ ...prev, audit: { ...prev.audit, [key]: value } }));

  const handlePushToggle = async (enabled) => {
    if (enabled) {
      const permission = await requestNotificationPermission();
      if (permission === 'unsupported') {
        toast({ title: 'Not supported', description: 'This browser does not support notifications.', variant: 'destructive' });
        return;
      }
      if (permission !== 'granted') {
        toast({ title: 'Permission denied', description: 'Allow notifications in your browser settings to enable this.', variant: 'destructive' });
        return;
      }
    }
    updateNotification('pushNotifications', enabled);
  };

  const changePassword = async () => {
    if (pwForm.next !== pwForm.confirm) {
      toast({ title: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetch('/api?path=auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.next }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Password changed', description: 'Your password has been updated.' });
        setPwOpen(false);
        setPwForm({ current: '', next: '', confirm: '' });
      } else {
        toast({ title: 'Change failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Change failed', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setPwSaving(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api?path=auth/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: delForm.password }),
      });
      const data = await res.json();
      if (data.success) {
        await logout();
        router.push('/');
      } else {
        toast({ title: 'Deletion failed', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Deletion failed', description: 'Network error occurred.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading settings…
      </div>
    );
  }

  const SaveButton = ({ onClick }) => (
    <div className="flex justify-end pt-2">
      <Button onClick={onClick} disabled={saving} className="gap-2">
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        Save Changes
      </Button>
    </div>
  );

  return (
    <PageTransition className="space-y-6 max-w-4xl">
      <PageHeader
        icon={SettingsIcon}
        title="Settings"
        description="Manage your account and preferences"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/50 flex-wrap h-auto">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" /> Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" /> Security
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2">
            <Globe className="h-4 w-4" /> Audit Preferences
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-2">
            <Palette className="h-4 w-4" /> Branding
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Profile Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-10 w-10 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{profile.name || user?.name}</p>
                  <p className="text-sm text-muted-foreground">{profile.email || user?.email}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <Input
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <SaveButton onClick={saveProfile} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Control how you receive alerts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {emailTransport === 'console' && (
                <div className="flex items-start gap-3 rounded-md border border-warning/30 bg-warning/10 p-3">
                  <MailWarning className="h-4 w-4 text-warning mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    Email delivery is not configured yet. Preferences are saved and honored, but emails
                    are logged on the server until SMTP or Resend credentials are added to <span className="font-mono">.env.local</span>.
                  </p>
                </div>
              )}

              <div className="py-3 border-b border-border space-y-2">
                <p className="font-medium">Notification Email</p>
                <p className="text-sm text-muted-foreground">Where alerts and digests are sent. Leave blank to use your account email ({profile.email || user?.email}).</p>
                <Input
                  type="email"
                  value={settings.notifications.notificationEmail}
                  onChange={(e) => updateNotification('notificationEmail', e.target.value)}
                  placeholder={profile.email || 'you@example.com'}
                  className="max-w-sm"
                />
              </div>

              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Email Alerts</p>
                  <p className="text-sm text-muted-foreground">Get a summary email when a scan completes</p>
                </div>
                <Switch
                  checked={settings.notifications.emailAlerts}
                  onCheckedChange={(v) => updateNotification('emailAlerts', v)}
                />
              </div>
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Push Notifications</p>
                  <p className="text-sm text-muted-foreground">Browser notification when a scan finishes</p>
                </div>
                <Switch
                  checked={settings.notifications.pushNotifications}
                  onCheckedChange={handlePushToggle}
                />
              </div>
              {/* Hidden for now as requested */}
              {false && (
                <>
                  <div className="flex items-center justify-between py-3 border-b border-border">
                    <div>
                      <p className="font-medium">Weekly SEO & Visibility Digest</p>
                      <p className="text-sm text-muted-foreground">Weekly email summarizing your scans and site scores</p>
                    </div>
                    <Switch
                      checked={settings.notifications.weeklyReport}
                      onCheckedChange={(v) => updateNotification('weeklyReport', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <p className="font-medium">Marketing Emails</p>
                      <p className="text-sm text-muted-foreground">Product updates and tips</p>
                    </div>
                    <Switch
                      checked={settings.notifications.marketingEmails}
                      onCheckedChange={(v) => updateNotification('marketingEmails', v)}
                    />
                  </div>
                </>
              )}

              <SaveButton onClick={() => saveSettings()} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Security Settings</CardTitle>
              <CardDescription>Protect your account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-border">
                <div>
                  <p className="font-medium">Login Alerts</p>
                  <p className="text-sm text-muted-foreground">Get an email when a new sign-in is detected</p>
                </div>
                <Switch
                  checked={settings.security.loginAlerts}
                  onCheckedChange={(v) => {
                    const next = { ...settings, security: { ...settings.security, loginAlerts: v } };
                    setSettings(next);
                    saveSettings(next);
                  }}
                />
              </div>
              <div className="py-3">
                <Dialog open={pwOpen} onOpenChange={setPwOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Key className="h-4 w-4" /> Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Minimum 8 characters with an uppercase letter, a number, and a special character.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder="Current password"
                        value={pwForm.current}
                        onChange={(e) => setPwForm(prev => ({ ...prev, current: e.target.value }))}
                      />
                      <Input
                        type="password"
                        placeholder="New password"
                        value={pwForm.next}
                        onChange={(e) => setPwForm(prev => ({ ...prev, next: e.target.value }))}
                      />
                      <Input
                        type="password"
                        placeholder="Confirm new password"
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm(prev => ({ ...prev, confirm: e.target.value }))}
                      />
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setPwOpen(false)}>Cancel</Button>
                      <Button onClick={changePassword} disabled={pwSaving || !pwForm.current || !pwForm.next} className="gap-2">
                        {pwSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        Update Password
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30 mt-6">
            <CardHeader>
              <CardTitle className="text-base text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Delete Account</p>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
                </div>
                <Dialog open={delOpen} onOpenChange={setDelOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2">
                      <Trash2 className="h-4 w-4" /> Delete Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="text-destructive">Delete Account</DialogTitle>
                      <DialogDescription>
                        This permanently deletes your account, all scans, tracked sites, API keys and
                        scheduled audits. This cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3">
                      <Input
                        type="password"
                        placeholder="Your password"
                        value={delForm.password}
                        onChange={(e) => setDelForm(prev => ({ ...prev, password: e.target.value }))}
                      />
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Type <span className="font-mono font-semibold text-destructive">DELETE</span> to confirm</p>
                        <Input
                          value={delForm.confirmText}
                          onChange={(e) => setDelForm(prev => ({ ...prev, confirmText: e.target.value }))}
                          placeholder="DELETE"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDelOpen(false)}>Cancel</Button>
                      <Button
                        variant="destructive"
                        onClick={deleteAccount}
                        disabled={deleting || !delForm.password || delForm.confirmText !== 'DELETE'}
                        className="gap-2"
                      >
                        {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
                        Permanently Delete
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Preferences Tab */}
        <TabsContent value="audit">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-base">Audit Preferences</CardTitle>
              <CardDescription>Configure defaults for SEO, AEO, and GEO scans</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="font-medium">Default AI Provider</p>
                <div className="flex gap-2 flex-wrap">
                  {PROVIDERS.map((provider) => {
                    const comingSoon = !aiProviders[provider];
                    return (
                      <Button
                        key={provider}
                        variant={settings.audit.defaultProvider === provider ? 'default' : 'outline'}
                        size="sm"
                        disabled={comingSoon}
                        onClick={() => updateAudit('defaultProvider', provider)}
                        className="capitalize gap-2"
                      >
                        {provider}
                        {comingSoon && (
                          <Badge variant="outline" className="text-[10px] uppercase tracking-wide">Coming soon</Badge>
                        )}
                      </Button>
                    );
                  })}
                </div>
                <p className="text-sm text-muted-foreground">
                  The AI engine used for Deep Analysis. Providers marked “Coming soon” unlock automatically
                  once their API key is added in the Admin panel.
                </p>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <p className="font-medium">Target Locale / Region</p>
                <div className="flex gap-2 flex-wrap">
                  {LOCALES.map((locale) => (
                    <Button
                      key={locale}
                      variant={settings.audit.targetLocale === locale ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => updateAudit('targetLocale', locale)}
                      className={locale === 'global' ? 'capitalize' : 'uppercase'}
                    >
                      {locale}
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">Deep Analysis recommendations are tailored to this region.</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <p className="font-medium">Deep AI Analysis by Default</p>
                  <p className="text-sm text-muted-foreground">Pre-enable the Deep AI Analysis option on new scans</p>
                </div>
                <Switch
                  checked={settings.audit.enableDeepAnalysis}
                  onCheckedChange={(v) => updateAudit('enableDeepAnalysis', v)}
                />
              </div>

              <div className="pt-4 border-t border-border space-y-2">
                <label className="text-sm font-medium">Default Competitor Domain</label>
                <Input
                  placeholder="e.g. competitor.com"
                  value={settings.audit.defaultCompetitor}
                  onChange={(e) => updateAudit('defaultCompetitor', e.target.value)}
                />
                <p className="text-sm text-muted-foreground">Automatically pre-filled into the competitor field when starting a new scan.</p>
              </div>

              <SaveButton onClick={() => saveSettings()} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab (white-label PDF reports) */}
        <TabsContent value="branding">
          {branding === null ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading branding…
            </div>
          ) : !brandingAccess ? (
            <div className="space-y-4">
              <UpgradePrompt currentPlan={user?.plan || 'free'} reason="whiteLabel" />
              <Card className="border-border">
                <CardHeader>
                  <CardTitle className="text-base">White-Label Reports</CardTitle>
                  <CardDescription>Replace Igris Radar branding on exported PDF reports with your own.</CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Once unlocked, you'll be able to set a custom company name, upload your logo, and
                  add your own footer text — every "Export Report → Save as PDF" will use your branding
                  instead of ours.
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="text-base">White-Label PDF Reports</CardTitle>
                <CardDescription>Customize the branding shown on exported PDF audit reports.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    placeholder="Your Company Inc."
                    value={branding.companyName}
                    onChange={(e) => setBranding(prev => ({ ...prev, companyName: e.target.value }))}
                    className="max-w-sm"
                  />
                  <p className="text-sm text-muted-foreground">Shown in the report header instead of "Igris Radar".</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-medium">Logo</label>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-md border border-border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                      {branding.logoDataUri
                        ? <img src={branding.logoDataUri} alt="Logo preview" className="h-full w-full object-contain" />
                        : <ImageIcon className="h-6 w-6 text-muted-foreground/50" />}
                    </div>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <Upload className="h-3.5 w-3.5" /> Upload logo
                          <input id="logo-upload" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                        </label>
                      </Button>
                      {branding.logoDataUri && (
                        <Button type="button" variant="outline" size="sm" onClick={() => setBranding(prev => ({ ...prev, logoDataUri: '' }))} className="gap-1 text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5" /> Remove
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">PNG, JPEG, WEBP or SVG — max 2MB.</p>
                </div>

                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-medium">Footer Text</label>
                  <Input
                    placeholder='e.g. "Prepared by Your Company Inc."'
                    value={branding.footerText}
                    onChange={(e) => setBranding(prev => ({ ...prev, footerText: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">Replaces "Powered by Igris Radar" at the bottom of each page.</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div>
                    <p className="font-medium">Hide Igris Radar Branding</p>
                    <p className="text-sm text-muted-foreground">Omit our name and mark entirely when no logo/company name is set</p>
                  </div>
                  <Switch
                    checked={branding.hideDefaultBranding}
                    onCheckedChange={(v) => setBranding(prev => ({ ...prev, hideDefaultBranding: v }))}
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={saveBranding} disabled={brandingSaving} className="gap-2">
                    {brandingSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Branding
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </PageTransition>
  );
}

export default function SettingsPage() {
  return <SettingsContent />;
}
