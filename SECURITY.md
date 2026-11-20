# SECURITY.md

## TinyVault Security Posture (W12)

This document summarizes what is implemented in code and what must be configured at deployment/operator level.

## 1) Implemented in Code

### Backend (`tinyvault-api`)
- JWT authentication (`/auth/register`, `/auth/login`, `/auth/me`)
- Password hashing with bcrypt (`passlib`)
- Multi-user data isolation (`current_user.id` scope in service layer)
- Pydantic validation and typed `422` responses
- Global sanitized exception handling (no stack-trace leakage)
- CORS allowlist (`localhost:5173`, configured origins, Chrome extension pattern)
- Rate limiting (`slowapi`):
  - Default limit: `60/minute`
  - Login endpoint: `5/minute`
  - FX conversion endpoint: `20/minute`
  - Key strategy: JWT user key first, IP fallback

### Frontend (`v2/tinyvault-frontend`)
- Security headers in `vercel.json`:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
  - `Permissions-Policy`
- Edge middleware (`middleware.js`):
  - Injects `x-request-id`
  - Denies `/admin/*` access without `bb_session` cookie

## 2) Operator-Level W12 Checklist

These are not pure code changes; they must be configured in cloud dashboards:

### Vercel
- Enable deployment/preview protection for non-production branches
- Add and publish at least one WAF rate-limit rule
- Enable bot protection defaults

### Railway / Database
- Prefer private networking for database access
- Disable public DB exposure where possible
- Store secrets only in platform secret manager
- Perform periodic secret rotation drill

### GitHub
- Enable Dependabot security updates
- Keep lockfiles versioned and up to date

## 3) Verification Guide

### Backend security behavior
1. Trigger `POST /auth/login` repeatedly to observe `429` after limit.
2. Call `GET /subscriptions/summary/converted` repeatedly to observe stricter limit.
3. Send invalid payload (`amount: -5`) to verify `422`.
4. Access unknown resource (`/subscriptions/999999`) to verify `404` without leakage.

### Frontend/deployment behavior
1. Deploy frontend to Vercel.
2. Check response headers in browser devtools network tab.
3. Open `/admin/demo` without cookie and verify middleware `401`.

