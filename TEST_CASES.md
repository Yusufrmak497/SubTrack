# TinyVault - Test Cases

## Environment
- Swagger: `http://127.0.0.1:8000/docs`
- Frontend v2: `http://127.0.0.1:5173`

---

## W11 Authentication Tests

1. `POST /auth/register` (valid payload)
```json
{
  "username": "demo_user_a",
  "email": "demoa@example.com",
  "password": "StrongPass123"
}
```
- Expect `201 Created`.

2. `POST /auth/login` (same user)
```json
{
  "username_or_email": "demo_user_a",
  "password": "StrongPass123"
}
```
- Expect `200 OK` and `access_token` in response.

3. `GET /auth/me` with `Authorization: Bearer <token>`
- Expect `200 OK` and current user identity.

4. `GET /auth/me` without token
- Expect `401 Unauthorized`.

5. `POST /auth/register` with duplicate username/email
- Expect `409 Conflict`.

---

## W11 Multi-User Data Isolation Tests

6. Login as **User A** and create a subscription (`POST /subscriptions`) -> keep returned `id` as `A_SUB_ID`.
- Expect `201 Created`.

7. Register/Login as **User B**.

8. As User B, request `GET /subscriptions/{A_SUB_ID}`
- Expect `404 Not Found` (cross-user read blocked).

9. As User B, request `PUT /subscriptions/{A_SUB_ID}`
- Expect `404 Not Found` (cross-user update blocked).

10. As User B, request `DELETE /subscriptions/{A_SUB_ID}`
- Expect `404 Not Found` (cross-user delete blocked).

---

## Backend CRUD + Validation Tests

11. `GET /subscriptions`
- Expect `200` and user-scoped list.

12. `GET /subscriptions?search=net`
- Expect `200` and filtered service names.

13. `GET /subscriptions?category=Entertainment`
- Expect `200` and only category-matching rows.

14. `GET /subscriptions?sort_by=amount&sort_order=desc`
- Expect `200` sorted descending by amount.

15. `GET /subscriptions/summary/monthly-total`
- Expect `200` with: `active_count`, `estimated_monthly_total`, `yearly_subscription_count`, `upcoming_payments_next_7_days`.

16. `GET /subscriptions/summary/converted?currency=TRY`
- Expect `200` converted summary.

17. `GET /subscriptions/summary/converted?currency=GBP`
- Expect `422` (allowed: `USD`, `TRY`, `EUR`).

18. `POST /subscriptions` (valid)
```json
{
  "service_name": "Canva Pro",
  "category": "Productivity",
  "billing_cycle": "Monthly",
  "amount": 12.99,
  "next_payment_date": "2026-04-05",
  "is_active": true
}
```
- Expect `201 Created`.

19. `POST /subscriptions` invalid amount
```json
{
  "service_name": "Bad Amount",
  "category": "Productivity",
  "billing_cycle": "Monthly",
  "amount": -5,
  "next_payment_date": "2026-04-05",
  "is_active": true
}
```
- Expect `422 Unprocessable Entity`.

20. `POST /subscriptions` invalid billing cycle
```json
{
  "service_name": "Bad Cycle",
  "category": "Productivity",
  "billing_cycle": "Weekly",
  "amount": 10,
  "next_payment_date": "2026-04-05",
  "is_active": true
}
```
- Expect `422 Unprocessable Entity`.

21. `GET /subscriptions/99999`
- Expect `404 Not Found`.

22. `PUT /subscriptions/{subscription_id}`
```json
{
  "billing_cycle": "Yearly",
  "amount": 120
}
```
- Expect `200` and updated monthly estimate.

23. `DELETE /subscriptions/{subscription_id}`
- Expect `204 No Content`.

24. `GET /subscriptions/{subscription_id}/audits`
- After create/update, expect `200` and `CREATED`/`UPDATED` actions.

25. `GET /subscriptions/{subscription_id}/calendar`
- Expect `200`, `text/calendar`, downloadable `.ics`.

---

## Frontend v2 Tests

1. Open app and login/register from auth panel.
2. Verify list and summary cards load after login.
3. Search by service name and verify reactive filtering.
4. Change category filter and verify list updates.
5. Create a subscription from UI form and verify toast + list refresh.
6. Open detail modal, update a field, and verify changes persist.
7. In detail modal, verify audit history section renders entries.
8. Toggle dark mode and verify theme variables switch correctly.
9. Remove a subscription and verify list updates.
10. Trigger calendar export from detail modal and verify file download.

---

## Build/Startup Checks

1. Backend startup
```bash
cd tinyvault-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```
- Expect backend and `/docs` to load.

2. Frontend build
```bash
cd v2/tinyvault-frontend
npm install
npm run build
```
- Expect successful Vite build.
