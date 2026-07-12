# Igris Radar — GEO Scanner Improvements Roadmap

> **Last Updated:** July 2026
> **Plan Tiers:** Free → Starter → Pro → Agency
> **Principle:** Maximum value in Free/Starter/Pro. Only premium AI-powered intelligence in Agency.

---

## Current State

The GEO (Generative Engine Optimization) scanner currently checks **4 categories** with **~17 findings**:

| Category | Current Checks |
|---|---|
| **Entity Authority** | Author byline/bio, sameAs links, logo detection, publication dates, about page link |
| **Topical Authority** | Word count/depth, breadcrumbs, FAQ schema, internal link density, H2/H3 subtopic hierarchy |
| **Factual Density** | External citations, data point density (numbers/stats), quotes/blockquotes, authoritative source links (.edu, .gov) |
| **AI Readability** | Paragraph chunking (avg sentences), tables, lists, pronoun ambiguity detection |

---

## 🟢 Free Tier — Enhanced Baseline

*Focus: Pure HTML analysis, zero API cost.*

| Check | Category | What It Does | Implementation |
|---|---|---|---|
| **Knowledge Graph Entity Signals** | Entity Authority | Check for `@id` fields in JSON-LD — how Google Knowledge Graph identifies distinct entities. Without `@id`, your brand is invisible to the Knowledge Graph | JSON-LD `@id` field check |
| **Contact & Trust Signals** | Entity Authority | Check for visible phone, email, address, or `ContactPoint` schema. Generative engines trust entities they can verify | Regex + schema parsing |
| **Unique Value Proposition Detection** | Topical Authority | Check if first 200 words contain differentiating statements ("only", "first", "unique", "unlike"). AIs prefer original perspectives over commodity content | Text heuristic analysis |
| **Definition Format Detection** | Factual Density | Check for "X is..." or "X refers to..." definition patterns near headings. LLMs heavily favor clean, extractable definitions | Regex pattern matching |
| **Semantic HTML Landmarks** | AI Readability | Check for `<article>`, `<section>`, `<aside>`, `<nav>`. LLMs use these to identify primary content vs. boilerplate | Cheerio DOM query |
| **Image with Caption Detection** | AI Readability | Check if images have `<figcaption>` or descriptive adjacent text. LLMs can't see images but DO read captions | Cheerio parent/sibling traversal |

---

## 🔵 Starter Tier — Deeper Content Analysis

| Check | Category | What It Does | Implementation |
|---|---|---|---|
| **Wikipedia-Style Inline Citations** | Factual Density | Check if citations appear inline near claims (same `<p>`) vs. dumped in footer. Inline citations dramatically increase LLM trust | Link-paragraph proximity analysis |
| **Statistic Freshness Heuristic** | Factual Density | Check if statistics are accompanied by year references ("in 2025", "2024 study"). Undated stats get deprioritized | Regex for number + year proximity |
| **Content Uniqueness Indicators** | Topical Authority | Detect first-person research ("we tested"), case studies, expert quotes — signals of original content | Text pattern heuristics |
| **Multi-Format Content Score** | AI Readability | Score diversity: text + lists + tables + code + captioned images. Pages with 3+ formats score higher | Element counting + scoring |
| **Heading as Complete Thoughts** | AI Readability | Check if headings are descriptive phrases ("How to Install Node.js") vs. single words ("Installation") | Word count per heading analysis |

---

## ⭐ Pro Tier — Technical Depth + Soft AI + Competitor

| Check | Category | What It Does | Implementation |
|---|---|---|---|
| **Entity Disambiguation Score** | Entity Authority | Analyze Organization + WebSite schema completeness (`description`, `foundingDate`, `founder`). Incomplete entity data causes LLMs to confuse brands | JSON-LD field validation |
| **Topical Cluster Detection** | Topical Authority | Analyze if internal links form coherent topic clusters vs. random navigation. LLMs reward pillar-page + cluster architecture | Link destination analysis |
| **Comparison & "Best Of" Optimization** | Factual Density | Detect comparison patterns (vs., alternatives, pros/cons) — #1 most-cited content type in AI shopping queries | Text pattern detection |
| **Structured Summary Detection** | AI Readability | Check for TL;DR, executive summary, or key takeaways sections. LLMs extract these as primary answer snippets | Heading + content pattern matching |
| **Soft AI Analysis** | AI Intelligence | Lightweight AI: entity confidence, topical authority score, 3 actionable suggestions | AI prompt |
| **Competitor GEO Comparison** | AI Intelligence | Compare entity signals, factual density, and content depth side-by-side with a competitor | Dual-fetch pipeline |

---

## 👑 Agency Tier — Premium AI Intelligence

| Check | Category | What It Does | Implementation |
|---|---|---|---|
| **Citation Simulation** | AI Intelligence | AI role-plays as a generative engine: "Would I cite this for [topic]? Yes/No, because..." with specific reasoning | Role-play AI prompt |
| **Entity Knowledge Graph Gap Analysis** | AI Intelligence | AI compares entity signals against a complete Knowledge Graph entry, identifies missing properties (founding date, HQ, key people, industry) | AI structured analysis |
| **Topical Authority Depth Map** | AI Intelligence | AI generates complete topic map of what subtopics the page SHOULD cover to be the definitive source, checks present vs. missing | AI topic mapping prompt |
| **Competitive Positioning Report** | AI Intelligence | AI analysis of brand ranking in LLM's "trust hierarchy" against competitors, with specific content recommendations to outrank them | Deep AI competitive analysis |

---

## Summary Table

| Feature | Free | Starter | Pro | Agency |
|---|:---:|:---:|:---:|:---:|
| Author/org schema, sameAs, logo, dates | ✅ | ✅ | ✅ | ✅ |
| Word count, breadcrumbs, FAQ, link density | ✅ | ✅ | ✅ | ✅ |
| External citations, data points, quotes | ✅ | ✅ | ✅ | ✅ |
| Paragraph chunking, tables, lists, pronouns | ✅ | ✅ | ✅ | ✅ |
| Knowledge Graph entity signals (`@id`) | ✅ | ✅ | ✅ | ✅ |
| Contact/trust signals, definition detection | ✅ | ✅ | ✅ | ✅ |
| Semantic HTML landmarks, image captions | ✅ | ✅ | ✅ | ✅ |
| Wikipedia-style inline citations | — | ✅ | ✅ | ✅ |
| Statistic freshness heuristic | — | ✅ | ✅ | ✅ |
| Content uniqueness indicators | — | ✅ | ✅ | ✅ |
| Multi-format content scoring | — | ✅ | ✅ | ✅ |
| Heading completeness check | — | ✅ | ✅ | ✅ |
| Entity disambiguation scoring | — | — | ✅ | ✅ |
| Topical cluster detection | — | — | ✅ | ✅ |
| Comparison/Best-Of optimization | — | — | ✅ | ✅ |
| Structured summary (TL;DR) detection | — | — | ✅ | ✅ |
| Soft AI analysis + competitor compare | — | — | ✅ | ✅ |
| Citation simulation (AI role-play) | — | — | — | ✅ |
| Knowledge Graph gap analysis (AI) | — | — | — | ✅ |
| Topical authority depth map (AI) | — | — | — | ✅ |
| Competitive positioning report (AI) | — | — | — | ✅ |

---

## Implementation Priority

1. **Phase 1:** All Free tier additions (6 new checks — pure HTML, no cost)
2. **Phase 2:** All Starter tier additions (5 new checks — slightly more processing, still no APIs)
3. **Phase 3:** Pro tier (6 new checks — Soft AI + Competitor comparison)
4. **Phase 4:** Agency tier (4 new checks — Deep AI prompts and simulation)
