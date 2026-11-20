# W9 Session 1 – Frontend Unit Tests with Vitest + MSW

I want to add unit tests for the React components. I'll use Vitest as the test runner and MSW (Mock Service Worker) to intercept fetch calls so tests don't need a real backend running.

## Setup

Install these packages (all dev dependencies):
```
npm install -D vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom msw
```

Add to `vite.config.js`:
```js
test: {
  globals: true,
  environment: 'jsdom',
  setupFiles: ['./src/__tests__/setup.js'],
}
```

Create `src/__tests__/setup.js`:
```js
import '@testing-library/jest-dom'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
afterEach(() => cleanup())
```

## MSW handlers

Create `src/__tests__/mocks/handlers.js`. Define mock API responses for all the endpoints the components use:

```js
import { http, HttpResponse } from 'msw'

const mockSubscriptions = [
  {
    id: 1, service_name: 'Netflix', category: 'Entertainment',
    billing_cycle: 'Monthly', amount: 15.99, next_payment_date: '2026-06-10',
    is_active: true, estimated_monthly_amount: 15.99,
    days_until_payment: 5, upcoming_payment: true, tags: []
  },
  // add a few more...
]

export const handlers = [
  http.get('*/subscriptions', () => HttpResponse.json(mockSubscriptions)),
  http.get('*/subscriptions/summary/monthly-total', () =>
    HttpResponse.json({ active_count: 2, total_monthly_estimate: 25.98, upcoming_payments_count: 1 })
  ),
  http.post('*/subscriptions', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ id: 99, ...body, estimated_monthly_amount: body.amount, tags: [] }, { status: 201 })
  }),
  http.delete('*/subscriptions/:id', () => new HttpResponse(null, { status: 204 })),
  http.put('*/subscriptions/:id', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({ ...mockSubscriptions[0], ...body })
  }),
  http.get('*/subscriptions/:id/audits', () => HttpResponse.json([])),
  // add auth handlers, summary/converted etc.
]
```

Create `src/__tests__/mocks/server.js`:
```js
import { setupServer } from 'msw/node'
import { handlers } from './handlers'
export const server = setupServer(...handlers)
```

In `setup.js`, start the server:
```js
import { server } from './mocks/server'
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

## Tests to write

**`SubscriptionCard.test.jsx`** – test that all fields render correctly (service name, category, amount, billing cycle, monthly estimate, next payment, upcoming badge, inactive label). Test that clicking Remove calls `onDelete`. Test that clicking the card calls `onSelect`.

**`SummaryCards.test.jsx`** – test that the 4 summary cards render with correct values. Test loading state. Test the converted total chip selector (clicking TRY triggers the right fetch).

**`AddSubscriptionForm.test.jsx`** (or part of `SubscriptionList.test.jsx`) – test that submitting with empty fields shows an error toast. Test that submitting valid data calls the API and triggers `onCreate`.

**`SubscriptionList.test.jsx`** – test that cards render after loading. Test that the delete button on a card removes it. Test that opening a card shows the detail modal. Test that editing in the modal and saving calls the update API.

Add a `test:coverage` script to `package.json`:
```json
"test:coverage": "vitest run --coverage"
```

Run `npm run test:coverage` and check that the important components have decent coverage.
