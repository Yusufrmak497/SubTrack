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


def create_db_and_tables() -> None:
    """Create database tables if they do not exist."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependency injection."""
    with Session(engine) as session:
        yield session
