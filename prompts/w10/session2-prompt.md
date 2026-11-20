# W10 Session 2 – Auth Frontend Polish + User Preferences

Wire up the email OTP method in the frontend and add user preferences (currency + theme) synced with the backend.

## TwoFactorModal update

The `TwoFactorModal.jsx` already has tabs for TOTP, Recovery, and Security Question. Add a 4th tab for Email OTP.

The Email OTP tab should have:
- A "Send Code" button that calls `POST /auth/2fa/email/send` with the temp token in the Authorization header
- Disable the button for 60 seconds after clicking to prevent spam (show a countdown)
- A 6-digit code input field
- A "Verify" button that calls `POST /auth/2fa/verify` with `{method: "email_otp", code: "...", temp_token: "..."}`

Also add a "Trust this device for 30 days" checkbox at the bottom of all 2FA tabs. If checked, the verify request includes `{trust_device: true}`. Store the returned `device_token` in `localStorage` as `deviceToken`.

On login, before sending the credentials, check if `localStorage.getItem('deviceToken')` exists and send it as `X-Device-Token` header. If the backend accepts it, you'll get a full token back immediately without the 2FA step.

## User preferences

The backend has `GET /auth/preferences` and `PATCH /auth/preferences`. After login, fetch the user's preferences and store them (preferred currency, theme).

Apply the stored theme on app load:
```js
const prefs = JSON.parse(localStorage.getItem('preferences') || '{}')
if (prefs.theme === 'dark') document.body.classList.add('dark')
```

When the dark mode toggle is clicked, also call `PATCH /auth/preferences` with `{theme: "dark"}` (or `"light"`) to persist it server-side.

The currency selector in `SummaryCards` should default to `prefs.preferred_currency` instead of always defaulting to USD. When the user changes it, call `PATCH /auth/preferences` with `{preferred_currency: "TRY"}`.

## Login page improvements

Add a "Show password" toggle (eye icon button) on the password input.

Add a small link below the form: "Forgot your 2FA device?" that explains recovery code usage.

Show the 4 OAuth buttons (Google, GitHub, GitLab, Discord) below the login form with a divider "or continue with".

After a successful OAuth login (from `OAuthCallback.jsx`), also fetch preferences and store them.

## Protected route

Create a `ProtectedRoute.jsx` component:
```jsx
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) return <Navigate to="/login" replace />
  return children
}
```

Wrap the `/app` route with it in `App.jsx`. Also wrap the admin dashboard route so only users with `role === "admin"` can access it.
