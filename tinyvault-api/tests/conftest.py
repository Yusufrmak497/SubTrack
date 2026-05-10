"""
conftest.py — Shared pytest fixtures for tinyvault-api tests.

Uses an in-memory SQLite database to keep tests isolated from the real DB.
Each test gets a fresh DB and a fresh HTTP client.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from database import get_session
import main as app_module


# ---------------------------------------------------------------------------
# Engine / session / client
# ---------------------------------------------------------------------------

@pytest.fixture(name="engine", scope="function")
def engine_fixture():
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    yield engine
    SQLModel.metadata.drop_all(engine)


@pytest.fixture(name="session", scope="function")
def session_fixture(engine):
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client", scope="function")
def client_fixture(engine):
    def get_session_override():
        with Session(engine) as session:
            yield session

    app_module.app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app_module.app, raise_server_exceptions=False)
    yield client
    app_module.app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# User fixtures  (role="user" default, plus admin and viewer variants)
# ---------------------------------------------------------------------------

def _create_user(session, *, username, email, password, role="user", is_active=True):
    from models import User
    from auth import hash_password
    user = User(
        username=username,
        email=email,
        hashed_password=hash_password(password),
        is_active=is_active,
        role=role,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    return user


@pytest.fixture(name="seeded_user", scope="function")
def seeded_user_fixture(session):
    """Regular user (role='user')."""
    from models import Currency, UserPreference
    currency = Currency(code="USD", symbol="$")
    session.add(currency)
    session.commit()
    session.refresh(currency)

    user = _create_user(session, username="test_user", email="test@tinyvault.local",
                        password="password123", role="user")

    pref = UserPreference(user_id=user.id, theme="dark", currency_id=currency.id)
    session.add(pref)
    session.commit()
    return user


@pytest.fixture(name="seeded_admin", scope="function")
def seeded_admin_fixture(session):
    """Admin user (role='admin')."""
    return _create_user(session, username="admin_user", email="admin@tinyvault.local",
                        password="admin123", role="admin")


@pytest.fixture(name="seeded_viewer", scope="function")
def seeded_viewer_fixture(session):
    """Viewer user (role='viewer')."""
    return _create_user(session, username="viewer_user", email="viewer@tinyvault.local",
                        password="viewer123", role="viewer")


@pytest.fixture(name="seeded_inactive", scope="function")
def seeded_inactive_fixture(session):
    """Deactivated user."""
    return _create_user(session, username="inactive_user", email="inactive@tinyvault.local",
                        password="pass123", role="user", is_active=False)


# ---------------------------------------------------------------------------
# Token / header helpers
# ---------------------------------------------------------------------------

def _make_token(user):
    from auth import create_access_token
    return create_access_token({"sub": user.username, "role": user.role})


@pytest.fixture(name="auth_token")
def auth_token_fixture(seeded_user):
    return _make_token(seeded_user)


@pytest.fixture(name="auth_headers")
def auth_headers_fixture(auth_token):
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(name="admin_token")
def admin_token_fixture(seeded_admin):
    return _make_token(seeded_admin)


@pytest.fixture(name="admin_headers")
def admin_headers_fixture(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


@pytest.fixture(name="viewer_token")
def viewer_token_fixture(seeded_viewer):
    return _make_token(seeded_viewer)


@pytest.fixture(name="viewer_headers")
def viewer_headers_fixture(viewer_token):
    return {"Authorization": f"Bearer {viewer_token}"}


# ---------------------------------------------------------------------------
# Subscription fixture
# ---------------------------------------------------------------------------

@pytest.fixture(name="seeded_subscription", scope="function")
def seeded_subscription_fixture(session, seeded_user):
    from datetime import date, timedelta
    from models import Category, Subscription

    cat = Category(name="Entertainment", color_code="#f43f5e")
    session.add(cat)
    session.commit()
    session.refresh(cat)

    sub = Subscription(
        user_id=seeded_user.id,
        category_id=cat.id,
        service_name="Netflix",
        billing_cycle="Monthly",
        amount=15.99,
        next_payment_date=date.today() + timedelta(days=5),
        is_active=True,
    )
    session.add(sub)
    session.commit()
    session.refresh(sub)
    return sub
