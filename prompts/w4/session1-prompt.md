# W4 Session 1 – React + Vite Frontend (Read + Summary)

Time to build the frontend. I want to use React + Vite with JavaScript (not TypeScript). The frontend goes in `v2/tinyvault-frontend/`.

Set up with `npm create vite@latest tinyvault-frontend -- --template react` then `cd` into it and install `react-hot-toast`.

## Environment variable

The API base URL should be configurable. Create `.env`:
```
VITE_API_URL=http://127.0.0.1:8000
```

In any component that calls the API:
```js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
```

## Components to create

**`src/components/SummaryCards.jsx`**

Fetches `GET /subscriptions/summary/monthly-total` on mount. Displays 4 cards:
- Active Subscriptions (count)
- Monthly Total ($X.XX)
- Due in 7 Days (count)
- A placeholder card for "Converted Total" (I'll wire this up later)

Use `useState` for the summary data and loading state. Show "Loading..." while fetching and "Unavailable" on error.

**`src/components/SubscriptionCard.jsx`**

A presentational component that receives a `subscription` prop and renders:
- Service name as an `<h3>`
- Category badge
- Billing cycle + amount (`$X.XX / Month` or `$X.XX / Year`)
- Monthly estimate (if yearly, show the monthly normalized amount)
- Next payment date
- An "Upcoming" badge if `upcoming_payment === true` (distinct color, eye-catching)
- An "Inactive" label if `is_active === false`

**`src/components/SubscriptionList.jsx`**

The main component. Fetches `GET /subscriptions` on mount. Stores results in `useState`. Renders:
- Loading state while fetching
- An error message if fetch fails (include a retry button that re-runs the fetch)
- Empty state message if the array is empty
- A grid of `<SubscriptionCard>` components when data is loaded

## CSS

Create `src/components/SubscriptionList.css`. Use CSS custom properties matching the landing page color scheme from W1. The subscription grid should use `display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1rem`. Cards should have `background`, `border-radius`, `padding` and a hover `transform` effect.

## App structure

In `src/App.jsx`, render `<SummaryCards />` above `<SubscriptionList />`. Pass the list down from a shared fetch in App if needed, or let each component fetch independently for now.

This session is read-only – no create/edit/delete yet. Just make sure data loads correctly and looks decent.
