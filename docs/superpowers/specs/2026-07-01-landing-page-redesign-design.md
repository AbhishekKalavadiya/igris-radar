# Landing Page Redesign — Design Spec
**Date:** 2026-07-01  
**Status:** Approved  
**Approach:** A — The Pain Stack (problem-first narrative, self-serve conversion focus)

---

## Context

Redesign the Provenance landing page (`app/landing/page.js`) using keyword intelligence from two competitor SEO analysis Excel files:
- `ahrefs_seo_keyword_intelligence.xlsx` — 196 pages analysed
- `airanklab_seo_keyword_intelligence.xlsx` — 83 pages analysed

The page must be content-driven, long-form (9 sections), and link out to individual feature detail pages. Target audience: marketing managers and SEO professionals at mid-size companies (self-serve, "Start Free Trial" focus).

---

## Design Constraints (Igris Design System)

- **No hex colors in JSX** — use semantic Tailwind tokens only (`text-primary`, `bg-card`, etc.)
- **No rounded corners** — `--radius: 0px`. No `rounded-xl`, `rounded-2xl`, `rounded-3xl` on cards or buttons
- **`rounded-pill`** only for avatar circles and status badges
- **`◆`** brand signature in `text-primary` for eyebrow labels and nav
- **Always dark** — no `dark:` variants needed
- **SVG exceptions** — use `#3bbcdc` (Igris teal) only in SVG `stroke`/`stopColor` attributes

---

## Page Structure — 9 Sections

### Section 1 — Hero

**Purpose:** Hook cold traffic with a pain statement using high-frequency intelligence vocabulary.

**Badge:** `◆ The SEO + AEO + GEO Platform`

**H1:** "Your brand is invisible to ChatGPT. Let's fix that."

**Subheadline:** "Provenance gives you the AI search visibility tools to monitor, measure, and grow your brand's presence across ChatGPT, Gemini, Perplexity, and Google AI Overviews — before your competitors do."

**CTAs:**
- Primary: `Start Free Trial` → `/signup`
- Ghost: `Explore Features` → `#features`

**Trust element:** Scrolling ticker of AI engine names — ChatGPT · Gemini · Perplexity · Claude · Google AI Overviews · Bing Chat

**Intelligence sources:** "ai search visibility" (AIRankLab 141x), "ChatGPT" (269x), "Gemini" (253x), "SEO AEO GEO" (211x), "your competitors" (457x Ahrefs)

---

### Section 2 — Problem Agitation

**Purpose:** Amplify the pain with specific, data-anchored statements before introducing the solution.

**Eyebrow:** `◆ THE NEW SEARCH REALITY`

**H2:** "Traditional SEO is no longer enough."

**3 pain stat cards** (horizontal row):
1. "67% of search journeys now start in an AI engine — not Google" *(placeholder stat — replace with sourced figure before launch)*
2. "Your competitors are getting cited by ChatGPT. You don't know why."
3. "Zero-click traffic is rising. Your organic rankings mean less every month."

**Intelligence sources:** "your competitors" (457x), "organic traffic" (143x), "ai overviews" (41x)

---

### Section 3 — Solution Triad (SEO + AEO + GEO)

**Purpose:** Present Provenance as the complete answer, framed around the three disciplines.

**Eyebrow:** `◆ THE PROVENANCE PLATFORM`

**H2:** "One platform. Three disciplines. Total AI search visibility."

**Subtext:** "Monitor your rankings, optimize your content for AI answers, and track your brand across every generative engine — all in one place."

**3 sharp-cornered feature cards:**

| Colour | Title | Body | Link |
|---|---|---|---|
| `text-primary` / teal border | Technical SEO | Site audit, rank tracker, keywords explorer, content gap analysis. The foundation that feeds every AI engine. | `/landing/features/seo-audit` |
| Indigo | AEO — Answer Engine Optimization | Optimize your content to be cited by ChatGPT, Claude, and Perplexity when users ask conversational questions. Citation analytics included. | `/landing/features/aeo-audit` |
| Emerald | GEO — Generative Engine Optimization | Track your pixel share in Google AI Overviews, monitor AI Mode, and reclaim zero-click traffic with the GEO Checker. | `/landing/features/geo-audit` |

**Intelligence sources:** "seo aeo geo" (211x), "citation analytics" (114x), "geo checker" (193x), "ai overview tracker" (95x)

---

### Section 4 — Feature Showcase

**Purpose:** Grid of individual tool cards, each linking to a dedicated feature detail page. Drives depth and content indexing.

**Eyebrow:** `◆ TOOLS & FEATURES`

**H2:** "Every tool your brand needs to dominate AI search."

**6 feature cards** (2×3 grid on desktop, 1-col on mobile):

| Feature | Tagline | Target Page |
|---|---|---|
| GEO Checker | "Check your brand's GEO score instantly — free" | `/landing/features/geo-audit` |
| AI Overview Tracker | "Know when Google features your brand" | `/landing/features/brand-visibility` |
| Citation Analytics | "Count your AI engine brand citations" | `/landing/features/aeo-audit` |
| Site Audit | "Find and fix every technical SEO issue" | `/landing/features/seo-audit` |
| Rank Tracker | "Monitor your rankings across 190 countries" | `/landing/features/seo-audit` |
| Site Health | "Core Web Vitals + security in one dashboard" | `/landing/features/site-health` |

Each card: icon + title + tagline + `Learn more →` link

**Intelligence sources:** "geo checker" (193x), "ai overview tracker" (95x), "citation analytics" (114x), "site audit" (638x Ahrefs), "rank tracker" (581x), "core web vitals" (138x)

---

### Section 5 — How It Works

**Purpose:** Reduce friction for self-serve buyers by making the onboarding path obvious.

**Eyebrow:** `◆ HOW IT WORKS`

**H2:** "From invisible to cited — in 3 steps."

**3-step vertical/horizontal flow:**

1. **Connect your site** — "Enter your URL. Provenance crawls your site, checks your AI visibility score, and identifies content gaps in minutes."
2. **Monitor your brand** — "Track your brand citations across ChatGPT, Gemini, Perplexity, and Google AI Overviews in real time. Know who mentions you and why."
3. **Optimize and outrank** — "Get actionable fixes for every finding. Use AI content recommendations to improve citation likelihood and outrank your competitors."

**Intelligence sources:** "ai visibility checker" (393x Ahrefs), "monitor your" (453x), "content gap" (247x), "your competitors" (457x), "brand citations" (AIRankLab)

---

### Section 6 — Stats & Social Proof

**Purpose:** Establish credibility with concrete numbers before the FAQ and pricing.

**Eyebrow:** `◆ BY THE NUMBERS`

**H2:** "Trusted by marketing and SEO teams who take AI search seriously."

**4 stat blocks** (large `text-primary` numbers):
- `190+` — countries tracked for rank monitoring
- `5` — AI engines monitored (ChatGPT, Gemini, Perplexity, Claude, Bing)
- `638` — technical SEO checks per site audit
- `14-day` — free trial, no credit card required

**Below stats:** Greyscale logo strip — "Used by growth teams at..." with placeholder brand names (to be replaced with real customers)

---

### Section 7 — FAQ (AEO-Optimised)

**Purpose:** Capture AEO/GEO answer-trigger queries. Page includes JSON-LD `FAQPage` schema markup. Each answer is 2-3 sentences and includes a product CTA link.

**Eyebrow:** `◆ FREQUENTLY ASKED QUESTIONS`

**H2:** "Everything you need to know about AI search visibility."

**8 FAQ items** (accordion UI):

1. What is AEO (Answer Engine Optimization)?
2. What is GEO (Generative Engine Optimization)?
3. What is the difference between AEO and SEO?
4. How do I check if ChatGPT mentions my brand?
5. What is an AI visibility score?
6. How do I appear in Google AI Overviews?
7. What is a GEO checker?
8. How do I track brand citations in AI search?

**JSON-LD:** Inline `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />` rendered at the bottom of the `FaqAccordion` component. The `faqSchema` object is defined as a constant in the same file.

**Intelligence sources:** All 8 questions are direct AEO/GEO trigger phrases from both Excel files (AEO 587x, GEO 547x, "What is AEO?" 587x AIRankLab, "geo checker" 193x, etc.)

---

### Section 8 — Pricing Preview

**Purpose:** Remove the "how much does it cost?" objection before the final CTA.

**Eyebrow:** `◆ SIMPLE PRICING`

**H2:** "Start free. Scale when you're ready."

**3 sharp-cornered pricing cards:**

| Tier | Headline | Features summary | CTA |
|---|---|---|---|
| Free | "Get started at no cost" | GEO Checker + basic site audit + 1 site | `Start for Free` |
| Pro *(highlighted)* | "The full SEO + AEO + GEO suite" | Rank tracker + citation analytics + unlimited sites + AI overview tracker | `Start Free Trial` |
| Enterprise | "Built for teams and agencies" | White label + custom prompts + SLA + dedicated support | `Book a Demo` |

**Intelligence sources:** "free tools" (118x AIRankLab), "pricing" (224x), "enterprise" (232x), "white label" (86x), "book demo" (177x)

---

### Section 9 — Final CTA

**Purpose:** Last conversion push with urgency framing using competitor language.

**H2:** "Your competitors are already optimizing for AI search."

**Subtext:** "Join the marketing teams using Provenance to monitor their brand visibility, track AI citations, and dominate generative search — before it's too late."

**CTAs:**
- Primary: `Start Free Trial` → `/signup`
- Ghost: `Book a Demo` → `/landing/contact`

**Small print:** "No credit card required · 14-day free trial · Cancel anytime"

**Intelligence sources:** "your competitors" (457x), "brand visibility" (150x), "ai citations" (109x), "book demo" (177x)

---

## Feature Detail Pages

The following pages already exist and need to be improved with intelligence-vocabulary content:

| Page | Route | Primary keywords to embed |
|---|---|---|
| SEO Audit | `/landing/features/seo-audit` | site audit (638x), rank tracker (581x), keywords explorer (575x), content gap (247x) |
| AEO Audit | `/landing/features/aeo-audit` | aeo (587x/647x), citation analytics (114x), chatgpt (269x), gemini (253x), schema markup (55x) |
| GEO Audit | `/landing/features/geo-audit` | geo checker (193x), ai overview tracker (95x), ai mode tracker (97x), generative engine optimization |
| Brand Visibility | `/landing/features/brand-visibility` | brand visibility (150x), brand radar (654x Ahrefs), ai brand mentions (109x) |
| Site Health | `/landing/features/site-health` | core web vitals (138x), site audit (638x), security scanner |
| Security Scanner | `/landing/features/security-scanner` | owasp, ci/cd pipeline, continuous pentesting |

---

## Component Architecture

- **Main page:** `app/landing/page.js` — full rewrite, ~150 lines max (thin wiring)
- **New shared components** to extract:
  - `components/landing/HeroTicker.js` — scrolling AI engine name ticker
  - `components/landing/PainCards.js` — 3-column problem agitation cards
  - `components/landing/TriadCards.js` — SEO/AEO/GEO solution cards
  - `components/landing/FeatureGrid.js` — 6-card feature showcase grid
  - `components/landing/StepsFlow.js` — 3-step how it works
  - `components/landing/StatBar.js` — 4-stat social proof block
  - `components/landing/FaqAccordion.js` — accordion with JSON-LD schema
  - `components/landing/PricingCards.js` — 3-tier pricing preview

---

## Intelligence Vocabulary Reference (key phrases to use throughout)

From Ahrefs (196 pages):
- "monitor your [rankings/brand/backlinks]" (453x)
- "your competitors" (457x)  
- "ai visibility checker" (393x)
- "content gap" (247x)
- "site audit" (638x)
- "brand radar" (654x)

From AI Rank Lab (83 pages):
- "ai search visibility" (141x)
- "seo aeo geo" (211x)
- "brand visibility" (150x)
- "geo checker" (193x)
- "citation analytics" (114x)
- "chatgpt" (269x) / "gemini" (253x)
- "book demo" (177x)
- "enterprise" (232x)
