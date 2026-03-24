from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

import os

# PostgreSQL - running locally via Homebrew
# Format: postgresql://user:password@host:port/dbname
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://{os.getenv('USER', 'rojhat')}@localhost:5432/tinyvault"
)
engine = create_engine(DATABASE_URL, echo=True)


def create_db_and_tables() -> None:
    """Create database tables if they do not exist."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependency injection."""
    with Session(engine) as session:
        yield session
