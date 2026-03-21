Extend TinyVault from Session 1 with interactivity in both backend and frontend.

Requirements:
1. Backend enhancements:
   - Add full CRUD endpoints:
     - `POST /subscriptions`
     - `PUT /subscriptions/{id}`
     - `DELETE /subscriptions/{id}`
   - Expand `GET /subscriptions` with query parameters:
     - `search`
     - `category`
     - `active_only`
     - `sort_by`
     - `sort_order`
     - `skip`, `limit`
   - Add summary endpoint:
     - `GET /subscriptions/summary/monthly-total`
     - returns active_count, estimated_monthly_total, yearly count, upcoming payments in next 7 days.

2. Frontend v2 (`v2/tinyvault-frontend/`):
   - Keep all Session 1 functionality.
   - Add a form to create new subscriptions.
   - Add remove button to delete subscriptions.
   - Add live search by service name.
   - Add category dropdown filter.
   - Add summary cards:
     - active subscriptions
     - estimated monthly total
     - due in next 7 days
   - Add detail modal on card click.

3. UX details:
   - Keep layout responsive on mobile and desktop.
   - Add transitions for cards and modal.
   - Show clear messages for empty results and failed requests.

Goal: Session 2 should demonstrate full-stack CRUD + client-side state management and filtering.
