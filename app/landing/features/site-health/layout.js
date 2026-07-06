import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Site Health Check: Core Web Vitals & Accessibility | Igris Radar',
  description: 'Measure LCP, INP, CLS and FCP through Google PageSpeed analysis and audit WCAG 2.2 accessibility rules in one scan and one report, with plain-language fixes.',
  path: '/landing/features/site-health',
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['site-health'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Site Health', path: '/landing/features/site-health' },
      ])} />
      {children}
    </>
  );
}
