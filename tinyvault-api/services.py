from datetime import date
from typing import Optional, List

import httpx
from fastapi import HTTPException
from sqlmodel import Session, col, func, select

from models import Subscription, SubscriptionAudit, Category, Tag, SubscriptionTagLink, User, PaymentMethod, Currency, UserPreference, Bill, Reminder
from schemas import (
    ConvertedSummaryResponse,
    SubscriptionAuditResponse,
    SummaryResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpdate,
)


class SubscriptionService:
    """Business logic layer accommodating the advanced 11-entity relational schema."""

    @staticmethod
    def _add_audit(session: Session, subscription_id: int, action: str, note: Optional[str] = None) -> None:
        """Create an audit record for a subscription action."""
        audit = SubscriptionAudit(
            subscription_id=subscription_id,
            action=action,
            note=note,
        )
        session.add(audit)
        session.commit()

    @staticmethod
    def _to_monthly(amount: float, billing_cycle: str) -> float:
        return round(amount / 12, 2) if billing_cycle.lower() == "yearly" else round(amount, 2)

    @staticmethod
    def _days_until_payment(next_payment_date: date) -> int:
        return (next_payment_date - date.today()).days

    @classmethod
    def _to_response(cls, sub: Subscription) -> SubscriptionResponse:
        days_left = cls._days_until_payment(sub.next_payment_date)
        cat_name = sub.category_rel.name if sub.category_rel else "Uncategorized"
        tags = [t.name for t in sub.tags] if sub.tags else []
        
        return SubscriptionResponse(
            id=sub.id,
            service_name=sub.service_name,
            category=cat_name,
            billing_cycle=sub.billing_cycle,
            amount=sub.amount,
            next_payment_date=sub.next_payment_date,
            is_active=sub.is_active,
            created_at=sub.created_at,
            estimated_monthly_amount=cls._to_monthly(sub.amount, sub.billing_cycle),
            days_until_payment=days_left,
            upcoming_payment=0 <= days_left <= 7,
            tags=tags
        )

    @staticmethod
    def _get_or_create_category(session: Session, name: str) -> Category:
        cat = session.exec(select(Category).where(func.lower(Category.name) == name.lower())).first()
        if not cat:
            cat = Category(name=name.title(), color_code="#0ea5e9")
            session.add(cat)
            session.commit()
            session.refresh(cat)
        return cat

    @staticmethod
    def _get_or_create_tags(session: Session, names: List[str]) -> List[Tag]:
        tags = []
        user = session.exec(select(User)).first() # Pick the first seeded user 
        if not user:
            return tags
            
        for name in names:
            t = session.exec(select(Tag).where(func.lower(Tag.name) == name.lower())).first()
            if not t:
                t = Tag(name=name.lower(), color="#f43f5e", user_id=user.id)
                session.add(t)
                session.commit()
                session.refresh(t)
            tags.append(t)
        return tags

    @staticmethod
    def _build_query(
        category: Optional[str],
        search: Optional[str],
        active_only: bool,
        sort_by: str,
        sort_order: str,
    ):
        query = select(Subscription)

        if category:
            query = query.join(Category).where(func.lower(Category.name) == category.lower())

        if search:
            query = query.where(func.lower(Subscription.service_name).contains(search.lower()))

        if active_only:
            query = query.where(Subscription.is_active == True)

        sort_map = {
            "service_name": Subscription.service_name,
            "amount": Subscription.amount,
            "next_payment_date": Subscription.next_payment_date,
            "created_at": Subscription.created_at,
        }

        sort_column = sort_map.get(sort_by, Subscription.service_name)
        query = query.order_by(sort_column.desc() if sort_order.lower() == "desc" else sort_column.asc())

        return query

    @classmethod
    def list_subscriptions(
        cls,
        session: Session,
        category: Optional[str],
        search: Optional[str],
        active_only: bool,
        sort_by: str,
        sort_order: str,
        skip: int,
        limit: int,
    ) -> list[SubscriptionResponse]:
        query = cls._build_query(category, search, active_only, sort_by, sort_order)
        query = query.offset(skip).limit(limit)
        subs = session.exec(query).all()
        return [cls._to_response(sub) for sub in subs]

    @classmethod
    def get_subscription(cls, session: Session, sub_id: int) -> Optional[SubscriptionResponse]:
        sub = session.get(Subscription, sub_id)
        if not sub:
            raise HTTPException(status_code=404, detail="Subscription not found")
        return cls._to_response(sub)

    @classmethod
    def create_subscription(cls, session: Session, data: SubscriptionCreate) -> SubscriptionResponse:
        cat = cls._get_or_create_category(session, data.category)
        tags = cls._get_or_create_tags(session, data.tags)
        
        user = session.exec(select(User)).first()
        
        db_sub = Subscription(
            user_id=user.id if user else None,
            service_name=data.service_name,
            category_id=cat.id,
            billing_cycle=data.billing_cycle,
            amount=data.amount,
            next_payment_date=data.next_payment_date,
            is_active=data.is_active,
            tags=tags
        )
        session.add(db_sub)
        session.commit()
        session.refresh(db_sub)

        cls._add_audit(session, db_sub.id, "CREATED", f"Subscription '{db_sub.service_name}' added.")
        return cls._to_response(db_sub)

    @classmethod
    def update_subscription(cls, session: Session, sub_id: int, data: SubscriptionUpdate) -> Optional[SubscriptionResponse]:
        db_sub = session.get(Subscription, sub_id)
        if not db_sub:
            raise HTTPException(status_code=404, detail="Subscription not found")

        update_data = data.model_dump(exclude_unset=True)
        
        if "category" in update_data:
            cat = cls._get_or_create_category(session, update_data.pop("category"))
            db_sub.category_id = cat.id
            
        if "tags" in update_data:
            new_tags = cls._get_or_create_tags(session, update_data.pop("tags"))
            db_sub.tags = new_tags

        for key, value in update_data.items():
            setattr(db_sub, key, value)

        session.add(db_sub)
        session.commit()
        session.refresh(db_sub)

        cls._add_audit(session, db_sub.id, "UPDATED", "Subscription details updated.")
        return cls._to_response(db_sub)

    @classmethod
    def delete_subscription(cls, session: Session, sub_id: int) -> bool:
        db_sub = session.get(Subscription, sub_id)
        if not db_sub:
            raise HTTPException(status_code=404, detail="Subscription not found")

        session.delete(db_sub)
        session.commit()
        return True

    @classmethod
    def get_summary(cls, session: Session) -> SummaryResponse:
        active_subs = session.exec(select(Subscription).where(Subscription.is_active == True)).all()

        monthly_total = sum(cls._to_monthly(s.amount, s.billing_cycle) for s in active_subs)
        yearly_count = sum(1 for s in active_subs if s.billing_cycle.lower() == "yearly")
        upcoming_count = sum(1 for s in active_subs if 0 <= cls._days_until_payment(s.next_payment_date) <= 7)

        return SummaryResponse(
            active_count=len(active_subs),
            estimated_monthly_total=round(monthly_total, 2),
            yearly_subscription_count=yearly_count,
            upcoming_payments_next_7_days=upcoming_count,
        )

    @classmethod
    async def get_converted_summary(cls, session: Session, currency: str) -> ConvertedSummaryResponse:
        valid_currencies = {"USD", "TRY", "EUR"}
        target = currency.upper()
        if target not in valid_currencies:
            raise HTTPException(status_code=422, detail="Invalid target currency.")

        summary = cls.get_summary(session)
        base_total = summary.estimated_monthly_total

        if target == "USD":
            return ConvertedSummaryResponse(
                base_currency="USD",
                target_currency="USD",
                rate=1.0,
                estimated_monthly_total_base=base_total,
                estimated_monthly_total_converted=base_total,
                active_count=summary.active_count,
            )

        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"https://api.frankfurter.app/latest?from=USD&to={target}")
                response.raise_for_status()
                data = response.json()
                rate = data["rates"][target]
        except (httpx.RequestError, httpx.HTTPStatusError):
            raise HTTPException(status_code=502, detail="External FX API is currently unavailable.")

        return ConvertedSummaryResponse(
            base_currency="USD",
            target_currency=target,
            rate=rate,
            estimated_monthly_total_base=base_total,
            estimated_monthly_total_converted=round(base_total * rate, 2),
            active_count=summary.active_count,
        )

    @classmethod
    def list_audits(cls, session: Session, sub_id: int) -> list[SubscriptionAuditResponse]:
        audits = session.exec(
            select(SubscriptionAudit)
            .where(SubscriptionAudit.subscription_id == sub_id)
            .order_by(SubscriptionAudit.created_at.desc())
        ).all()
        return [SubscriptionAuditResponse.model_validate(a) for a in audits]
