# W8 Session 2 – Auth Frontend + OAuth + 2FA

The backend now has JWT auth. This session wires it up in the frontend and adds OAuth social login and two-factor authentication.

## Frontend auth flow

Create `src/pages/LoginPage.jsx`. It should have a username and password field. On submit, `POST /auth/login` with `application/x-www-form-urlencoded` content type (because it uses `OAuth2PasswordRequestForm` on the backend). Store the returned token in `localStorage` and the username/role in component state (or a context).

After login, redirect to `/app`. Protect the `/app` route so unauthenticated users are redirected back to `/login`.

Pass the token in API calls with `Authorization: Bearer ${token}` header. If a request returns `401`, clear the token and redirect to `/login`.

Create a `Header.jsx` component that shows the username and a Logout button. Logout clears localStorage and redirects to `/login`.

## OAuth social login

Add 4 social login buttons to the login page: Google, GitHub, GitLab, Discord. Each button is just a link that navigates to the backend's OAuth start URL like `{API_URL}/auth/google`.

On the backend, you'll need to:
1. Install `authlib>=1.3.0` and `itsdangerous>=2.1.0`
2. Register the app in each provider's developer console and get client ID + secret
3. Add OAuth routes:
   - `GET /auth/google` → redirect to Google consent page
   - `GET /auth/google/callback` → exchange code for token, create/find the User, issue JWT, redirect to frontend `/oauth-callback?token=...`

Do the same for GitHub, GitLab, Discord.

Add OAuth credentials to `.env`:
```
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

Create `src/components/OAuthCallback.jsx` that reads the token from the URL query param, stores it in localStorage, and redirects to `/app`.

## 2FA (TOTP)

After login succeeds but before redirecting to `/app`, check if the user has 2FA enabled. If they do, show a verification screen asking for their TOTP code or another method.

**Backend 2FA endpoints:**

`POST /auth/2fa/setup/totp` – generates a TOTP secret for the user, returns a QR code image as base64 and the secret string. The user scans this in their authenticator app (Google Authenticator, Authy etc.).

`POST /auth/2fa/verify/totp` – accepts `{code: "123456"}`. Uses `pyotp` to verify the code against the stored secret. Add `pyotp>=2.9.0` to requirements. If correct, issue the full JWT and set `two_fa_enabled=True` on the user.

`POST /auth/login` should return `{"requires_2fa": true, "temp_token": "..."}` instead of the full token if the user has 2FA enabled. The temp token is short-lived (5 min) and can only be used to call the 2FA verify endpoint.

Add `two_fa_enabled: bool` and `totp_secret: Optional[str]` fields to the `User` model.

Also add recovery codes (10 random 8-char strings, hashed and stored) and a security question/answer option as fallback 2FA methods.

**Frontend:**

Create `src/components/TwoFactorModal.jsx`. After initial login returns `requires_2fa: true`, show this modal with tabs for TOTP, recovery code, and security question. On successful 2FA, store the full token and continue.
