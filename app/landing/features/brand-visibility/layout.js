import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'AI Brand Monitoring & Recommendation Tracking Tool | Igris Radar',
  description: 'Track your brand visibility in AI assistants. Monitor whether ChatGPT, Perplexity, and Claude recommend your product over competitors in real time.',
  path: '/landing/features/brand-visibility',
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['brand-visibility'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'AI Brand Visibility Tracker', path: '/landing/features/brand-visibility' },
      ])} />
      {children}
    </>
  );
}
