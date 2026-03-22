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

6. `GET /subscriptions/summary/converted?currency=TRY`
- Expect `200` with fields:
  - `base_currency` (USD)
  - `target_currency` (TRY)
  - `rate`
  - `estimated_monthly_total_base`
  - `estimated_monthly_total_converted`
  - `active_count`

7. `GET /subscriptions/summary/converted?currency=EUR`
- Expect `200` and converted totals in EUR.

8. `POST /subscriptions`
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

9. `PUT /subscriptions/{subscription_id}`
```json
{
  "billing_cycle": "Yearly",
  "amount": 120
}
```
- Expect updated values and new monthly estimate.

10. `DELETE /subscriptions/{subscription_id}`
- Expect `204 No Content`.

11. `GET /subscriptions/99999`
- Expect `404 Not Found`.

12. `GET /subscriptions/{subscription_id}/audits`
- First create or update a subscription, then call this endpoint.
- Expect audit entries such as `CREATED` and `UPDATED` for that subscription.

13. `POST /subscriptions` with invalid amount
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

14. `POST /subscriptions` with invalid billing cycle
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

15. `GET /subscriptions/summary/converted?currency=GBP`
- Expect `422 Unprocessable Entity` (allowed values are `USD`, `TRY`, `EUR`).

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
6. Confirm converted summary card appears (`Converted Total`) and shows a value or fallback text.
7. Confirm upcoming payments have highlighted style.
8. Click a card; verify detail modal opens and closes.
9. In detail modal, confirm `History` section loads audit entries (`CREATED`/`UPDATED`) after create/update actions.
