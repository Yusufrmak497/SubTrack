import os
from typing import Generator

from sqlalchemy import inspect
from sqlmodel import Session, SQLModel, create_engine

# Uses Railway/production DATABASE_URL when present.
# Falls back to local SQLite for zero-config development.
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./tinyvault.db",
)

# Some platforms expose postgres://, SQLAlchemy expects postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, echo=True, connect_args=connect_args)


def _is_sqlite() -> bool:
    return DATABASE_URL.startswith("sqlite")


def _needs_legacy_sqlite_reset() -> bool:
    """
    Detect pre-W11 local SQLite schema.
    Old schema did not have `subscription.user_id`, which breaks user isolation.
    """
    if not _is_sqlite():
        return False

    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "subscription" not in table_names:
        return False

    columns = {col["name"] for col in inspector.get_columns("subscription")}
    return "user_id" not in columns


def create_db_and_tables() -> None:
    """
    Create database tables if they do not exist.
    For legacy local SQLite schemas (pre-W11), recreate tables once to apply
    user-isolation fields required by auth.
    """
    SQLModel.metadata.create_all(engine)

    if _needs_legacy_sqlite_reset():
        SQLModel.metadata.drop_all(engine)
        SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependency injection."""
    with Session(engine) as session:
        yield session
