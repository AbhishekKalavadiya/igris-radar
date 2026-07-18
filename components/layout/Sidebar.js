'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard,
  Settings, 
  Shield,
  LogOut,
  X,
  Search,
  Sparkles,
  Activity,
  Signal,
  Globe,
  Bot,
  Target,
  Sun,
  Moon,
  CreditCard,
  Briefcase,
  Smartphone
} from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import LogoText from '@/components/ui/LogoText';
import LogoIcon from '@/components/ui/LogoIcon';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/companies', icon: Briefcase, label: 'Companies' },
    ]
  },
  {
    label: 'Web Scanner',
    items: [
      { href: '/security-scan', icon: Shield, label: 'Security Scan', accent: 'text-scanner-security' },
      { href: '/seo-audit', icon: Search, label: 'SEO Audit', accent: 'text-scanner-seo' },
      { href: '/aeo-audit', icon: Sparkles, label: 'AEO Audit', accent: 'text-scanner-aeo' },
      { href: '/geo-audit', icon: Bot, label: 'GEO Audit', accent: 'text-scanner-geo' },
      { href: '/aso-audit', icon: Smartphone, label: 'ASO Audit', accent: 'text-scanner-aso' },
      { href: '/brand-visibility', icon: Target, label: 'Brand Visibility', accent: 'text-scanner-brand' },
    ]
  },
  {
    label: 'Infrastructure',
    items: [
      { href: '/site-health', icon: Activity, label: 'Site Health', accent: 'text-scanner-health' },
      { href: '/uptime', icon: Signal, label: 'Uptime Monitor' },
      { href: '/domain-health', icon: Globe, label: 'Domain Health' },
    ]
  },
  {
    label: 'System',
    items: [
      { href: '/plans', icon: CreditCard, label: 'Plans' },
      { href: '/settings', icon: Settings, label: 'Settings' },
    ]
  }
];

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  // Prevent hydration mismatch for theme toggle
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <aside className={`
      fixed left-0 top-0 z-50 h-screen bg-card/95 backdrop-blur-xl border-r border-border/50 flex flex-col
      w-64 transition-all duration-300 ease-in-out shadow-2xl shadow-black/20
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      lg:translate-x-0
    `}>
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-border/50 bg-gradient-to-r from-transparent to-primary/5">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={onClose}>
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <LogoIcon className="h-5 w-5" />
          </div>
          <LogoText />
        </Link>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            <h4 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2">
              {group.label}
            </h4>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-300 group ${
                      isActive
                        ? 'bg-gradient-to-r from-primary/15 to-transparent text-primary shadow-[inset_2px_0_0_0_hsl(var(--primary))]'
                        : 'text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-1'
                    }`}
                  >
                    <item.icon className={`h-4 w-4 flex-shrink-0 transition-colors ${
                      isActive ? 'text-primary' : item.accent ? `${item.accent} opacity-70 group-hover:opacity-100` : 'group-hover:text-primary/70'
                    }`} />
                    <span className="font-medium text-sm">{item.label}</span>
                    {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer: Theme Toggle & Logout */}
      <div className="p-2 border-t border-border space-y-1">
        {mounted && (
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <Sun className="h-5 w-5" />
            ) : (
              <Moon className="h-5 w-5" />
            )}
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </Button>
        )}
        
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={() => { logout(); onClose?.(); }}
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </Button>
      </div>
    </aside>
  );
}
