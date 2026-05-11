"""
TinyVault API - FastAPI + SQLModel backend with Robust 11-Entity Relational Schema

Run commands:
1) python3 -m venv venv
2) source venv/bin/activate
3) pip install -r requirements.txt
4) uvicorn main:app --reload
5) Open docs: http://127.0.0.1:8000/docs
"""

import os
import secrets
from dotenv import load_dotenv
load_dotenv()
from contextlib import asynccontextmanager
from datetime import date, timedelta, datetime
from typing import Literal, Optional

from fastapi import Depends, FastAPI, Query, Response, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from jose import JWTError, jwt
from slowapi import Limiter
from slowapi.middleware import SlowAPIMiddleware
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.middleware.sessions import SessionMiddleware
from sqlmodel import Session, func, select

from database import create_db_and_tables, engine, get_session
from models import Subscription, User, Category, Currency, PaymentMethod, Tag, UserPreference, RecoveryCode, SecurityQuestion, TrustedDevice
from schemas import (
    ConvertedSummaryResponse,
    SubscriptionAuditResponse,
    SummaryResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpdate,
    UserResponse,
    UserRoleUpdate,
    UserRegister,
    TOTPSetupResponse,
    TwoFactorVerifyRequest,
    RecoveryCodesResponse,
    SecurityQuestionSetup,
    TrustedDeviceResponse,
    PreferenceResponse,
    PreferenceUpdate,
)
from services import SubscriptionService
import secrets
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Header
from auth import SECRET_KEY, ALGORITHM, create_access_token, get_current_user_obj, require_admin, verify_password, hash_password, generate_totp_secret, get_provisioning_uri, verify_totp, generate_recovery_codes
from oauth import router as oauth_router


def _fix_demo_users() -> None:
    """Ensure all demo accounts exist with correct passwords and roles."""
    admin_pass = os.getenv("ADMIN_PASSWORD", "admin123")
    user_pass = os.getenv("DEMO_USER_PASSWORD", "user123")
    viewer_pass = os.getenv("DEMO_VIEWER_PASSWORD", "viewer123")

    accounts = [
        ("admin_rojhat", "rojhat@admin.local.com", admin_pass, "admin"),
        ("demo_user", "user@demo.local.com", user_pass, "user"),
        ("demo_viewer", "viewer@demo.local.com", viewer_pass, "viewer"),
    ]

    with Session(engine) as session:
        for username, email, password, role in accounts:
            user = session.exec(select(User).where(User.username == username)).first()
            if user:
                if not verify_password(password, user.hashed_password):
                    user.hashed_password = hash_password(password)
                user.role = role
                session.add(user)
            else:
                new_user = User(
                    username=username, email=email,
                    hashed_password=hash_password(password),
                    is_active=True, role=role,
                )
                session.add(new_user)
        session.commit()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hook for DB creation and complex 11-entity seeding."""
    create_db_and_tables()
    _seed_complex_entities()
    _fix_demo_users()
    yield


app = FastAPI(
    title="TinyVault Advanced API",
    version="2.0.0",
    description="Advanced Subscription tracker enforcing Pydantic validations, M:N relationships, and 11 distinct entities.",
    lifespan=lifespan,
)

app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET_KEY", SECRET_KEY))
app.include_router(oauth_router)

def _rate_limit_key(request: Request) -> str:
    """Use authenticated user identity for limits, fallback to IP."""
    auth_header = request.headers.get("Authorization", "")
    if auth_header.lower().startswith("bearer "):
        raw_token = auth_header.split(" ", 1)[1].strip()
        try:
            payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
            uid = payload.get("uid")
            if isinstance(uid, int):
                return f"user:{uid}"
            sub = payload.get("sub")
            if isinstance(sub, str) and sub.strip():
                return f"sub:{sub.strip().lower()}"
        except JWTError:
            pass

    query_token = request.query_params.get("token")
    if query_token:
        try:
            payload = jwt.decode(query_token, SECRET_KEY, algorithms=[ALGORITHM])
            uid = payload.get("uid")
            if isinstance(uid, int):
                return f"user:{uid}"
        except JWTError:
            pass

    return f"ip:{get_remote_address(request)}"


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    retry_after = getattr(exc, "retry_after", None)
    headers = {"Retry-After": str(int(retry_after))} if retry_after is not None else {}
    return JSONResponse(
        status_code=429,
        content={"error": "Rate limit exceeded. Please retry later."},
        headers=headers,
    )


# --- Rate Limiting (prevents brute-force and DDoS) ---
_default_rate = "600/minute" if os.getenv("ENVIRONMENT") == "test" else "60/minute"
limiter = Limiter(key_func=_rate_limit_key, default_limits=[_default_rate])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

# --- CORS (base origins + runtime-configurable via env) ---
ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
}

frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url:
    ALLOWED_ORIGINS.add(frontend_url)

for origin in os.getenv("CORS_ORIGINS", "").split(","):
    origin = origin.strip()
    if origin:
        ALLOWED_ORIGINS.add(origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(ALLOWED_ORIGINS),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

# --- Global Exception Handlers (no stack trace leakage) ---
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(status_code=exc.status_code, content={"error": exc.detail})

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"error": "Validation failed"})

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Production-safe: never expose internal error details
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


def _seed_complex_entities() -> None:
    """Deterministically seed the 11 entities to demonstrate M:N and robust schemas."""
    with Session(engine) as session:
        if session.exec(select(User)).first() is not None:
            return

        admin_pass = os.getenv("ADMIN_PASSWORD") or secrets.token_urlsafe(16)
        user_pass = os.getenv("DEMO_USER_PASSWORD") or secrets.token_urlsafe(16)
        viewer_pass = os.getenv("DEMO_VIEWER_PASSWORD") or secrets.token_urlsafe(16)

        # 1. Seed Currency
        usd = Currency(code="USD", symbol="$")
        session.add(usd)

        # 2. Seed Users
        admin_totp_secret = os.getenv("ADMIN_TEST_TOTP_SECRET")
        admin_user = User(
            username="admin_rojhat",
            email="rojhat@admin.local.com",
            hashed_password=hash_password(admin_pass),
            is_active=True,
            role="admin",
            totp_secret=admin_totp_secret,
            is_2fa_enabled=bool(admin_totp_secret),
        )
        regular_user = User(
            username="demo_user",
            email="user@demo.local.com",
            hashed_password=hash_password(user_pass),
            is_active=True,
            role="user",
        )
        viewer_user = User(
            username="demo_viewer",
            email="viewer@demo.local.com",
            hashed_password=hash_password(viewer_pass),
            is_active=True,
            role="viewer",
        )
        session.add_all([admin_user, regular_user, viewer_user])
        session.commit()
        session.refresh(admin_user)
        session.refresh(usd)

        # 3. User Preferences (1:1)
        pref = UserPreference(user_id=admin_user.id, theme="dark", currency_id=usd.id)
        session.add(pref)

        # 4. Payment Method
        cc = PaymentMethod(user_id=admin_user.id, provider="Visa", last_four="4242", expiry_date="12/28")
        session.add(cc)

        # 5. Categories
        cat_ent = Category(name="Entertainment", color_code="#f43f5e")
        cat_mus = Category(name="Music", color_code="#10b981")
        cat_pro = Category(name="Productivity", color_code="#3b82f6")
        cat_cld = Category(name="Cloud", color_code="#8b5cf6")
        cat_edu = Category(name="Education", color_code="#f59e0b")
        session.add_all([cat_ent, cat_mus, cat_pro, cat_cld, cat_edu])
        session.commit()
        
        # 6. Tags
        tag_fav = Tag(user_id=admin_user.id, name="favorite", color="#eab308")
        tag_wrk = Tag(user_id=admin_user.id, name="work", color="#3b82f6")
        session.add_all([tag_fav, tag_wrk])
        session.commit()

        # 7. Subscriptions (Linked to Categories, Payment, User, Tags)
        today = date.today()
        sub_netflix = Subscription(
            user_id=admin_user.id,
            category_id=cat_ent.id,
            payment_method_id=cc.id,
            service_name="Netflix",
            billing_cycle="Monthly",
            amount=15.99,
            next_payment_date=today + timedelta(days=3),
            tags=[tag_fav]
        )
        sub_spotify = Subscription(
            user_id=admin_user.id,
            category_id=cat_mus.id,
            payment_method_id=cc.id,
            service_name="Spotify",
            billing_cycle="Monthly",
            amount=9.99,
            next_payment_date=today + timedelta(days=5),
            tags=[tag_fav]
        )
        sub_notion = Subscription(
            user_id=admin_user.id,
            category_id=cat_pro.id,
            payment_method_id=cc.id,
            service_name="Notion",
            billing_cycle="Monthly",
            amount=8.00,
            next_payment_date=today + timedelta(days=9),
            tags=[tag_wrk]
        )
        
        session.add_all([sub_netflix, sub_spotify, sub_notion])
        session.commit()
        
        # 8 & 9 & 10. Audit, Reminders and Bills
        SubscriptionService._add_audit(session, sub_netflix.id, "CREATED", "System seeded Netflix")
        SubscriptionService._add_audit(session, sub_spotify.id, "CREATED", "System seeded Spotify")
        SubscriptionService._add_audit(session, sub_notion.id, "CREATED", "System seeded Notion")


@app.post("/auth/login", tags=["Auth"])
@limiter.limit("200/minute" if os.getenv("ENVIRONMENT") == "test" else "5/minute")
def login(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session), x_device_token: Optional[str] = Header(default=None)):
    user = session.exec(
        select(User).where(func.lower(User.username) == form_data.username.lower())
    ).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Hatalı kullanıcı adı veya şifre")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
        
    if x_device_token:
        for device in user.trusted_devices:
            if verify_password(x_device_token, device.hashed_token) and device.expires_at > datetime.utcnow():
                token = create_access_token({"sub": user.username, "uid": user.id, "role": user.role})
                return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}
        
    has_recovery_codes = len(user.recovery_codes) > 0
    has_security_question = user.security_question is not None

    if user.is_2fa_enabled or has_recovery_codes or has_security_question:
        temp_token = create_access_token({"sub": user.username, "uid": user.id, "type": "2fa_temp"})
        return {
            "requires_2fa": True, 
            "temp_token": temp_token,
            "methods": {
                "totp": user.is_2fa_enabled,
                "recovery_code": has_recovery_codes,
                "security_question": has_security_question,
                "question_text": user.security_question.question if has_security_question else None
            }
        }

    token = create_access_token({"sub": user.username, "uid": user.id, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}


@app.post("/auth/register", tags=["Auth"], response_model=UserResponse, status_code=201)
@limiter.limit("3/minute")
def register(request: Request, data: UserRegister, session: Session = Depends(get_session)):
    if session.exec(select(User).where(func.lower(User.username) == data.username.lower())).first():
        raise HTTPException(status_code=409, detail="Username already taken")
    if session.exec(select(User).where(func.lower(User.email) == data.email.lower())).first():
        raise HTTPException(status_code=409, detail="Email already registered")
    user = User(
        username=data.username.strip(),
        email=data.email.strip().lower(),
        hashed_password=hash_password(data.password),
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

    return user


@app.get("/auth/me", tags=["Auth"], response_model=UserResponse)
def me(current_user=Depends(get_current_user_obj)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active,
        is_2fa_enabled=current_user.is_2fa_enabled,
        has_recovery_codes=len(current_user.recovery_codes) > 0,
        has_security_question=current_user.security_question is not None,
        created_at=current_user.created_at,
    )


@app.get("/auth/preferences", tags=["Auth"], response_model=PreferenceResponse)
def get_preferences(session: Session = Depends(get_session), current_user: User = Depends(get_current_user_obj)):
    pref = session.exec(select(UserPreference).where(UserPreference.user_id == current_user.id)).first()
    currency_code = pref.currency_rel.code if pref and pref.currency_rel else "USD"
    return PreferenceResponse(currency=currency_code, theme=pref.theme if pref else "light")


@app.patch("/auth/preferences", tags=["Auth"], response_model=PreferenceResponse)
def update_preferences(data: PreferenceUpdate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user_obj)):
    pref = session.exec(select(UserPreference).where(UserPreference.user_id == current_user.id)).first()
    if not pref:
        pref = UserPreference(user_id=current_user.id)

    if data.currency is not None:
        currency = session.exec(select(Currency).where(Currency.code == data.currency)).first()
        if not currency:
            raise HTTPException(status_code=400, detail="Currency not found")
        pref.currency_id = currency.id

    if data.theme is not None:
        pref.theme = data.theme

    session.add(pref)
    session.commit()
    session.refresh(pref)

    currency_code = pref.currency_rel.code if pref.currency_rel else "USD"
    return PreferenceResponse(currency=currency_code, theme=pref.theme)


@app.post("/auth/2fa/setup", tags=["Auth"], response_model=TOTPSetupResponse)
def setup_2fa(session: Session = Depends(get_session), current_user: User = Depends(get_current_user_obj)):
    if current_user.is_2fa_enabled:
        raise HTTPException(status_code=400, detail="2FA is already enabled")
    
    secret = generate_totp_secret()
    current_user.totp_secret = secret
    session.add(current_user)
    session.commit()
    
    uri = get_provisioning_uri(secret, current_user.email)
    return TOTPSetupResponse(secret=secret, provisioning_uri=uri)

@app.post("/auth/2fa/recovery-codes/generate", tags=["Auth"], response_model=RecoveryCodesResponse)
def generate_codes(session: Session = Depends(get_session), current_user: User = Depends(get_current_user_obj)):
    if current_user.recovery_codes:
        for code in current_user.recovery_codes:
            session.delete(code)
    
    raw_codes = generate_recovery_codes()
    for code in raw_codes:
        hashed = hash_password(code)
        rc = RecoveryCode(user_id=current_user.id, hashed_code=hashed)
        session.add(rc)
    session.commit()
    return RecoveryCodesResponse(codes=raw_codes)

@app.post("/auth/2fa/security-question/setup", tags=["Auth"])
def setup_security_question(data: SecurityQuestionSetup, session: Session = Depends(get_session), current_user: User = Depends(get_current_user_obj)):
    if current_user.security_question:
        session.delete(current_user.security_question)
        
    sq = SecurityQuestion(
        user_id=current_user.id, 
        question=data.question, 
        hashed_answer=hash_password(data.answer.lower().strip())
    )
    session.add(sq)
    session.commit()
    return {"message": "Security question successfully setup"}

@app.delete("/auth/2fa/disable", tags=["Auth"])
def disable_2fa(session: Session = Depends(get_session), current_user: User = Depends(get_current_user_obj)):
    current_user.is_2fa_enabled = False
    current_user.totp_secret = None
    session.add(current_user)
    session.commit()
    return {"message": "2FA has been disabled"}

@app.post("/auth/2fa/verify", tags=["Auth"])
def verify_2fa(
    data: TwoFactorVerifyRequest, 
    request: Request,
    session: Session = Depends(get_session),
    authorization: Optional[str] = Header(default=None)
):
    from auth import SECRET_KEY, ALGORITHM, _resolve_user_from_jwt
    user = None
    
    if data.temp_token:
        try:
            payload = jwt.decode(data.temp_token, SECRET_KEY, algorithms=[ALGORITHM])
            if payload.get("type") != "2fa_temp":
                raise HTTPException(status_code=401, detail="Invalid token type")
            uid = payload.get("uid")
            user = session.get(User, uid)
        except JWTError:
            raise HTTPException(status_code=401, detail="Invalid temporary token")
    elif authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        user = _resolve_user_from_jwt(session, token)
        
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
        
    if data.method == "totp":
        if not user.totp_secret:
            raise HTTPException(status_code=400, detail="2FA is not set up")
        if not verify_totp(user.totp_secret, data.code):
            raise HTTPException(status_code=400, detail="Invalid 2FA code")
        if not user.is_2fa_enabled and not data.temp_token:
            user.is_2fa_enabled = True
            session.add(user)
            session.commit()
            return {"message": "2FA successfully enabled"}
            
    elif data.method == "recovery_code":
        valid = False
        for rc in user.recovery_codes:
            if not rc.is_used and verify_password(data.code, rc.hashed_code):
                rc.is_used = True
                session.add(rc)
                valid = True
                break
        if not valid:
            raise HTTPException(status_code=400, detail="Invalid or used recovery code")
        session.commit()
            
    elif data.method == "security_question":
        if not user.security_question:
            raise HTTPException(status_code=400, detail="Security question not set up")
        if not verify_password(data.code.lower().strip(), user.security_question.hashed_answer):
            raise HTTPException(status_code=400, detail="Incorrect answer")
            
    else:
        raise HTTPException(status_code=400, detail="Unknown method")
        
    device_token = None
    if data.remember_device:
        raw_token = secrets.token_hex(32)
        user_agent = request.headers.get("user-agent", "Unknown Device")[:255]
        expires = datetime.utcnow() + timedelta(days=30)
        td = TrustedDevice(
            user_id=user.id,
            hashed_token=hash_password(raw_token),
            device_name=user_agent,
            expires_at=expires
        )
        session.add(td)
        session.commit()
        device_token = raw_token
        
    if data.temp_token:
        token = create_access_token({"sub": user.username, "uid": user.id, "role": user.role})
        response_data = {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}
        if device_token:
            response_data["device_token"] = device_token
        return response_data
        
    return {"message": "Code verified"}


@app.get("/auth/devices", tags=["Auth"], response_model=list[TrustedDeviceResponse])
def get_trusted_devices(session: Session = Depends(get_session), current_user: User = Depends(get_current_user_obj)):
    return current_user.trusted_devices

@app.delete("/auth/devices/{device_id}", tags=["Auth"])
def revoke_device(device_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user_obj)):
    for device in current_user.trusted_devices:
        if device.id == device_id:
            session.delete(device)
            session.commit()
            return {"message": "Device revoked"}
    raise HTTPException(status_code=404, detail="Device not found")


# --- Admin Endpoints ---

@app.get("/admin/users", tags=["Admin"], response_model=list[UserResponse])
def admin_list_users(session: Session = Depends(get_session), _admin=Depends(require_admin)):
    return session.exec(select(User)).all()


@app.put("/admin/users/{user_id}/role", tags=["Admin"], response_model=UserResponse)
def admin_update_role(user_id: int, data: UserRoleUpdate, session: Session = Depends(get_session), _admin=Depends(require_admin)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = data.role
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@app.put("/admin/users/{user_id}/status", tags=["Admin"], response_model=UserResponse)
def admin_toggle_status(user_id: int, session: Session = Depends(get_session), _admin=Depends(require_admin)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to Advanced SubTrack API", "status": "Secure", "docs": "/docs"}


@app.get("/subscriptions", response_model=list[SubscriptionResponse], tags=["Subscriptions"])
def list_subscriptions(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    search: Optional[str] = Query(default=None, description="Search in service name"),
    active_only: bool = Query(default=False, description="Return only active subscriptions"),
    sort_by: Literal["service_name", "amount", "next_payment_date", "created_at"] = Query(default="service_name"),
    sort_order: Literal["asc", "desc"] = Query(default="asc", description="asc or desc"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> list[SubscriptionResponse]:
    return SubscriptionService.list_subscriptions(session, current_user.id, category, search, active_only, sort_by, sort_order, skip, limit)


@app.get("/subscriptions/summary/monthly-total", response_model=SummaryResponse, tags=["Subscriptions"])
def get_monthly_summary(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
) -> SummaryResponse:
    return SubscriptionService.get_summary(session, current_user.id)


@app.get("/subscriptions/summary/converted", response_model=ConvertedSummaryResponse, tags=["Subscriptions"])
@limiter.limit("200/minute" if os.getenv("ENVIRONMENT") == "test" else "20/minute")
async def get_converted_summary(
    request: Request,
    currency: Literal["USD", "TRY", "EUR"] = Query(default="TRY", description="Target currency"),
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
) -> ConvertedSummaryResponse:
    return await SubscriptionService.get_converted_summary(session, current_user.id, currency)


@app.get("/subscriptions/{subscription_id}", response_model=SubscriptionResponse, tags=["Subscriptions"])
def get_subscription(
    subscription_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
) -> SubscriptionResponse:
    return SubscriptionService.get_subscription(session, current_user.id, subscription_id)


@app.get("/subscriptions/{subscription_id}/audits", response_model=list[SubscriptionAuditResponse], tags=["Subscriptions"])
def get_subscription_audits(
    subscription_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
) -> list[SubscriptionAuditResponse]:
    return SubscriptionService.list_audits(session, current_user.id, subscription_id)


@app.post("/subscriptions", response_model=SubscriptionResponse, status_code=201, tags=["Subscriptions"])
def create_subscription(
    payload: SubscriptionCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
) -> SubscriptionResponse:
    return SubscriptionService.create_subscription(session, current_user.id, payload)


@app.put("/subscriptions/{subscription_id}", response_model=SubscriptionResponse, tags=["Subscriptions"])
def update_subscription(
    subscription_id: int,
    payload: SubscriptionUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
) -> SubscriptionResponse:
    return SubscriptionService.update_subscription(session, current_user.id, subscription_id, payload)


@app.delete("/subscriptions/{subscription_id}", status_code=204, tags=["Subscriptions"])
def delete_subscription(
    subscription_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
) -> Response:
    SubscriptionService.delete_subscription(session, current_user.id, subscription_id)
    return Response(status_code=204)


@app.get("/subscriptions/{subscription_id}/calendar", tags=["Subscriptions"], response_class=Response)
def get_subscription_calendar(
    subscription_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_obj),
) -> Response:
    sub = SubscriptionService.get_subscription(session, current_user.id, subscription_id)
    
    dtstart = sub.next_payment_date.strftime("%Y%m%d")
    dtend = (sub.next_payment_date + timedelta(days=1)).strftime("%Y%m%d")
        
    rrule = "FREQ=MONTHLY" if sub.billing_cycle == "Monthly" else "FREQ=YEARLY"
    uid = f"subtrack-{sub.id}-{dtstart}@tinyvault.local"
    nowstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//TinyVault//SubTrack//EN",
        "CALSCALE:GREGORIAN",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{nowstamp}",
        f"DTSTART;VALUE=DATE:{dtstart}",
        f"DTEND;VALUE=DATE:{dtend}",
        f"SUMMARY:Payment Due: {sub.service_name}",
        f"DESCRIPTION:TinyVault Reminder\\nService: {sub.service_name}\\nAmount: ${sub.amount:.2f}\\nCycle: {sub.billing_cycle}",
        f"RRULE:{rrule}",
        "END:VEVENT",
        "END:VCALENDAR"
    ]
    
    ics_content = "\r\n".join(lines) + "\r\n"
    safe_name = sub.service_name.lower().replace(" ", "-")
    headers = {"Content-Disposition": f'attachment; filename="{safe_name}-reminder.ics"'}
    
    return Response(content=ics_content, media_type="text/calendar", headers=headers)
