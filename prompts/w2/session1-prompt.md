# W2 Session 1 – FastAPI Backend with SQLite (Read Endpoints)

I'm starting the actual backend for SubTrack. The backend lives in `tinyvault-api/`. I want FastAPI + SQLModel with a SQLite database for now. Later I'll migrate to PostgreSQL.

## Files to create

- `main.py` – FastAPI app, lifespan, route handlers
- `models.py` – SQLModel table definition and response schema
- `database.py` – engine setup and session dependency
- `requirements.txt`

## Data model

In `models.py`, create a `Subscription` class that's both a SQLModel table and a Pydantic schema. Fields:

| Field | Type | Details |
|---|---|---|
| `id` | `Optional[int]` | Primary key, auto-increment |
| `service_name` | `str` | max 120 chars |
| `category` | `str` | max 50 chars |
| `billing_cycle` | `str` | only "Monthly" or "Yearly" |
| `amount` | `float` | must be >= 0 |
| `next_payment_date` | `date` | |
| `is_active` | `bool` | default True |
| `created_at` | `datetime` | default utcnow |

Also create a `SubscriptionRead` Pydantic model (not a table) that includes all the above fields plus three computed ones: `estimated_monthly_amount`, `days_until_payment`, `upcoming_payment`.

## Database setup

In `database.py`:
```python
from sqlmodel import SQLModel, create_engine, Session

DATABASE_URL = "sqlite:///tinyvault.db"
engine = create_engine(DATABASE_URL, echo=False)

def create_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
```

## Seed data

In `main.py` use the `lifespan` context manager. On startup, call `create_db()` then check if the subscription table is empty. If it is, insert 6 subscriptions: Netflix (Entertainment, Monthly, $15.99), Spotify (Music, Monthly, $9.99), Notion (Productivity, Yearly, $96.00), Google Drive (Cloud, Monthly, $2.99), YouTube Premium (Entertainment, Monthly, $13.99), Duolingo Plus (Education, Yearly, $83.88). Set some `next_payment_date` values to be within the next 7 days so the `upcoming_payment` field triggers.

## Computed fields

Create a helper function `enrich(sub: Subscription) -> SubscriptionRead` that calculates:
- `estimated_monthly_amount`: if `billing_cycle == "Monthly"` return `amount`, if `"Yearly"` return `round(amount / 12, 2)`
- `days_until_payment`: `(sub.next_payment_date - date.today()).days`
- `upcoming_payment`: `True` if `0 <= days_until_payment <= 7`

## Endpoints

**`GET /`** – health check, returns `{"status": "ok", "service": "SubTrack API"}`

**`GET /subscriptions`** – returns `list[SubscriptionRead]`. Optional query param `active_only: bool = False`, if true only return subscriptions where `is_active == True`.

**`GET /subscriptions/{subscription_id}`** – returns one `SubscriptionRead`. If the ID doesn't exist raise `HTTPException(status_code=404, detail={"error": "Subscription not found"})`.

## CORS

Add `CORSMiddleware` allowing `http://localhost:5173` with all methods and headers. I need this for the React frontend.

## requirements.txt

```
fastapi>=0.111.0
sqlmodel>=0.0.22
uvicorn[standard]>=0.30.0
python-dotenv>=1.0.0
```

Run with `uvicorn main:app --reload` and test in Swagger at `http://127.0.0.1:8000/docs`.
