# W12 Session 1 – Rate Limiting + CORS Hardening + OWASP Audit

The app is live but I want to do a proper security review and fix the most obvious vulnerabilities. I'll go through the OWASP Top 10 and fix what applies to this project.

## Rate limiting with slowapi

Install `slowapi==0.1.9`. Add it to `requirements.txt`.

Set up rate limiting in `main.py`:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
```

Apply the default 60/minute limit globally by adding the middleware. Also apply a stricter limit on the email OTP endpoint specifically:
```python
@app.post("/auth/2fa/email/send")
@limiter.limit("3/minute")
async def send_email_otp(request: Request, ...):
```

And on the login endpoint:
```python
@app.post("/auth/login")
@limiter.limit("10/minute")
async def login(request: Request, ...):
```

Test it: send more than 10 login requests in a minute → should get `429 Too Many Requests`.

## CORS policy hardening

The current CORS config might be too permissive. Update it:

```python
ALLOWED_ORIGINS = [
    "http://localhost:5173",
    os.getenv("FRONTEND_URL", ""),
    "chrome-extension://your-extension-id-here",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o for o in ALLOWED_ORIGINS if o],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Device-Token"],
)
```

Never use `allow_origins=["*"]` – it lets any website make requests to your API with the user's credentials.

## OWASP Top 10 checklist

Go through these and note what applies and how it's handled (or not):

**A01 – Broken Access Control:** Are write endpoints protected with `get_current_user`? Is DELETE restricted to admin only? Check that `demo_viewer` can't create or delete. Test this in Swagger.

**A02 – Cryptographic Failures:** Are passwords hashed with bcrypt (not MD5/SHA1)? Are JWT secrets in env vars not hardcoded? Are device tokens stored as hashes not plaintext?

**A03 – Injection:** SQLModel uses parameterized queries via SQLAlchemy – raw SQL injection is not possible. Verify there's no `text()` with f-strings anywhere in the codebase.

**A05 – Security Misconfiguration:** Are stack traces exposed in error responses? The generic exception handler should return `{"error": "Internal server error"}` not the full traceback. Check with a deliberately malformed request.

**A07 – Identification and Authentication Failures:** Does the login endpoint limit attempts? (Rate limiting above handles this.) Are JWT tokens short-lived (60 min)? Are there no hardcoded credentials in source code?

**A09 – Security Logging and Monitoring:** The `SubscriptionAudit` table logs creates and updates. Is there any logging for failed login attempts? Add a simple `print()` or `logging.warning()` for failed auth at minimum.

## Input sanitization

Make sure all string inputs from users are stripped and length-checked before hitting the database. The Pydantic validators should handle this, but double-check that `service_name`, `category`, and `tags` all have sensible max lengths defined on the `Field()`.

Also make sure that the `note` field on `SubscriptionAudit` is capped (e.g. 500 chars) so a malicious update can't store arbitrary large strings.
