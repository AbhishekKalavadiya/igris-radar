import JsonLd from '@/components/ui/JsonLd';
import { buildMetadata, faqPageJsonLd, breadcrumbJsonLd } from '@/lib/seo';
import { FEATURE_PAGES } from '@/lib/landingContent';

export const metadata = buildMetadata({
  title: 'Free Website Security Checker & Vulnerability Scanner Online | Igris Radar',
  description: 'Free website security checker and online vulnerability scanner. Run 90+ automated checks: security headers, TLS, exposed secrets, live CVE detection, web risk assessment, and subdomain takeover risks.',
  path: '/landing/features/security-scanner',
  keywords: [
    'website security checker', 'website security scanner', 'website vulnerability scanner',
    'free website security scan', 'web risk assessment', 'website security test',
    'web scanner', 'security headers checker', 'ssl checker', 'CVE scanner',
    'subdomain takeover checker', 'website security checker online free',
  ],
});

export default function Layout({ children }) {
  return (
    <>
      <JsonLd data={faqPageJsonLd(FEATURE_PAGES['security-scanner'].faqs)} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', path: '/landing' },
        { name: 'Website Security Checker', path: '/landing/features/security-scanner' },
      ])} />
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Igris Radar Security Scanner',
        applicationCategory: 'SecurityApplication',
        operatingSystem: 'Web',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: 'Free website security checker with 90+ automated vulnerability checks including TLS, security headers, exposed secrets, CVE detection, and subdomain takeover risks.',
      }} />
      {children}
    </>
  );
}
