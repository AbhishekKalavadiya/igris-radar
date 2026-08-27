# Provenance (Igris Radar) - Product Improvements & Growth Roadmap

> **Master Repository of Proposed Product Features & Strategic Improvements**  
> *Saved for instant retrieval whenever requested.*

---

## 🧭 Executive Summary & Value Proposition

Provenance is positioned at the intersection of **AI Search Optimization (GEO / AEO)**, **Technical SEO**, **Site Health**, and **Security Auditing**. 

This roadmap outlines high-impact improvements designed to:
1. **Acquire users at zero customer acquisition cost (CAC)** via viral free tools.
2. **Deliver enterprise-grade cybersecurity inspection** without requiring third-party paid API keys.
3. **Retain users daily/weekly** through automated alerts and actionable recommendations.
4. **Monetize at higher price points (ACV)** by empowering agencies, security professionals, and enterprises.

---

## 🛡️ 1. Advanced Security Scanner Improvements

### 1.1. Interactive Visual Attack Surface Map (Dynamic Canvas / Node Graph)
- **Concept:** An interactive, draggable visual network canvas of the scanned domain.
- **Visual Nodes:**
  - **Core Domain Node** in the center.
  - **Subdomain Tree:** Discovered subdomains (`api.`, `admin.`, `staging.`, `mail.`) color-coded by vulnerability status.
  - **Third-Party Script Perimeters:** External CDNs, tracking pixels, and chat widgets branching off with risk ratings.
  - **Security Shield Nodes:** WAF status, TLS cipher strength, DNSSEC verification, and Mail security records.
- **Value:** Enterprise "Cyber Command Center" visual aesthetic that wows founders, developers, and security auditors.

### 1.2. Third-Party Supply Chain & Script Poisoning Inspector (Magecart & CDN Defense)
- **Concept:** Deep inventory of all external JavaScript bundles running on the page.
- **Features:**
  - **Subresource Integrity (SRI) Audit:** Flags external scripts missing `integrity="sha384-..."` hashes.
  - **Script Permission Analysis:** Flags scripts capable of reading un-secured cookies or intercepting keystrokes.
  - **Compromised / Malicious CDN Radar:** Checks loaded domains against lists of hijacked or unmaintained CDNs (e.g. Polyfill.io attack defense).

### 1.3. Subdomain Takeover & Dangling DNS Record Radar
- **Concept:** Prevents hostile takeover of abandoned cloud assets.
- **Features:**
  - Discovers subdomains via `crt.sh` and DNS resolution.
  - Inspects CNAME pointers targeting reclaimable cloud services (AWS S3, Vercel, GitHub Pages, Heroku, Azure, Zendesk).
  - Emits critical alerts when an active DNS record points to an unregistered/deleted cloud resource.

### 1.4. API & Shadow Endpoint Discovery (GraphQL & Swagger Leak Detector)
- **Concept:** Probes for exposed developer artifacts and unauthenticated endpoints.
- **Checks:**
  - `/openapi.json`, `/swagger.json`, `/api-docs`.
  - `/api/graphql` (detects if GraphQL Introspection is enabled, exposing full schema).
  - Next.js dev artifacts leaked in production (`/__nextjs_original-stack-frame`, `/_next/static/development/`).
  - Sensitive files (`.env`, `docker-compose.yml`, `.git/HEAD`, backup archives).

### 1.5. Multi-Stack "1-Click Hardening Config" Generator
- **Concept:** Pre-built, tailored configuration blocks for every detected missing header or security flaw.
- **Supported Stacks:**
  - ⚛️ **Next.js** (`middleware.js` or `headers()` in `next.config.js`)
  - 🟢 **Nginx** (`nginx.conf`)
  - ☁️ **Vercel** (`vercel.json`)
  - 🔶 **Cloudflare** (Transform Rules & Page Rules)
  - 🪶 **Apache** (`.htaccess`)
  - 🌐 **DNS Records** (Ready-to-paste TXT records for SPF/DMARC/MTA-STS)

### 1.6. Email Spoofing & Phishing Defense Analyzer (SPF, DMARC & BIMI)
- **Concept:** Protects corporate domains against spoofed phishing emails.
- **Features:**
  - **SPF 10-Lookup Limit Counter:** Ensures SPF records don't exceed RFC 7208 limits (which cause silent email delivery failure).
  - **DMARC Enforcement:** Flags weak `p=none` configurations and guides transition to `p=quarantine` / `p=reject`.
  - **BIMI (Brand Indicators for Message Identification):** Evaluates readiness to display verified company logos in Gmail/Apple Mail inboxes.

---

## 🚀 2. Viral Top-of-Funnel Tools & Acquisition (Zero Paid API Keys)

### 2.1. AI Robots.txt & Bot Permissions Tester & Generator (Free Public Tool)
- **Concept:** Scans `robots.txt` and HTTP headers for 15+ AI crawler bots (`GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `CCBot`, `Bytespider`, `Applebot-Extended`, `Meta-ExternalAgent`).
- **Features:** Visual access matrix + 1-click optimized `robots.txt` generator.

### 2.2. Competitor Head-to-Head Battle Arena
- **Concept:** Enter `YourDomain.com` vs `Competitor.com`.
- **Output:** Unified side-by-side battle radar across Security, SEO, AEO, and Site Health using the existing `CompetitorCompare.js` engine.

### 2.3. LLM Structured Data & Entity Graph Builder (JSON-LD)
- **Concept:** Generates ready-to-paste Schema.org JSON-LD snippets (`Organization`, `FAQPage`, `Product`, `TechArticle`, `SameAs` entity links).

---

## 💼 3. Monetization, Agency & Habit Loops

### 3.1. White-Label Agency PDF Reports
- **Concept:** Custom branded PDF client audit reports with agency logos, custom accent colors, and consultant notes (powered by `@react-pdf/renderer`).

### 3.2. Embeddable "Verified AI-Ready & Secure" Trust Badge
- **Concept:** Dynamic SVG badge for user footers that links back to Provenance, creating a viral backlink loop.

### 3.3. Provenance Chrome Extension ("Instant Web & Security Inspector")
- **Concept:** 1-click popup inspecting any active browser tab for Security headers, AI Bot permissions, and Schema.

### 3.4. Slack / Discord Webhook Notifications & Weekly Executive Digest
- **Concept:** Real-time webhook alerts for security vulnerabilities, certificate expirations, and uptime drops.

---

## 📊 Master Priority Matrix & Status

| Priority | Feature / Initiative | Category | API Keys Needed? | Status |
| :--- | :--- | :--- | :--- | :--- |
| 🛡️ **P0** | **Interactive Visual Attack Surface Map** | Security | ❌ None | 📋 Planned |
| 🛡️ **P0** | **API & Shadow Endpoint Hunter (GraphQL/Swagger)** | Security | ❌ None | 📋 Planned |
| 🛡️ **P0** | **Multi-Stack 1-Click Hardening Config Generator** | Security | ❌ None | 📋 Planned |
| 🚀 **P0** | **AI Robots.txt & Bot Permissions Tester** | AEO / Free Tool | ❌ None | 📋 Planned |
| 🛡️ **P1** | **Third-Party Supply Chain & SRI Inspector** | Security | ❌ None | 📋 Planned |
| 🛡️ **P1** | **Subdomain Takeover & Dangling DNS Radar** | Security | ❌ None | ✅ Shipped (Starter Tier) |
| 🛡️ **P1** | **Email Spoofing, SPF & BIMI Analyzer** | Security | ❌ None | 📋 Planned |
| 📈 **P1** | **Competitor Head-to-Head Battle Arena** | Analytics | ❌ None | 🟡 Half-Built (`CompetitorCompare.js`) |
| 📈 **P1** | **White-Label Agency PDF Customizer** | Monetization | ❌ None | 🟢 Mostly Built (`pdfReport.js`) |
| 🔮 **P2** | **Embeddable "Verified Secure" Trust Badge** | Growth | ❌ None | 📋 Planned |
| 🔮 **P2** | **Provenance Chrome Extension** | User Habit | ❌ None | 📋 Planned |

---
