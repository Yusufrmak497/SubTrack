# Session 2 Prompt - TinyVault (Full-Stack CRUD + Validation + Relations + External API)

You are extending TinyVault from Session 1 into a production-style Session 2 implementation.
The project must stay aligned with the same business problem: users forget active subscriptions,
miss renewal dates, and lose control of recurring spending.

## 1) Objective

Build a full-stack v2 that demonstrates:
- Backend CRUD with filtering, sorting, pagination, and validation
- Frontend stateful UI with create/delete/search/filter/detail flows
- Entity relation visibility (Subscription -> SubscriptionAudit)
- External API integration (currency conversion for monthly total)
- Theme management (dark/light toggle with persistent preference)
- Clear technical structure suitable for academic presentation

The output should show not only that features work, but why implementation choices are correct.

---

## 2) Technology Constraints

- Backend: FastAPI + SQLModel + SQLite
- Frontend: React + Vite (JavaScript)
- API docs/testing: Swagger UI (`/docs`)
- Use CORS for frontend dev origin(s)
- Keep existing project folder structure:
  - `tinyvault-api/`
  - `v2/tinyvault-frontend/`
  - `prompts/`

Do not replace stack or migrate to TypeScript in this session.

---

## 3) Domain Model and Relation

### Main Entity: `Subscription`
Required fields:
- `id`
- `service_name`
- `category`
- `billing_cycle` (`Monthly` | `Yearly`)
- `amount` (`>= 0`)
- `next_payment_date`
- `is_active`
- `created_at`

### Related Entity: `SubscriptionAudit`
Required fields:
- `id`
- `subscription_id` (FK -> Subscription)
- `action` (`CREATED`, `UPDATED`, etc.)
- `note` (nullable)
- `created_at`

Relation requirement:
- One `Subscription` has many `SubscriptionAudit` records.
- API and frontend must expose this relation in a meaningful way.

---

## 4) Backend Requirements (FastAPI)

Implement or keep these endpoints:
- `GET /`
- `GET /subscriptions`
- `GET /subscriptions/{subscription_id}`
- `POST /subscriptions`
- `PUT /subscriptions/{subscription_id}`
- `DELETE /subscriptions/{subscription_id}`
- `GET /subscriptions/{subscription_id}/audits`
- `GET /subscriptions/summary/monthly-total`
- `GET /subscriptions/summary/converted?currency=USD|TRY|EUR`

### 4.1 List Endpoint Behavior
`GET /subscriptions` must support query params:
- `search` (case-insensitive service name search)
- `category` (exact category filter, case-insensitive)
- `active_only` (boolean)
- `sort_by` (`service_name`, `amount`, `next_payment_date`, `created_at`)
- `sort_order` (`asc` | `desc`)
- `skip`, `limit`

### 4.2 Response Enrichment
Each subscription response should include computed fields:
- `estimated_monthly_amount` (if yearly: divide by 12)
- `days_until_payment`
- `upcoming_payment` (true when next payment is in 0-7 days)

### 4.3 Validation and Error Handling
Use Pydantic constraints and return proper HTTP codes:
- `422` for validation errors (negative amount, invalid enum, missing fields)
- `404` for unknown subscription id
- `204` for successful delete with empty body
- `503` for external FX service unavailability
- `502` for malformed external service payload

### 4.4 Service Layer
Keep business logic in service methods, not directly in route handlers.
Route handlers should be thin and delegate to service layer.

### 4.5 Audit Creation Rules
- Create audit row on `POST /subscriptions`
- Create audit row on `PUT /subscriptions/{subscription_id}`
- `GET /subscriptions/{subscription_id}/audits` returns audit history sorted by newest first

### 4.6 External API Integration
Use an HTTP client (e.g., `httpx`) to fetch FX rates.
`GET /subscriptions/summary/converted` should:
1. Compute current monthly summary in USD
2. Fetch conversion rate for target currency
3. Return base amount, rate, converted amount, active count

---

## 5) Frontend Requirements (React v2)

Target folder: `v2/tinyvault-frontend/`

### 5.1 Core UI Flows
- Subscription cards list
- Create form (add new subscription)
- Delete action from card
- Search input by service name
- Category dropdown filter
- Summary cards at top
- Detail modal when clicking a card
- Audit history section inside detail modal
- Dark/light mode toggle in header with icon button

### 5.2 Hook Usage (must be intentional)
Use hooks with clear purpose:
- `useState`: local UI state (data, form state, selected item, errors)
- `useEffect`: lifecycle side effects (initial fetch, detail-driven fetch)
- `useMemo`: derived computations (filtered list, categories, summary derivation)

Do not use hooks randomly. Each hook must match the problem it solves.

### 5.3 Why This Hook Strategy
- `useEffect` prevents repeated uncontrolled fetch calls and ties data loading to dependencies.
- `useMemo` avoids recalculating heavy derived lists on unrelated re-renders.
- `useState` keeps UI reactive and predictable for user interactions.

### 5.4 UX and Styling
- Responsive layout for desktop and mobile
- Clear empty/loading/error states
- Card hover transitions and modal overlay for interaction clarity
- Consistent spacing, readable hierarchy, accessible contrast
- Keep CSS modular and readable (component-scoped class names)
- Implement light/dark themes using CSS variables (no duplicated style blocks)
- Persist selected theme in browser storage and restore on load

### 5.5 External Summary in UI
Display converted total (TRY by default) on summary area.
If conversion endpoint fails, show graceful fallback text such as `Unavailable`.

---

## 6) Testing Scenarios (Swagger + UI)

Must be demonstrable from `/docs`:
1. `POST /subscriptions` valid payload -> `201`
2. `POST /subscriptions` with negative amount -> `422`
3. `GET /subscriptions/{subscription_id}` for unknown id -> `404`
4. `PUT /subscriptions/{subscription_id}` valid update -> `200`
5. `DELETE /subscriptions/{subscription_id}` -> `204`
6. `GET /subscriptions?search=...&category=...` -> filtered result
7. `GET /subscriptions/summary/monthly-total` -> aggregate metrics
8. `GET /subscriptions/summary/converted?currency=TRY` -> converted result
9. `GET /subscriptions/{subscription_id}/audits` after create/update -> non-empty audit list

UI checks:
- Add form creates new card without page reload
- Search/filter updates list instantly
- Modal opens and shows audit history
- Converted summary card is visible and updates
- Theme toggle switches between dark/light and persists after refresh

---

## 7) Code Quality and Delivery Rules

- Keep functions short and focused
- Prefer clear naming over clever shortcuts
- Add short comments only where logic is non-obvious
- Do not mix database logic into React components
- Do not expose secrets or `.env` files
- Ensure build/compile commands pass before finalizing

---

## 8) Definition of Done

Session 2 is complete when:
- Backend CRUD + filtering + validation endpoints work in Swagger
- Frontend v2 supports create/delete/search/filter/detail flows
- Audit relation is visible to end user in detail modal
- External API conversion endpoint works and is visible in UI summary
- Dark/light mode toggle works and keeps user preference across reloads
- Error states are handled gracefully
- Implementation is presentable with technical reasoning, not only screenshots
