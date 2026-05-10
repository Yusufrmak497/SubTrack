/**
 * msw-handlers.js — Mock Service Worker handlers for all API endpoints.
 *
 * Provides realistic mock responses that mirror the real tinyvault-api
 * so unit/integration tests can run without a live backend.
 */

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const API = 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

export const MOCK_TOKEN = 'mock.jwt.token'

export const MOCK_USERS = [
  { id: 1, username: 'admin_rojhat', email: 'admin@local.com', role: 'admin',  is_active: true,  created_at: '2026-04-30T00:00:00' },
  { id: 2, username: 'demo_user',    email: 'user@local.com',  role: 'user',   is_active: true,  created_at: '2026-05-10T00:00:00' },
  { id: 3, username: 'demo_viewer',  email: 'view@local.com',  role: 'viewer', is_active: true,  created_at: '2026-05-10T00:00:00' },
]

export const MOCK_SUBSCRIPTIONS = [
  {
    id: 1,
    service_name: 'Netflix',
    category: 'Entertainment',
    billing_cycle: 'Monthly',
    amount: 15.99,
    next_payment_date: '2026-05-15',
    is_active: true,
    created_at: '2026-01-01T00:00:00',
    estimated_monthly_amount: 15.99,
    days_until_payment: 5,
    upcoming_payment: true,
    tags: ['favorite'],
  },
  {
    id: 2,
    service_name: 'Spotify',
    category: 'Music',
    billing_cycle: 'Monthly',
    amount: 9.99,
    next_payment_date: '2026-05-20',
    is_active: true,
    created_at: '2026-01-02T00:00:00',
    estimated_monthly_amount: 9.99,
    days_until_payment: 10,
    upcoming_payment: false,
    tags: [],
  },
  {
    id: 3,
    service_name: 'Notion',
    category: 'Productivity',
    billing_cycle: 'Yearly',
    amount: 96.0,
    next_payment_date: '2026-12-01',
    is_active: false,
    created_at: '2026-01-03T00:00:00',
    estimated_monthly_amount: 8.0,
    days_until_payment: 200,
    upcoming_payment: false,
    tags: ['work'],
  },
]

export const MOCK_SUMMARY = {
  active_count: 2,
  estimated_monthly_total: 25.98,
  yearly_subscription_count: 0,
  upcoming_payments_next_7_days: 1,
}

export const MOCK_CONVERTED_SUMMARY = {
  base_currency: 'USD',
  target_currency: 'TRY',
  rate: 32.5,
  estimated_monthly_total_base: 25.98,
  estimated_monthly_total_converted: 844.35,
  active_count: 2,
}

export const MOCK_AUDITS = [
  {
    id: 1,
    subscription_id: 1,
    action: 'CREATED',
    note: 'System seeded Netflix',
    created_at: '2026-01-01T00:00:00',
  },
  {
    id: 2,
    subscription_id: 1,
    action: 'UPDATED',
    note: 'Subscription details updated.',
    created_at: '2026-02-01T00:00:00',
  },
]

// ---------------------------------------------------------------------------
// MSW Handlers
// ---------------------------------------------------------------------------

export const handlers = [
  // Auth — login
  http.post(`${API}/auth/login`, async ({ request }) => {
    const body = await request.text()
    const params = new URLSearchParams(body)
    const username = params.get('username')
    const password = params.get('password')

    const accounts = {
      admin_rojhat: { password: 'admin123',  role: 'admin' },
      demo_user:    { password: 'user123',   role: 'user'  },
      demo_viewer:  { password: 'viewer123', role: 'viewer' },
    }
    const account = accounts[username]
    if (account && account.password === password) {
      return HttpResponse.json({
        access_token: MOCK_TOKEN,
        token_type: 'bearer',
        role: account.role,
        username,
      })
    }
    return HttpResponse.json({ detail: 'Incorrect username or password' }, { status: 401 })
  }),

  // Auth — register
  http.post(`${API}/auth/register`, async ({ request }) => {
    const body = await request.json()
    if (!body.username || body.username.length < 3) {
      return HttpResponse.json({ detail: 'Invalid username' }, { status: 422 })
    }
    if (body.username === 'existing_user') {
      return HttpResponse.json({ detail: 'Username already taken' }, { status: 409 })
    }
    return HttpResponse.json(
      { id: 99, username: body.username, email: body.email, role: 'user', is_active: true, created_at: new Date().toISOString() },
      { status: 201 },
    )
  }),

  // Auth — me
  http.get(`${API}/auth/me`, ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    return HttpResponse.json({ id: 1, username: 'admin_rojhat', email: 'admin@local.com', role: 'admin', is_active: true, created_at: '2026-04-30T00:00:00' })
  }),

  // Admin — list users
  http.get(`${API}/admin/users`, ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) return HttpResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    return HttpResponse.json(MOCK_USERS)
  }),

  // Admin — update role
  http.put(`${API}/admin/users/:id/role`, async ({ request, params }) => {
    const body = await request.json()
    const user = MOCK_USERS.find(u => u.id === parseInt(params.id))
    if (!user) return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
    return HttpResponse.json({ ...user, role: body.role })
  }),

  // Admin — toggle status
  http.put(`${API}/admin/users/:id/status`, ({ params }) => {
    const user = MOCK_USERS.find(u => u.id === parseInt(params.id))
    if (!user) return HttpResponse.json({ detail: 'Not found' }, { status: 404 })
    return HttpResponse.json({ ...user, is_active: !user.is_active })
  }),

  // List subscriptions
  http.get(`${API}/subscriptions`, ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const search = url.searchParams.get('search')
    const category = url.searchParams.get('category')
    const activeOnly = url.searchParams.get('active_only') === 'true'

    let results = [...MOCK_SUBSCRIPTIONS]

    if (search) {
      results = results.filter((s) =>
        s.service_name.toLowerCase().includes(search.toLowerCase()),
      )
    }
    if (category) {
      results = results.filter(
        (s) => s.category.toLowerCase() === category.toLowerCase(),
      )
    }
    if (activeOnly) {
      results = results.filter((s) => s.is_active)
    }

    return HttpResponse.json(results)
  }),

  // Get single subscription
  http.get(`${API}/subscriptions/:id`, ({ params }) => {
    const id = parseInt(params.id)
    const sub = MOCK_SUBSCRIPTIONS.find((s) => s.id === id)
    if (!sub) {
      return HttpResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }
    return HttpResponse.json(sub)
  }),

  // Create subscription
  http.post(`${API}/subscriptions`, async ({ request }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const newSub = {
      id: 99,
      ...body,
      category: body.category || 'Entertainment',
      created_at: new Date().toISOString(),
      estimated_monthly_amount: body.billing_cycle === 'Yearly'
        ? body.amount / 12
        : body.amount,
      days_until_payment: 5,
      upcoming_payment: true,
      tags: body.tags || [],
    }
    return HttpResponse.json(newSub, { status: 201 })
  }),

  // Update subscription
  http.put(`${API}/subscriptions/:id`, async ({ request, params }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const id = parseInt(params.id)
    const existing = MOCK_SUBSCRIPTIONS.find((s) => s.id === id)
    if (!existing) {
      return HttpResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }
    const body = await request.json()
    return HttpResponse.json({ ...existing, ...body })
  }),

  // Delete subscription
  http.delete(`${API}/subscriptions/:id`, ({ request, params }) => {
    const auth = request.headers.get('Authorization')
    if (!auth || !auth.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const id = parseInt(params.id)
    const exists = MOCK_SUBSCRIPTIONS.find((s) => s.id === id)
    if (!exists) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return new HttpResponse(null, { status: 204 })
  }),

  // Monthly summary
  http.get(`${API}/subscriptions/summary/monthly-total`, () => {
    return HttpResponse.json(MOCK_SUMMARY)
  }),

  // Converted summary
  http.get(`${API}/subscriptions/summary/converted`, ({ request }) => {
    const url = new URL(request.url)
    const currency = url.searchParams.get('currency') || 'TRY'
    if (!['USD', 'TRY', 'EUR'].includes(currency)) {
      return HttpResponse.json({ error: 'Invalid currency' }, { status: 422 })
    }
    return HttpResponse.json(MOCK_CONVERTED_SUMMARY)
  }),

  // Audits
  http.get(`${API}/subscriptions/:id/audits`, ({ params }) => {
    const id = parseInt(params.id)
    return HttpResponse.json(MOCK_AUDITS.filter((a) => a.subscription_id === id))
  }),
]

// Create and export the MSW server
export const server = setupServer(...handlers)
