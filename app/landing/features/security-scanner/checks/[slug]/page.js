import { notFound } from 'next/navigation';
import { SECURITY_CHECKS, getCheckBySlug } from '@/lib/securityChecksData';
import { buildMetadata } from '@/lib/seo';
import JsonLd from '@/components/ui/JsonLd';
import CheckDetailClient from '@/components/landing/CheckDetailClient';

export function generateStaticParams() {
  return SECURITY_CHECKS.map((check) => ({
    slug: check.slug,
  }));
}

export async function generateMetadata({ params }) {
  const resolved = await params;
  const check = getCheckBySlug(resolved.slug);

  if (!check) {
    return {
      title: 'Security Check Not Found | Igris Radar',
    };
  }

  return buildMetadata({
    title: `${check.name} — Security Check & Fix Guide | Igris Radar`,
    description: check.whyItMatters.slice(0, 160),
    path: `/landing/features/security-scanner/checks/${check.slug}`,
    keywords: [check.name, 'security check', 'remediation guide', 'vulnerability scan', check.categoryName],
  });
}

export default async function CheckDetailPage({ params }) {
  const resolved = await params;
  const check = getCheckBySlug(resolved.slug);

  if (!check) {
    notFound();
  }

  // Find related checks
  const related = (check.relatedSlugs || [])
    .map((slug) => getCheckBySlug(slug))
    .filter(Boolean);

  // Schema.org FAQPage & TechArticle
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (check.faqs || []).map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: `${check.name} Security Check`,
    description: check.shortDesc,
    author: {
      '@type': 'Organization',
      name: 'Igris Radar Security Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Igris Radar',
    },
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <JsonLd data={faqSchema} />
      <JsonLd data={articleSchema} />

      <div className="max-w-4xl mx-auto">
        <CheckDetailClient check={check} relatedChecks={related} />
      </div>
    </div>
  );
}
