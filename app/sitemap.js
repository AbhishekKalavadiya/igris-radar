import { SITE_URL } from '@/lib/seo'
import { FINDING_EXPLANATIONS } from '@/lib/scannerExplanations'
import { slugify } from '@/lib/slugify'

const FEATURE_SLUGS = [
  'security-scanner',
  'seo-audit',
  'aeo-audit',
  'geo-audit',
  'brand-visibility',
  'site-health',
]

const LEARN_PAGES = [
  '/learn',
  '/learn/understanding-domain-reputation-for-email-security',
  '/learn/what-is-a-dmarc-policy',
  '/learn/what-is-an-spf-record',
  '/learn/what-is-an-ssl-certificate',
  '/learn/what-is-a-404-error-and-how-it-affects-aeo',
  '/learn/optimizing-content-for-llm-crawlers',
  '/learn/what-is-a-knowledge-graph',
  '/learn/brand-entity-recognition-in-generative-ai',
  '/learn/core-web-vitals-and-ranking-factors',
  '/learn/what-is-a-canonical-tag',
  '/learn/rules'
]

/** Serves /sitemap.xml with every indexable public page. */
export default function sitemap() {
  const now = new Date()

  // Generate sitemap entries for all 100+ scanner rules
  const rulePages = Object.keys(FINDING_EXPLANATIONS).map((rule) => ({
    url: `${SITE_URL}/learn/rules/${slugify(rule)}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const learnPages = LEARN_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: `${SITE_URL}/landing`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    ...FEATURE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/landing/features/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    ...learnPages,
    ...rulePages,
    { url: `${SITE_URL}/landing/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/terms`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/landing/privacy`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
