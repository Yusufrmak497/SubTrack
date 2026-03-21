Create a full-stack project called **TinyVault** based on FastAPI (backend) and React + Vite (frontend v1).

Requirements:
1. Backend (`tinyvault-api/`):
   - Use FastAPI + SQLModel + SQLite.
   - Create a `Subscription` model with fields:
     - service_name
     - category
     - billing_cycle (Monthly/Yearly)
     - amount
     - next_payment_date
     - is_active
     - created_at
   - Seed at least 6 subscriptions (Netflix, Spotify, Notion, Google Drive, YouTube Premium, Duolingo).
   - Add endpoints:
     - `GET /`
     - `GET /subscriptions`
     - `GET /subscriptions/{id}`
   - Include computed fields in response:
     - estimated_monthly_amount (yearly to monthly conversion)
     - days_until_payment
     - upcoming_payment (true if within 7 days)
   - Add CORS middleware for `http://localhost:5173`.

2. Frontend v1 (`v1/tinyvault-frontend/`):
   - Create React app with Vite.
   - Fetch `GET /subscriptions` on mount.
   - Show loading and error states.
   - Render responsive subscription cards showing:
     - service name
     - category
     - billing cycle + amount
     - monthly estimate
     - next payment date
   - Highlight upcoming payments with a badge.

3. Styling:
   - Use a clean responsive layout.
   - Add hover effect on cards.
   - Use a modern color palette with clear contrast.

Goal: Session 1 should establish backend + frontend data flow with a polished read-only UI.
