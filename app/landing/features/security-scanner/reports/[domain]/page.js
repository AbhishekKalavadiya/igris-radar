import { notFound } from 'next/navigation';
import { TOP_DOMAINS, getDomainBySlug, buildDomainScanResult } from '@/lib/topDomainsSecurityData';
import { buildMetadata } from '@/lib/seo';
import JsonLd from '@/components/ui/JsonLd';
import DomainReportClient from '@/components/landing/DomainReportClient';

export function generateStaticParams() {
  return TOP_DOMAINS.map((domain) => ({
    domain: domain.slug,
  }));
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const domainObj = getDomainBySlug(resolved.domain);

  if (!domainObj) {
    return {
      title: 'Domain Security Report Not Found | Igris Radar',
    };
  }

  return buildMetadata({
    title: `Is ${domainObj.domain} Secure? — Security Audit Report (${domainObj.score}% Score) | Igris Radar`,
    description: `Automated security assessment for ${domainObj.domain}. Scored ${domainObj.score}/100 across TLS protocols, HTTP security headers, DNS authentication, and exposed assets.`,
    path: `/landing/features/security-scanner/reports/${domainObj.slug}`,
    keywords: [
      `${domainObj.domain} security`,
      `is ${domainObj.domain} safe`,
      `${domainObj.domain} ssl check`,
      `${domainObj.domain} headers`,
      'website security report',
    ],
  });
}

export default async function DomainReportPage({ params }) {
  const resolved = await params;
  const domainObj = getDomainBySlug(resolved.domain);

  if (!domainObj) {
    notFound();
  }

  const scanResult = buildDomainScanResult(domainObj);

  // Schema.org Structured Data
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `Security Audit Report for ${domainObj.domain}`,
    description: `Automated website security assessment for ${domainObj.domain} covering TLS, headers, cookies, and DNS trust.`,
    author: {
      '@type': 'Organization',
      name: 'Igris Radar Security Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Igris Radar',
    },
  };

  const reviewSchema = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    itemReviewed: {
      '@type': 'Organization',
      name: domainObj.name,
      url: `https://${domainObj.domain}`,
    },
    reviewRating: {
      '@type': 'Rating',
      ratingValue: domainObj.score,
      bestRating: 100,
      worstRating: 0,
    },
    author: {
      '@type': 'Organization',
      name: 'Igris Radar Security Scanner',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `Is ${domainObj.domain} secure?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `${domainObj.domain} scored ${domainObj.score}/100 (Grade ${domainObj.grade}) on Igris Radar's automated security audit evaluating TLS certificates, HTTP response headers, cookie hardening, and DNS authentication records.`,
        },
      },
      {
        '@type': 'Question',
        name: `What security checks were run on ${domainObj.domain}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Checks included TLS 1.3 encryption, HSTS preload status, Content Security Policy (CSP) validation, clickjacking defenses (X-Frame-Options), cookie HttpOnly/Secure flags, and email authentication records (SPF, DMARC).`,
        },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <JsonLd data={articleSchema} />
      <JsonLd data={reviewSchema} />
      <JsonLd data={faqSchema} />

      <div className="max-w-5xl mx-auto">
        <DomainReportClient domainObj={domainObj} scanResult={scanResult} />
      </div>
    </div>
  );
}
