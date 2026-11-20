# W11 Session 1 – Deploy Backend to Railway + PostgreSQL

Time to deploy. This session puts the backend live on Railway with a managed PostgreSQL database.

## Railway setup

1. Go to railway.app and create a new project
2. Add a **PostgreSQL** service to the project – Railway provisions the database and gives you a `DATABASE_URL` environment variable automatically
3. Create a second service and connect it to the GitHub repo. Set the root directory to `tinyvault-api/`

Railway detects it's a Python app. Make sure there's a `Procfile` in `tinyvault-api/`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

Or configure the start command in Railway's settings: `uvicorn main:app --host 0.0.0.0 --port $PORT`.

## Environment variables on Railway

Set these in Railway's Variables tab for the backend service:

```
DATABASE_URL         = (auto-provided by the PostgreSQL service)
JWT_SECRET_KEY       = (generate a long random string, not the dev one)
SESSION_SECRET_KEY   = (another long random string)
ADMIN_PASSWORD       = (set a real password, not admin123)
DEMO_USER_PASSWORD   = (set a real password)
DEMO_VIEWER_PASSWORD = (set a real password)
ADMIN_TEST_TOTP_SECRET = JBSWY3DPEHPK3PXP
ENVIRONMENT          = production
SMTP_HOST            = smtp.gmail.com
SMTP_PORT            = 587
SMTP_USER            = (gmail address)
SMTP_PASSWORD        = (gmail app password)
SMTP_FROM            = (gmail address)
GOOGLE_CLIENT_ID     = (from google console)
GOOGLE_CLIENT_SECRET = (from google console)
GITHUB_CLIENT_ID     = (from github oauth app)
GITHUB_CLIENT_SECRET = (from github oauth app)
```

## CORS update for production

The backend's `allow_origins` list currently only has `localhost:5173`. I need to add the Netlify/Vercel production URL once the frontend is deployed. For now, also add `*` temporarily or add the Railway backend's own URL.

Actually set a `FRONTEND_URL` environment variable and read it in `main.py`:
```python
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
allow_origins = [
    "http://localhost:5173",
    FRONTEND_URL,
]
```

## OAuth redirect URIs

After deploying, the backend URL changes from `localhost:8000` to something like `https://subtrack-production.up.railway.app`. Update the OAuth callback URLs in each provider's developer console to point to the production URL.

For example in Google Console: add `https://subtrack-production.up.railway.app/auth/google/callback` to Authorized redirect URIs.

## Verify the deployment

After Railway finishes building:
- `GET https://your-railway-url.up.railway.app/` should return the health check JSON
- Open `/docs` on the production URL to test all endpoints via Swagger
- Check Railway logs if there are any startup errors (most common: missing env var, DB connection string format)
- Make sure the seed data was created (the startup seeder should run on first boot)
