import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Web Risk Scanner & Security Audit Tool | Subdomain Radar | Igris Radar',
  description: 'Automated Web Risk Scanner & Subdomain Radar: audit website risks, OWASP security headers, exposed API secrets, vulnerable JS libraries, and subdomain takeover vulnerabilities in 30 seconds.',
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
