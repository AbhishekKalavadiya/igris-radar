import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'AEO Audit: Answer Engine Optimization for ChatGPT | Igris Radar',
  description: 'Measure whether ChatGPT, Claude, Perplexity and Gemini can crawl, parse and cite your content. AI crawler access, answer-ready structure, llms.txt and citation-readiness, all scored in one AEO audit.',
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
