import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'AI Brand Visibility Tracker: ChatGPT, Claude & More | Igris Radar',
  description: 'Send your real customer prompts to live AI engines and see whether your brand is recommended. Mention detection, sentiment analysis and an AI share-of-voice visibility score.',
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
