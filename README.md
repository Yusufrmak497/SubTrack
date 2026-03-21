# SWE314 Web Programming - TinyVault Subscription Tracker

**Instructor:** Asst. Prof. Yiğit Bekir Kaya  
**Course:** SWE314 - Web Programming, Istinye University

## Overview

**TinyVault** is a subscription tracker project designed to help users manage digital services like Netflix, Spotify, Notion, and Google Drive in one place.

Common user pain points:
- Forgetting which subscriptions are active
- Missing renewal/payment dates
- Not knowing total monthly spending
- Continuing to pay for unused services

This week-style structure follows the same pattern as `week1-web-programming`:
- **Session 1 (`v1/`)**: static landing + subscription list UI
- **Session 2 (`v2/`)**: dynamic add/remove, search, filter, and spending summary updates

## Project Structure

```
tinyvault-web-programming/
├── prompts/
│   ├── session1-prompt.md
│   └── session2-prompt.md
├── v1/
│   ├── index.html
│   └── styles.css
├── v2/
│   ├── index.html
│   └── styles.css
└── README.md
```

## How to Run

No installation is required.

1. Open `v1/index.html` for the static version.
2. Open `v2/index.html` for the interactive version.

## Session 1 - Static UI (`v1/`)

- TinyVault brand + intro section
- Subscription cards (sample data)
- Basic spending summary cards
- Category tags and payment date badges

## Session 2 - Interactive App (`v2/`)

Builds on Session 1 and adds:
- Add new subscription form
- Remove subscription action
- Search by service name
- Filter by category
- Auto-updating monthly total and active subscription count
- Upcoming payment highlighting

## Notes

You can push this folder as a standalone project repository or keep it under your course workspace.
