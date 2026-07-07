import { SITE_URL } from '@/lib/seo'

const FEATURE_SLUGS = [
  'security-scanner',
  'seo-audit',
  'aeo-audit',
  'geo-audit',
  'brand-visibility',
  'site-health',
]

/** Serves /sitemap.xml with every indexable public page. */
export default function sitemap() {
  const now = new Date()

  return [
    { url: `${SITE_URL}/landing`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...FEATURE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/landing/features/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    { url: `${SITE_URL}/landing/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/landing/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
