/**
 * lib/seo.js
 * Single source of truth for site identity, page metadata, and structured data.
 *
 * Usage (server components / layout.js files only for metadata):
 *   import { buildMetadata } from '@/lib/seo'
 *   export const metadata = buildMetadata({ title, description, path })
 *
 * JSON-LD builders are safe to use from both server and client components -
 * render the result with <JsonLd data={...} /> (components/ui/JsonLd.js).
 */

import { env } from '@/lib/env'

export const SITE_NAME = 'Igris Radar'
export const SITE_URL = env.siteUrl
export const SITE_TAGLINE = 'AI Search Visibility & Web Audit Platform'
export const SITE_DESCRIPTION =
  'Measure and grow your AI search visibility. Security, SEO, AEO & GEO audits, brand visibility tracking, and Core Web Vitals monitoring in one platform.'

/**
 * Build a complete Next.js metadata object for an indexable public page.
 * Guarantees every page ships a unique title/description, a canonical URL,
 * Open Graph tags, and Twitter Card tags.
 *
 * @param {object} opts
 * @param {string} opts.title       Full title, 10–70 chars, brand included
 * @param {string} opts.description Meta description, 50–160 chars
 * @param {string} opts.path        Route path used for the canonical URL (e.g. '/landing/about')
 * @param {string} [opts.ogType]    Open Graph type, defaults to 'website'
 * @param {string[]} [opts.keywords]
 */
export function buildMetadata({ title, description, path, ogType = 'website', keywords }) {
  return {
    title,
    description,
    ...(keywords ? { keywords } : {}),
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: SITE_NAME,
      type: ogType,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

// ─── Structured data (Schema.org JSON-LD) ────────────────────────────────────

export const FOUNDER = {
  name: 'Abhishek',
  title: 'Founder',
  bio: 'Abhishek is the founder of Igris Radar and an experienced software developer. He builds the audit engines behind the platform: security, SEO, AEO, GEO, brand visibility, and site health.',
}

/**
 * Knowledge-graph identity links (Schema.org sameAs). The official site URL is
 * a spec-valid sameAs value; replace/extend with real social profiles
 * (LinkedIn, X, GitHub, YouTube) as they are created.
 */
export const SOCIAL_PROFILES = [SITE_URL]

/** ISO date the current site went live; dateModified is the build date. */
export const SITE_PUBLISHED = '2026-07-03'

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    // Google's structured-data guidelines for Organization.logo explicitly
    // disallow SVG (must be JPG/PNG/GIF) - use the raster logo, not /icon.
    logo: `${SITE_URL}/logo-dark.png`,
    description: SITE_DESCRIPTION,
    founder: {
      '@type': 'Person',
      name: FOUNDER.name,
      jobTitle: FOUNDER.title,
    },
    sameAs: SOCIAL_PROFILES,
  }
}

export function personJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: FOUNDER.name,
    jobTitle: FOUNDER.title,
    description: FOUNDER.bio,
    url: `${SITE_URL}/landing/about`,
    worksFor: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function webSiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    datePublished: SITE_PUBLISHED,
    dateModified: new Date().toISOString().split('T')[0],
  }
}

/**
 * @param {Array<{name: string, path: string}>} items ordered from root to current page
 */
export function breadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(({ name, path }, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: `${SITE_URL}${path}`,
    })),
  }
}

export function softwareApplicationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: SITE_NAME,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      description: 'Free plan: 3 full scans a month across all six audit types.',
    },
  }
}

/**
 * @param {string} name
 * @param {Array<{title: string, text: string}>} steps ordered process steps
 */
export function howToJsonLd(name, steps) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    step: steps.map(({ title, text }, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: title,
      text,
    })),
  }
}

/**
 * @param {Array<{q: string, a: string}>} faqs
 */
export function faqPageJsonLd(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  }
}
