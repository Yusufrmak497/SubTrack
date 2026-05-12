# W10 Session 1 – Email OTP + Device Trust Tokens

The 2FA system has TOTP, recovery codes, and security question. I want to add a 4th method: email OTP. When the user chooses this option on the 2FA screen, the backend sends a 6-digit code to their registered email address.

## Backend

Add `pyotp>=2.9.0` (already installed) and configure Gmail SMTP. Add to `.env`:
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=youremail@gmail.com
```

Use a Gmail App Password (not the regular password – generate one in Google Account → Security → App Passwords).

Create `tinyvault-api/email_service.py`:
```python
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

def send_otp_email(to_email: str, code: str, username: str) -> None:
    if not os.getenv("SMTP_USER") or not os.getenv("SMTP_PASSWORD"):
        raise RuntimeError("SMTP credentials not configured")
    
    msg = MIMEMultipart("alternative")
    msg["Subject"] = "SubTrack — Your verification code"
    msg["From"] = os.getenv("SMTP_FROM")
    msg["To"] = to_email
    
    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
      <h2 style="color:#4f46e5">SubTrack</h2>
      <p>Hi <strong>{username}</strong>,</p>
      <p>Your verification code (expires in 10 minutes):</p>
      <div style="font-size:2rem;font-weight:700;letter-spacing:0.3em;background:#e0e7ff;
                  border-radius:8px;padding:16px;text-align:center;margin:24px 0">{code}</div>
      <p style="color:#64748b;font-size:0.85rem">Never share this code with anyone.</p>
    </div>
    """
    msg.attach(MIMEText(html, "html"))
    
    with smtplib.SMTP(os.getenv("SMTP_HOST"), int(os.getenv("SMTP_PORT", "587"))) as server:
        server.ehlo()
        server.starttls()
        server.login(os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD"))
        server.sendmail(os.getenv("SMTP_FROM"), to_email, msg.as_string())
```

Add an `EmailOTPCode` table to `models.py`:
```python
class EmailOTPCode(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    code: str           # hashed
    expires_at: datetime
    used: bool = False
```

Add the endpoint `POST /auth/2fa/email/send` – rate limited to 3 requests/minute per IP using `slowapi`. Generates a random 6-digit code, hashes it, stores an `EmailOTPCode` row with `expires_at = now + 10 minutes`, then calls `send_otp_email()`. Returns `{"message": "Code sent"}`.

Add `POST /auth/2fa/verify` to handle all 2FA methods in one place. Accept `{method: "totp"|"recovery"|"question"|"email_otp", code: str, temp_token: str}`. Verify the temp token, then dispatch to the right verification logic based on `method`.

## Device trust tokens

When a user successfully completes 2FA, give them the option to "trust this device for 30 days". If they check this, generate a random `device_token` UUID, store it hashed on the User, and return it in the response.

On subsequent logins from the same device, the frontend sends `X-Device-Token: <token>` in the request header. If the header is present and the token matches (after unhashing), skip 2FA and issue the full JWT directly.

Add `device_token_hash: Optional[str]` and `device_token_expires: Optional[datetime]` to the `User` model.

Update `CORS` `allow_headers` to include `x-device-token`.
