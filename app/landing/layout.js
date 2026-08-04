import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, organizationJsonLd, webSiteJsonLd, personJsonLd, SITE_DESCRIPTION } from '@/lib/seo';

// The landing segment (home, about, contact, legal, and every /features page)
// reads no cookies/headers, so pin it to static generation. Pages are
// prerendered at build and served from the CDN edge - this is the primary
// lever for cutting Time to First Byte (TTFB) on marketing routes. ISR
// rebuilds daily so the JSON-LD dateModified stays fresh.
export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata = buildMetadata({
  title: 'AI Search Visibility & Website Audit Platform — Free SEO, AEO & Security Audit | Igris Radar',
  description: SITE_DESCRIPTION,
  path: '/landing',
  keywords: [
    'ai search visibility platform', 'ai website audit tool', 'how to increase google search visibility',
    'AEO', 'answer engine optimization', 'GEO', 'generative engine optimization',
    'AI visibility', 'AI search', 'SEO audit', 'website security scanner',
    'brand visibility', 'core web vitals',
  ],
});

export default function LandingLayout({ children }) {
  return (
    <div className="theme-light min-h-screen bg-background text-foreground antialiased selection:bg-primary/15">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webSiteJsonLd()} />
      <JsonLd data={personJsonLd()} />
      <Navbar />
      <main className="pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
}
