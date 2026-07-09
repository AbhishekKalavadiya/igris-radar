'use client';

import { Bell, User, Menu, Settings, LogOut, CheckCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PAGE_TITLES = {
  '/dashboard': 'Command Center',
  '/companies': 'Companies Hub',
  '/security-scan': 'Security Scanner',
  '/seo-audit': 'SEO Audit',
  '/aeo-audit': 'AEO Audit',
  '/geo-audit': 'GEO Audit',
  '/brand-visibility': 'Brand Visibility',
  '/site-health': 'Site Health',
  '/uptime': 'Uptime Monitor',
  '/domain-health': 'Domain Health',
  '/plans': 'Plans & Billing',
  '/settings': 'Settings',
};

export default function Navbar({ onMenuClick }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [alerts, setAlerts] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [usage, setUsage] = useState(null);
  const [planLimits, setPlanLimits] = useState(null);

  const pageTitle =
    PAGE_TITLES[pathname] ||
    PAGE_TITLES[Object.keys(PAGE_TITLES).find((p) => pathname.startsWith(p))] ||
    'Dashboard';

  useEffect(() => {
    fetchAlerts();
    fetchUsage();
  }, [pathname]);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api?path=usage');
      const data = await res.json();
      if (data.success) {
        setUsage(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/?path=alerts');
      const data = await res.json();
      if (data.success) {
        setAlerts(data.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    }
  };

  const markAsRead = async (alertId) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, read: true } : a)));
    try {
      await fetch(`/api?path=alerts/${alertId}/read`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to mark alert as read:', error);
    }
  };

  const markAllRead = async () => {
    const unread = alerts.filter((a) => !a.read);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
    try {
      await Promise.all(unread.map((a) => fetch(`/api?path=alerts/${a.id}/read`, { method: 'POST' })));
    } catch (error) {
      console.error('Failed to mark alerts as read:', error);
    }
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

  return (
    <header className="h-16 bg-card/80 backdrop-blur-xl border-b border-border flex items-center justify-between px-4 md:px-6 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="text-base md:text-lg font-semibold text-foreground">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Usage Indicators */}
        {usage && usage.limits && (
          <div className="hidden lg:flex items-center gap-2 mr-2 text-xs font-medium cursor-pointer" onClick={() => router.push('/plans')}>
            <div className="flex items-center gap-1.5 bg-muted/50 hover:bg-muted rounded-full px-3 py-1.5 transition-colors border border-border/50">
              <span className="text-muted-foreground">Scans:</span>
              <span className={usage.limits.scansPerMonth !== null && usage.scansUsed >= usage.limits.scansPerMonth ? 'text-destructive' : 'text-foreground'}>
                {usage.scansUsed} / {usage.limits.scansPerMonth === Infinity || usage.limits.scansPerMonth === null ? '∞' : usage.limits.scansPerMonth}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-muted/50 hover:bg-muted rounded-full px-3 py-1.5 transition-colors border border-border/50">
              <span className="text-muted-foreground">Sites:</span>
              <span className={usage.limits.sites !== null && usage.sitesUsed >= usage.limits.sites ? 'text-destructive' : 'text-foreground'}>
                {usage.sitesUsed} / {usage.limits.sites === Infinity || usage.limits.sites === null ? '∞' : usage.limits.sites}
              </span>
            </div>
          </div>
        )}

        {/* Notifications */}
        <DropdownMenu open={showNotifications} onOpenChange={setShowNotifications}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72 md:w-80 glass-elevated">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllRead}
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <CheckCheck className="h-3 w-3" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => (
                  <DropdownMenuItem
                    key={alert.id}
                    className="flex flex-col items-start px-3 py-2 cursor-pointer"
                    onSelect={(e) => { e.preventDefault(); markAsRead(alert.id); }}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.severity === 'high' ? 'bg-destructive' :
                        alert.severity === 'medium' ? 'bg-warning' : 'bg-muted-foreground'
                      }`} />
                      <span className={`text-sm flex-1 line-clamp-2 ${!alert.read ? 'font-medium' : 'text-muted-foreground'}`}>
                        {alert.message?.slice(0, 80)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{alert.timestamp}</span>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No notifications yet
                </div>
              )}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 px-2 md:px-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden md:inline text-sm">{user?.name || 'User'}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-elevated w-48">
            <div className="px-3 py-2 border-b border-border">
              <p className="text-sm font-medium truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem onSelect={() => router.push('/settings')} className="gap-2 cursor-pointer">
              <User className="h-4 w-4" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => router.push('/settings')} className="gap-2 cursor-pointer">
              <Settings className="h-4 w-4" /> Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => logout()} className="gap-2 cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="h-4 w-4" /> Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
