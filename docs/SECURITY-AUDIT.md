# LLMeter — Security Audit Report
Date: 2026-02-21 (Updated: 2026-02-21)

## Summary
**Overall Security Score: A-** — Strong security posture with AES-256-GCM encryption, comprehensive RLS policies, input validation via Zod, open redirect protection, middleware hardening, rate limiting on all API routes, sanitized error messages, and full security headers. Remaining items are medium/low priority.

---

## Findings

### Critical Issues
**None found.**

---

### High Priority

#### H1. ~~Rate Limiting Not Applied to API Routes~~ ✅ RESOLVED
- **Status:** Fixed in commits `f66491c` and `0e9c8c5`
- **Resolution:** `checkRateLimit` (30 req/min per user) applied to POST, PATCH, and DELETE provider endpoints.

#### H2. In-Memory Rate Limiter Won't Scale
- **File:** `src/lib/rate-limit.ts`
- **Issue:** Uses `Map` in memory. Serverless deployments (Vercel) create new instances per request — the rate limiter resets on every cold start, making it effectively useless.
- **Recommendation:** Replace with Upstash Redis rate limiter (`@upstash/ratelimit`) for production, or use Vercel's built-in WAF rate limiting.

---

### Medium Priority

#### M1. ~~Error Messages May Leak Internal Details~~ ✅ RESOLVED
- **Status:** Fixed in commit `3e86c9f`
- **Resolution:** All API routes now return generic error messages to clients. Detailed errors logged server-side via `console.error`.

#### M2. ~~No CSRF Protection on State-Changing Endpoints~~ ✅ RESOLVED
- **Status:** Fixed — custom header check (`X-Requested-With: LLMeter`) added to all state-changing endpoints (POST, PATCH, DELETE).
- **Resolution:** `verifyCsrfHeader()` in `src/lib/security.ts` validates the header. Frontend API client (`src/lib/api-client.ts`) automatically includes it. Browsers block cross-origin custom headers without CORS preflight, preventing CSRF attacks.

#### M3. ~~Missing Security Headers~~ ✅ RESOLVED
- **Status:** Already implemented in `next.config.ts`
- **Resolution:** Security headers configured: X-Frame-Options (DENY), X-Content-Type-Options (nosniff), Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control, Strict-Transport-Security (HSTS).

#### M4. ~~Service Role Key Access Pattern~~ ✅ RESOLVED
- **Status:** Fixed — `createAdminClient()` now requires a `caller` identifier for audit logging.
- **Resolution:** Authorized callers documented in `src/lib/supabase/admin.ts`. Each call logs caller identity and timestamp. Calls without a caller emit a warning. Authorized callers: `inngest:sync-provider-usage`, `inngest:process-usage-events`, `inngest:check-budget-alerts`, `email:send-alert`.

---

### Low Priority

#### L1. No API Key Rotation Mechanism
- **Issue:** Once a user stores an API key, there's no way to rotate it without disconnecting and reconnecting. The PATCH endpoint supports re-keying, but no UI flow exists.
- **Recommendation:** Add a "Rotate Key" button in the providers UI.

#### L2. Encryption Key Rotation
- **File:** `src/lib/crypto.ts`
- **Issue:** `ENCRYPTION_SECRET` is a single env var. If compromised, all stored API keys are exposed. No key rotation mechanism exists.
- **Recommendation:** Implement versioned encryption keys (e.g., `ENCRYPTION_SECRET_V1`, `V2`) with gradual re-encryption.

#### L3. Missing `not-found.tsx` Pages
- **Issue:** No custom 404 pages. Default Next.js 404 may leak route structure.
- **Recommendation:** Add `not-found.tsx` at root and dashboard levels.

---

## Positive Findings (What's Done Well)

1. **AES-256-GCM Encryption** — API keys encrypted with unique salt + IV per record. Uses `scrypt` for key derivation. Authentication tags prevent tampering.
2. **Row Level Security (RLS)** — All 6 tables have RLS enabled with proper policies. Users can only access their own data.
3. **Zod Validation** — All API inputs validated with Zod schemas. `safeParse` used correctly.
4. **JSON Parse Protection** — `request.json()` wrapped in try-catch on all routes.
5. **Open Redirect Prevention** — `safeRedirect()` validates redirect URLs thoroughly (protocol-relative, backslash, userinfo, colon attacks).
6. **Middleware Hardening** — Static file bypass uses explicit extension allowlist (not `pathname.includes('.')`).
7. **Auth via `getUser()`** — Middleware uses `getUser()` instead of `getSession()` (server-validated, not JWT-only).
8. **Unique Constraints** — One provider per type per user prevents duplicate entries.
9. **Inngest Functions** — Fully implemented with error handling, status tracking, and retry configuration.
10. **Rate Limiting** — Applied to all state-changing API routes (30 req/min per user).
11. **Error Sanitization** — Generic error messages returned to clients; detailed errors logged server-side.
12. **Security Headers** — Full suite configured: HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy.

---

## Recommendations Summary

| Priority | Issue | Status | Effort | Impact |
|----------|-------|--------|--------|--------|
| ~~High~~ | ~~Apply rate limiting to API routes~~ | ✅ Done | Low | High |
| High | Switch to Redis-based rate limiter | ⏳ Open | Medium | High |
| ~~Medium~~ | ~~Sanitize error messages~~ | ✅ Done | Low | Medium |
| ~~Medium~~ | ~~Add security headers~~ | ✅ Done | Low | Medium |
| ~~Medium~~ | ~~CSRF protection~~ | ✅ Done | Medium | Medium |
| ~~Medium~~ | ~~Audit admin client usage~~ | ✅ Done | Low | Low |
| Low | API key rotation UI | ⏳ Open | Medium | Low |
| Low | Encryption key versioning | ⏳ Open | High | Low |
| Low | Custom 404 pages | ⏳ Open | Low | Low |

---

*Audited by Otto — 2026-02-21*
