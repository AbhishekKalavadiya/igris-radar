import { SITE_URL } from '@/lib/seo'
import { PROTECTED_ROUTES, AUTH_ROUTES } from '@/lib/constants'

const PRIVATE_PATHS = ['/api/', ...PROTECTED_ROUTES, ...AUTH_ROUTES]

/**
 * AI assistant crawlers get their own explicit allow group so intent is
 * unambiguous: public pages are open to answer engines, private app
 * surfaces stay closed. No crawl-delay anywhere - AI indexing is welcome.
 */
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'anthropic-ai',
  'PerplexityBot',
  'Google-Extended',
]

/** Serves /robots.txt - allow the public marketing site, keep crawlers out of
 * the API, auth flows, and the authenticated dashboard. */
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      {
        userAgent: AI_CRAWLERS,
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
