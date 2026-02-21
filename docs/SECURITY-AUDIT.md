# LLMeter — Security Audit Report
Date: 2026-02-21

## Summary
**Overall Security Score: B+** — Solid security foundation with AES-256-GCM encryption, comprehensive RLS policies, input validation via Zod, open redirect protection, and middleware hardening. A few medium-priority items remain.

---

## Findings

### Critical Issues
**None found.**

---

### High Priority

#### H1. Rate Limiting Not Applied to API Routes
- **Files:** `src/app/api/providers/route.ts`, `src/app/api/providers/[id]/route.ts`
- **Issue:** Rate limiter exists (`src/lib/rate-limit.ts`) but is only configured for magic link requests. API routes for creating/updating/deleting providers have no rate limiting. An authenticated attacker could spam these endpoints.
- **Recommendation:** Apply `checkRateLimit` to POST/PATCH/DELETE provider endpoints (e.g., 30 req/min per user).

#### H2. In-Memory Rate Limiter Won't Scale
- **File:** `src/lib/rate-limit.ts`
- **Issue:** Uses `Map` in memory. Serverless deployments (Vercel) create new instances per request — the rate limiter resets on every cold start, making it effectively useless.
- **Recommendation:** Replace with Upstash Redis rate limiter (`@upstash/ratelimit`) for production, or use Vercel's built-in WAF rate limiting.

---

### Medium Priority

#### M1. Error Messages May Leak Internal Details
- **Files:** API route error handlers
- **Issue:** `error.message` from Supabase errors is returned directly to the client. Some Supabase errors include table/column names.
- **Recommendation:** Return generic error messages in production; log detailed errors server-side.

#### M2. No CSRF Protection on State-Changing Endpoints
- **Files:** `src/app/api/providers/route.ts` (POST), `src/app/api/providers/[id]/route.ts` (PATCH/DELETE)
- **Issue:** Next.js API routes don't have built-in CSRF protection. Since auth uses cookies (Supabase SSR), a malicious site could forge requests.
- **Recommendation:** Add CSRF token validation or use `SameSite=Strict` cookies. Supabase SSR cookies default to `SameSite=Lax` which mitigates most CSRF but not all vectors.

#### M3. Missing Security Headers
- **File:** `next.config.ts` (or missing)
- **Issue:** No custom security headers configured (CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- **Recommendation:** Add `headers()` in next.config.ts with:
  - `Content-Security-Policy` (restrict script sources)
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

#### M4. Service Role Key Access Pattern
- **File:** `src/lib/supabase/admin.ts`
- **Issue:** Admin client with service role key is created on-demand. While the key is only server-side, any server-side code can call `createAdminClient()` and bypass RLS.
- **Recommendation:** Document which functions are authorized to use admin client. Consider adding an audit log for admin operations.

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
10. **Rate Limiter Exists** — Foundation for rate limiting is in place (needs scaling solution).

---

## Recommendations Summary

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| High | Apply rate limiting to API routes | Low | High |
| High | Switch to Redis-based rate limiter | Medium | High |
| Medium | Sanitize error messages | Low | Medium |
| Medium | Add security headers | Low | Medium |
| Medium | CSRF protection | Medium | Medium |
| Medium | Audit admin client usage | Low | Low |
| Low | API key rotation UI | Medium | Low |
| Low | Encryption key versioning | High | Low |
| Low | Custom 404 pages | Low | Low |

---

*Audited by Otto — 2026-02-21*
