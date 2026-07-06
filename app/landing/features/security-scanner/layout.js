import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Website Security Scanner: Headers, Secrets & Email | Igris Radar',
  description: 'Automated website security audit: security headers, exposed API keys and sensitive files, secure cookies, CORS, SPF and DMARC records. Severity-ranked findings with AI-ready fix prompts in about 30 seconds.',
  path: '/landing/features/security-scanner',
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['security-scanner'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Website Security Scanner', path: '/landing/features/security-scanner' },
      ])} />
      {children}
    </>
  );
}
