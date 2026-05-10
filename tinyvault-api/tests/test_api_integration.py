"""
test_api_integration.py — HTTP-level integration tests for all API endpoints.

Uses FastAPI TestClient with an in-memory SQLite DB (via conftest fixtures).
Tests cover: auth, subscriptions CRUD, summary, calendar, error handling.
"""

from datetime import date, timedelta

import pytest


# -----------------------------------------------------------------------
# Root
# -----------------------------------------------------------------------

class TestRoot:
    def test_root_returns_welcome(self, client):
        resp = client.get("/")
        assert resp.status_code == 200
        body = resp.json()
        assert "message" in body
        assert "SubTrack" in body["message"]


# -----------------------------------------------------------------------
# Auth — POST /auth/login
# -----------------------------------------------------------------------

class TestAuthLogin:
    def test_successful_login_returns_token(self, client, seeded_user):
        resp = client.post(
            "/auth/login",
            data={"username": "test_user", "password": "password123"},
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 10

    def test_wrong_password_returns_401(self, client, seeded_user):
        resp = client.post(
            "/auth/login",
            data={"username": "test_user", "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    def test_nonexistent_user_returns_401(self, client):
        resp = client.post(
            "/auth/login",
            data={"username": "ghost_user", "password": "anypass"},
        )
        assert resp.status_code == 401

    def test_missing_password_field_returns_422(self, client):
        resp = client.post("/auth/login", data={"username": "test_user"})
        assert resp.status_code == 422

    def test_missing_username_field_returns_422(self, client):
        resp = client.post("/auth/login", data={"password": "password123"})
        assert resp.status_code == 422


# -----------------------------------------------------------------------
# Subscriptions — GET /subscriptions
# -----------------------------------------------------------------------

class TestListSubscriptions:
    def test_requires_auth(self, client, seeded_user):
        resp = client.get("/subscriptions")
        assert resp.status_code == 401

    def test_returns_list_with_valid_token(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.get("/subscriptions", headers=auth_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_search_filter(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.get("/subscriptions?search=netflix", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert all("netflix" in item["service_name"].lower() for item in data)

    def test_search_no_match_returns_empty(self, client, seeded_user, auth_headers):
        resp = client.get("/subscriptions?search=xyznonexistent", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json() == []

    def test_category_filter(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.get("/subscriptions?category=Entertainment", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert all(item["category"] == "Entertainment" for item in data)

    def test_active_only_filter(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.get("/subscriptions?active_only=true", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert all(item["is_active"] is True for item in data)

    def test_sort_by_amount_asc(self, client, seeded_user, auth_headers, seeded_subscription):
        # Create another subscription
        client.post(
            "/subscriptions",
            json={
                "service_name": "Cheap Service",
                "category": "Entertainment",
                "billing_cycle": "Monthly",
                "amount": 1.99,
                "next_payment_date": str(date.today() + timedelta(days=3)),
            },
            headers=auth_headers,
        )
        resp = client.get("/subscriptions?sort_by=amount&sort_order=asc", headers=auth_headers)
        assert resp.status_code == 200
        amounts = [item["amount"] for item in resp.json()]
        assert amounts == sorted(amounts)

    def test_sort_by_amount_desc(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.get("/subscriptions?sort_by=amount&sort_order=desc", headers=auth_headers)
        assert resp.status_code == 200
        amounts = [item["amount"] for item in resp.json()]
        assert amounts == sorted(amounts, reverse=True)

    def test_pagination_limit(self, client, seeded_user, auth_headers):
        # Create 5 subscriptions
        for i in range(5):
            client.post(
                "/subscriptions",
                json={
                    "service_name": f"PagSub{i}",
                    "category": "Cloud",
                    "billing_cycle": "Monthly",
                    "amount": float(i + 1),
                    "next_payment_date": str(date.today() + timedelta(days=i + 1)),
                },
                headers=auth_headers,
            )
        resp = client.get("/subscriptions?limit=2", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) <= 2

    def test_pagination_skip(self, client, seeded_user, auth_headers):
        for i in range(4):
            client.post(
                "/subscriptions",
                json={
                    "service_name": f"SkipSub{i}",
                    "category": "Cloud",
                    "billing_cycle": "Monthly",
                    "amount": float(i + 1),
                    "next_payment_date": str(date.today() + timedelta(days=i + 1)),
                },
                headers=auth_headers,
            )
        all_resp = client.get("/subscriptions?sort_by=service_name&sort_order=asc", headers=auth_headers)
        skip_resp = client.get(
            "/subscriptions?sort_by=service_name&sort_order=asc&skip=2&limit=100",
            headers=auth_headers,
        )
        all_data = all_resp.json()
        skip_data = skip_resp.json()
        assert len(skip_data) == len(all_data) - 2
        assert skip_data[0]["id"] == all_data[2]["id"]


# -----------------------------------------------------------------------
# Subscriptions — POST /subscriptions
# -----------------------------------------------------------------------

class TestCreateSubscription:
    def test_creates_subscription_returns_201(self, client, seeded_user, auth_headers):
        payload = {
            "service_name": "Notion",
            "category": "Productivity",
            "billing_cycle": "Monthly",
            "amount": 8.00,
            "next_payment_date": str(date.today() + timedelta(days=7)),
        }
        resp = client.post("/subscriptions", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        body = resp.json()
        assert body["service_name"] == "Notion"
        assert body["category"] == "Productivity"
        assert "id" in body

    def test_requires_auth(self, client):
        payload = {
            "service_name": "Test",
            "category": "Cloud",
            "billing_cycle": "Monthly",
            "amount": 5.0,
            "next_payment_date": str(date.today() + timedelta(days=1)),
        }
        resp = client.post("/subscriptions", json=payload)
        assert resp.status_code == 401

    def test_missing_required_field_returns_422(self, client, seeded_user, auth_headers):
        payload = {
            "category": "Cloud",
            "billing_cycle": "Monthly",
            "amount": 5.0,
            # Missing service_name and next_payment_date
        }
        resp = client.post("/subscriptions", json=payload, headers=auth_headers)
        assert resp.status_code == 422

    def test_negative_amount_returns_422(self, client, seeded_user, auth_headers):
        payload = {
            "service_name": "NegativeTest",
            "category": "Cloud",
            "billing_cycle": "Monthly",
            "amount": -5.0,
            "next_payment_date": str(date.today() + timedelta(days=1)),
        }
        resp = client.post("/subscriptions", json=payload, headers=auth_headers)
        assert resp.status_code == 422

    def test_empty_service_name_returns_422(self, client, seeded_user, auth_headers):
        payload = {
            "service_name": "",
            "category": "Cloud",
            "billing_cycle": "Monthly",
            "amount": 5.0,
            "next_payment_date": str(date.today() + timedelta(days=1)),
        }
        resp = client.post("/subscriptions", json=payload, headers=auth_headers)
        assert resp.status_code == 422

    def test_invalid_billing_cycle_returns_422(self, client, seeded_user, auth_headers):
        payload = {
            "service_name": "BadCycle",
            "category": "Cloud",
            "billing_cycle": "Weekly",  # Not allowed
            "amount": 5.0,
            "next_payment_date": str(date.today() + timedelta(days=1)),
        }
        resp = client.post("/subscriptions", json=payload, headers=auth_headers)
        assert resp.status_code == 422

    def test_yearly_billing_cycle_accepted(self, client, seeded_user, auth_headers):
        payload = {
            "service_name": "AnnualPlan",
            "category": "Education",
            "billing_cycle": "Yearly",
            "amount": 99.0,
            "next_payment_date": str(date.today() + timedelta(days=30)),
        }
        resp = client.post("/subscriptions", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["billing_cycle"] == "Yearly"

    def test_with_tags(self, client, seeded_user, auth_headers):
        payload = {
            "service_name": "TaggedService",
            "category": "Music",
            "billing_cycle": "Monthly",
            "amount": 9.99,
            "next_payment_date": str(date.today() + timedelta(days=5)),
            "tags": ["work", "favorite"],
        }
        resp = client.post("/subscriptions", json=payload, headers=auth_headers)
        assert resp.status_code == 201
        body = resp.json()
        assert "work" in body["tags"]
        assert "favorite" in body["tags"]

    def test_response_contains_computed_fields(self, client, seeded_user, auth_headers):
        payload = {
            "service_name": "ComputedFields",
            "category": "Cloud",
            "billing_cycle": "Monthly",
            "amount": 10.0,
            "next_payment_date": str(date.today() + timedelta(days=3)),
        }
        resp = client.post("/subscriptions", json=payload, headers=auth_headers)
        body = resp.json()
        assert "estimated_monthly_amount" in body
        assert "days_until_payment" in body
        assert "upcoming_payment" in body
        assert body["upcoming_payment"] is True  # 3 days is within 7


# -----------------------------------------------------------------------
# Subscriptions — GET /subscriptions/{id}
# -----------------------------------------------------------------------

class TestGetSubscription:
    def test_returns_subscription_by_id(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.get(f"/subscriptions/{seeded_subscription.id}", headers=auth_headers)
        # Note: this endpoint doesn't require auth in current impl but let's pass anyway
        assert resp.status_code == 200
        body = resp.json()
        assert body["id"] == seeded_subscription.id
        assert body["service_name"] == "Netflix"

    def test_returns_404_for_missing_id(self, client, seeded_user, auth_headers):
        resp = client.get("/subscriptions/99999", headers=auth_headers)
        assert resp.status_code == 404


# -----------------------------------------------------------------------
# Subscriptions — PUT /subscriptions/{id}
# -----------------------------------------------------------------------

class TestUpdateSubscription:
    def test_updates_subscription(self, client, seeded_user, auth_headers, seeded_subscription):
        payload = {"amount": 19.99}
        resp = client.put(
            f"/subscriptions/{seeded_subscription.id}",
            json=payload,
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["amount"] == 19.99

    def test_requires_auth(self, client, seeded_subscription):
        resp = client.put(f"/subscriptions/{seeded_subscription.id}", json={"amount": 1.0})
        assert resp.status_code == 401

    def test_returns_404_for_missing_id(self, client, seeded_user, auth_headers):
        resp = client.put("/subscriptions/99999", json={"amount": 1.0}, headers=auth_headers)
        assert resp.status_code == 404

    def test_can_toggle_is_active(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.put(
            f"/subscriptions/{seeded_subscription.id}",
            json={"is_active": False},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["is_active"] is False

    def test_can_update_category(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.put(
            f"/subscriptions/{seeded_subscription.id}",
            json={"category": "Music"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["category"] == "Music"

    def test_partial_update_preserves_other_fields(self, client, seeded_user, auth_headers, seeded_subscription):
        original_name = seeded_subscription.service_name
        resp = client.put(
            f"/subscriptions/{seeded_subscription.id}",
            json={"amount": 5.0},
            headers=auth_headers,
        )
        assert resp.json()["service_name"] == original_name


# -----------------------------------------------------------------------
# Subscriptions — DELETE /subscriptions/{id}
# -----------------------------------------------------------------------

class TestDeleteSubscription:
    def test_deletes_subscription_returns_204(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.delete(
            f"/subscriptions/{seeded_subscription.id}", headers=auth_headers
        )
        assert resp.status_code == 204

    def test_after_delete_subscription_not_found(self, client, seeded_user, auth_headers, seeded_subscription):
        client.delete(f"/subscriptions/{seeded_subscription.id}", headers=auth_headers)
        resp = client.get(f"/subscriptions/{seeded_subscription.id}")
        assert resp.status_code == 404

    def test_requires_auth(self, client, seeded_subscription):
        resp = client.delete(f"/subscriptions/{seeded_subscription.id}")
        assert resp.status_code == 401

    def test_returns_404_for_missing_id(self, client, seeded_user, auth_headers):
        resp = client.delete("/subscriptions/99999", headers=auth_headers)
        assert resp.status_code == 404


# -----------------------------------------------------------------------
# Subscriptions — GET /subscriptions/{id}/audits
# -----------------------------------------------------------------------

class TestGetAudits:
    def test_returns_audit_list(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.get(f"/subscriptions/{seeded_subscription.id}/audits")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_audit_created_after_update(self, client, seeded_user, auth_headers, seeded_subscription):
        client.put(
            f"/subscriptions/{seeded_subscription.id}",
            json={"amount": 100.0},
            headers=auth_headers,
        )
        resp = client.get(f"/subscriptions/{seeded_subscription.id}/audits")
        audits = resp.json()
        actions = [a["action"] for a in audits]
        assert "UPDATED" in actions

    def test_audit_has_required_fields(self, client, seeded_user, auth_headers, seeded_subscription):
        resp = client.get(f"/subscriptions/{seeded_subscription.id}/audits")
        if resp.json():
            audit = resp.json()[0]
            assert "id" in audit
            assert "action" in audit
            assert "created_at" in audit
            assert "subscription_id" in audit


# -----------------------------------------------------------------------
# Summary — GET /subscriptions/summary/monthly-total
# -----------------------------------------------------------------------

class TestMonthlySummary:
    def test_returns_summary_structure(self, client, seeded_user, seeded_subscription):
        resp = client.get("/subscriptions/summary/monthly-total")
        assert resp.status_code == 200
        body = resp.json()
        assert "active_count" in body
        assert "estimated_monthly_total" in body
        assert "yearly_subscription_count" in body
        assert "upcoming_payments_next_7_days" in body

    def test_active_count_reflects_subscriptions(self, client, seeded_user, seeded_subscription):
        resp = client.get("/subscriptions/summary/monthly-total")
        body = resp.json()
        assert body["active_count"] >= 1

    def test_empty_db_returns_zero_values(self, client, seeded_user):
        resp = client.get("/subscriptions/summary/monthly-total")
        body = resp.json()
        assert body["active_count"] == 0
        assert body["estimated_monthly_total"] == 0.0


# -----------------------------------------------------------------------
# Summary — GET /subscriptions/summary/converted
# -----------------------------------------------------------------------

class TestConvertedSummary:
    def test_usd_returns_rate_1(self, client, seeded_user):
        resp = client.get("/subscriptions/summary/converted?currency=USD")
        assert resp.status_code == 200
        body = resp.json()
        assert body["rate"] == 1.0
        assert body["target_currency"] == "USD"
        assert body["base_currency"] == "USD"

    def test_invalid_currency_returns_422(self, client, seeded_user):
        resp = client.get("/subscriptions/summary/converted?currency=INVALID")
        assert resp.status_code == 422

    def test_response_structure(self, client, seeded_user):
        resp = client.get("/subscriptions/summary/converted?currency=USD")
        body = resp.json()
        required_fields = [
            "base_currency", "target_currency", "rate",
            "estimated_monthly_total_base", "estimated_monthly_total_converted", "active_count"
        ]
        for field in required_fields:
            assert field in body


# -----------------------------------------------------------------------
# Calendar — GET /subscriptions/{id}/calendar
# -----------------------------------------------------------------------

class TestCalendar:
    def test_returns_ics_content(self, client, seeded_subscription):
        resp = client.get(f"/subscriptions/{seeded_subscription.id}/calendar")
        assert resp.status_code == 200
        assert "text/calendar" in resp.headers.get("content-type", "")
        body = resp.text
        assert "BEGIN:VCALENDAR" in body
        assert "END:VCALENDAR" in body

    def test_ics_contains_subscription_info(self, client, seeded_subscription):
        resp = client.get(f"/subscriptions/{seeded_subscription.id}/calendar")
        body = resp.text
        assert seeded_subscription.service_name in body
        assert "RRULE:FREQ=MONTHLY" in body  # monthly billing

    def test_content_disposition_header(self, client, seeded_subscription):
        resp = client.get(f"/subscriptions/{seeded_subscription.id}/calendar")
        disposition = resp.headers.get("content-disposition", "")
        assert "attachment" in disposition
        assert ".ics" in disposition

    def test_returns_404_for_missing_subscription(self, client):
        resp = client.get("/subscriptions/99999/calendar")
        assert resp.status_code == 404


# -----------------------------------------------------------------------
# Error handling
# -----------------------------------------------------------------------

class TestErrorHandling:
    def test_nonexistent_route_returns_404(self, client):
        resp = client.get("/this/does/not/exist")
        assert resp.status_code == 404

    def test_invalid_json_body_returns_422(self, client, seeded_user, auth_headers):
        resp = client.post(
            "/subscriptions",
            content="not-json",
            headers={**auth_headers, "Content-Type": "application/json"},
        )
        assert resp.status_code == 422

    def test_invalid_subscription_id_type_returns_422(self, client):
        resp = client.get("/subscriptions/not-a-number")
        assert resp.status_code == 422
