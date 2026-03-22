# SWE314 Web Programming - TinyVault Subscription Tracker (Full Stack)

**Instructor:** Asst. Prof. Yigit Bekir Kaya  
**Course:** SWE314 - Web Programming, Istinye University

## Overview

**TinyVault** is a full-stack subscription tracker that helps users manage services such as Netflix, Spotify, Notion, and Google Drive in one dashboard.

Problem solved:
- Users forget active subscriptions
- Renewal dates are missed
- Total monthly spending is unclear
- Unused services keep charging

## Repository Structure

```
SubTrack/
├── tinyvault-api/            # FastAPI backend (REST API + SQLite)
├── v1/tinyvault-frontend/    # Session 1: Basic React frontend
├── v2/tinyvault-frontend/    # Session 2: Enhanced React frontend
├── prompts/                  # AI prompts used per session
├── TEST_CASES.md             # Step-by-step manual test scenarios
└── README.md
```

## Sessions

### Session 1 — React Fundamentals (`v1/`)

- Fetch subscriptions from API
- Display cards in responsive grid
- Show monthly estimate and payment info
- Handle loading and error states

### Session 2 — Interactivity & State Management (`v2/`)

- Add new subscription form
- Remove subscriptions
- Search by service name
- Filter by category
- Summary cards (active count, monthly total, upcoming payments)
- Highlight payments due in next 7 days
- Detail modal for selected subscription

### Backend — FastAPI (`tinyvault-api/`)

- CRUD endpoints for subscriptions
- One-to-many relation: `Subscription` -> `SubscriptionAudit` (audit trail)
- Query support (search, filter, sort, pagination)
- Summary endpoint for spending metrics
- SQLite database with seed data
- CORS enabled for Vite frontend

## Quick Start

### 1) Start Backend

```bash
cd tinyvault-api
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at `http://localhost:8000` and Swagger docs at `http://localhost:8000/docs`.

### 2) Start Frontend (v1 or v2)

Open a second terminal:

```bash
cd v1/tinyvault-frontend
npm install
npm run dev
```

or

```bash
cd v2/tinyvault-frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/subscriptions` | List subscriptions (search/filter/sort/pagination) |
| GET | `/subscriptions/summary/monthly-total` | Summary metrics |
| GET | `/subscriptions/{id}` | Get one subscription |
| GET | `/subscriptions/{id}/audits` | Get audit history for one subscription |
| POST | `/subscriptions` | Create subscription |
| PUT | `/subscriptions/{id}` | Update subscription |
| DELETE | `/subscriptions/{id}` | Delete subscription |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, CSS |
| Backend | Python, FastAPI, SQLModel |
| Database | SQLite |
