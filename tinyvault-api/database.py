from typing import Generator

from sqlmodel import Session, SQLModel, create_engine

DATABASE_URL = "sqlite:///tinyvault.db"
engine = create_engine(DATABASE_URL, echo=True)


def create_db_and_tables() -> None:
    """Create database tables if they do not exist."""
    SQLModel.metadata.create_all(engine)


def get_session() -> Generator[Session, None, None]:
    """Yield a database session for FastAPI dependency injection."""
    with Session(engine) as session:
        yield session
