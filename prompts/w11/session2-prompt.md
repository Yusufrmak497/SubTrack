# W11 Session 2 – Deploy Frontend + GitHub Actions CI/CD

The backend is live. Now deploy the frontend and set up automated testing with GitHub Actions.

## Frontend deployment (Netlify)

The frontend is a Vite React app so it just needs to build to static files.

Create `v2/tinyvault-frontend/netlify.toml`:
```toml
[build]
  base    = "v2/tinyvault-frontend"
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from   = "/*"
  to     = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options        = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy        = "strict-origin-when-cross-origin"
```

In Netlify's dashboard, add environment variable:
```
VITE_API_URL = https://your-railway-url.up.railway.app
```

After deploying, update the Railway backend's `FRONTEND_URL` env var to the Netlify URL so CORS works.

Also update all 4 OAuth provider apps to add the production frontend URL to allowed redirect URIs if needed.

## GitHub Actions CI/CD

Create `.github/workflows/ci.yml`. The pipeline should run on every push to `main` and `development` branches.

I need 3 jobs:

**Job 1: Backend tests**
- Use `ubuntu-latest`
- Spin up a PostgreSQL 16 service container
- Set up Python 3.12, install dependencies from `tinyvault-api/requirements.txt`
- Run `pytest --cov=. --cov-report=xml`
- Upload `coverage.xml` as an artifact

**Job 2: Frontend unit tests**
- Use `ubuntu-latest`
- Set up Node 22
- `npm ci` in `v2/tinyvault-frontend/`
- Run `npm run test:coverage`
- Upload coverage report as artifact

**Job 3: Playwright E2E tests** (runs after jobs 1 and 2 pass)
- Set up PostgreSQL service container
- Start the backend with `uvicorn main:app --port 8000 &` and wait for it to be ready
- Install Playwright browsers with `npx playwright install --with-deps chromium`
- Run `npx playwright test`
- Upload the Playwright HTML report as artifact (always, even on failure)

Add required environment variables in the workflow (not secrets for test values):
```yaml
env:
  DATABASE_URL: postgresql://testuser:testpass@localhost:5432/tinyvault_test
  JWT_SECRET_KEY: ci-test-secret
  ADMIN_PASSWORD: admin123
  DEMO_USER_PASSWORD: user123
  ADMIN_TEST_TOTP_SECRET: JBSWY3DPEHPK3PXP
  ENVIRONMENT: test
```

## Fix production issues

After deploying end-to-end, go through the app on the live URL and test:
- Login (JWT + each OAuth provider)
- Create/edit/delete a subscription
- 2FA verification (TOTP + email OTP)
- Currency conversion
- Calendar download
- Dark mode persistence

Common issues to watch for:
- Mixed content errors (frontend HTTPS → backend HTTP): make sure Railway serves over HTTPS
- CORS errors on OAuth callbacks: the redirect URI must exactly match what's in each provider's console
- Cookie/session issues: if using `SESSION_SECRET_KEY` for OAuth state, it must be set in Railway
