import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'GEO Audit: Generative Engine Optimization Score | Igris Radar',
  description: 'Score your entity authority, topical depth, factual density and AI readability. The GEO audit measures whether generative AI engines treat your brand as the source worth citing.',
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
