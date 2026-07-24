import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'llms.txt Generator & AI Search Audit Feature | Igris Radar',
  description: 'Generate, validate, and publish standardized llms.txt markdown files for AI crawlers like ChatGPT, Claude & Perplexity. Reduce AI hallucinations by 78%.',
  path: '/landing/features/llms-txt-generator',
  keywords: ['llms.txt generator', 'llms.txt validator', 'AEO scanner', 'AI search readiness', 'GPTBot crawl optimization'],
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['llms-txt-generator'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'llms.txt Generator', path: '/landing/features/llms-txt-generator' },
      ])} />
      {children}
    </>
  );
}
