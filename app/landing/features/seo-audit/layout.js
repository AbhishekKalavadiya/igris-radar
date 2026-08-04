import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Free Technical SEO Audit Tool & On-Page Analysis | Igris Radar',
  description: 'Analyze your website with our free technical SEO audit tool. 30+ checks covering on-page optimization, Schema markup, crawlability, and Core Web Vitals.',
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
