import pytest
from unittest.mock import patch, MagicMock
from database import create_db_and_tables, get_session
from main import app, lifespan, _seed_complex_entities
from fastapi import HTTPException
from sqlmodel import Session, select
from models import User

@pytest.mark.asyncio
async def test_lifespan_trigger():
    """Test the lifespan context manager calls DB setup and seeding."""
    mock_app = MagicMock()
    with patch("main.create_db_and_tables") as mock_create, \
         patch("main._seed_complex_entities") as mock_seed:
        async with lifespan(mock_app):
            mock_create.assert_called_once()
            mock_seed.assert_called_once()
            yield

def test_database_setup_coverage():
    """Call database setup functions to ensure coverage."""
    with patch("sqlmodel.SQLModel.metadata.create_all") as mock_create_all:
        create_db_and_tables()
        mock_create_all.assert_called_once()

    # Test get_session generator
    with patch("database.Session") as mock_session_class:
        gen = get_session()
        next(gen)
        mock_session_class.assert_called_once()

def test_seed_complex_entities_idempotency(session, engine):
    """Test seeding logic coverage, ensuring it handles existing data."""
    with patch("main.engine", engine):
        # First call - should seed
        _seed_complex_entities()
        
        # Check if user exists
        user = session.exec(select(User).where(User.username == "admin_rojhat")).first()
        assert user is not None
        
        # Second call - should skip (idempotency)
        _seed_complex_entities()

def test_generic_exception_handler(client, auth_headers):
    """Trigger the generic 500 exception handler."""
    # We force a 500 by patching a service to raise a naked Exception
    with patch("main.SubscriptionService.list_subscriptions", side_effect=Exception("Boom")):
        response = client.get("/subscriptions", headers=auth_headers)
        assert response.status_code == 500
        assert response.json()["error"] == "Internal server error"

def test_validation_exception_handler(client, auth_headers):
    """Trigger 422 validation handler."""
    # Send invalid JSON to a POST endpoint
    response = client.post(
        "/subscriptions",
        json={"amount": "invalid"}, # Missing required service_name
        headers=auth_headers
    )
    assert response.status_code == 422
    assert "error" in response.json()
