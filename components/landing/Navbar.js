'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, X, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NAV_PLATFORM, NAV_COMPANY, SHOW_AUTH_CTAS } from '@/lib/landingContent';
import LogoText from '@/components/ui/LogoText';
import LogoIcon from '@/components/ui/LogoIcon';

function DesktopDropdown({ label, open, onOpen, onClose, children, width = 'w-[560px]' }) {
  return (
    <div className="relative" onMouseEnter={onOpen} onMouseLeave={onClose}>
      <button
        type="button"
        className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-md transition-colors
          ${open ? 'text-foreground bg-muted' : 'text-muted-foreground hover:text-foreground'}`}
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className={`absolute left-0 top-full pt-2 ${width}`}
          >
            <div className="rounded-xl border border-border bg-popover shadow-lg p-3">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSection, setMobileSection] = useState(null);

  // Close everything on navigation
  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          {/* Logo */}
          <Link href="/landing" className="flex items-center gap-2.5 shrink-0">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <LogoIcon className="h-6 w-6" />
            </div>
            <LogoText />
          </Link>

          {/* Desktop menu */}
          <div className="hidden lg:flex items-center gap-1">
          <DesktopDropdown
            label="Platform"
            open={openMenu === 'platform'}
            onOpen={() => setOpenMenu('platform')}
            onClose={() => setOpenMenu(null)}
          >
            <div className="grid grid-cols-2 gap-1">
              {NAV_PLATFORM.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-start gap-3 rounded-lg p-3 hover:bg-muted transition-colors group"
                  >
                    <div className={`p-2 rounded-md ${item.bgSoft} shrink-0`}>
                      <Icon className={`h-4 w-4 ${item.accent}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold flex items-center gap-1.5">
                        {item.title}
                        {item.planBadge && (
                          <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {item.planBadge}
                          </span>
                        )}
                        <ArrowRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all ml-auto" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{item.description}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </DesktopDropdown>

          <DesktopDropdown
            label="Company"
            open={openMenu === 'company'}
            onOpen={() => setOpenMenu('company')}
            onClose={() => setOpenMenu(null)}
            width="w-64"
          >
            <div className="space-y-1">
              {NAV_COMPANY.map((item) => (
                <Link key={item.href} href={item.href} className="block rounded-lg p-3 hover:bg-muted transition-colors">
                  <div className="text-sm font-semibold">{item.title}</div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                </Link>
              ))}
            </div>
          </DesktopDropdown>

          <Link
            href="/landing/pricing"
            className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            Pricing
          </Link>
        </div>
        </div>

        {/* Desktop CTAs */}
        {SHOW_AUTH_CTAS && (
          <div className="hidden lg:flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" className="text-sm font-medium">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button className="text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground">
                Get Started Free
              </Button>
            </Link>
          </div>
        )}

        {/* Mobile toggle */}
        <button
          type="button"
          className="lg:hidden p-2 rounded-md hover:bg-muted transition-colors"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-border bg-background overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2 max-h-[calc(100vh-4rem)] overflow-y-auto">
              <button
                type="button"
                className="w-full flex items-center justify-between py-2 text-sm font-semibold"
                onClick={() => setMobileSection(mobileSection === 'platform' ? null : 'platform')}
              >
                Platform
                <ChevronDown className={`h-4 w-4 transition-transform ${mobileSection === 'platform' ? 'rotate-180' : ''}`} />
              </button>
              {mobileSection === 'platform' && (
                <div className="space-y-1 pb-2">
                  {NAV_PLATFORM.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted">
                        <Icon className={`h-4 w-4 ${item.accent}`} />
                        <span className="text-sm font-medium">{item.title}</span>
                      </Link>
                    );
                  })}
                </div>
              )}

              {NAV_COMPANY.map((item) => (
                <Link key={item.href} href={item.href} className="block py-2 text-sm font-semibold">
                  {item.title}
                </Link>
              ))}
              <Link href="/landing/pricing" className="block py-2 text-sm font-semibold">Pricing</Link>

              {SHOW_AUTH_CTAS && (
                <div className="pt-3 border-t border-border flex flex-col gap-2">
                  <Link href="/login">
                    <Button variant="outline" className="w-full">Log in</Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="w-full bg-primary text-primary-foreground">Get Started Free</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
