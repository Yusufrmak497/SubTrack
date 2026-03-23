# TinyVault Midterm Report

## 1) Executive Summary
TinyVault is a full-stack subscription tracking application designed to reduce hidden recurring costs. The system combines a React frontend (`v2`) with a FastAPI + SQLModel backend and a SQLite database. The delivered implementation covers backend CRUD, validation, filtered/sorted listing, entity relation visibility (`Subscription` -> `SubscriptionAudit`), summary analytics, external API currency conversion, and calendar export capability.

## 2) Business Problem (Depth)
### Problem Context
Modern users hold multiple subscriptions across entertainment, productivity, cloud, and education services. Payments occur at different dates and billing cycles, which makes recurring spending difficult to monitor.

### Root Causes
1. Subscription information is fragmented across many provider dashboards.
2. Renewal dates are not centralized.
3. Yearly plans hide real monthly burden.
4. Users often miss cancellation windows.

### Business Impact
1. Uncontrolled recurring expenses.
2. Weak monthly budget planning.
3. Low visibility into near-term payments.

### Why This Problem Is Worth Solving
TinyVault converts scattered subscription data into an actionable dashboard where users can inspect totals, upcoming renewals, category spend distribution, and change history for each subscription.

## 3) Proposed Solution
TinyVault provides a single interface to:
1. List and inspect subscriptions.
2. Create, update, pause/resume, and delete subscriptions.
3. Search/filter/sort subscriptions quickly.
4. See monthly normalized costs and upcoming payments.
5. View summary metrics and category distribution chart.
6. Audit each subscription's lifecycle events.
7. Convert monthly totals to target currencies (USD/TRY/EUR).
8. Download `.ics` calendar reminders for renewals.

## 4) Scope Implemented
### Included
1. Full-stack architecture (frontend + backend + DB).
2. REST API with typed schemas and validation.
3. Query-driven list endpoint (`search`, `category`, `sort_by`, `sort_order`, `skip`, `limit`).
4. Frontend interactive flows (create/delete/update/detail).
5. Summary analytics and category chart.
6. Entity relation support and UI exposure for audit history.
7. External API integration for converted summary values.
8. Calendar export endpoint for subscription reminders.
9. Toast feedback and UI animation for better UX.

## 5) System Architecture
```mermaid
flowchart LR
  U[User Browser] --> F[React Frontend (Vite)]
  F -->|HTTP/JSON| A[FastAPI Backend]
  A --> S[Service Layer]
  S --> O[SQLModel ORM]
  O --> D[(SQLite DB)]
  A --> X[External FX API]
```

## 6) Technologies and Course Concept Mapping

| Course Concept / Capability | How It Was Applied | Evidence |
|---|---|---|
| Full-stack architecture | Separate frontend/backend/database layers | `/v2/tinyvault-frontend`, `/tinyvault-api` |
| React componentization | Reusable UI components for list/card/form/modal/chart/header | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx), [`SubscriptionDetail.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionDetail.jsx), [`CategoryChart.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/CategoryChart.jsx) |
| React state management (`useState`) | Local state for list, filters, sort, selected item, modal edit form, errors | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx), [`SubscriptionDetail.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionDetail.jsx) |
| React effects (`useEffect`) | Data fetch and dependency-based refresh flows | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx), [`SubscriptionDetail.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionDetail.jsx) |
| React memoization (`useMemo`) | Category spend aggregation for chart | [`CategoryChart.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/CategoryChart.jsx) |
| Conditional rendering | Loading/error/empty states + modal state + edit mode | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx), [`SubscriptionDetail.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionDetail.jsx) |
| Frontend UX libraries | Toast notifications and entrance animations | [`App.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/App.jsx), [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx) |
| Chart visualization | Pie chart for monthly spend by category | [`CategoryChart.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/CategoryChart.jsx) |
| FastAPI route design | Resource-oriented REST endpoints | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| Dependency injection | DB session via `Depends(get_session)` | [`database.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/database.py), [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| Service layer pattern | Core business logic kept outside route handlers | [`services.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/services.py) |
| Database modeling | `Subscription` and `SubscriptionAudit` SQLModel tables | [`models.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/models.py) |
| Entities and relations | One-to-many relation for audit trail | [`models.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/models.py), [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| Validation (Pydantic) | Type/constraint enforcement for create/update payloads | [`schemas.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/schemas.py) |
| Query/filter/sort/pagination | Server-side list controls | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py), [`services.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/services.py) |
| Business calculations | Monthly normalization, due-in-7-days logic, summary metrics | [`services.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/services.py) |
| External API integration | FX conversion endpoint via `httpx` | [`services.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/services.py), [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| File generation capability | iCalendar (`.ics`) output for reminders | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| CORS handling | Cross-origin allowance for local frontend/dev tools | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |

## 7) API Design Summary
### Endpoints
1. `GET /` - health check.
2. `GET /subscriptions` - list endpoint with query options.
3. `GET /subscriptions/{subscription_id}` - detail endpoint.
4. `GET /subscriptions/{subscription_id}/audits` - subscription audit trail.
5. `GET /subscriptions/{subscription_id}/calendar` - iCalendar file export.
6. `POST /subscriptions` - create.
7. `PUT /subscriptions/{subscription_id}` - partial update.
8. `DELETE /subscriptions/{subscription_id}` - delete.
9. `GET /subscriptions/summary/monthly-total` - aggregate metrics.
10. `GET /subscriptions/summary/converted?currency=USD|TRY|EUR` - aggregate metrics converted with external FX rate.

### Query Parameters on `GET /subscriptions`
1. `search`
2. `category`
3. `active_only`
4. `sort_by`
5. `sort_order`
6. `skip`
7. `limit`

## 8) Data Model and Core Logic
### `Subscription`
Fields: `service_name`, `category`, `billing_cycle`, `amount`, `next_payment_date`, `is_active`, `created_at`.

### `SubscriptionAudit`
Fields: `subscription_id`, `action`, `note`, `created_at`.

### Entity Relation
- One subscription has many audit entries (`Subscription 1:N SubscriptionAudit`).
- Audit rows are generated on create and update operations.

### Core Algorithms
1. Monthly normalization:
   - Yearly plan -> `amount / 12`
   - Monthly plan -> `amount`
2. Upcoming payment flag:
   - `days_until_payment = next_payment_date - today`
   - `upcoming_payment = 0 <= days_until_payment <= 7`
3. Converted summary:
   - Get base summary in USD
   - Fetch FX rate (`USD -> target`)
   - Return converted total

## 9) Frontend Behavior
1. Fetches subscription list from backend and reacts to filter/sort changes.
2. Shows analytics cards and converted total card.
3. Displays category distribution chart.
4. Supports create/delete/update flows.
5. Opens detail modal with inline edit and status toggle (pause/resume).
6. Loads audit history in detail modal.
7. Exports calendar reminder (`.ics`) from modal action.
8. Uses toast notifications for user feedback.
9. Uses GSAP animation for visual polish on card loading and modal appearance.

## 10) Testing and Verification
Manual verification includes:
1. CRUD scenario checks in Swagger (`201`, `200`, `204`).
2. Validation/error checks (`422` invalid payload, `404` unknown id).
3. Query behavior checks (search/category/sort).
4. Relation check (`GET /subscriptions/{subscription_id}/audits`) after create/update.
5. External conversion check (`GET /subscriptions/summary/converted`) for valid/invalid currency.
6. Calendar export check (`GET /subscriptions/{subscription_id}/calendar`) and file download behavior.
7. Frontend checks for form, filters, sorting, detail edit, pause/resume, chart, toast, and modal history.
8. Build checks (`npm run build`) and backend startup checks.

Detailed scenarios are provided in [`TEST_CASES.md`](/Users/yaren/Desktop/webprogramming/SubTrack/TEST_CASES.md).

## 11) AI Usage and Originality Strategy
AI support was used for acceleration and drafting, while final architecture boundaries, domain mapping, feature prioritization, and integration choices were manually reviewed and adjusted to match the TinyVault business problem.

## 12) Limitations and Next Steps
### Current Limitations
1. No authentication/authorization.
2. Local single-user scope.
3. External FX conversion depends on third-party API availability.
4. Calendar export exists, but no push/email reminder delivery pipeline yet.

### Planned Next Steps
1. User accounts and per-user subscription isolation.
2. Background reminder jobs (email/push).
3. Additional analytics (trend lines, category deltas).
4. Better offline/degraded-mode handling for external API failures.

## 13) Conclusion
TinyVault demonstrates end-to-end full-stack development with strong technical coverage: database design, API architecture, validation, entity relations, frontend state-driven UI, external integration, and demonstrable testing evidence.
