import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Brand Radar & AI Visibility Tracker (Surveillance Visibilité IA) | Igris Radar',
  description: 'AI Brand Radar & visibility surveillance (surveillance visibilité IA). Send real customer prompts to ChatGPT, Claude, Perplexity & Gemini to measure AI brand mentions, sentiment analysis, and share of voice.',
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
