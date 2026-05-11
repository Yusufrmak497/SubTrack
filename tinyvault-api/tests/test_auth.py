"""
test_auth.py — Unit tests for auth.py

Tests:
    - verify_password (correct / incorrect)
    - hash_password (bcrypt output format, verify roundtrip)
    - create_access_token (payload, expiry)
    - get_current_user (valid token, missing sub, invalid token → 401)
"""

import pytest
from datetime import datetime, timedelta, timezone

from jose import jwt

from auth import (
    verify_password,
    hash_password,
    create_access_token,
    get_current_user,
    SECRET_KEY,
    ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from fastapi import HTTPException
from models import User


# -----------------------------------------------------------------------
# verify_password
# -----------------------------------------------------------------------

class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        hashed = hash_password("mySecret")
        assert verify_password("mySecret", hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("mySecret")
        assert verify_password("wrongPassword", hashed) is False

    def test_empty_password_vs_hashed_empty(self):
        hashed = hash_password("")
        assert verify_password("", hashed) is True

    def test_different_plain_passwords_not_interchangeable(self):
        hashed = hash_password("pass1")
        assert verify_password("pass2", hashed) is False


# -----------------------------------------------------------------------
# hash_password
# -----------------------------------------------------------------------

class TestHashPassword:
    def test_returns_string(self):
        result = hash_password("anyPassword")
        assert isinstance(result, str)

    def test_bcrypt_prefix(self):
        result = hash_password("test123")
        assert result.startswith("$2b$")

    def test_two_hashes_of_same_password_differ(self):
        """bcrypt uses random salt — two hashes should not be equal."""
        h1 = hash_password("same")
        h2 = hash_password("same")
        assert h1 != h2

    def test_hash_verify_roundtrip(self):
        plain = "roundTrip99!"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True


# -----------------------------------------------------------------------
# create_access_token
# -----------------------------------------------------------------------

class TestCreateAccessToken:
    def test_returns_string(self):
        token = create_access_token({"sub": "user1"})
        assert isinstance(token, str)

    def test_token_contains_sub(self):
        token = create_access_token({"sub": "alice"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["sub"] == "alice"

    def test_token_contains_expiry(self):
        before = datetime.utcnow()
        token = create_access_token({"sub": "bob"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = datetime.utcfromtimestamp(payload["exp"])
        # Expiry must be ~ACCESS_TOKEN_EXPIRE_MINUTES in the future
        assert exp > before
        assert exp <= before + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES + 1)

    def test_extra_fields_preserved(self):
        token = create_access_token({"sub": "user", "role": "admin"})
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        assert payload["role"] == "admin"

    def test_invalid_secret_fails_decode(self):
        token = create_access_token({"sub": "x"})
        with pytest.raises(Exception):
            jwt.decode(token, "wrong-secret", algorithms=[ALGORITHM])


# -----------------------------------------------------------------------
# get_current_user
# -----------------------------------------------------------------------

class TestGetCurrentUser:
    def test_valid_token_returns_username(self, session, engine):
        from models import User
        from sqlmodel import SQLModel
        SQLModel.metadata.create_all(engine)
        user = User(username="charlie", email="charlie@test.local",
                    hashed_password=hash_password("pass"), is_active=True, role="user")
        session.add(user)
        session.commit()
        session.refresh(user)
        token = create_access_token({"sub": user.username, "uid": user.id})
        result = get_current_user(bearer_token=token, session=session)
        assert result == "charlie"

    def test_invalid_token_raises_401(self, session):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(bearer_token="not.a.valid.token", session=session)
        assert exc_info.value.status_code == 401

    def test_token_missing_sub_raises_401(self, session):
        payload = {"exp": datetime.utcnow() + timedelta(minutes=30)}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(bearer_token=token, session=session)
        assert exc_info.value.status_code == 401

    def test_expired_token_raises_401(self, session):
        payload = {
            "sub": "expired_user",
            "exp": datetime.utcnow() - timedelta(minutes=1),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(bearer_token=token, session=session)
        assert exc_info.value.status_code == 401



# -----------------------------------------------------------------------
# _resolve_user_from_jwt — username fallback path
# -----------------------------------------------------------------------

class TestResolveUserFromJwt:
    """Tests for auth.py lines 73 and 76: username-based lookup fallback."""

    def test_token_with_sub_but_no_uid_resolves_by_username(self, session, engine):
        from auth import _resolve_user_from_jwt
        user = User(username="resolve_test", email="r@test.local",
                    hashed_password=hash_password("pass"), is_active=True, role="user")
        session.add(user)
        session.commit()
        # Token has sub but no uid field → falls through to username lookup (line 76)
        token = create_access_token({"sub": "resolve_test"})
        result = _resolve_user_from_jwt(session, token)
        assert result is not None
        assert result.username == "resolve_test"

    def test_token_with_no_sub_and_no_uid_returns_none(self, session):
        from auth import _resolve_user_from_jwt
        # Token has neither sub nor uid → line 73 returns None
        token = create_access_token({"role": "user"})
        result = _resolve_user_from_jwt(session, token)
        assert result is None

    def test_inactive_user_returns_none(self, session):
        from auth import _resolve_user_from_jwt
        user = User(username="inactive_resolve", email="ir@test.local",
                    hashed_password=hash_password("pass"), is_active=False, role="user")
        session.add(user)
        session.commit()
        token = create_access_token({"sub": "inactive_resolve"})
        result = _resolve_user_from_jwt(session, token)
        assert result is None
