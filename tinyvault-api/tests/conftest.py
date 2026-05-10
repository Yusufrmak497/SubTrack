"""
conftest.py — Shared pytest fixtures for tinyvault-api tests.

Uses an in-memory SQLite database to keep tests isolated from the real DB.
Each test gets a fresh DB and a fresh HTTP client.
"""

import pytest
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

# --- Override DB before importing the app ---
from database import get_session
import main as app_module


# ---------------------------------------------------------------------------
# In-memory engine factory
# ---------------------------------------------------------------------------

@pytest.fixture(name="engine", scope="function")
def engine_fixture():
    """Create a fresh in-memory SQLite engine per test."""
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
    """Provide a DB session bound to the in-memory engine."""
    with Session(engine) as session:
        yield session


@pytest.fixture(name="client", scope="function")
def client_fixture(engine):
    """
    Provide a FastAPI TestClient that overrides the DB dependency
    with the in-memory engine.
    """
    def get_session_override():
        with Session(engine) as session:
            yield session

    app_module.app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app_module.app, raise_server_exceptions=False)
    yield client
    app_module.app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

@pytest.fixture(name="seeded_user", scope="function")
def seeded_user_fixture(session):
    """Create and return a test user in the in-memory DB."""
    from models import User, Currency, UserPreference
    from auth import hash_password

    currency = Currency(code="USD", symbol="$")
    session.add(currency)
    session.commit()
    session.refresh(currency)

    user = User(
        username="test_user",
        email="test@tinyvault.local",
        hashed_password=hash_password("password123"),
        is_active=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)

    pref = UserPreference(user_id=user.id, theme="dark", currency_id=currency.id)
    session.add(pref)
    session.commit()

    return user


@pytest.fixture(name="auth_token", scope="function")
def auth_token_fixture(seeded_user):
    """Return a valid JWT token for the test user."""
    from auth import create_access_token
    return create_access_token({"sub": seeded_user.username})


@pytest.fixture(name="auth_headers", scope="function")
def auth_headers_fixture(auth_token):
    """Return Authorization headers dict."""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture(name="seeded_subscription", scope="function")
def seeded_subscription_fixture(session, seeded_user):
    """Create a test subscription and return it."""
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
