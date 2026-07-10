import { SITE_URL, SITE_NAME } from '@/lib/seo'

export const dynamic = 'force-static'

/**
 * Serves /llms.txt - structured site instructions for AI crawlers,
 * following the llmstxt.org convention (H1 name, blockquote summary,
 * markdown link sections). HEAD requests are derived from GET by Next.js.
 */
export async function GET() {
  const body = `# ${SITE_NAME}

> ${SITE_NAME} is an AI search visibility and web audit platform. From a single URL it runs six audits - website security, SEO, AEO (answer engine optimization), GEO (generative engine optimization), live AI brand visibility tracking, and site health - and returns severity-ranked findings with AI-ready fix prompts.

${SITE_NAME} is built for teams that want to be cited and recommended by AI assistants (ChatGPT, Claude, Perplexity, Gemini) as well as rank in traditional search. Every audit runs from the outside against a public URL; nothing is installed on the audited site.

## Product

- [Home](${SITE_URL}/landing): Platform overview, pricing, and FAQ
- [Website Security Scanner](${SITE_URL}/landing/features/security-scanner): Security headers, exposed secrets, cookies, CORS, SPF/DMARC
- [SEO Audit](${SITE_URL}/landing/features/seo-audit): Technical SEO, on-page signals, structured data, link health
- [AEO Audit](${SITE_URL}/landing/features/aeo-audit): AI crawler access, answer-ready structure, llms.txt, citation-readiness
- [GEO Audit](${SITE_URL}/landing/features/geo-audit): Entity authority, topical depth, factual density, AI readability
- [AI Brand Visibility Tracker](${SITE_URL}/landing/features/brand-visibility): Live prompt tracking across ChatGPT, Claude, Perplexity, Gemini
- [Site Health](${SITE_URL}/landing/features/site-health): Core Web Vitals via PageSpeed and WCAG 2.2 accessibility

## Company

- [About](${SITE_URL}/landing/about): Why we built the platform and how we work
- [Contact](${SITE_URL}/landing/contact): Sales, support, enterprise, and partnerships

## Crawling preferences

AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) are welcome on all public pages listed above. The authenticated application (/dashboard and related routes) and the API (/api) are private and excluded via robots.txt. No crawl-delay is imposed.
`

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
