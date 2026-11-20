import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER)


def send_otp_email(to_email: str, code: str, username: str) -> None:
    if not SMTP_USER or not SMTP_PASSWORD:
        raise RuntimeError("SMTP credentials not configured")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "SubTrack — Your verification code"
    msg["From"] = SMTP_FROM
    msg["To"] = to_email

    html = f"""
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8fafc;border-radius:12px">
      <h2 style="color:#0f766e;margin-bottom:8px">SubTrack</h2>
      <p>Hi <strong>{username}</strong>,</p>
      <p>Use the code below to verify your identity. It expires in <strong>10 minutes</strong>.</p>
      <div style="font-size:2.2rem;font-weight:700;letter-spacing:0.3em;color:#0f172a;background:#e2e8f0;border-radius:8px;padding:16px;text-align:center;margin:24px 0">
        {code}
      </div>
      <p style="color:#64748b;font-size:0.85rem">
        If you didn't request this code, you can safely ignore this email.
        Never share this code with anyone.
      </p>
    </div>
    """

    msg.attach(MIMEText(html, "html"))

    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as server:
        server.ehlo()
        server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, to_email, msg.as_string())
