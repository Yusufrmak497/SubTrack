# Session 2 Prompt - TinyVault Interactive Full-Stack (CRUD + Relations + External API)

You are extending TinyVault Session 1 into a feature-rich Session 2 implementation.

## Primary Objective
Deliver a technically strong full-stack system that demonstrates:
- FastAPI CRUD and validation
- Query-based search/filter/sort flows
- Entity relation visibility (`Subscription` -> `SubscriptionAudit`)
- External API integration for currency conversion
- Enhanced frontend UX (charts, toasts, animations, editable modal)

## Scope and Constraints
- Keep backend in `tinyvault-api/`
- Keep frontend v2 in `v2/tinyvault-frontend/`
- Use React + Vite (JS) and FastAPI + SQLModel + SQLite
- Preserve Session 1 behavior while adding interactivity

## Backend Requirements

### Core Endpoints
Implement and verify:
- `GET /`
- `GET /subscriptions`
- `GET /subscriptions/{subscription_id}`
- `POST /subscriptions`
- `PUT /subscriptions/{subscription_id}`
- `DELETE /subscriptions/{subscription_id}`
- `GET /subscriptions/{subscription_id}/audits`
- `GET /subscriptions/summary/monthly-total`
- `GET /subscriptions/summary/converted?currency=USD|TRY|EUR`
- `GET /subscriptions/{subscription_id}/calendar`

### List Endpoint Query Behavior
`GET /subscriptions` must support:
- `search` (service_name contains, case-insensitive)
- `category`
- `active_only`
- `sort_by` (`service_name`, `amount`, `next_payment_date`, `created_at`)
- `sort_order` (`asc`, `desc`)
- `skip`, `limit`

### Business Rules and Validation
- Invalid payloads return `422`
- Unknown ids return `404`
- Delete success returns `204`
- Converted summary invalid currency returns `422`
- External API failures return meaningful gateway/service errors (`502/503`)

### Service Layer Separation
Place non-trivial logic in service functions:
- Query composition
- Summary calculation
- Monthly normalization
- Upcoming-payment computation
- External FX fetch and conversion
- Audit row creation on create/update

### Relation Requirement
Data model must include:
- `Subscription` table
- `SubscriptionAudit` table
- One-to-many relation (`Subscription.audits`)

Audit endpoint should return newest entries first.

### Calendar Export Requirement
`GET /subscriptions/{subscription_id}/calendar` should:
- Return `text/calendar`
- Generate valid `.ics` content
- Include recurring rule based on billing cycle (`MONTHLY` or `YEARLY`)

## Frontend v2 Requirements

### Core Flows
- Create subscription form
- Delete action on cards
- Search + category filter controls
- Sorting controls (`sort_by`, `sort_order`)
- Summary cards (active count, monthly total, due in 7 days, converted total)
- Detail modal on card click
- Modal edit mode for update
- Pause/Resume action (`is_active` toggle)
- Audit history section in modal
- Calendar download button

### Additional UX Capabilities
- Toast notifications for create/update/delete and calendar action
- Card and modal animations using GSAP
- Category spend pie chart using Recharts
- Responsive layout and readable visual hierarchy

### React Concepts to Show Explicitly
Use intentionally:
- `useState` for UI/data state
- `useEffect` for fetch and dependency-driven refresh
- `useMemo` for derived chart data
- Refs (`useRef`) where needed for animation scope

### Data Synchronization Rules
- After create/update/delete, refresh list and summary data.
- Keep modal selected item synchronized after update.
- Handle loading/error/empty states gracefully.

## Testing Requirements (Swagger + Frontend)

### Backend Test Scenarios
1. Valid create -> `201`
2. Invalid create (negative amount) -> `422`
3. Invalid billing_cycle -> `422`
4. Non-existent detail -> `404`
5. Update -> `200`
6. Delete -> `204`
7. Filter/search/sort queries -> `200` and expected subset/order
8. Monthly summary -> `200`
9. Converted summary TRY/EUR -> `200`
10. Converted summary invalid currency -> `422`
11. Audits after create/update -> non-empty list
12. Calendar export -> downloadable `.ics` response

### Frontend Test Scenarios
1. Add flow works and shows success toast
2. Delete flow works and shows success toast
3. Search/filter/sort control updates visible list
4. Detail modal opens, edits, and saves updates
5. Pause/Resume changes status
6. Audit history list is visible in modal
7. Category pie chart is rendered
8. Converted total card is visible
9. Calendar action triggers download and toast feedback

## Code Quality Rules
- Keep route handlers thin.
- Keep logic in service layer.
- Use clear naming and avoid hidden side effects.
- Keep CSS organized and reusable.
- Avoid exposing secrets or committing private local data.

## Definition of Done
Session 2 is complete when:
1. All endpoints above are available and testable in Swagger.
2. Frontend v2 demonstrates full interactive flow end-to-end.
3. Validation and status codes are demonstrably correct.
4. Entity relation is visible both in API and UI.
5. External API and calendar export capabilities are working.
6. Documentation (`README`, `REPORT`, `TEST_CASES`) reflects actual implementation.
