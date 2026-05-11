"""
test_services.py — Unit tests for services.py (SubscriptionService)

Tests cover:
    - _to_monthly (billing cycle conversion)
    - _days_until_payment (date arithmetic)
    - _to_response (SubscriptionResponse mapping, upcoming_payment logic)
    - _get_or_create_category (create new, return existing, case-insensitive)
    - _get_or_create_tags (create, reuse, no user → empty list)
    - _build_query (category filter, search filter, active_only, sort)
    - list_subscriptions (pagination)
    - get_subscription (found, 404)
    - create_subscription (audit created, response correct)
    - update_subscription (partial update, category/tag change, 404)
    - delete_subscription (success, 404)
    - get_summary (metrics calculation)
    - list_audits (desc ordering)
"""

from datetime import date, timedelta, datetime

import pytest
from fastapi import HTTPException
from sqlmodel import Session, select

from models import Category, Subscription, Tag, User, SubscriptionAudit, Currency, UserPreference
from schemas import SubscriptionCreate, SubscriptionUpdate
from services import SubscriptionService


# -----------------------------------------------------------------------
# _to_monthly
# -----------------------------------------------------------------------

class TestToMonthly:
    def test_monthly_billing_returns_same_amount(self):
        assert SubscriptionService._to_monthly(9.99, "Monthly") == 9.99

    def test_yearly_billing_divides_by_12(self):
        result = SubscriptionService._to_monthly(120.0, "Yearly")
        assert result == 10.0

    def test_yearly_case_insensitive(self):
        assert SubscriptionService._to_monthly(120.0, "yearly") == 10.0

    def test_result_is_rounded_to_two_decimals(self):
        # 100 / 12 = 8.333... → 8.33
        result = SubscriptionService._to_monthly(100.0, "Yearly")
        assert result == 8.33

    def test_zero_amount(self):
        assert SubscriptionService._to_monthly(0.0, "Monthly") == 0.0
        assert SubscriptionService._to_monthly(0.0, "Yearly") == 0.0


# -----------------------------------------------------------------------
# _days_until_payment
# -----------------------------------------------------------------------

class TestDaysUntilPayment:
    def test_future_date_returns_positive(self):
        future = date.today() + timedelta(days=10)
        assert SubscriptionService._days_until_payment(future) == 10

    def test_today_returns_zero(self):
        assert SubscriptionService._days_until_payment(date.today()) == 0

    def test_past_date_returns_negative(self):
        past = date.today() - timedelta(days=3)
        assert SubscriptionService._days_until_payment(past) == -3


# -----------------------------------------------------------------------
# _to_response
# -----------------------------------------------------------------------

class TestToResponse:
    def _make_sub(self, session, user, category, days_offset=5, billing="Monthly", amount=9.99, is_active=True):
        sub = Subscription(
            user_id=user.id,
            category_id=category.id,
            service_name="TestService",
            billing_cycle=billing,
            amount=amount,
            next_payment_date=date.today() + timedelta(days=days_offset),
            is_active=is_active,
        )
        session.add(sub)
        session.commit()
        session.refresh(sub)
        return sub

    def test_response_fields_populated(self, session, seeded_user):
        cat = Category(name="TestCat", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        sub = self._make_sub(session, seeded_user, cat, days_offset=5)
        resp = SubscriptionService._to_response(sub)

        assert resp.id == sub.id
        assert resp.service_name == "TestService"
        assert resp.category == "TestCat"
        assert resp.billing_cycle == "Monthly"
        assert resp.amount == 9.99
        assert resp.is_active is True

    def test_upcoming_payment_true_when_within_7_days(self, session, seeded_user):
        cat = Category(name="Cat2", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        sub = self._make_sub(session, seeded_user, cat, days_offset=3)
        resp = SubscriptionService._to_response(sub)
        assert resp.upcoming_payment is True
        assert resp.days_until_payment == 3

    def test_upcoming_payment_false_when_beyond_7_days(self, session, seeded_user):
        cat = Category(name="Cat3", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        sub = self._make_sub(session, seeded_user, cat, days_offset=10)
        resp = SubscriptionService._to_response(sub)
        assert resp.upcoming_payment is False

    def test_upcoming_payment_true_for_today(self, session, seeded_user):
        cat = Category(name="Cat4", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        sub = self._make_sub(session, seeded_user, cat, days_offset=0)
        resp = SubscriptionService._to_response(sub)
        assert resp.upcoming_payment is True

    def test_estimated_monthly_for_yearly(self, session, seeded_user):
        cat = Category(name="Cat5", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        sub = self._make_sub(session, seeded_user, cat, billing="Yearly", amount=120.0)
        resp = SubscriptionService._to_response(sub)
        assert resp.estimated_monthly_amount == 10.0

    def test_tags_empty_list_when_no_tags(self, session, seeded_user):
        cat = Category(name="Cat6", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        sub = self._make_sub(session, seeded_user, cat)
        resp = SubscriptionService._to_response(sub)
        assert resp.tags == []

    def test_category_uncategorized_when_none(self, session, seeded_user):
        sub = Subscription(
            user_id=seeded_user.id,
            service_name="NoCatService",
            billing_cycle="Monthly",
            amount=5.0,
            next_payment_date=date.today() + timedelta(days=1),
        )
        session.add(sub)
        session.commit()
        session.refresh(sub)
        resp = SubscriptionService._to_response(sub)
        assert resp.category == "Uncategorized"


# -----------------------------------------------------------------------
# _get_or_create_category
# -----------------------------------------------------------------------

class TestGetOrCreateCategory:
    def test_creates_new_category(self, session):
        cat = SubscriptionService._get_or_create_category(session, "Gaming")
        assert cat.id is not None
        assert cat.name == "Gaming"

    def test_returns_existing_category(self, session):
        first = SubscriptionService._get_or_create_category(session, "Music")
        second = SubscriptionService._get_or_create_category(session, "Music")
        assert first.id == second.id

    def test_case_insensitive_lookup(self, session):
        lower = SubscriptionService._get_or_create_category(session, "productivity")
        upper = SubscriptionService._get_or_create_category(session, "PRODUCTIVITY")
        assert lower.id == upper.id

    def test_new_category_has_default_color(self, session):
        cat = SubscriptionService._get_or_create_category(session, "NewCat")
        assert cat.color_code == "#0ea5e9"


# -----------------------------------------------------------------------
# _get_or_create_tags
# -----------------------------------------------------------------------

class TestGetOrCreateTags:
    def test_creates_new_tags(self, session, seeded_user):
        tags = SubscriptionService._get_or_create_tags(session, ["tag1", "tag2"], seeded_user.id)
        assert len(tags) == 2
        assert {t.name for t in tags} == {"tag1", "tag2"}

    def test_returns_existing_tag(self, session, seeded_user):
        first_call = SubscriptionService._get_or_create_tags(session, ["fav"], seeded_user.id)
        second_call = SubscriptionService._get_or_create_tags(session, ["fav"], seeded_user.id)
        assert first_call[0].id == second_call[0].id

    def test_case_insensitive_tag_lookup(self, session, seeded_user):
        lower = SubscriptionService._get_or_create_tags(session, ["hello"], seeded_user.id)
        upper = SubscriptionService._get_or_create_tags(session, ["HELLO"], seeded_user.id)
        assert lower[0].id == upper[0].id

    def test_empty_list_returns_empty(self, session, seeded_user):
        result = SubscriptionService._get_or_create_tags(session, [], seeded_user.id)
        assert result == []


# -----------------------------------------------------------------------
# _build_query
# -----------------------------------------------------------------------

class TestBuildQuery:
    """Indirectly test _build_query via list_subscriptions."""

    def _create_sub(self, session, user, name, amount, days, active=True, cat_name="General"):
        cat = session.exec(select(Category).where(Category.name == cat_name)).first()
        if not cat:
            cat = Category(name=cat_name, color_code="#000")
            session.add(cat)
            session.commit()
            session.refresh(cat)
        sub = Subscription(
            user_id=user.id,
            category_id=cat.id,
            service_name=name,
            billing_cycle="Monthly",
            amount=amount,
            next_payment_date=date.today() + timedelta(days=days),
            is_active=active,
        )
        session.add(sub)
        session.commit()
        session.refresh(sub)
        return sub

    def test_search_filter(self, session, seeded_user):
        self._create_sub(session, seeded_user, "Netflix", 10, 5)
        self._create_sub(session, seeded_user, "Spotify", 8, 3)
        results = SubscriptionService.list_subscriptions(
            session, seeded_user.id, None, "netflix", False, "service_name", "asc", 0, 100
        )
        assert len(results) == 1
        assert results[0].service_name == "Netflix"

    def test_category_filter(self, session, seeded_user):
        self._create_sub(session, seeded_user, "Netflix", 10, 5, cat_name="Entertainment")
        self._create_sub(session, seeded_user, "Spotify", 8, 3, cat_name="Music")
        results = SubscriptionService.list_subscriptions(
            session, seeded_user.id, "entertainment", None, False, "service_name", "asc", 0, 100
        )
        assert all(r.category == "Entertainment" for r in results)

    def test_active_only_filter(self, session, seeded_user):
        self._create_sub(session, seeded_user, "Active Service", 5, 2, active=True)
        self._create_sub(session, seeded_user, "Paused Service", 3, 2, active=False)
        results = SubscriptionService.list_subscriptions(
            session, seeded_user.id, None, None, True, "service_name", "asc", 0, 100
        )
        assert all(r.is_active is True for r in results)

    def test_sort_by_amount_desc(self, session, seeded_user):
        self._create_sub(session, seeded_user, "Cheap", 5, 2)
        self._create_sub(session, seeded_user, "Expensive", 50, 2)
        results = SubscriptionService.list_subscriptions(
            session, seeded_user.id, None, None, False, "amount", "desc", 0, 100
        )
        amounts = [r.amount for r in results]
        assert amounts == sorted(amounts, reverse=True)

    def test_sort_by_service_name_asc(self, session, seeded_user):
        self._create_sub(session, seeded_user, "Zebra", 5, 2)
        self._create_sub(session, seeded_user, "Alpha", 5, 2)
        results = SubscriptionService.list_subscriptions(
            session, seeded_user.id, None, None, False, "service_name", "asc", 0, 100
        )
        names = [r.service_name for r in results]
        assert names == sorted(names)

    def test_pagination_skip_and_limit(self, session, seeded_user):
        for i in range(5):
            self._create_sub(session, seeded_user, f"Service{i}", i + 1, i + 1)
        page1 = SubscriptionService.list_subscriptions(
            session, seeded_user.id, None, None, False, "service_name", "asc", 0, 2
        )
        page2 = SubscriptionService.list_subscriptions(
            session, seeded_user.id, None, None, False, "service_name", "asc", 2, 2
        )
        assert len(page1) == 2
        assert len(page2) == 2
        assert page1[0].id != page2[0].id


# -----------------------------------------------------------------------
# get_subscription
# -----------------------------------------------------------------------

class TestGetSubscription:
    def test_returns_subscription_by_id(self, session, seeded_user, seeded_subscription):
        result = SubscriptionService.get_subscription(session, seeded_user.id, seeded_subscription.id)
        assert result.id == seeded_subscription.id
        assert result.service_name == "Netflix"

    def test_raises_404_for_missing_id(self, session, seeded_user):
        with pytest.raises(HTTPException) as exc_info:
            SubscriptionService.get_subscription(session, seeded_user.id, 99999)
        assert exc_info.value.status_code == 404


# -----------------------------------------------------------------------
# create_subscription
# -----------------------------------------------------------------------

class TestCreateSubscription:
    def test_creates_subscription_and_returns_response(self, session, seeded_user):
        data = SubscriptionCreate(
            service_name="Notion",
            category="Productivity",
            billing_cycle="Monthly",
            amount=8.00,
            next_payment_date=date.today() + timedelta(days=10),
        )
        result = SubscriptionService.create_subscription(session, seeded_user.id, data)
        assert result.service_name == "Notion"
        assert result.category == "Productivity"
        assert result.id is not None

    def test_creates_audit_on_creation(self, session, seeded_user):
        data = SubscriptionCreate(
            service_name="Audited Service",
            category="Cloud",
            billing_cycle="Monthly",
            amount=5.0,
            next_payment_date=date.today() + timedelta(days=5),
        )
        result = SubscriptionService.create_subscription(session, seeded_user.id, data)
        audits = session.exec(
            select(SubscriptionAudit).where(SubscriptionAudit.subscription_id == result.id)
        ).all()
        assert len(audits) == 1
        assert audits[0].action == "CREATED"

    def test_creates_new_category_if_not_exists(self, session, seeded_user):
        data = SubscriptionCreate(
            service_name="NewCatService",
            category="Unique New Category",
            billing_cycle="Yearly",
            amount=100.0,
            next_payment_date=date.today() + timedelta(days=30),
        )
        result = SubscriptionService.create_subscription(session, seeded_user.id, data)
        assert result.category == "Unique New Category"


# -----------------------------------------------------------------------
# update_subscription
# -----------------------------------------------------------------------

class TestUpdateSubscription:
    def test_updates_service_name(self, session, seeded_user, seeded_subscription):
        data = SubscriptionUpdate(service_name="Updated Name")
        result = SubscriptionService.update_subscription(session, seeded_user.id, seeded_subscription.id, data)
        assert result.service_name == "Updated Name"

    def test_updates_amount(self, session, seeded_user, seeded_subscription):
        data = SubscriptionUpdate(amount=29.99)
        result = SubscriptionService.update_subscription(session, seeded_user.id, seeded_subscription.id, data)
        assert result.amount == 29.99

    def test_updates_category(self, session, seeded_user, seeded_subscription):
        data = SubscriptionUpdate(category="Music")
        result = SubscriptionService.update_subscription(session, seeded_user.id, seeded_subscription.id, data)
        assert result.category == "Music"

    def test_updates_is_active(self, session, seeded_user, seeded_subscription):
        data = SubscriptionUpdate(is_active=False)
        result = SubscriptionService.update_subscription(session, seeded_user.id, seeded_subscription.id, data)
        assert result.is_active is False

    def test_update_creates_audit(self, session, seeded_user, seeded_subscription):
        data = SubscriptionUpdate(amount=5.0)
        SubscriptionService.update_subscription(session, seeded_user.id, seeded_subscription.id, data)
        audits = session.exec(
            select(SubscriptionAudit).where(
                SubscriptionAudit.subscription_id == seeded_subscription.id,
                SubscriptionAudit.action == "UPDATED",
            )
        ).all()
        assert len(audits) >= 1

    def test_raises_404_for_missing_id(self, session, seeded_user):
        data = SubscriptionUpdate(amount=5.0)
        with pytest.raises(HTTPException) as exc_info:
            SubscriptionService.update_subscription(session, seeded_user.id, 99999, data)
        assert exc_info.value.status_code == 404

    def test_partial_update_does_not_change_other_fields(self, session, seeded_user, seeded_subscription):
        original_name = seeded_subscription.service_name
        data = SubscriptionUpdate(amount=1.0)
        result = SubscriptionService.update_subscription(session, seeded_user.id, seeded_subscription.id, data)
        assert result.service_name == original_name


# -----------------------------------------------------------------------
# delete_subscription
# -----------------------------------------------------------------------

class TestDeleteSubscription:
    def test_deletes_subscription_returns_true(self, session, seeded_user, seeded_subscription):
        result = SubscriptionService.delete_subscription(session, seeded_user.id, seeded_subscription.id)
        assert result is True
        deleted = session.get(Subscription, seeded_subscription.id)
        assert deleted is None

    def test_raises_404_for_missing_id(self, session, seeded_user):
        with pytest.raises(HTTPException) as exc_info:
            SubscriptionService.delete_subscription(session, seeded_user.id, 99999)
        assert exc_info.value.status_code == 404


# -----------------------------------------------------------------------
# get_summary
# -----------------------------------------------------------------------

class TestGetSummary:
    def _make_sub(self, session, user, cat, amount, billing, days, active=True):
        sub = Subscription(
            user_id=user.id,
            category_id=cat.id,
            service_name=f"Sub_{amount}",
            billing_cycle=billing,
            amount=amount,
            next_payment_date=date.today() + timedelta(days=days),
            is_active=active,
        )
        session.add(sub)
        session.commit()
        session.refresh(sub)
        return sub

    def test_active_count(self, session, seeded_user):
        cat = Category(name="Sum Cat", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        self._make_sub(session, seeded_user, cat, 10, "Monthly", 5, active=True)
        self._make_sub(session, seeded_user, cat, 10, "Monthly", 5, active=False)
        summary = SubscriptionService.get_summary(session, seeded_user.id)
        assert summary.active_count == 1

    def test_monthly_total_calculation(self, session, seeded_user):
        cat = Category(name="Sum Cat2", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        # 10 monthly + 120 yearly (=10/mo) → total 20/mo
        self._make_sub(session, seeded_user, cat, 10, "Monthly", 5)
        self._make_sub(session, seeded_user, cat, 120, "Yearly", 5)
        summary = SubscriptionService.get_summary(session, seeded_user.id)
        assert summary.estimated_monthly_total == 20.0

    def test_upcoming_payments_count(self, session, seeded_user):
        cat = Category(name="Sum Cat3", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        self._make_sub(session, seeded_user, cat, 5, "Monthly", 3)   # upcoming
        self._make_sub(session, seeded_user, cat, 5, "Monthly", 10)  # not upcoming
        summary = SubscriptionService.get_summary(session, seeded_user.id)
        assert summary.upcoming_payments_next_7_days == 1

    def test_yearly_subscription_count(self, session, seeded_user):
        cat = Category(name="Sum Cat4", color_code="#000")
        session.add(cat)
        session.commit()
        session.refresh(cat)
        self._make_sub(session, seeded_user, cat, 120, "Yearly", 5)
        self._make_sub(session, seeded_user, cat, 10, "Monthly", 5)
        summary = SubscriptionService.get_summary(session, seeded_user.id)
        assert summary.yearly_subscription_count == 1


# -----------------------------------------------------------------------
# list_audits
# -----------------------------------------------------------------------

class TestListAudits:
    def test_returns_audits_in_desc_order(self, session, seeded_user, seeded_subscription):
        SubscriptionService._add_audit(session, seeded_subscription.id, "CREATED", "First")
        SubscriptionService._add_audit(session, seeded_subscription.id, "UPDATED", "Second")
        audits = SubscriptionService.list_audits(session, seeded_user.id, seeded_subscription.id)
        assert len(audits) == 2
        assert audits[0].action == "UPDATED"

    def test_returns_404_for_unknown_subscription(self, session, seeded_user):
        with pytest.raises(HTTPException) as exc_info:
            SubscriptionService.list_audits(session, seeded_user.id, 99999)
        assert exc_info.value.status_code == 404

    def test_add_audit_creates_record(self, session, seeded_subscription):
        SubscriptionService._add_audit(
            session, seeded_subscription.id, "TEST_ACTION", "Test note"
        )
        all_audits = session.exec(
            select(SubscriptionAudit).where(
                SubscriptionAudit.subscription_id == seeded_subscription.id
            )
        ).all()
        actions = [a.action for a in all_audits]
        assert "TEST_ACTION" in actions
