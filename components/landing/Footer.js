import Link from 'next/link';
import { NAV_PLATFORM } from '@/lib/landingContent';
import LogoText from '@/components/ui/LogoText';
import LogoIcon from '@/components/ui/LogoIcon';

const COLUMNS = [
  {
    title: 'Platform',
    links: NAV_PLATFORM.map((f) => ({ href: f.href, label: f.title })),
  },
  {
    title: 'Optimize for',
    links: [
      { href: '/landing/features/aeo-audit', label: 'ChatGPT visibility' },
      { href: '/landing/features/aeo-audit', label: 'Perplexity citations' },
      { href: '/landing/features/geo-audit', label: 'Google AI Overviews' },
      { href: '/landing/features/brand-visibility', label: 'Gemini recommendations' },
      { href: '/landing/features/seo-audit', label: 'Organic search' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/landing/about', label: 'About' },
      { href: '/landing/contact', label: 'Contact' },
      { href: '/landing#pricing', label: 'Pricing' },
      { href: '/signup', label: 'Get started' },
      { href: '/login', label: 'Log in' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2">
            <Link href="/landing" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <LogoIcon className="h-5 w-5" />
              </div>
              <LogoText />
            </Link>
            <p className="text-sm text-muted-foreground mt-4 max-w-xs leading-relaxed">
              The AI search visibility platform. Audit your security, SEO, AEO, GEO,
              brand visibility, and site health. Then fix what you find with
              AI-ready remediation prompts.
            </p>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">{col.title}</h2>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-foreground/70 hover:text-foreground transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap justify-center sm:justify-start">
            <span>© <time dateTime={String(new Date().getFullYear())}>{new Date().getFullYear()}</time> Igris Radar. All rights reserved.</span>
            <span className="hidden sm:inline text-muted-foreground/50">|</span>
            <span>A part of <a href="https://igrisecurity.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors underline underline-offset-2">Igris Security</a></span>
          </p>
          <p className="text-xs text-muted-foreground">
            Built for teams optimizing for search engines <span className="text-primary">◆</span> and answer engines
          </p>
        </div>
      </div>
    </footer>
  );
}
