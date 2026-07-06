# 🛡️ Provenance (Igris Radar) — Security & Penetration Testing Checklist

> Tailored to the Provenance SaaS platform architecture: Next.js 14, MongoDB, Stripe billing, session-cookie auth, multi-tier plan enforcement.

---

## Table of Contents

1. [Codebase Audit — Findings from Current Review](#1-codebase-audit--findings-from-current-review)
2. [Penetration Testing Checklist (OWASP-aligned)](#2-penetration-testing-checklist-owasp-aligned)
3. [ISO 27001 Annex A — Application Security Controls](#3-iso-27001-annex-a--application-security-controls)
4. [Pre-Production Go-Live Gate](#4-pre-production-go-live-gate)

---

## 1. Codebase Audit — Findings from Current Review

These are **real vulnerabilities and weaknesses** identified in the current codebase during this review.

### 🔴 Critical

| # | Finding | File | Detail | Remediation |
|---|---------|------|--------|-------------|
| C1 | **Session token is unsigned base64 JSON** | `lib/auth/session.js` | `encodeSession()` produces `base64(JSON)`. Any user can decode it, modify `plan`, `role`, or `id`, re-encode, and set the cookie. There is **zero tamper protection**. | Replace with signed JWT (`jsonwebtoken`) or `iron-session` (encrypted + signed). Validate signature on every decode. |
| C2 | **Admin panel uses hardcoded credentials** | `app/api/[[...path]]/route.js` (L1029-L1036) | `username === 'admin' && password === 'admin'` — trivially guessable. Admin cookie is a simple `provenance_admin=true` boolean, also forgeable. | Move admin creds to env vars, hash password, use a proper session token for admin auth. |
| C3 | **Plan elevation via cookie tampering** | `lib/auth/session.js` + `route.js` | Because the session cookie is unsigned, a `free` user can set `plan: 'enterprise'` in the cookie and bypass all scan limits, feature gates, and site tracking limits. | Fix C1 (signed tokens). Additionally, re-verify `plan` from DB on sensitive operations rather than trusting the cookie payload alone. |
| C4 | **Fake plan upgrade endpoint in production** | `app/api/[[...path]]/route.js` (L449-L467) | `POST /api?path=auth/update-plan` allows any authenticated user to set their plan to any tier without payment. No admin check, no Stripe verification. | Remove entirely, or gate behind admin auth + RBAC. Plan changes should only happen via Stripe webhooks. |

### 🟠 High

| # | Finding | File | Detail | Remediation |
|---|---------|------|--------|-------------|
| H1 | **Rate limiter is in-memory (Map)** | `lib/rateLimit.js` | Resets on server restart. In a multi-instance deployment (Vercel, k8s), each instance has its own counter — an attacker can bypass by hitting different instances. Memory also leaks (Map never evicts old entries). | Replace with Redis-backed rate limiting (`@upstash/ratelimit` or `ioredis`). Add TTL-based eviction. |
| H2 | **No CSRF protection** | `app/api/[[...path]]/route.js` | POST endpoints rely on `SameSite=Lax` cookies only. Lax allows top-level navigations (form POST from external site). State-changing endpoints lack CSRF tokens. | Add CSRF token validation for all POST/PUT/DELETE, or switch cookies to `SameSite=Strict`. |
| H3 | **MongoDB injection via `$regex`** | `route.js` (L268) | Company domain search: `url: { $regex: domain, $options: 'i' }` — user-supplied `domain` is passed directly into a regex. An attacker can craft a ReDoS payload or inject regex operators. | Escape regex special characters with a utility function, or use exact-match queries. |
| H4 | **No input validation / sanitization framework** | Multiple files | URL inputs, brand names, scan parameters are accepted and stored without validation (no Zod, no sanitization). Potential for stored XSS if any field is rendered unsafely client-side. | Add Zod schemas for all API inputs. Sanitize HTML-like content before storage. |
| H5 | **Dev secret used as SESSION_SECRET fallback** | `lib/env.js` (L17) | Default `SESSION_SECRET` is `'provenance-dev-secret-CHANGE-IN-PRODUCTION'`. While it throws in production, the check is at boot time only — if the env var is set to any weak value, no strength check runs. | Enforce minimum length (32+ chars) and entropy check for SESSION_SECRET in production. |

### 🟡 Medium

| # | Finding | File | Detail | Remediation |
|---|---------|------|--------|-------------|
| M1 | **No account lockout / brute-force protection on login** | `route.js` (L417-L439) | Login endpoint has no per-account rate limiting. An attacker can try unlimited passwords for a target email. Global rate limit (500/min) is too high to prevent targeted brute force. | Add per-email rate limiting (e.g., 5 failed attempts → 15-min lockout). Log failed attempts. |
| M2 | **clearSessionCookie missing HttpOnly and Secure flags** | `lib/auth/session.js` (L71-L73) | The `clearSessionCookie()` function doesn't set `HttpOnly` or `Secure` flags on the clearing cookie. While the cookie value is empty, the inconsistency can confuse security scanners. | Add `HttpOnly` and `Secure` (in production) to the clearing cookie. |
| M3 | **API key shown in full once — no copy-to-clipboard safeguard** | `route.js` (L929-L937) | The raw API key is returned in the JSON response. If the response is logged (browser devtools, proxy, CDN logs), the key is exposed permanently. | Consider using a time-limited retrieval token, or display in a secure modal with explicit copy action. |
| M4 | **No audit logging on sensitive operations** | Entire API | No audit trail for: login, plan changes, API key creation/revocation, admin actions. ISO 27001 A.8.15 requires logging of privileged events. | Implement `lib/audit.js` → write to `COLLECTIONS.AUDIT_LOGS` for all sensitive actions. |
| M5 | **Password policy is minimal** | `route.js` (L381-L383) | Only checks `password.length < 8`. No complexity requirements (uppercase, numbers, symbols). | Enforce complexity: min 8 chars, at least 1 uppercase, 1 number, 1 special char. Consider checking against breached password lists (HaveIBeenPwned API). |

### 🟢 Low / Informational

| # | Finding | File | Detail |
|---|---------|------|--------|
| L1 | `X-Powered-By` header disabled ✅ | `next.config.js` (L21) | `poweredByHeader: false` — good. |
| L2 | CSP headers present ✅ | `next.config.js` (L6-L17) | CSP is set but uses `unsafe-inline` for scripts (required by Next.js). Consider nonce-based CSP in production. |
| L3 | HSTS present ✅ | `next.config.js` (L58) | `max-age=63072000; includeSubDomains` — good. Consider adding `preload`. |
| L4 | CORS origin is hardcoded | `next.config.js` (L62) | Uses env var with fallback. Verify wildcard `*` is never set in production. |
| L5 | Stripe webhook signature verified ✅ | `app/api/webhooks/stripe/route.js` | `stripe.webhooks.constructEvent` is used correctly. |

---

## 2. Penetration Testing Checklist (OWASP-aligned)

### A. Authentication Testing

| # | Test Case | How to Test | Status |
|---|-----------|-------------|--------|
| A1 | Brute-force login | Use Burp Intruder/Hydra against `POST /api?path=auth/login` with common password list for a known email | `[ ]` |
| A2 | Credential stuffing | Replay leaked credential pairs against login endpoint | `[ ]` |
| A3 | Session token tampering | Decode base64 session cookie, modify `role` to `owner` or `plan` to `enterprise`, re-encode, and replay | `[ ]` |
| A4 | Session fixation | Set a known session cookie before login, check if it persists post-authentication | `[ ]` |
| A5 | Session expiry enforcement | Wait past `SESSION_MAX_AGE` (7 days), verify the cookie is rejected | `[ ]` |
| A6 | Concurrent session handling | Login from two browsers, logout from one, verify the other is still valid (or invalidated if desired) | `[ ]` |
| A7 | Password reset flow | (Not yet implemented) Verify reset tokens are single-use, time-limited, and cryptographically random | `[ ]` |
| A8 | Account enumeration via signup | `POST /api?path=auth/signup` with existing email returns 409. Attacker can enumerate valid emails. | `[ ]` |
| A9 | Account enumeration via login | Login error message should not distinguish "email not found" vs "wrong password" | `[ ]` |
| A10 | Admin panel brute-force | `POST /api?path=admin/login` with `admin:admin` — verify this is not in production | `[ ]` |

### B. Authorization & Access Control Testing

| # | Test Case | How to Test | Status |
|---|-----------|-------------|--------|
| B1 | Horizontal privilege escalation | User A accesses User B's scans by guessing/enumerating scan IDs (UUID) | `[ ]` |
| B2 | Vertical privilege escalation | `viewer` role user attempts `write`/`delete` operations | `[ ]` |
| B3 | Plan limit bypass via cookie | Tamper session cookie `plan` field, attempt premium features (deep analysis, competitor scan) | `[ ]` |
| B4 | Plan upgrade without payment | `POST /api?path=auth/update-plan` with `{"plan": "enterprise"}` — this should not exist in production | `[ ]` |
| B5 | Admin cookie forgery | Set `provenance_admin=true` cookie manually, access `POST /api?path=admin/update-plans` | `[ ]` |
| B6 | IDOR on scan deletion | Attempt to delete another user's scheduled audit or API key by guessing the ID | `[ ]` |
| B7 | Scan limit bypass | Create scans rapidly and verify the monthly limit is correctly enforced (check race conditions) | `[ ]` |
| B8 | Site tracking limit bypass | Add companies beyond the plan's `sites` limit by sending concurrent requests | `[ ]` |

### C. Injection Testing

| # | Test Case | How to Test | Status |
|---|-----------|-------------|--------|
| C-I1 | NoSQL injection on login | Send `{"email": {"$gt": ""}, "password": {"$gt": ""}}` to login endpoint | `[ ]` |
| C-I2 | NoSQL injection via regex | Send crafted regex in `domain` parameter: `GET /api?path=companies&domain=.*` | `[ ]` |
| C-I3 | ReDoS via regex | Send catastrophic backtracking pattern in domain search: `(a+)+$` | `[ ]` |
| C-I4 | XSS via scan URL | Submit `javascript:alert(1)` or `<script>` tags as the `url` field in scan endpoints | `[ ]` |
| C-I5 | Stored XSS via brand name | Submit HTML/JS in `brandName` field of brand-visibility scan | `[ ]` |
| C-I6 | Server-Side Request Forgery (SSRF) | Submit internal URLs (`http://localhost`, `http://169.254.169.254`) as scan targets | `[ ]` |
| C-I7 | Header injection | Inject `\r\n` characters in URL parameters to split HTTP headers | `[ ]` |

### D. API Security Testing

| # | Test Case | How to Test | Status |
|---|-----------|-------------|--------|
| D1 | Unauthenticated access to protected endpoints | Call scan endpoints, companies, settings without a session cookie | `[ ]` |
| D2 | Mass data exposure | Verify GET list endpoints don't leak other users' data | `[ ]` |
| D3 | Excessive data exposure | Check that `passwordHash` is never returned in any API response | `[ ]` |
| D4 | Rate limit bypass | Send > 500 requests/min from a single IP, verify blocking | `[ ]` |
| D5 | Rate limit bypass via IP rotation | Test rate limiting behind a proxy (X-Forwarded-For spoofing) | `[ ]` |
| D6 | API key enumeration | Try to list/read other users' API keys | `[ ]` |
| D7 | Revoked API key usage | Use a revoked API key and verify it's rejected | `[ ]` |
| D8 | HTTP method fuzzing | Send PUT, PATCH, OPTIONS to endpoints that only expect GET/POST | `[ ]` |
| D9 | Large payload DoS | Send a 100MB JSON body to POST endpoints (2MB limit is in middleware) | `[ ]` |

### E. Session Management Testing

| # | Test Case | How to Test | Status |
|---|-----------|-------------|--------|
| E1 | Cookie flags audit | Verify `HttpOnly`, `Secure` (in prod), `SameSite=Lax/Strict`, `Path=/` | `[ ]` |
| E2 | Session invalidation on logout | After logout, replay the old session cookie | `[ ]` |
| E3 | Session invalidation on password change | (Not yet implemented) Change password → old sessions should be invalidated | `[ ]` |
| E4 | Cookie scope | Verify cookie is not set with too broad a domain (e.g., `.com`) | `[ ]` |

### F. Business Logic Testing

| # | Test Case | How to Test | Status |
|---|-----------|-------------|--------|
| F1 | Race condition on scan limits | Send 10 concurrent scan requests when only 1 scan remains in quota | `[ ]` |
| F2 | Stripe webhook replay | Replay a legitimate Stripe webhook event — verify idempotency | `[ ]` |
| F3 | Stripe webhook without signature | Send a fake Stripe event without a valid `stripe-signature` header | `[ ]` |
| F4 | Plan downgrade data handling | Downgrade from Agency to Free — verify premium data isn't deleted but features are locked | `[ ]` |
| F5 | Onboarding bypass replay | Set `isOnboarding: true` in scan request after already completing onboarding | `[ ]` |
| F6 | Negative number inputs | Send `{"scansPerMonth": -1}` via admin plan update | `[ ]` |

### G. Infrastructure & Transport Testing

| # | Test Case | How to Test | Status |
|---|-----------|-------------|--------|
| G1 | TLS configuration | Run `testssl.sh` or Qualys SSL Labs scan on production domain | `[ ]` |
| G2 | HTTP to HTTPS redirect | Access `http://` version and verify 308 redirect to `https://` | `[ ]` |
| G3 | Security headers | Run `securityheaders.com` scan. Verify CSP, HSTS, X-Frame-Options, X-Content-Type-Options | `[ ]` |
| G4 | Information disclosure | Check for stack traces, debug info in error responses (set `NODE_ENV=production`) | `[ ]` |
| G5 | MongoDB exposed | Verify MongoDB is not publicly accessible (check port 27017 firewall rules) | `[ ]` |
| G6 | `.env.local` exposure | Attempt to access `/.env.local` via the web server | `[ ]` |
| G7 | Source map exposure | Check if `.map` files are served in production | `[ ]` |

---

## 3. ISO 27001 Annex A — Application Security Controls

Mapped to **ISO 27001:2022 Annex A** controls relevant to application security.

### A.5 — Organizational Controls

| Control | Description | Status | Evidence / Gap |
|---------|-------------|--------|----------------|
| A.5.1 | Policies for information security | `[ ]` | Documented security policy for the application? |
| A.5.8 | Information security in project management | `[ ]` | Security reviews in sprint planning / PR reviews? |
| A.5.23 | Information security for use of cloud services | `[ ]` | MongoDB Atlas / Vercel security configuration documented? |
| A.5.29 | Information security during disruption | `[ ]` | Incident response plan for data breach? |
| A.5.34 | Privacy and PII protection | `[ ]` | GDPR/privacy compliance for user emails, scan data? |

### A.8 — Technological Controls

| Control | Description | Status | Evidence / Gap |
|---------|-------------|--------|----------------|
| A.8.1 | User endpoint devices | `[ ]` | N/A (SaaS — browser-based) |
| A.8.3 | Information access restriction | `[ ]` | RBAC implemented in `lib/auth/rbac.js` ✅. But not enforced on most endpoints ⚠️ |
| A.8.4 | Access to source code | `[ ]` | Source code access restricted to authorized developers? |
| A.8.5 | Secure authentication | `⚠️` | **Gap:** Session tokens are unsigned (C1). No MFA. No account lockout. |
| A.8.6 | Capacity management | `[ ]` | Rate limiting exists but is in-memory (H1). No horizontal scaling support. |
| A.8.7 | Protection against malware | `[ ]` | Dependency scanning (npm audit, Snyk)? |
| A.8.8 | Management of technical vulnerabilities | `[ ]` | Regular `npm audit` / Dependabot configured? |
| A.8.9 | Configuration management | `[ ]` | Infrastructure as code? Environment parity? |
| A.8.10 | Information deletion | `[ ]` | User account deletion / data export (GDPR Art. 17)? |
| A.8.12 | Data leakage prevention | `[ ]` | `passwordHash` excluded from API responses ✅. API key shown once ✅. |
| A.8.15 | Logging | `⚠️` | **Gap:** No audit logging on authentication, plan changes, admin actions (M4). |
| A.8.16 | Monitoring activities | `[ ]` | Application-level monitoring (error tracking, APM)? |
| A.8.24 | Use of cryptography | `✅/⚠️` | AES-256-GCM in `crypto.js` ✅. But session tokens are not cryptographically signed ⚠️. bcrypt 12 rounds ✅. |
| A.8.25 | Secure development life cycle | `[ ]` | Code review process? Security testing in CI/CD? |
| A.8.26 | Application security requirements | `⚠️` | Input validation framework missing (H4). |
| A.8.28 | Secure coding | `⚠️` | Several injection vectors identified (C-I1 through C-I7). |

---

## 4. Pre-Production Go-Live Gate

> **⛔ Do NOT deploy to production until all Critical items are resolved.** These represent exploitable vulnerabilities that can lead to complete account takeover and financial loss.

### Must-Fix Before Production

- [ ] **Replace base64 session tokens with signed JWT or iron-session** (C1, C3)
- [ ] **Remove or secure the admin panel** — env-based credentials, proper session (C2)
- [ ] **Remove `auth/update-plan` endpoint** — plan changes only via Stripe webhook (C4)
- [ ] **Add CSRF protection** to all state-changing endpoints (H2)
- [ ] **Replace in-memory rate limiter** with Redis-backed solution (H1)
- [ ] **Escape or remove regex in MongoDB queries** (H3)
- [ ] **Add Zod input validation** on all API endpoints (H4)

### Should-Fix Before Production

- [ ] Add per-account login brute-force protection (M1)
- [ ] Implement audit logging for sensitive operations (M4)
- [ ] Strengthen password policy (M5)
- [ ] Fix `clearSessionCookie` flag inconsistency (M2)
- [ ] Add `preload` to HSTS header (L3)
- [ ] Implement nonce-based CSP to remove `unsafe-inline` (L2)

### Recommended Security Tooling

| Category | Tool | Purpose |
|----------|------|---------|
| Dependency scanning | `npm audit`, Snyk, Socket | Known CVE detection |
| DAST scanner | OWASP ZAP, Burp Suite | Automated vulnerability scanning |
| SAST scanner | Semgrep, CodeQL | Static code analysis for injection, secrets |
| Secret scanning | Gitleaks, TruffleHog | Detect hardcoded secrets in code |
| Header analysis | securityheaders.com | Verify HTTP security headers |
| TLS testing | testssl.sh, SSL Labs | Certificate and cipher configuration |
| Penetration testing | Burp Suite Professional | Manual exploitation and verification |

---

> **⚠️ IMPORTANT:** This checklist should be reviewed and updated after each sprint. Schedule a full penetration test with a third-party security firm before public launch. Re-run automated scans (ZAP, npm audit) on every release.

---

*Generated: July 4, 2026 — Provenance Security Audit*
