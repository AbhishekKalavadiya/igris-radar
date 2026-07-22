import { SITE_URL } from '@/lib/seo'
import { FINDING_EXPLANATIONS } from '@/lib/scannerExplanations'
import { slugify } from '@/lib/slugify'
import { getLastModified } from '@/lib/gitLastModified'

const FEATURE_SLUGS = [
  'security-scanner',
  'seo-audit',
  'aeo-audit',
  'geo-audit',
  'brand-visibility',
  'site-health',
]

const BLOG_SLUGS = [
  'why-is-my-new-website-not-getting-traffic',
  'what-is-answer-engine-optimization',
  'aeo-vs-geo-vs-seo-difference',
  'how-to-show-up-in-perplexity-ai-overviews',
  'does-llms-txt-actually-do-anything',
  'how-ai-crawlers-read-your-site',
  'why-ranking-1-doesnt-drive-traffic',
  'how-to-check-if-chatgpt-cites-you',
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

/** Maps a LEARN_PAGES entry to the source file that holds its content. */
function learnPageFile(path) {
  if (path === '/learn') return 'app/learn/page.js'
  if (path === '/learn/rules') return 'app/learn/rules/page.js'
  return `app${path}/page.js`
}

/** Serves /sitemap.xml with every indexable public page. */
export default function sitemap() {
  const landingModified = getLastModified('app/landing/page.js')
  const featuresModified = getLastModified('lib/landingContent.js')
  const rulesContentModified = getLastModified('lib/scannerExplanations.js')
  const aboutModified = getLastModified('app/landing/about/page.js')
  const contactModified = getLastModified('app/landing/contact/page.js')
  const termsModified = getLastModified('app/landing/terms/page.js')
  const privacyModified = getLastModified('app/landing/privacy/page.js')

  // Generate sitemap entries for all 100+ scanner rules - all share the
  // same source file (lib/scannerExplanations.js), so the git lookup runs
  // once above and is reused here rather than once per rule.
  const rulePages = Object.keys(FINDING_EXPLANATIONS).map((rule) => ({
    url: `${SITE_URL}/learn/rules/${slugify(rule)}`,
    lastModified: rulesContentModified,
    changeFrequency: 'weekly',
    priority: 0.7,
  }))

  const learnPages = LEARN_PAGES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: getLastModified(learnPageFile(path)),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  return [
    { url: `${SITE_URL}/landing`, lastModified: landingModified, changeFrequency: 'weekly', priority: 1 },
    ...FEATURE_SLUGS.map((slug) => ({
      url: `${SITE_URL}/landing/features/${slug}`,
      lastModified: featuresModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    })),
    ...learnPages,
    { url: `${SITE_URL}/landing/blog`, lastModified: getLastModified('app/landing/blog/page.js'), changeFrequency: 'weekly', priority: 0.7 },
    ...BLOG_SLUGS.map((slug) => ({
      url: `${SITE_URL}/landing/blog/${slug}`,
      lastModified: getLastModified(`app/landing/blog/${slug}/page.js`),
      changeFrequency: 'monthly',
      priority: 0.7,
    })),
    ...rulePages,
    { url: `${SITE_URL}/landing/about`, lastModified: aboutModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/contact`, lastModified: contactModified, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/landing/terms`, lastModified: termsModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${SITE_URL}/landing/privacy`, lastModified: privacyModified, changeFrequency: 'yearly', priority: 0.3 },
  ]
}
