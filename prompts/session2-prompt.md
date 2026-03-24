# Session 2 Prompt - TinyVault Advanced Full-Stack System

You are building TinyVault: an advanced full-stack subscription tracker in two layers — a FastAPI backend and a React + Vite frontend. The system must demonstrate robust engineering, a rich relational database schema, and security-conscious API design.

## Primary Objective

Deliver a technically strong, production-aware full-stack system that demonstrates:
- FastAPI CRUD with Pydantic validation and strict error handling
- Advanced relational data modeling (11 entities, M:N included)
- PostgreSQL database backend via SQLModel ORM
- Defense-in-depth API security (rate limiting, CORS policy, error sanitization)
- External API integration with resilient error handling
- React frontend with rich interactive features and animations

## Scope and Constraints

- Backend lives in `tinyvault-api/`
- Frontend v2 lives in `v2/tinyvault-frontend/`
- Use React + Vite (JS) and FastAPI + SQLModel + **PostgreSQL**
- Preserve Session 1 behavior while extending with full interactivity

---

## Backend Requirements

### Database: 11 Entities with Advanced Relationships

Design and implement the following entities using SQLModel (ORM over PostgreSQL):

| Entity | Purpose | Relationship |
|--------|---------|--------------|
| `User` | System user (auth anchor) | Root |
| `UserPreference` | Theme, currency preference | 1:1 with User |
| `Currency` | Supported FX currencies | 1:N with UserPreference |
| `Category` | Formalized subscription categories | 1:N with Subscription |
| `PaymentMethod` | Credit card / payment provider | 1:N with Subscription |
| `Tag` | User-defined labels | **M:N with Subscription** |
| `SubscriptionTagLink` | M:N junction table | Subscription ↔ Tag |
| `Subscription` | Core entity | Hub of all relations |
| `SubscriptionAudit` | Immutable change log | 1:N with Subscription |
| `Bill` | Historical actual payments | 1:N with Subscription |
| `Reminder` | Pre-payment alert config | 1:N with Subscription |

All `Subscription` deletions must cascade to `SubscriptionAudit`, `Bill`, and `Reminder`.

### Core Endpoints

Implement and verify all these routes:
- `GET /` — health check
- `GET /subscriptions` — list with search, filter, sort, pagination
- `GET /subscriptions/{id}` — single subscription detail
- `GET /subscriptions/{id}/audits` — audit trail (newest first)
- `GET /subscriptions/{id}/calendar` — iCalendar `.ics` file download
- `GET /subscriptions/summary/monthly-total` — aggregated metrics
- `GET /subscriptions/summary/converted?currency=USD|TRY|EUR` — FX converted summary
- `POST /subscriptions` — create (with category auto-resolution + tag assignment)
- `PUT /subscriptions/{id}` — partial update (category/tags update supported)
- `DELETE /subscriptions/{id}` — delete with cascade, return `204`

### List Endpoint Query Behavior

`GET /subscriptions` must support:
- `search` — case-insensitive service_name contains
- `category` — join to `Category` table by name
- `active_only` — boolean filter
- `sort_by` — `service_name`, `amount`, `next_payment_date`, `created_at`
- `sort_order` — `asc` or `desc`
- `skip`, `limit` — pagination

### Business Rules and Validation

- `amount` must be `>= 0` (Pydantic `ge=0`)
- `billing_cycle` must be a `Literal["Monthly", "Yearly"]`
- `service_name` between 1–120 chars, `category` between 1–50 chars
- Invalid payloads return `422 Unprocessable Entity`
- Unknown IDs return `404 Not Found`
- Successful delete returns `204 No Content`
- External FX API failures return `502 Bad Gateway`
- Invalid currency code returns `422`

### Security Requirements

Implement all of the following:

1. **Rate Limiting** — 60 requests/minute per IP using `slowapi`. Return `429 Too Many Requests` on breach.
2. **CORS Policy** — Whitelist only `localhost:5173` and Chrome extension origins. No wildcard.
3. **Global Exception Handlers** — Handle `HTTPException`, `RequestValidationError`, and all `Exception`:
   - Return clean JSON `{"error": "..."}` — never expose stack traces or internal details.
4. **Mock JWT Auth** — A `get_current_user` FastAPI `Depends` that validates a token query param. Protect write endpoints (POST, PUT, DELETE).

### Service Layer

Put all non-trivial logic in `SubscriptionService`:
- Query composition (filter + sort)
- Summary calculation and monthly normalization
- FX fetch with `httpx` async client (5s timeout)
- Audit row creation on every create/update
- Category auto-resolution: accept string → find or create `Category` row
- Tag sync: accept tag names → resolve or create `Tag` rows → update M:N link

### Seeding

On startup, if no `User` exists, seed the following 11-entity chain:
- 1 `Currency` (USD), 1 `User`, 1 `UserPreference`, 1 `PaymentMethod`,
  5 `Category` rows, 2 `Tag` rows (favorite, work),
  3 `Subscription` records linked to categories/tags/user/payment method,
  3 `SubscriptionAudit` rows for the initial CREATED event.

---

## Frontend v2 Requirements

### Core Flows

- Create subscription (POST) with toast notification
- Delete subscription (DELETE) with cascade-aware UI refresh
- Search + category filter + sort controls
- Summary cards: active count, monthly total, due in 7 days, converted total
- Detail modal on card click with GSAP animation
- Modal edit mode (inline update, PUT)
- Pause/Resume toggle via `is_active`
- Audit history list inside the modal (1:N demo)
- Calendar download button with toast feedback
- Tag badges rendered on each subscription card (M:N demo)
- Category pie chart (Recharts)

### React Concepts to Show

- `useState` for all UI/data state
- `useEffect` for fetch, dependency-driven refresh
- `useMemo` for derived chart data
- `useRef` for GSAP animation scoping

### Data Sync Rules

- After create/update/delete: refresh list + summary
- Keep modal in sync after update (use updated response directly)
- Handle loading, error, and empty states explicitly

---

## Testing Requirements

### Backend (Swagger UI: `http://127.0.0.1:8000/docs`)

1. Valid create → `201` with `tags` array in response
2. Negative amount → `422`
3. Invalid billing_cycle → `422`
4. Non-existent ID → `404` with `{"error": "Subscription not found"}`
5. Update → `200` with updated fields
6. Delete → `204`
7. Filter/search/sort queries → correct subset + order
8. Monthly summary → `200` with metrics
9. FX converted TRY/EUR → `200`
10. Invalid currency → `422`
11. Audits after create → non-empty list
12. Calendar → `text/calendar` MIME + `.ics` content
13. Unauthorized request (bad token) on POST/PUT/DELETE → `401`

### Frontend

1. Add flow with tags → success toast + new card visible with tag badge
2. Delete flow → card removed + toast
3. Search/filter/sort → list updates correctly
4. Detail modal → edit fields → save → updated data shown
5. Pause/Resume → is_active changes, card style changes
6. Audit history → at least 1 row visible after create/update
7. Category pie chart renders with correct slices
8. Converted total card shows FX-converted value
9. Calendar button → file download triggered + toast

---

## Code Quality Rules

- Route handlers must be thin — all logic in service layer
- No raw SQL — use SQLModel ORM exclusively
- All secrets (DB credentials, JWT keys) via environment variables
- Never expose stack traces in API responses
- CSS organized into component-level files with reusable classes

## Definition of Done

Session 2 is complete when:
1. All 11 entities exist and are seeded in PostgreSQL
2. All API endpoints are testable in Swagger
3. M:N relationship (Tag ↔ Subscription) is visible both in API and UI
4. Rate limiting, CORS, and error handlers are active
5. Frontend v2 demonstrates full interactive flow end-to-end
6. Validation and status codes are demonstrably correct
7. Documentation (`README`, `REPORT`, `TEST_CASES`) reflects actual implementation
