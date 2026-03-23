# Session 1 Prompt - TinyVault (Foundation Build: Read + Analyze Flow)

Build the first full-stack version of TinyVault using FastAPI (backend) and React + Vite (frontend v1).
This session is the foundation step. Focus on clean architecture, read-only data flow, and business-ready
visualization of subscriptions. Do not implement full CRUD screens yet.

## 1) Session Goal

Deliver a stable v1 where:
- Backend serves subscription data and computed analytics fields.
- Frontend consumes backend API and renders a clear dashboard-like list.
- User can understand active subscriptions and upcoming payments at a glance.
- Project is presentation-ready with Swagger and a polished UI.

Session 1 is about fundamentals: model, API, fetch flow, state handling, and responsive rendering.

---

## 2) Business Context

Problem:
- Users subscribe to many digital services.
- They forget renewals and lose spending visibility.

Session 1 product outcome:
- Centralized read-only subscription board.
- Computed monthly estimate and upcoming payment indicators.

Keep the business language visible in naming and UI text.

---

## 3) Tech Stack and Structure

Use these technologies:
- Backend: FastAPI + SQLModel + SQLite
- Frontend: React + Vite (JavaScript)
- API exploration: Swagger UI at `/docs`

Expected folder structure:
- `tinyvault-api/` for backend
- `v1/tinyvault-frontend/` for frontend
- `prompts/` for prompt records

Do not change stack in Session 1.

---

## 4) Backend Requirements (`tinyvault-api/`)

### 4.1 Data Model
Create `Subscription` model with at least:
- `id` (auto)
- `service_name`
- `category`
- `billing_cycle` (`Monthly` | `Yearly`)
- `amount` (must be non-negative)
- `next_payment_date`
- `is_active` (default true)
- `created_at`

### 4.2 Seed Data
Seed minimum 6 records on startup if DB is empty.
Use realistic examples such as:
- Netflix
- Spotify
- Notion
- Google Drive
- YouTube Premium
- Duolingo

Seed data must include mixed categories and at least one yearly plan.

### 4.3 Endpoints
Implement:
- `GET /` -> health/welcome info
- `GET /subscriptions` -> list all subscriptions
- `GET /subscriptions/{id}` -> single subscription

### 4.4 Computed Fields (important)
Each subscription response should include:
- `estimated_monthly_amount`
  - if yearly, divide amount by 12
  - if monthly, use amount as-is
- `days_until_payment`
  - date difference from today
- `upcoming_payment`
  - true if payment is in next 7 days (0-7)

This is required to show business logic depth even in read-only phase.

### 4.5 Validation and Errors
Use Pydantic/SQLModel constraints:
- Reject invalid billing cycle values.
- Reject negative amount.

Error behavior:
- Invalid payload/query/path should produce `422`.
- Unknown subscription id should produce `404`.

### 4.6 CORS
Allow frontend origin(s), especially:
- `http://localhost:5173`

Use FastAPI CORS middleware correctly so browser fetch calls do not fail.

---

## 5) Frontend v1 Requirements (`v1/tinyvault-frontend/`)

### 5.1 Data Fetch Flow
- On first render, call `GET /subscriptions`.
- Keep API base consistent with backend local URL.
- Handle loading state while request is pending.
- Handle error state when request fails.

### 5.2 Rendering
Render a responsive card list showing:
- service name
- category
- billing cycle + original amount
- estimated monthly amount
- next payment date

If `upcoming_payment=true`, show a highlighted badge on that card.

### 5.3 State Management (React fundamentals)
Use:
- `useState` for list/loading/error state
- `useEffect` for initial API fetch on mount

Do not overcomplicate with global state libraries in Session 1.

---

## 6) UI/UX and CSS Quality

The interface should be clean and readable:
- responsive grid layout
- clear spacing and typographic hierarchy
- good contrast for accessibility
- hover effect on cards
- distinct style for upcoming-payment badge

Keep CSS organized and class names meaningful.
Avoid inline style overload.

---

## 7) Swagger and Demo Readiness

Swagger page must clearly show the three endpoints.
The following should be testable from `/docs`:
1. `GET /subscriptions` returns seeded records.
2. `GET /subscriptions/{id}` returns one item.
3. Non-existing id returns `404`.

This ensures backend contract is visible before frontend demo.

---

## 8) Definition of Done (Session 1)

Session 1 is complete when:
- Backend starts cleanly and creates DB/tables.
- Seed data appears automatically.
- `/docs` endpoints are functional.
- Frontend loads and displays subscription cards from API.
- Loading/error states are visible and meaningful.
- Upcoming payment badge works from computed field.
- Layout works on both desktop and mobile widths.

Keep this version read-focused. Advanced create/update/delete flows belong to Session 2.
