import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'ASO Audit: App Store Optimization for iOS & Android | Igris Radar',
  description: 'Run a full App Store Optimization audit in minutes. 30+ checks across metadata, visual assets, ratings health, and competitive signals for iOS App Store and Google Play — scored and prioritized.',
  path: '/landing/features/aso-audit',
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['aso-audit'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'ASO Audit', path: '/landing/features/aso-audit' },
      ])} />
      {children}
    </>
  );
}
