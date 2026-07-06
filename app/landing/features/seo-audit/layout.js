import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'SEO Audit Tool: Technical, On-Page, Schema & Links | Igris Radar',
  description: 'Run a complete SEO audit in minutes: 25+ checks across technical SEO, on-page signals, Schema.org structured data and link health, with competitor comparison and a 100-point score.',
  path: '/landing/features/seo-audit',
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['seo-audit'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'SEO Audit', path: '/landing/features/seo-audit' },
      ])} />
      {children}
    </>
  );
}
