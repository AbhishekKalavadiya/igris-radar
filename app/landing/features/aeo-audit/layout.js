import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Answer Engine Optimization (AEO) Audit & ChatGPT Visibility | Igris Radar',
  description: 'Optimize for AI answer engines. Run an AEO audit to ensure your content gets cited by ChatGPT, Perplexity AI, Claude, and Google AI Overviews.',
  path: '/landing/features/aeo-audit',
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['aeo-audit'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'AEO Audit', path: '/landing/features/aeo-audit' },
      ])} />
      {children}
    </>
  );
}
