# TinyVault - Test Cases

## Backend Tests (Swagger: http://127.0.0.1:8000/docs)

1. `GET /subscriptions`
- Expect `200` and seeded subscription list.

2. `GET /subscriptions?search=net`
- Expect `200` and service names containing `net`.

3. `GET /subscriptions?category=Entertainment`
- Expect `200` and only entertainment category rows.

4. `GET /subscriptions?sort_by=amount&sort_order=desc`
- Expect `200` and amount-sorted descending list.

5. `GET /subscriptions/summary/monthly-total`
- Expect `200` with `active_count`, `estimated_monthly_total`, `yearly_subscription_count`, `upcoming_payments_next_7_days`.

6. `GET /subscriptions/summary/converted?currency=TRY`
- Expect `200` with `base_currency`, `target_currency`, `rate`, `estimated_monthly_total_base`, `estimated_monthly_total_converted`, `active_count`.

7. `GET /subscriptions/summary/converted?currency=EUR`
- Expect `200` converted result in EUR.

8. `GET /subscriptions/summary/converted?currency=GBP`
- Expect `422` (allowed: `USD`, `TRY`, `EUR`).

9. `POST /subscriptions` (valid payload)
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
- Expect `201 Created` and created row with computed fields.

10. `POST /subscriptions` with invalid amount
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

11. `POST /subscriptions` with invalid billing cycle
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

12. `GET /subscriptions/99999`
- Expect `404 Not Found`.

13. `PUT /subscriptions/{subscription_id}`
```json
{
  "billing_cycle": "Yearly",
  "amount": 120
}
```
- Expect `200` and updated monthly estimate.

14. `PUT /subscriptions/{subscription_id}` status toggle
```json
{
  "is_active": false
}
```
- Expect `200` and `is_active=false`.

15. `DELETE /subscriptions/{subscription_id}`
- Expect `204 No Content`.

16. `GET /subscriptions/{subscription_id}/audits`
- After create or update, expect `200` with entries like `CREATED` and `UPDATED`.

17. `GET /subscriptions/{subscription_id}/calendar`
- Expect `200` with `text/calendar` response and downloadable `.ics` file.

18. `GET /subscriptions/{unknown_id}/calendar`
- Expect `404 Not Found`.

## Frontend v1 Tests

1. Open `v1` while backend is running.
2. Confirm cards render from API.
3. Confirm upcoming badge appears for near-due subscriptions.
4. Stop backend and refresh; confirm error state appears.

## Frontend v2 Tests

1. Confirm header/navbar is visible on app load.
2. Search by service name and verify list updates.
3. Change category filter and verify list updates.
4. Change sorting controls and verify order changes.
5. Add subscription via form and confirm toast success + new list entry.
6. Remove subscription from card and confirm toast success + list update.
7. Confirm summary cards include converted total card.
8. Confirm category chart is rendered when subscriptions exist.
9. Click a card to open detail modal.
10. In modal, edit a field and save; confirm updated data and success toast.
11. In modal, use Pause/Resume and verify status change.
12. In modal history section, verify audit entries load (`CREATED`, `UPDATED`).
13. Click Calendar button in modal and verify `.ics` file download trigger.
14. Verify modal close behavior works.

## Build/Startup Checks

1. Backend startup:
```bash
cd tinyvault-api
source venv/bin/activate
uvicorn main:app --reload
```
- Expect server starts and `/docs` accessible.

2. Frontend v2 build:
```bash
cd v2/tinyvault-frontend
npm run build
```
- Expect successful Vite build without fatal errors.
