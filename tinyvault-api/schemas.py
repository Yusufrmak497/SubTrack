from datetime import date, datetime
from typing import Literal, Optional, List

from pydantic import BaseModel, ConfigDict, Field


class SubscriptionCreate(BaseModel):
    """Request payload for creating a subscription."""
    service_name: str = Field(min_length=1, max_length=120)
    # We keep category as a string for backward compatibility with frontend, 
    # but map it to Category entity under the hood in services.py
    category: str = Field(min_length=1, max_length=50)
    billing_cycle: Literal["Monthly", "Yearly"]
    amount: float = Field(ge=0)
    next_payment_date: date
    is_active: bool = True
    tags: Optional[List[str]] = Field(default_factory=list)


class SubscriptionUpdate(BaseModel):
    """Request payload for partially updating a subscription."""
    service_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    billing_cycle: Optional[Literal["Monthly", "Yearly"]] = None
    amount: Optional[float] = Field(default=None, ge=0)
    next_payment_date: Optional[date] = None
    is_active: Optional[bool] = None
    tags: Optional[List[str]] = None


class SubscriptionResponse(BaseModel):
    """API response model including computed helper fields and relation mappings."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    service_name: str
    category: str  # Dynamically mapped from relation
    billing_cycle: str
    amount: float
    next_payment_date: date
    is_active: bool
    created_at: datetime
    estimated_monthly_amount: float
    days_until_payment: int
    upcoming_payment: bool
    tags: List[str]  # Dynamically mapped from relation


class SummaryResponse(BaseModel):
    """Aggregated dashboard metrics for active subscriptions."""
    active_count: int
    estimated_monthly_total: float
    yearly_subscription_count: int
    upcoming_payments_next_7_days: int


class ConvertedSummaryResponse(BaseModel):
    """Monthly summary converted with an external FX rate."""
    base_currency: str
    target_currency: str
    rate: float = Field(gt=0)
    estimated_monthly_total_base: float
    estimated_monthly_total_converted: float
    active_count: int


class SubscriptionAuditResponse(BaseModel):
    """API response model for audit records linked to a subscription."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    subscription_id: int
    action: str
    note: Optional[str]
    created_at: datetime
