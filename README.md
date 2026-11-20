# SWE314 Web Programming - TinyVault Subscription Tracker (Full Stack)

**Instructor:** Asst. Prof. Yigit Bekir Kaya  
**Course:** SWE314 - Web Programming, Istinye University

## Overview

**TinyVault** is a full-stack subscription tracker that helps users manage recurring digital payments (Netflix, Spotify, Notion, Google Drive, etc.) in one place. The platform is fully localized in **English**, ensuring a seamless global user experience.

Business pain points addressed:
- Users forget active subscriptions
- Renewal dates are missed
- Monthly spending is unclear and uncontrolled
- Currency differences make multi-service tracking hard

## Screenshots

### Database ER Diagram (PostgreSQL — pgAdmin)

![ER Diagram](screenshots/er-diagram.png)

### App

![Dashboard 1 - Summary & Charts](screenshots/Ekran%20Resmi%202026-03-23%2022.25.05.png)
![Dashboard 2 - Forms & Filters](screenshots/Ekran%20Resmi%202026-03-23%2022.25.12.png)
![Dashboard 3 - Subscription Cards](screenshots/Ekran%20Resmi%202026-03-23%2022.25.15.png)
![Subscription Detail & History Flow](screenshots/Ekran%20Resmi%202026-03-23%2022.25.23.png)
![Edit Mode & Action Buttons](screenshots/Ekran%20Resmi%202026-03-23%2022.25.29.png)
![Calendar Export - .ics File Evidence](screenshots/Ekran%20Resmi%202026-03-23%2022.25.59.png)
![Success Toast Notification](screenshots/Ekran%20Resmi%202026-03-23%2022.26.08.png)
![Chrome Extension - Background Service Capture](screenshots/Ekran%20Resmi%202026-03-23%2022.32.56.png)
![Chrome Extension - Save Success State](screenshots/Ekran%20Resmi%202026-03-23%2022.33.54.png)
![FastAPI Swagger API Documentation](screenshots/Ekran%20Resmi%202026-03-23%20at%2018.11.22.jpeg)

### API & Test Evidence
![API Testing 1 - Filtered Resource List](screenshots/tests/WhatsApp%20Image%202026-03-23%20at%2018.24.27.jpeg)
![API Testing 2 - CREATE Endpoint Flow](screenshots/tests/WhatsApp%20Image%202026-03-23%20at%2018.24.28.jpeg)
![API Testing 3 - Summary Logic Verification](screenshots/tests/Image%202026-03-23%20at%2018.24.28.jpeg)
![API Testing 4 - UPDATE State Persistence](screenshots/tests/Image%202026-03-23%20at%2018.24.29.jpeg)
![API Testing 5 - Single Resource Retrieval](screenshots/tests/WhatsApp%20Image%202026-03-2%20at%2018.24.29.jpeg)
![API Testing 6 - Validation Constraint Check](screenshots/tests/Image%202026-03-23%20at%2018.24.4.jpeg)
![API Testing 7 - iCalendar Export Verification](screenshots/tests/Image%202026-03-23%20at%2018.24.3.jpeg)
![API Testing 8 - External FX Conversion Integration](screenshots/tests/mage%202026-03-23%20at%2018.24.28.jpeg)


## Repository Structure

```text
SubTrack/
├── tinyvault-api/            # FastAPI backend (REST API + PostgreSQL)
│   ├── main.py               # Route handlers + security middleware
│   ├── models.py             # 11 SQLModel entities with M:N relationships
│   ├── oauth.py              # OAuth integration (Google, GitHub, GitLab, Discord)
│   ├── database.py           # PostgreSQL engine configuration
│   └── requirements.txt      # Python dependencies
├── v1/tinyvault-frontend/    # Session 1: Basic React frontend
├── v2/tinyvault-frontend/    # Session 2: Full-featured React frontend
├── chrome-extension/         # Mini-Vault Chrome companion extension
├── screenshots/              # App screenshots for documentation
├── prompts/                  # AI prompts used per session
├── REPORT.md                 # Technical midterm report
├── TEST_CASES.md             # Manual test scenarios
├── SECURITY.md               # W12 security posture + operator checklist
└── responsibilities/         # Team responsibility breakdown
```

## Sessions

### Session 1 (`v1/`) - Read and Visualize Foundation

- Fetch subscriptions from backend API
- Display cards in responsive layout
- Show computed fields (monthly estimate, upcoming payment)
- Handle loading and error states

### Session 2 (`v2/`) - Interactive Full-Stack Flows with Advanced Architecture

- **🌍 i18n Localization:** Fully translated English user interface
- **🌐 Social Authentication:** 4-Provider OAuth Login (Google, GitHub, GitLab, Discord)
- **🔐 Advanced 2FA Security:** Multi-method 2FA including TOTP (Google Authenticator), Security Questions, Recovery Codes, and 30-Day Trusted Device memory
- **👑 Role-Based Access Control (RBAC):** Admin, User, and Viewer roles with a dedicated Admin Dashboard to manage users
- **🎭 E2E Testing:** Comprehensive End-to-End browser testing using Playwright
- Add new subscription form (POST) with tag support (M:N relation demo)
- Remove subscription action (DELETE) with cascade
- Search and category filtering (via relational `Category` entity)
- Server-side sorting controls
- Summary cards (active count, monthly total, due in 7 days, converted total)
- Category spend pie chart (`recharts`)
- Detail modal with inline edit/update (PUT)
- Pause/Resume subscription via `is_active` toggle
- Audit history in modal (1:N `SubscriptionAudit` relation)
- Calendar export button (`.ics` file generation)
- Toast notifications (`react-hot-toast`)
- UI animations (`gsap` + `@gsap/react`)
- Tag badges on subscription cards (M:N `Tag` relation)

## Data Model — 11 Entities with Advanced Relationships

| Entity | Role | Relation |
|--------|------|----------|
| `User` | System user for auth | Root entity |
| `UserPreference` | User settings (theme, currency) | **1:1** with User |
| `Currency` | Supported currency lookup | 1:N with UserPreference |
| `Category` | Subscription categories | **1:N** with Subscription |
| `PaymentMethod` | Credit cards / payment providers | **1:N** with Subscription |
| `Tag` | Custom user-defined labels | **M:N** with Subscription |
| `SubscriptionTagLink` | M:N junction table | Links Tag ↔ Subscription |
| `Subscription` | Core entity | Central hub |
| `SubscriptionAudit` | Change history log | **1:N** with Subscription |
| `Bill` | Historical payment records | **1:N** with Subscription |
| `Reminder` | Upcoming payment alerts | **1:N** with Subscription |

## Backend Highlights (`tinyvault-api/`)

- **FastAPI + SQLModel + PostgreSQL** architecture
- **11 distinct entities** with 1:1, 1:N, and M:N relationships
- **Social Login:** OAuthlib integration supporting Google, GitHub, GitLab, and Discord
- **Rate Limiting:** `slowapi` enforces default 60 requests/minute with JWT-aware keys (falls back to IP)
- **CORS Policy:** Restricted to `localhost:5173` and Chrome extension origins
- **Global Exception Handlers:** Clean JSON errors, no stack trace leakage
- **Pydantic validation** on all request payloads (min/max length, ge=0, Literal types)
- Real JWT authentication (`/auth/register`, `/auth/login`, `/auth/me`) with bcrypt password hashing
- Multi-user data isolation (each user sees only their own subscriptions)
- External FX API integration with timeout and 502/503 error handling
- Cascade delete on all child entities

## Week 12 Security Hardening

- Frontend deployment headers configured in `v2/tinyvault-frontend/vercel.json`:
  - CSP
  - HSTS
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
  - Permissions-Policy
- Edge middleware in `v2/tinyvault-frontend/middleware.js`:
  - Adds `x-request-id` to requests
  - Blocks `/admin/*` when `bb_session` cookie is missing (`401`)
- Backend rate limit key strategy:
  - Uses JWT `uid/sub` when authenticated
  - Falls back to client IP for anonymous traffic

> Operator-level W12 tasks (Vercel WAF rules, preview protection, Railway private networking and secret rotation) are documented in `SECURITY.md`.

## Quick Start

### Prerequisites
- Python 3.11+ and Node.js 18+
- Optional local PostgreSQL (for production-like local setup)

### 1) Start Backend

```bash
cd tinyvault-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend URL: `http://127.0.0.1:8000`  
Swagger docs: `http://127.0.0.1:8000/docs`

> **Auth note (W11):**
> 1. `POST /auth/register`
> 2. `POST /auth/login` and copy `access_token`
> 3. Swagger `Authorize` -> `Bearer <token>`

### 2) Start Frontend v2

```bash
cd v2/tinyvault-frontend
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`

### 3) Frontend Env (W11)

`v2/tinyvault-frontend/.env.development`
```env
VITE_API_URL=http://127.0.0.1:8000
```

`v2/tinyvault-frontend/.env.production.example`
```env
VITE_API_URL=https://your-backend.railway.app
```

### 4) Backend Env (W11)

`tinyvault-api/.env.example`
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET_KEY=replace-with-strong-secret
ACCESS_TOKEN_EXPIRE_MINUTES=120
FRONTEND_URL=https://your-frontend.vercel.app

# Social Login Keys (Google, GitHub, GitLab, Discord)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
# ... etc
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, CSS (Glassmorphism) |
| Frontend Libraries | GSAP, @gsap/react, Recharts, react-hot-toast |
| Testing | **Playwright** (E2E), **Pytest** (Unit Tests) |
| Backend | Python, FastAPI, SQLModel, **Authlib** (OAuth) |
| Database | **PostgreSQL 16** (via psycopg2-binary) |
| Security | JWT Bearer auth, bcrypt hash, slowapi rate limiting, restricted CORS, global error handlers |
| External Integration | Frankfurter FX API via `httpx` (async, timeout-safe) |
| Browser Extension | Chrome Extension (Manifest V3) |
