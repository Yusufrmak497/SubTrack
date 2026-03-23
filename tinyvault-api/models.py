from datetime import date, datetime
from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    """Represents a system user for authentication and robustness."""
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True, unique=True, min_length=3, max_length=50)
    email: str = Field(unique=True, index=True)
    hashed_password: str
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    preference: Optional["UserPreference"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    payment_methods: List["PaymentMethod"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    subscriptions: List["Subscription"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    tags: List["Tag"] = Relationship(
        back_populates="user", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )


class Currency(SQLModel, table=True):
    """Lookup table for supported currencies."""
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(min_length=3, max_length=3, unique=True, index=True)
    symbol: str = Field(max_length=5)
    
    preferences: List["UserPreference"] = Relationship(back_populates="currency_rel")


class UserPreference(SQLModel, table=True):
    """1:1 Extension table for User settings."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True, index=True)
    theme: str = Field(default="light")
    currency_id: Optional[int] = Field(default=None, foreign_key="currency.id")
    email_notifications: bool = Field(default=True)
    
    user: Optional[User] = Relationship(back_populates="preference")
    currency_rel: Optional[Currency] = Relationship(back_populates="preferences")


class Category(SQLModel, table=True):
    """Category classification (1:N with Subscription)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(index=True, unique=True, min_length=1, max_length=50)
    color_code: str = Field(default="#000000", max_length=7)
    
    subscriptions: List["Subscription"] = Relationship(back_populates="category_rel")


class PaymentMethod(SQLModel, table=True):
    """Payment methods (Credit Cards, PayPal)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    provider: str = Field(min_length=1, max_length=50)
    last_four: str = Field(min_length=4, max_length=4)
    expiry_date: str = Field(min_length=5, max_length=5)
    
    user: Optional[User] = Relationship(back_populates="payment_methods")
    subscriptions: List["Subscription"] = Relationship(back_populates="payment_method_rel")


class SubscriptionTagLink(SQLModel, table=True):
    """M:N Intermediary joining Subscriptions and Tags."""
    subscription_id: Optional[int] = Field(default=None, foreign_key="subscription.id", primary_key=True)
    tag_id: Optional[int] = Field(default=None, foreign_key="tag.id", primary_key=True)


class Tag(SQLModel, table=True):
    """Custom tags created by users (M:N with Subscription)."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", index=True)
    name: str = Field(index=True, min_length=1, max_length=30)
    color: str = Field(default="#4f46e5", max_length=7)
    
    user: Optional[User] = Relationship(back_populates="tags")
    subscriptions: List["Subscription"] = Relationship(back_populates="tags", link_model=SubscriptionTagLink)


class Subscription(SQLModel, table=True):
    """Core Subscription entity."""
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: Optional[int] = Field(default=None, foreign_key="user.id", index=True)
    category_id: Optional[int] = Field(default=None, foreign_key="category.id", index=True)
    payment_method_id: Optional[int] = Field(default=None, foreign_key="paymentmethod.id")
    
    service_name: str = Field(index=True, min_length=1, max_length=120)
    billing_cycle: str = Field(min_length=1, max_length=20)
    amount: float = Field(ge=0)
    next_payment_date: date
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    user: Optional[User] = Relationship(back_populates="subscriptions")
    category_rel: Optional[Category] = Relationship(back_populates="subscriptions")
    payment_method_rel: Optional[PaymentMethod] = Relationship(back_populates="subscriptions")
    
    audits: List["SubscriptionAudit"] = Relationship(
        back_populates="subscription",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    bills: List["Bill"] = Relationship(
        back_populates="subscription",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    reminders: List["Reminder"] = Relationship(
        back_populates="subscription",
        sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )
    tags: List[Tag] = Relationship(back_populates="subscriptions", link_model=SubscriptionTagLink)


class SubscriptionAudit(SQLModel, table=True):
    """Audit log history tracking."""
    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_id: int = Field(foreign_key="subscription.id", index=True)
    action: str = Field(max_length=30)
    note: Optional[str] = Field(default=None, max_length=255)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    subscription: Optional[Subscription] = Relationship(back_populates="audits")


class Bill(SQLModel, table=True):
    """Historical record of payments made."""
    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_id: int = Field(foreign_key="subscription.id", index=True)
    amount_paid: float = Field(ge=0)
    payment_date: date
    status: str = Field(default="PAID", max_length=20)
    
    subscription: Optional[Subscription] = Relationship(back_populates="bills")


class Reminder(SQLModel, table=True):
    """Notification reminders entity."""
    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_id: int = Field(foreign_key="subscription.id", index=True)
    days_before: int = Field(ge=0, le=30)
    message: str = Field(max_length=255)
    is_active: bool = Field(default=True)
    
    subscription: Optional[Subscription] = Relationship(back_populates="reminders")
