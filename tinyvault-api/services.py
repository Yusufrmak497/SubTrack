from datetime import date
from typing import Optional

import httpx
from fastapi import HTTPException
from sqlmodel import Session, col, func, select

from models import Subscription, SubscriptionAudit
from schemas import (
    ConvertedSummaryResponse,
    SubscriptionAuditResponse,
    SummaryResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpdate,
)


class SubscriptionService:
    """Business logic layer for subscription operations."""

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
        return SubscriptionResponse(
            id=sub.id,
            service_name=sub.service_name,
            category=sub.category,
            billing_cycle=sub.billing_cycle,
            amount=sub.amount,
            next_payment_date=sub.next_payment_date,
            is_active=sub.is_active,
            created_at=sub.created_at,
            estimated_monthly_amount=cls._to_monthly(sub.amount, sub.billing_cycle),
            days_until_payment=days_left,
            upcoming_payment=0 <= days_left <= 7,
        )

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
            query = query.where(func.lower(col(Subscription.category)) == category.lower())

        if search:
            query = query.where(func.lower(col(Subscription.service_name)).contains(search.lower()))

        if active_only:
            query = query.where(col(Subscription.is_active) == True)

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
        query = cls._build_query(category, search, active_only, sort_by, sort_order).offset(skip).limit(limit)
        items = session.exec(query).all()
        return [cls._to_response(item) for item in items]

    @classmethod
    def get_subscription(cls, session: Session, subscription_id: int) -> SubscriptionResponse:
        item = session.get(Subscription, subscription_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"Subscription with id {subscription_id} not found")
        return cls._to_response(item)

    @classmethod
    def create_subscription(cls, session: Session, payload: SubscriptionCreate) -> SubscriptionResponse:
        item = Subscription.model_validate(payload)
        session.add(item)
        session.commit()
        session.refresh(item)
        cls._add_audit(
            session=session,
            subscription_id=item.id,
            action="CREATED",
            note=f"Created subscription {item.service_name}",
        )
        return cls._to_response(item)

    @classmethod
    def update_subscription(
        cls,
        session: Session,
        subscription_id: int,
        payload: SubscriptionUpdate,
    ) -> SubscriptionResponse:
        item = session.get(Subscription, subscription_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"Subscription with id {subscription_id} not found")

        update_data = payload.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(item, key, value)

        session.add(item)
        session.commit()
        session.refresh(item)
        cls._add_audit(
            session=session,
            subscription_id=item.id,
            action="UPDATED",
            note="Updated subscription fields",
        )
        return cls._to_response(item)

    @staticmethod
    def delete_subscription(session: Session, subscription_id: int) -> None:
        item = session.get(Subscription, subscription_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"Subscription with id {subscription_id} not found")

        session.delete(item)
        session.commit()

    @classmethod
    def get_summary(cls, session: Session) -> SummaryResponse:
        active_items = session.exec(
            select(Subscription).where(col(Subscription.is_active) == True)
        ).all()

        estimated_monthly_total = round(
            sum(cls._to_monthly(item.amount, item.billing_cycle) for item in active_items),
            2,
        )

        upcoming_next_7_days = sum(
            1 for item in active_items if 0 <= cls._days_until_payment(item.next_payment_date) <= 7
        )

        yearly_count = sum(1 for item in active_items if item.billing_cycle.lower() == "yearly")

        return SummaryResponse(
            active_count=len(active_items),
            estimated_monthly_total=estimated_monthly_total,
            yearly_subscription_count=yearly_count,
            upcoming_payments_next_7_days=upcoming_next_7_days,
        )

    @staticmethod
    def _get_fx_rate(base_currency: str, target_currency: str) -> float:
        if base_currency == target_currency:
            return 1.0

        try:
            response = httpx.get(
                "https://api.frankfurter.app/latest",
                params={"from": base_currency, "to": target_currency},
                timeout=5.0,
            )
            response.raise_for_status()
            data = response.json()
            rate = data.get("rates", {}).get(target_currency)
            if rate is None:
                raise HTTPException(status_code=502, detail="FX API returned invalid payload")
            return float(rate)
        except httpx.HTTPError:
            raise HTTPException(status_code=503, detail="External FX service unavailable")

    @classmethod
    def get_converted_summary(cls, session: Session, currency: str) -> ConvertedSummaryResponse:
        summary = cls.get_summary(session)
        base_currency = "USD"
        target_currency = currency.upper()
        rate = cls._get_fx_rate(base_currency, target_currency)

        return ConvertedSummaryResponse(
            base_currency=base_currency,
            target_currency=target_currency,
            rate=rate,
            estimated_monthly_total_base=summary.estimated_monthly_total,
            estimated_monthly_total_converted=round(summary.estimated_monthly_total * rate, 2),
            active_count=summary.active_count,
        )

    @staticmethod
    def list_audits(session: Session, subscription_id: int) -> list[SubscriptionAuditResponse]:
        """Return audit history for a given subscription."""
        item = session.get(Subscription, subscription_id)
        if item is None:
            raise HTTPException(status_code=404, detail=f"Subscription with id {subscription_id} not found")

        rows = session.exec(
            select(SubscriptionAudit)
            .where(SubscriptionAudit.subscription_id == subscription_id)
            .order_by(SubscriptionAudit.created_at.desc())
        ).all()
        return [SubscriptionAuditResponse.model_validate(row) for row in rows]
