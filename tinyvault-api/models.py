from datetime import date, datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class Subscription(SQLModel, table=True):
    """Database model representing one digital subscription."""

    id: Optional[int] = Field(default=None, primary_key=True)
    service_name: str = Field(index=True, min_length=1, max_length=120)
    category: str = Field(index=True, min_length=1, max_length=50)
    billing_cycle: str = Field(min_length=1, max_length=20)
    amount: float = Field(ge=0)
    next_payment_date: date
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
