# SWE314 Web Programming - TinyVault Subscription Tracker (Full Stack)

**Instructor:** Asst. Prof. Yigit Bekir Kaya  
**Course:** SWE314 - Web Programming, Istinye University

## Overview

**TinyVault** is a full-stack subscription tracker that helps users manage recurring digital payments (Netflix, Spotify, Notion, Google Drive, etc.) in one place.

Business pain points addressed:
- Users forget active subscriptions
- Renewal dates are missed
- Monthly spending is unclear
- Unused subscriptions continue charging

## Repository Structure

```text
SubTrack/
├── tinyvault-api/            # FastAPI backend (REST API + SQLite)
├── v1/tinyvault-frontend/    # Session 1: Basic React frontend
├── v2/tinyvault-frontend/    # Session 2: Enhanced React frontend
├── prompts/                  # AI prompts used per session
├── REPORT.md                 # Technical midterm report
├── TEST_CASES.md             # Manual test scenarios
└── responsibilities/         # Team responsibility files
```

## Sessions

### Session 1 (`v1/`) - Read and Visualize Foundation

- Fetch subscriptions from backend API
- Display cards in responsive layout
- Show computed fields (monthly estimate, upcoming payment)
- Handle loading and error states

### Session 2 (`v2/`) - Interactive Full-Stack Flows

- Add new subscription form (POST)
- Remove subscription action (DELETE)
- Search and category filtering
- Server-side sorting controls
- Summary cards (active, monthly total, due in 7 days, converted total)
- Category pie chart (`recharts`)
- Detail modal with inline edit/update (PUT)
- Pause/Resume subscription via `is_active` update
- Audit history in modal (`SubscriptionAudit` relation)
- Calendar export button (`.ics` file)
- Toast notifications (`react-hot-toast`)
- UI animations (`gsap` + `@gsap/react`)

## Backend Highlights (`tinyvault-api/`)

- FastAPI + SQLModel + SQLite architecture
- CRUD endpoints for `Subscription`
- One-to-many relation: `Subscription -> SubscriptionAudit`
- Query support: `search`, `category`, `sort_by`, `sort_order`, `skip`, `limit`
- Summary endpoint: `/subscriptions/summary/monthly-total`
- External FX integration endpoint: `/subscriptions/summary/converted`
- iCalendar export endpoint: `/subscriptions/{subscription_id}/calendar`
- Pydantic validation and typed response schemas
- CORS enabled via `allow_origin_regex=".*"`

## Quick Start

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

### 2) Start Frontend v2

```bash
cd v2/tinyvault-frontend
npm install
npm run dev
```

Frontend URL: `http://127.0.0.1:5173`

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health / welcome |
| GET | `/subscriptions` | List subscriptions (filter + sort + pagination) |
| GET | `/subscriptions/summary/monthly-total` | Aggregated summary metrics |
| GET | `/subscriptions/summary/converted?currency=USD\|TRY\|EUR` | Converted summary using external FX rate |
| GET | `/subscriptions/{subscription_id}` | Get one subscription |
| GET | `/subscriptions/{subscription_id}/audits` | Get audit history for one subscription |
| GET | `/subscriptions/{subscription_id}/calendar` | Download iCalendar reminder (`.ics`) |
| POST | `/subscriptions` | Create subscription |
| PUT | `/subscriptions/{subscription_id}` | Update subscription |
| DELETE | `/subscriptions/{subscription_id}` | Delete subscription |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, CSS |
| Frontend Libraries | GSAP, @gsap/react, Recharts, react-hot-toast |
| Backend | Python, FastAPI, SQLModel |
| Database | SQLite |
| External Integration | Frankfurter FX API via `httpx` |
