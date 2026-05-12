# W12 Session 2 – SSH Keys, Security Headers + Final Hardening

This session covers SSH key-based access (relevant for VPS deployments), adding HTTP security headers to the frontend, and some final hardening steps before the project is fully production-ready.

## SSH key setup

Even though we're using Railway (which doesn't require direct SSH), understanding SSH keys is essential for any VPS work.

**Generate an SSH key pair:**
```bash
ssh-keygen -t ed25519 -C "yourname@subtrack" -f ~/.ssh/subtrack_deploy
```

This creates two files:
- `~/.ssh/subtrack_deploy` – private key (never share this, never commit it)
- `~/.ssh/subtrack_deploy.pub` – public key (safe to share)

**How it works:**
- The public key goes on the server (in `~/.ssh/authorized_keys`)
- The private key stays on your machine
- When you SSH in, the server challenges you with something only the private key can answer – no password needed

**For GitHub Actions deploys to a VPS** you'd:
1. Add the private key as a GitHub Secret: `SSH_PRIVATE_KEY`
2. In the workflow, write it to `~/.ssh/id_ed25519` before running `ssh` commands
3. Never print or log the private key

This is different from Railway/Netlify which handle deployments via Git push – no manual SSH needed there.

## Security headers on the Netlify frontend

The `netlify.toml` already has some headers. Make sure these are all present:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options           = "DENY"
    X-Content-Type-Options    = "nosniff"
    Referrer-Policy           = "strict-origin-when-cross-origin"
    Permissions-Policy        = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy   = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://your-railway-url.up.railway.app"
```

What each one does:
- `X-Frame-Options: DENY` – prevents the site being embedded in an iframe (clickjacking protection)
- `X-Content-Type-Options: nosniff` – browser won't try to guess file types (MIME sniffing attack protection)
- `Referrer-Policy` – limits what referrer info is sent to external sites
- `Permissions-Policy` – explicitly denies the app access to camera/mic/location since it doesn't need them
- `Content-Security-Policy` – whitelist of where resources can be loaded from (most effective XSS protection)

## Backend security headers

Add these response headers to the FastAPI app:

```python
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)
```

`Strict-Transport-Security` tells browsers to always use HTTPS for this domain for the next year.

## Final security checklist

Before calling the project done, verify:
- [ ] No credentials, secrets or API keys in the Git history (run `git log --all -S "password"` to check)
- [ ] `.env` is in `.gitignore` and was never committed
- [ ] All admin routes require role `"admin"` not just `"user"`
- [ ] JWT secret in production is a long random string (not `tinyvault-secret-key-2026`)
- [ ] SMTP password in production is an App Password, not the Google account password
- [ ] Rate limiting is active (test by sending 15 rapid login requests → should see 429)
- [ ] CORS does not allow `*` origins
- [ ] Error responses never include Python tracebacks
- [ ] All OAuth redirect URIs point to the production URL, not localhost
