from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, Field


class SubscriptionCreate(BaseModel):
    """Request payload for creating a subscription."""

    service_name: str = Field(min_length=1, max_length=120)
    category: str = Field(min_length=1, max_length=50)
    billing_cycle: Literal["Monthly", "Yearly"]
    amount: float = Field(ge=0)
    next_payment_date: date
    is_active: bool = True


class SubscriptionUpdate(BaseModel):
    """Request payload for partially updating a subscription."""

    service_name: Optional[str] = Field(default=None, min_length=1, max_length=120)
    category: Optional[str] = Field(default=None, min_length=1, max_length=50)
    billing_cycle: Optional[Literal["Monthly", "Yearly"]] = None
    amount: Optional[float] = Field(default=None, ge=0)
    next_payment_date: Optional[date] = None
    is_active: Optional[bool] = None


class SubscriptionResponse(BaseModel):
    """API response model including computed helper fields."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    service_name: str
    category: str
    billing_cycle: str
    amount: float
    next_payment_date: date
    is_active: bool
    created_at: datetime
    estimated_monthly_amount: float
    days_until_payment: int
    upcoming_payment: bool


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
