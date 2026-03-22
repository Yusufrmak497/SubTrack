# TinyVault - Test Cases

## Backend Tests (Swagger: http://localhost:8000/docs)

1. `GET /subscriptions`
- Expect seeded subscription list.

2. `GET /subscriptions?search=net`
- Expect results containing service names with "net".

3. `GET /subscriptions?category=Entertainment`
- Expect only entertainment subscriptions.

4. `GET /subscriptions?sort_by=amount&sort_order=desc`
- Expect results sorted by amount descending.

5. `GET /subscriptions/summary/monthly-total`
- Expect valid `active_count`, `estimated_monthly_total`, `upcoming_payments_next_7_days`.

6. `POST /subscriptions`
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
- Expect `201 Created` and new record with computed fields.

7. `PUT /subscriptions/{id}`
```json
{
  "billing_cycle": "Yearly",
  "amount": 120
}
```
- Expect updated values and new monthly estimate.

8. `DELETE /subscriptions/{id}`
- Expect `204 No Content`.

9. `GET /subscriptions/99999`
- Expect `404 Not Found`.

10. `GET /subscriptions/{id}/audits`
- First create or update a subscription, then call this endpoint.
- Expect audit entries such as `CREATED` and `UPDATED` for that subscription.

11. `POST /subscriptions` with invalid amount
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

12. `POST /subscriptions` with invalid billing cycle
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

## Frontend v1 Tests

1. Open `v1` app while backend is running.
2. Confirm cards are rendered from API.
3. Confirm upcoming payment badge appears for near-due items.
4. Stop backend and refresh; confirm error state appears.

## Frontend v2 Tests

1. Search by service name and verify live filtering.
2. Change category filter and verify list updates.
3. Add new subscription via form; verify new card appears.
4. Remove a subscription; verify card is removed.
5. Confirm summary cards reflect active subscriptions and monthly estimate.
6. Confirm upcoming payments have highlighted style.
7. Click a card; verify detail modal opens and closes.
