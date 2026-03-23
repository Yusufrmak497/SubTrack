# Session 1 Prompt - TinyVault Foundation (Backend + Read-Only Frontend)

You are building Session 1 of TinyVault, a full-stack subscription tracker.

## Goal
Create a stable foundational version that demonstrates:
- Database-backed subscription records
- FastAPI read endpoints
- React frontend data fetching and card rendering
- Computed business fields (monthly normalization, due-soon flags)

Session 1 should focus on read/analysis flows, not full edit UX.

## Business Context
Users lose money on recurring subscriptions because payment schedules are scattered.
TinyVault should centralize this information and make near-term payment risk visible.

## Stack Constraints
- Backend: FastAPI + SQLModel + SQLite
- Frontend: React + Vite (JavaScript)
- API docs: Swagger UI (`/docs`)

## Repository Structure
- Backend folder: `tinyvault-api/`
- Frontend v1 folder: `v1/tinyvault-frontend/`
- Keep prompts in `prompts/`

## Backend Requirements

### Data Model: `Subscription`
Fields:
- `id` (PK)
- `service_name`
- `category`
- `billing_cycle` (`Monthly` or `Yearly`)
- `amount` (`>= 0`)
- `next_payment_date`
- `is_active`
- `created_at`

### Seed Data
Add at least 6 seeded subscriptions (Netflix, Spotify, Notion, Google Drive, YouTube Premium, Duolingo).
Use mixed categories and include both monthly and yearly billing cycles.

### Endpoints
Implement:
- `GET /`
- `GET /subscriptions`
- `GET /subscriptions/{subscription_id}`

### Computed Response Fields
For each subscription response include:
- `estimated_monthly_amount`
- `days_until_payment`
- `upcoming_payment` (`true` if 0-7 days)

### Validation
- Reject invalid billing cycles.
- Reject negative amounts.
- Return `404` for unknown ids.
- Use typed Pydantic/SQLModel schemas.

### CORS
Enable CORS to allow frontend development origin.

## Frontend v1 Requirements

### Data Fetching
- Fetch `GET /subscriptions` on mount.
- Show loading and error states.

### UI Output
Display cards with:
- service name
- category
- billing cycle + amount
- monthly estimate
- next payment date

If `upcoming_payment=true`, show a highlighted badge.

### React Concepts
Use:
- `useState` for subscriptions/loading/error
- `useEffect` for fetch on mount

## Styling Requirements
- Responsive card grid
- Clear spacing and typography
- Card hover effect
- Distinct upcoming-payment badge

## Deliverables
Session 1 is done when:
1. Backend starts and seeds database.
2. `/docs` shows read endpoints.
3. Frontend v1 loads API data and renders cards.
4. Loading/error/empty states work.
5. Computed business fields are visible in UI.
