import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Core Web Vitals Test & Free Website Health Checker | Igris Radar',
  description: 'Test your Core Web Vitals, page speed, and WCAG 2.2 accessibility compliance in seconds with our free site health audit tool.',
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
