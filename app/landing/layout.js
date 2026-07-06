import Navbar from '@/components/landing/Navbar';
import Footer from '@/components/landing/Footer';
import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, organizationJsonLd, webSiteJsonLd, personJsonLd } from '@/lib/seo';

export const metadata = buildMetadata({
  title: 'Igris Radar: AI Search Visibility & Web Audit Platform',
  description:
    'Measure and grow your visibility in AI search. Website security scanner, SEO audit, AEO & GEO audits, live AI brand visibility tracking, and Core Web Vitals monitoring in one platform.',
  path: '/landing',
  keywords: [
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
