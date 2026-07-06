# 🛡️ Security Implementation — Changes Applied

This document records the security hardening implemented against
`docs/SECURITY_CHECKLIST.md`. It maps each finding to the code change, and lists
what was intentionally deferred (with the reason).

_Applied: 2026-07-04. Tooling constraint: only free security tooling was added._

---

## ✅ Implemented

### Critical

| ID | Fix | Files |
|----|-----|-------|
| **C1 / C3** | Session tokens are now **HMAC-SHA256 signed** (`payload.signature`) with an absolute `exp` expiry. Tampering with `id`/`role`/`plan` invalidates the signature and the session is rejected (constant-time compare). No new dependency — uses Node `crypto`. | `lib/auth/tokenSigner.js` (new), `lib/auth/session.js` |
| **C2** | Admin login moved to **env credentials** (`ADMIN_USERNAME` + bcrypt `ADMIN_PASSWORD_HASH`); no `admin:admin` fallback. The admin cookie is now a **signed, expiring token** instead of a forgeable `=true` boolean. Admin panel is disabled (503) when creds are unset. | `app/api/[[...path]]/route.js`, `lib/env.js` |
| **C4** | `auth/update-plan` (free self-upgrade) is **disabled in production** (returns 404). It remains in dev for the demo upgrade buttons; production plan changes flow only through verified Stripe webhooks. | `app/api/[[...path]]/route.js` |

### High

| ID | Fix | Files |
|----|-----|-------|
| **H1** | Rate limiter gained **TTL-based eviction** (no more unbounded memory growth) and documents the Redis path for multi-instance deploys. | `lib/rateLimit.js` |
| **H2** | **CSRF Origin verification** on all state-changing requests in middleware. Cross-origin `POST/PUT/PATCH/DELETE` are blocked; server-to-server callers (Stripe webhook, cron) send no Origin and are authenticated separately. | `lib/security/originCheck.js` (new), `middleware.js` |
| **H3** | User-supplied `domain` is **regex-escaped** before use in `$regex` Mongo queries, killing regex injection and ReDoS. | `lib/security/regex.js` (new), `app/api/[[...path]]/route.js` |
| **H4** | **Zod validation** on all state-changing endpoints (auth, scans, brand, companies, api-keys, scheduled audits, plan updates). | `lib/validation/schemas.js` (new), `app/api/[[...path]]/route.js` |
| **H5** | `SESSION_SECRET` **strength enforced** in production (≥32 chars, entropy check, no default). Removes the silent insecure-default fallback. | `lib/env.js` |

### Medium

| ID | Fix | Files |
|----|-----|-------|
| **M1** | **Per-account login brute-force lockout** (5 failed attempts / 15-min lockout, keyed by email+IP). | `lib/security/loginThrottle.js` (new), `app/api/[[...path]]/route.js` |
| **M2** | `clearSessionCookie()` now sets `HttpOnly` + `Secure` (prod), matching the set-cookie flags. | `lib/auth/session.js` |
| **M4** | **Audit logging** for login (success/failure/lockout), signup, logout, plan changes, API-key create/revoke, and all admin actions → `audit_logs`. | `lib/audit.js`, `app/api/[[...path]]/route.js` |
| **M5** | **Password complexity policy** (min 8, upper, lower, number, symbol) via Zod on signup. | `lib/validation/schemas.js` |

### Injection / SSRF / Transport

| ID | Fix | Files |
|----|-----|-------|
| **C-I1** | NoSQL operator injection on login/signup neutralised — Zod forces string `email`/`password`. | `lib/validation/schemas.js` |
| **C-I2 / C-I3** | Regex injection + ReDoS fixed via `escapeRegex`. | `lib/security/regex.js` |
| **C-I4 / C-I6** | **SSRF guard**: scan targets must be `http(s)` and must not resolve to loopback/private/link-local/cloud-metadata addresses (DNS-resolved). Applied at every scan endpoint and inside the shared fetcher. | `lib/security/ssrf.js` (new), `lib/scanners/shared/fetcher.js`, `app/api/[[...path]]/route.js` |
| **F6** | Admin plan updates reject **negative** numeric limits and unknown plan ids. | `app/api/[[...path]]/route.js` |
| **L3** | HSTS header gained `preload`. | `next.config.js` |
| **D1 (cron)** | The scheduled-audit cron endpoint now requires a `CRON_SECRET` (fails closed in production). | `app/api/[[...path]]/route.js`, `lib/env.js` |
| **D5 (bug)** | API-key rate-limit tier matched the wrong prefix (`prov_` vs minted `pvn_`); fixed. | `middleware.js` |

### Tooling (all free)

- **Dependabot** weekly npm + actions updates — `.github/dependabot.yml`
- **CI security workflow** (npm audit, Semgrep SAST, Gitleaks secret scan, CodeQL) — `.github/workflows/security.yml`
- **Gitleaks config** — `.gitleaks.toml`
- **`.env.example`** documenting all required secrets and how to generate them.

---

## ⚠️ Intentionally Deferred (with reason)

| ID | Item | Why deferred |
|----|------|--------------|
| **H1 (Redis)** | Distributed rate limiting | Requires provisioning an external store (e.g. Upstash) with credentials that aren't available in this environment. The interface is Redis-ready; eviction added as an interim mitigation. |
| **L2** | Nonce-based CSP (drop `unsafe-inline`) | Next.js 14's inline hydration + Framer Motion style attributes require a non-trivial nonce pipeline; high risk of breaking rendering. Documented as a production follow-up. |
| **A7 / E3** | Password-reset flow & session-invalidation-on-password-change | No reset flow exists yet; this is a feature to build, not a bug to patch. Session `exp` limits exposure in the meantime. |
| **MFA** (A.8.5) | Multi-factor auth | Net-new feature, out of scope for a hardening pass. |

---

## 🔧 Required operational steps before production

1. Set a strong **`SESSION_SECRET`** (≥32 chars): `openssl rand -base64 48`.
2. Set **`ENCRYPTION_MASTER_KEY`** (≥32 chars).
3. To enable the admin panel, set **`ADMIN_USERNAME`** and **`ADMIN_PASSWORD_HASH`**:
   `node -e "console.log(require('bcryptjs').hashSync(process.argv[1],12))" 'YourStrongPassword'`
4. Set **`CRON_SECRET`** and pass it as `Authorization: Bearer <secret>` from your scheduler.
5. Confirm **`CORS_ORIGINS`** lists only your real origins (never `*`).

> Note: because session tokens are now signed, all users are logged out once on
> deploy (old base64 cookies fail verification). This is expected.
