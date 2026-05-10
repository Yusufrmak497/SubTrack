import os
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from database import get_session

_raw_secret = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
if not _raw_secret:
    _raw_secret = secrets.token_urlsafe(32)
SECRET_KEY = _raw_secret

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def _resolve_user_from_jwt(session, raw_token: str):
    """Decode JWT and return the matching active User, or None."""
    from models import User

    try:
        payload = jwt.decode(raw_token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

    uid = payload.get("uid")
    if isinstance(uid, int):
        user = session.get(User, uid)
    else:
        username = payload.get("sub")
        if not username:
            return None
        user = session.exec(select(User).where(User.username == username)).first()

    if user is None or not user.is_active:
        return None
    return user


def get_current_user(
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
) -> str:
    user = get_current_user_obj(bearer_token=bearer_token, session=session)
    return user.username


def get_current_user_obj(
    bearer_token: Optional[str] = Depends(oauth2_scheme),
    session: Session = Depends(get_session),
):
    """Returns the full User object (testable via injected session)."""
    if bearer_token:
        user = _resolve_user_from_jwt(session, bearer_token)
        if user is not None:
            return user

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def require_admin(user=Depends(get_current_user_obj)):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user
