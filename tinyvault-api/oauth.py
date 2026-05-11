import os
import secrets

from dotenv import load_dotenv
load_dotenv()

from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from sqlmodel import Session, select, func

from auth import create_access_token, hash_password
from database import get_session
from models import User, UserPreference, Currency

router = APIRouter(prefix="/auth", tags=["OAuth"])

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
BACKEND_URL = os.getenv("BACKEND_URL", "").rstrip("/")

oauth = OAuth()

oauth.register(
    name="google",
    client_id=os.getenv("GOOGLE_CLIENT_ID"),
    client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
    server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
    client_kwargs={"scope": "openid email profile"},
)

oauth.register(
    name="github",
    client_id=os.getenv("GITHUB_CLIENT_ID"),
    client_secret=os.getenv("GITHUB_CLIENT_SECRET"),
    access_token_url="https://github.com/login/oauth/access_token",
    authorize_url="https://github.com/login/oauth/authorize",
    api_base_url="https://api.github.com/",
    client_kwargs={"scope": "user:email"},
)

oauth.register(
    name="gitlab",
    client_id=os.getenv("GITLAB_CLIENT_ID"),
    client_secret=os.getenv("GITLAB_CLIENT_SECRET"),
    access_token_url="https://gitlab.com/oauth/token",
    authorize_url="https://gitlab.com/oauth/authorize",
    api_base_url="https://gitlab.com/api/v4/",
    client_kwargs={"scope": "read_user"},
)

oauth.register(
    name="discord",
    client_id=os.getenv("DISCORD_CLIENT_ID"),
    client_secret=os.getenv("DISCORD_CLIENT_SECRET"),
    access_token_url="https://discord.com/api/oauth2/token",
    authorize_url="https://discord.com/oauth2/authorize",
    api_base_url="https://discord.com/api/v10/",
    client_kwargs={"scope": "identify email"},
)

SUPPORTED_PROVIDERS = {"google", "github", "gitlab", "discord"}


@router.get("/{provider}/login")
async def oauth_login(provider: str, request: Request):
    if provider not in SUPPORTED_PROVIDERS:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=unsupported_provider")
    client = oauth.create_client(provider)
    if BACKEND_URL:
        redirect_uri = f"{BACKEND_URL}/auth/{provider}/callback"
    else:
        redirect_uri = str(request.url_for("oauth_callback", provider=provider))
    return await client.authorize_redirect(request, redirect_uri)


@router.get("/{provider}/callback", name="oauth_callback")
async def oauth_callback(provider: str, request: Request, session: Session = Depends(get_session)):
    if provider not in SUPPORTED_PROVIDERS:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=unsupported_provider")

    client = oauth.create_client(provider)

    try:
        token = await client.authorize_access_token(request)
    except OAuthError:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=oauth_failed")

    user_info = await _get_user_info(provider, client, token)
    if not user_info or not user_info.get("email"):
        return RedirectResponse(f"{FRONTEND_URL}/login?error=no_email")

    email = user_info["email"].lower().strip()
    name = user_info.get("name") or user_info.get("login") or ""

    user = session.exec(select(User).where(func.lower(User.email) == email)).first()

    if user is None:
        user = User(
            username=_unique_username(session, name, email),
            email=email,
            hashed_password=hash_password(secrets.token_hex(32)),
            is_active=True,
            role="user",
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        default_currency = session.exec(select(Currency).where(Currency.code == "USD")).first()
        if default_currency:
            pref = UserPreference(user_id=user.id, theme="light", currency_id=default_currency.id)
            session.add(pref)
            session.commit()

    if not user.is_active:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=account_disabled")

    jwt_token = create_access_token({"sub": user.username, "uid": user.id, "role": user.role})
    return RedirectResponse(
        f"{FRONTEND_URL}/auth/callback?token={jwt_token}&role={user.role}&username={user.username}"
    )


async def _get_user_info(provider: str, client, token: dict) -> dict:
    if provider == "google":
        return token.get("userinfo", {})

    if provider == "gitlab":
        resp = await client.get("user", token=token)
        data = resp.json()
        return {"email": data.get("email"), "name": data.get("name") or data.get("username")}

    if provider == "github":
        resp = await client.get("user", token=token)
        profile = resp.json()
        if not profile.get("email"):
            email_resp = await client.get("user/emails", token=token)
            primary = next(
                (e for e in email_resp.json() if e.get("primary") and e.get("verified")),
                None,
            )
            profile["email"] = primary["email"] if primary else None
        return profile

    if provider == "discord":
        resp = await client.get("users/@me", token=token)
        data = resp.json()
        return {"email": data.get("email"), "name": data.get("global_name") or data.get("username")}

    return {}


def _unique_username(session: Session, name: str, email: str) -> str:
    base = name.lower().replace(" ", "_") if name else email.split("@")[0]
    base = "".join(c for c in base if c.isalnum() or c == "_")[:20] or "user"
    username, counter = base, 1
    while session.exec(select(User).where(User.username == username)).first():
        username = f"{base}_{counter}"
        counter += 1
    return username
