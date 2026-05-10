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
    def test_valid_token_returns_username(self):
        token = create_access_token({"sub": "charlie"})
        result = get_current_user(token=token)
        assert result == "charlie"

    def test_invalid_token_raises_401(self):
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token="not.a.valid.token")
        assert exc_info.value.status_code == 401

    def test_token_missing_sub_raises_401(self):
        """A token without 'sub' claim should be rejected."""
        # Manually craft a token without 'sub'
        payload = {"exp": datetime.utcnow() + timedelta(minutes=30)}
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token)
        assert exc_info.value.status_code == 401

    def test_expired_token_raises_401(self):
        """A token past its expiry should be rejected."""
        payload = {
            "sub": "expired_user",
            "exp": datetime.utcnow() - timedelta(minutes=1),
        }
        token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)
        with pytest.raises(HTTPException) as exc_info:
            get_current_user(token=token)
        assert exc_info.value.status_code == 401
