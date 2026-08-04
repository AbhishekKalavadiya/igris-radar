import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Generative Engine Optimization (GEO) Audit & AI Citation Checker | Igris Radar',
  description: 'Master Generative Engine Optimization (GEO). Audit your entity authority, structured data, and citation-worthiness across generative AI models.',
  path: '/landing/features/geo-audit',
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['geo-audit'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'GEO Audit', path: '/landing/features/geo-audit' },
      ])} />
      {children}
    </>
  );
}
