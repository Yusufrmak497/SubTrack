# TinyVault Midterm Report

## 1) Executive Summary
TinyVault is a full-stack subscription tracking application that addresses hidden recurring spending caused by fragmented digital subscriptions. The solution combines a React frontend with a FastAPI + SQLModel backend and a SQLite database. The delivered scope includes dashboard analytics, search/filter interactions, detail modal flows, and form-based create operations integrated with backend CRUD.

## 2) Business Problem (Depth)
### Problem Context
Users now subscribe to multiple digital services (streaming, productivity, cloud, education). Payments happen at different dates and cycles (monthly/yearly), so spending becomes hard to track.

### Root Causes
1. Subscriptions are managed across different vendor dashboards.
2. Payment dates are not centralized.
3. Yearly plans hide real monthly burden.
4. Users cannot quickly detect near-term renewals.

### Business Impact
1. Silent budget leakage from forgotten subscriptions.
2. Weak monthly budget forecasting.
3. Low financial awareness for recurring expenses.

### Why This Problem Is Worth Solving
TinyVault turns scattered subscription data into a single operational dashboard with clear monthly-equivalent cost and upcoming payment visibility. This directly supports spending control and cost-cutting decisions.

## 3) Proposed Solution
TinyVault provides one interface to:
1. List all subscriptions.
2. Add new subscriptions from the UI form.
3. Filter/search subscriptions quickly.
4. Show monthly-equivalent totals (yearly divided by 12).
5. Highlight payments due in the next 7 days.
6. Inspect details per subscription.
7. Remove unnecessary subscriptions.

## 4) Midterm Scope and Boundaries
### Included
1. Full-stack architecture (frontend + backend + DB).
2. REST API with CRUD endpoints.
3. Query capabilities (search, category filter, sorting, pagination).
4. Frontend state management and interactive dashboard.
5. Form-based create flow in frontend connected to `POST /subscriptions`.
6. Entity relation support with audit trail (`Subscription` 1:N `SubscriptionAudit`).

## 5) System Architecture
```mermaid
flowchart LR
  U[User Browser] --> F[React Frontend (Vite)]
  F -->|HTTP/JSON| A[FastAPI Backend]
  A --> S[Service Layer]
  S --> O[SQLModel ORM]
  O --> D[(SQLite DB)]
```

## 6) Technologies and Concepts Covered

| Course Concept / Capability | How It Was Applied | Evidence |
|---|---|---|
| Full-stack architecture | Separate frontend/backend/database layers | `/v2/tinyvault-frontend`, `/tinyvault-api` |
| React component architecture | UI split into reusable components | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx), [`SubscriptionCard.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionCard.jsx), [`AddSubscriptionForm.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/AddSubscriptionForm.jsx) |
| React state management (`useState`) | Local UI state for subscriptions, loading/error, search/filter, modal | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx) |
| React side effects (`useEffect`) | API fetch on component mount | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx) |
| Controlled inputs | Search/filter inputs and form fields bound to component state | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx), [`AddSubscriptionForm.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/AddSubscriptionForm.jsx) |
| Conditional rendering | Loading/error/empty states and detail modal toggling | [`SubscriptionList.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.jsx), [`SubscriptionDetail.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionDetail.jsx) |
| Responsive UI | Grid layout and media queries | [`SubscriptionList.css`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SubscriptionList.css), [`index.css`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/index.css) |
| FastAPI route design | REST endpoints with proper methods | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| Dependency injection | `Session` via `Depends(get_session)` | [`database.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/database.py), [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| Data modeling (ORM) | `Subscription` SQLModel entity | [`models.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/models.py) |
| Entities and relations | `Subscription` has one-to-many relation with `SubscriptionAudit` | [`models.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/models.py), [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| Schema-based validation | Request/response contracts in Pydantic schemas | [`schemas.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/schemas.py) |
| Service layer pattern | Business logic centralized outside routes | [`services.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/services.py) |
| Search/filter/sort/pagination | Query params on `GET /subscriptions` | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py), [`services.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/services.py) |
| Business metrics calculation | Monthly estimate and upcoming-payment logic | [`services.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/services.py), [`SummaryCards.jsx`](/Users/yaren/Desktop/webprogramming/SubTrack/v2/tinyvault-frontend/src/components/SummaryCards.jsx) |
| HTTP status codes | 200/201/204/404 flows in CRUD | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| CORS handling | Frontend origin allowlist for browser calls | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |
| Seed data bootstrapping | Auto-populate initial subscriptions | [`main.py`](/Users/yaren/Desktop/webprogramming/SubTrack/tinyvault-api/main.py) |

## 7) API Design Summary
### Endpoints
1. `GET /` - health check.
2. `GET /subscriptions` - list + query params.
3. `GET /subscriptions/{id}` - detail.
4. `GET /subscriptions/{id}/audits` - subscription audit history.
5. `POST /subscriptions` - create.
6. `PUT /subscriptions/{id}` - update.
7. `DELETE /subscriptions/{id}` - delete.
8. `GET /subscriptions/summary/monthly-total` - aggregated metrics.

### Query Parameters on `GET /subscriptions`
1. `search`
2. `category`
3. `active_only`
4. `sort_by`
5. `sort_order`
6. `skip`
7. `limit`

## 8) Data Model and Core Logic
### `Subscription` Entity
Fields: `service_name`, `category`, `billing_cycle`, `amount`, `next_payment_date`, `is_active`, `created_at`.

### `SubscriptionAudit` Entity
Fields: `subscription_id`, `action`, `note`, `created_at`.

### Entity Relation
- One subscription can have many audit entries (`Subscription 1:N SubscriptionAudit`).

### Core Algorithms
1. Monthly normalization:
   - If yearly: `amount / 12`
   - If monthly: `amount`
2. Upcoming payment:
   - `days_until_payment = next_payment_date - today`
   - `upcoming_payment = 0 <= days_until_payment <= 7`

## 9) Frontend Behavior
1. On load, fetch subscriptions from API.
2. Render dashboard summary and card grid.
3. Add subscriptions through a controlled form.
4. Apply search and category filters in real time.
5. Open detail modal on card click.
6. Delete flow updates UI state immediately after successful backend response.

## 10) Testing and Verification
Manual verification completed with:
1. API checks (`GET /`, `GET /subscriptions`, `GET /subscriptions/summary/monthly-total`).
2. CRUD check (POST -> PUT -> DELETE) via cURL.
3. Validation/error checks (`422` invalid input, `404` non-existent resource).
4. Relation check (`GET /subscriptions/{id}/audits`) after create/update actions.
5. Frontend v1 and v2 production build success (`npm run build`).
6. Frontend dev server and backend server startup validation.

Detailed scenarios are documented in [`TEST_CASES.md`](/Users/yaren/Desktop/webprogramming/SubTrack/TEST_CASES.md).

## 11) AI Usage and Originality Strategy
AI assistance was used for implementation acceleration and wording refinement. Problem framing, architecture decisions, feature boundaries, and final integration choices were manually reviewed and adjusted to keep the project specific to the subscription-cost visibility problem.

## 12) Limitations and Next Steps
### Current Limitations
1. No authentication/authorization.
2. Single-user local scope.
3. No notification integration (email/push).

### Planned Next Steps
1. Add authentication and per-user data isolation.
2. Add reminder notifications for upcoming renewals.
3. Add analytics charts (category spend trends).

## 13) Conclusion
TinyVault delivers a technically complete full-stack baseline that directly targets a real cost-control problem. The project demonstrates the course stack end-to-end and explains each concept with concrete implementation evidence.
