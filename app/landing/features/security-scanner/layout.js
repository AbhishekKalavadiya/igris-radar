import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Free Website Security Scanner & Vulnerability Audit | Igris Radar',
  description: 'Free website security scanner online. Run 90+ automated vulnerability checks: TLS, security headers, exposed secrets, live JS CVEs, and subdomain takeover risks.',
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
