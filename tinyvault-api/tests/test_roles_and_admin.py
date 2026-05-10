"""
test_roles_and_admin.py — Tests for role-based auth and admin endpoints.

Covers:
    POST /auth/register      — happy path, duplicate username/email, validation
    POST /auth/login         — returns role + username, deactivated account
    GET  /auth/me            — returns current user profile
    GET  /admin/users        — admin only
    PUT  /admin/users/{id}/role   — admin changes roles, non-admin forbidden
    PUT  /admin/users/{id}/status — admin toggles active, non-admin forbidden
    require_admin            — viewer and regular user both get 403
"""

import pytest


# ===========================================================================
# POST /auth/register
# ===========================================================================

class TestRegister:
    def test_successful_registration_returns_201(self, client):
        resp = client.post("/auth/register", json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "secret123",
        })
        assert resp.status_code == 201
        body = resp.json()
        assert body["username"] == "newuser"
        assert body["email"] == "newuser@example.com"
        assert body["role"] == "user"
        assert body["is_active"] is True
        assert "id" in body
        assert "hashed_password" not in body

    def test_duplicate_username_returns_409(self, client, seeded_user):
        resp = client.post("/auth/register", json={
            "username": seeded_user.username,
            "email": "other@example.com",
            "password": "anypass123",
        })
        assert resp.status_code == 409
        assert "username" in resp.json()["error"].lower()

    def test_duplicate_email_returns_409(self, client, seeded_user):
        resp = client.post("/auth/register", json={
            "username": "brandnew",
            "email": seeded_user.email,
            "password": "anypass123",
        })
        assert resp.status_code == 409
        assert "email" in resp.json()["error"].lower()

    def test_short_username_returns_422(self, client):
        resp = client.post("/auth/register", json={
            "username": "ab",
            "email": "ok@example.com",
            "password": "validpass",
        })
        assert resp.status_code == 422

    def test_short_password_returns_422(self, client):
        resp = client.post("/auth/register", json={
            "username": "validuser",
            "email": "ok@example.com",
            "password": "12345",   # 5 chars — min is 6
        })
        assert resp.status_code == 422

    def test_missing_fields_returns_422(self, client):
        resp = client.post("/auth/register", json={"username": "onlyname"})
        assert resp.status_code == 422

    def test_registered_user_can_login(self, client):
        client.post("/auth/register", json={
            "username": "logintest",
            "email": "logintest@example.com",
            "password": "mypassword",
        })
        resp = client.post("/auth/login",
                           data={"username": "logintest", "password": "mypassword"})
        assert resp.status_code == 200
        assert "access_token" in resp.json()


# ===========================================================================
# POST /auth/login  (new fields: role, username)
# ===========================================================================

class TestLoginRoleFields:
    def test_login_returns_role(self, client, seeded_user):
        resp = client.post("/auth/login",
                           data={"username": seeded_user.username, "password": "password123"})
        assert resp.status_code == 200
        assert resp.json()["role"] == "user"

    def test_admin_login_returns_admin_role(self, client, seeded_admin):
        resp = client.post("/auth/login",
                           data={"username": seeded_admin.username, "password": "admin123"})
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

    def test_viewer_login_returns_viewer_role(self, client, seeded_viewer):
        resp = client.post("/auth/login",
                           data={"username": seeded_viewer.username, "password": "viewer123"})
        assert resp.status_code == 200
        assert resp.json()["role"] == "viewer"

    def test_login_returns_username(self, client, seeded_user):
        resp = client.post("/auth/login",
                           data={"username": seeded_user.username, "password": "password123"})
        assert resp.json()["username"] == seeded_user.username

    def test_deactivated_user_returns_403(self, client, seeded_inactive):
        resp = client.post("/auth/login",
                           data={"username": seeded_inactive.username, "password": "pass123"})
        assert resp.status_code == 403

    def test_wrong_password_returns_401(self, client, seeded_user):
        resp = client.post("/auth/login",
                           data={"username": seeded_user.username, "password": "wrongpass"})
        assert resp.status_code == 401


# ===========================================================================
# GET /auth/me
# ===========================================================================

class TestAuthMe:
    def test_returns_current_user_profile(self, client, seeded_user, auth_headers):
        resp = client.get("/auth/me", headers=auth_headers)
        assert resp.status_code == 200
        body = resp.json()
        assert body["username"] == seeded_user.username
        assert body["email"] == seeded_user.email
        assert body["role"] == "user"
        assert body["is_active"] is True

    def test_admin_me_returns_admin_role(self, client, seeded_admin, admin_headers):
        resp = client.get("/auth/me", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

    def test_unauthenticated_returns_401(self, client):
        resp = client.get("/auth/me")
        assert resp.status_code == 401

    def test_invalid_token_returns_401(self, client):
        resp = client.get("/auth/me", headers={"Authorization": "Bearer invalid.token"})
        assert resp.status_code == 401


# ===========================================================================
# GET /admin/users
# ===========================================================================

class TestAdminListUsers:
    def test_admin_can_list_all_users(self, client, seeded_admin, seeded_user, seeded_viewer, admin_headers):
        resp = client.get("/admin/users", headers=admin_headers)
        assert resp.status_code == 200
        usernames = [u["username"] for u in resp.json()]
        assert seeded_admin.username in usernames
        assert seeded_user.username in usernames
        assert seeded_viewer.username in usernames

    def test_regular_user_gets_403(self, client, seeded_user, auth_headers):
        resp = client.get("/admin/users", headers=auth_headers)
        assert resp.status_code == 403

    def test_viewer_gets_403(self, client, seeded_viewer, viewer_headers):
        resp = client.get("/admin/users", headers=viewer_headers)
        assert resp.status_code == 403

    def test_unauthenticated_gets_401(self, client):
        resp = client.get("/admin/users")
        assert resp.status_code == 401

    def test_response_includes_required_fields(self, client, seeded_admin, admin_headers):
        resp = client.get("/admin/users", headers=admin_headers)
        user = resp.json()[0]
        for field in ("id", "username", "email", "role", "is_active", "created_at"):
            assert field in user


# ===========================================================================
# PUT /admin/users/{id}/role
# ===========================================================================

class TestAdminUpdateRole:
    def test_admin_can_change_role_to_viewer(self, client, seeded_admin, seeded_user, admin_headers):
        resp = client.put(
            f"/admin/users/{seeded_user.id}/role",
            json={"role": "viewer"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "viewer"

    def test_admin_can_promote_to_admin(self, client, seeded_admin, seeded_user, admin_headers):
        resp = client.put(
            f"/admin/users/{seeded_user.id}/role",
            json={"role": "admin"},
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

    def test_invalid_role_returns_422(self, client, seeded_admin, seeded_user, admin_headers):
        resp = client.put(
            f"/admin/users/{seeded_user.id}/role",
            json={"role": "superuser"},
            headers=admin_headers,
        )
        assert resp.status_code == 422

    def test_nonexistent_user_returns_404(self, client, seeded_admin, admin_headers):
        resp = client.put(
            "/admin/users/99999/role",
            json={"role": "viewer"},
            headers=admin_headers,
        )
        assert resp.status_code == 404

    def test_regular_user_gets_403(self, client, seeded_user, seeded_viewer, auth_headers):
        resp = client.put(
            f"/admin/users/{seeded_viewer.id}/role",
            json={"role": "admin"},
            headers=auth_headers,
        )
        assert resp.status_code == 403

    def test_viewer_gets_403(self, client, seeded_viewer, seeded_user, viewer_headers):
        resp = client.put(
            f"/admin/users/{seeded_user.id}/role",
            json={"role": "admin"},
            headers=viewer_headers,
        )
        assert resp.status_code == 403


# ===========================================================================
# PUT /admin/users/{id}/status  (toggle active)
# ===========================================================================

class TestAdminToggleStatus:
    def test_admin_can_deactivate_user(self, client, seeded_admin, seeded_user, admin_headers):
        resp = client.put(
            f"/admin/users/{seeded_user.id}/status",
            headers=admin_headers,
        )
        assert resp.status_code == 200
        assert resp.json()["is_active"] is False

    def test_toggle_twice_restores_active(self, client, seeded_admin, seeded_user, admin_headers):
        client.put(f"/admin/users/{seeded_user.id}/status", headers=admin_headers)
        resp = client.put(f"/admin/users/{seeded_user.id}/status", headers=admin_headers)
        assert resp.status_code == 200
        assert resp.json()["is_active"] is True

    def test_deactivated_user_cannot_login(self, client, seeded_admin, seeded_user, admin_headers):
        client.put(f"/admin/users/{seeded_user.id}/status", headers=admin_headers)
        resp = client.post("/auth/login",
                           data={"username": seeded_user.username, "password": "password123"})
        assert resp.status_code == 403

    def test_nonexistent_user_returns_404(self, client, seeded_admin, admin_headers):
        resp = client.put("/admin/users/99999/status", headers=admin_headers)
        assert resp.status_code == 404

    def test_regular_user_gets_403(self, client, seeded_user, seeded_viewer, auth_headers):
        resp = client.put(f"/admin/users/{seeded_viewer.id}/status", headers=auth_headers)
        assert resp.status_code == 403

    def test_viewer_gets_403(self, client, seeded_viewer, seeded_user, viewer_headers):
        resp = client.put(f"/admin/users/{seeded_user.id}/status", headers=viewer_headers)
        assert resp.status_code == 403

    def test_unauthenticated_gets_401(self, client, seeded_user):
        resp = client.put(f"/admin/users/{seeded_user.id}/status")
        assert resp.status_code == 401
