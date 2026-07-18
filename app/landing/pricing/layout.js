import { buildMetadata, breadcrumbJsonLd } from '@/lib/seo';
import JsonLd from '@/components/ui/JsonLd';

export const metadata = buildMetadata({
  title: 'Pricing — Free, Starter, Pro & Agency Plans | Igris Radar',
  description: 'Compare all Igris Radar plans. Free plan includes 10 full scans/month across Security, SEO, AEO, GEO, Brand Visibility & Site Health. Starter adds ASO audits. Pro adds monitoring & AI analysis. Agency adds white-label & API access.',
  path: '/landing/pricing',
  keywords: [
    'Igris Radar pricing', 'ASO audit pricing', 'SEO audit pricing', 'AEO pricing',
    'website security scanner pricing', 'AI visibility pricing', 'free SEO audit tool',
  ],
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Pricing', path: '/landing/pricing' },
      ])} />
      {children}
    </>
  );
}
