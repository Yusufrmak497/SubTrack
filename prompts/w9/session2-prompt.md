# W9 Session 2 – Playwright E2E Tests

Now I want end-to-end tests using Playwright. These tests run against the real frontend and backend, so both need to be running. Tests should cover the main user flows from the browser's perspective.

## Setup

Install Playwright:
```
npm init playwright@latest
```

Choose JavaScript, put tests in `tests/`, install Chromium. This creates `playwright.config.js`.

Update `playwright.config.js` to set `baseURL: 'http://localhost:5173'` and `timeout: 30000`. Also set `use: { headless: true }` for CI.

## Test files

**`tests/auth.spec.js`** – Login and logout flows:
- Navigate to `/login`, fill in username/password, click Login, verify redirect to `/app`
- Test wrong password shows an error message
- Test that `/app` redirects unauthenticated users to `/login`
- Test the logout button clears the session and redirects to `/login`
- Test that OAuth buttons are visible on the login page

**`tests/subscriptions.spec.js`** – Main CRUD flows:
- Create a subscription: fill the form, pick a category chip, set billing cycle toggle, submit → verify card appears in the list
- Delete a subscription: click the remove button → verify card disappears
- Open the detail modal: click a card → verify modal opens with the subscription name
- Edit in the modal: click Edit, change the amount, save → verify the updated amount shows in the modal
- Pause/resume: click the Pause button → verify the card shows inactive state, click Resume → active again
- Calendar download: click the Calendar button → verify a file download is triggered

**`tests/filters.spec.js`** – Search and filter:
- Type in the search box → verify list filters to matching subscriptions
- Select a category chip in the filter → verify only that category shows
- Change sort to "Amount" → verify cards are in the right order
- Toggle sort direction → verify order reverses

**`tests/ui.spec.js`** – UI and visual:
- Dark mode toggle works: click the toggle, verify `body.dark` class is added
- Dark mode persists: toggle dark, reload page, verify it's still dark
- Verify the category chart renders (check for `<svg>` inside the chart container)
- Currency selector: click TRY chip, verify the converted total updates

## Test helpers

Create `tests/helpers/auth.js` with a `loginAsAdmin(page)` helper function that logs in with the admin credentials and waits for the app to load. Use this in `beforeEach` for tests that need to be authenticated:

```js
export async function loginAsAdmin(page) {
  await page.goto('/login')
  await page.fill('input[name="username"]', 'admin_rojhat')
  await page.fill('input[name="password"]', 'admin123')
  await page.click('button[type="submit"]')
  // handle 2FA if needed
  await page.waitForURL('**/app')
}
```

## Running tests

Add to `package.json`:
```json
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

Both backend (`uvicorn main:app`) and frontend (`npm run dev`) must be running before executing `npm run test:e2e`.
