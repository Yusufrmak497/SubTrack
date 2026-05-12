import os
from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///database.db"
)
# Some platforms expose postgres://, SQLAlchemy expects postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, echo=True, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL, echo=True)


def migrate_db() -> None:
    """Add missing columns to existing tables without dropping data."""
    from sqlalchemy import text
    migrations = [
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS role VARCHAR DEFAULT 'user'",
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS totp_secret VARCHAR",
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS is_2fa_enabled BOOLEAN DEFAULT FALSE",
        "ALTER TABLE \"user\" ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE",
        "UPDATE \"user\" SET role = 'admin' WHERE username = 'admin_rojhat'",
        "UPDATE \"user\" SET role = 'viewer' WHERE username = 'demo_viewer'",
    ]
    with engine.connect() as conn:
        for sql in migrations:
            try:
                conn.execute(text(sql))
            except Exception:
                pass
        conn.commit()


def create_db_and_tables() -> None:
    """Create database tables if they do not exist."""
    migrate_db()
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependency injection."""
    with Session(engine) as session:
        yield session
