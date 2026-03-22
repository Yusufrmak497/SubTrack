"""
TinyVault API - FastAPI + SQLModel backend

Run commands:
1) python3 -m venv venv
2) source venv/bin/activate
3) pip install -r requirements.txt
4) uvicorn main:app --reload
5) Open docs: http://127.0.0.1:8000/docs
"""

from contextlib import asynccontextmanager
from datetime import date, timedelta
from typing import Optional

from fastapi import Depends, FastAPI, Query, Response
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, select

from database import create_db_and_tables, engine, get_session
from models import Subscription
from schemas import (
    SubscriptionAuditResponse,
    SummaryResponse,
    SubscriptionCreate,
    SubscriptionResponse,
    SubscriptionUpdate,
)
from services import SubscriptionService


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create tables and seed initial subscriptions at startup."""
    create_db_and_tables()
    _seed_subscriptions()
    yield


app = FastAPI(
    title="TinyVault API",
    version="1.0.0",
    description="Subscription tracker backend for digital services.",
    lifespan=lifespan,
)

# Browser security blocks cross-origin requests by default.
# CORS middleware explicitly allows our Vite frontend origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _seed_subscriptions() -> None:
    """Seed sample subscriptions when database is empty."""
    with Session(engine) as session:
        if session.exec(select(Subscription)).first() is not None:
            return

        today = date.today()
        sample_data = [
            Subscription(
                service_name="Netflix",
                category="Entertainment",
                billing_cycle="Monthly",
                amount=15.99,
                next_payment_date=today + timedelta(days=3),
            ),
            Subscription(
                service_name="Spotify",
                category="Music",
                billing_cycle="Monthly",
                amount=9.99,
                next_payment_date=today + timedelta(days=5),
            ),
            Subscription(
                service_name="Notion",
                category="Productivity",
                billing_cycle="Monthly",
                amount=8.00,
                next_payment_date=today + timedelta(days=9),
            ),
            Subscription(
                service_name="Google Drive",
                category="Cloud",
                billing_cycle="Monthly",
                amount=1.99,
                next_payment_date=today + timedelta(days=2),
            ),
            Subscription(
                service_name="YouTube Premium",
                category="Entertainment",
                billing_cycle="Monthly",
                amount=5.99,
                next_payment_date=today + timedelta(days=12),
            ),
            Subscription(
                service_name="Duolingo",
                category="Education",
                billing_cycle="Yearly",
                amount=116.40,
                next_payment_date=today + timedelta(days=45),
            ),
        ]

        session.add_all(sample_data)
        session.commit()


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "Welcome to TinyVault API", "docs": "/docs"}


@app.get("/subscriptions", response_model=list[SubscriptionResponse], tags=["Subscriptions"])
def list_subscriptions(
    session: Session = Depends(get_session),
    category: Optional[str] = Query(default=None, description="Filter by category"),
    search: Optional[str] = Query(default=None, description="Search in service name"),
    active_only: bool = Query(default=False, description="Return only active subscriptions"),
    sort_by: str = Query(default="service_name", description="service_name, amount, next_payment_date, created_at"),
    sort_order: str = Query(default="asc", description="asc or desc"),
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=100),
) -> list[SubscriptionResponse]:
    return SubscriptionService.list_subscriptions(
        session=session,
        category=category,
        search=search,
        active_only=active_only,
        sort_by=sort_by,
        sort_order=sort_order,
        skip=skip,
        limit=limit,
    )


@app.get("/subscriptions/summary/monthly-total", response_model=SummaryResponse, tags=["Subscriptions"])
def get_monthly_summary(session: Session = Depends(get_session)) -> SummaryResponse:
    return SubscriptionService.get_summary(session)


@app.get("/subscriptions/{subscription_id}", response_model=SubscriptionResponse, tags=["Subscriptions"])
def get_subscription(subscription_id: int, session: Session = Depends(get_session)) -> SubscriptionResponse:
    return SubscriptionService.get_subscription(session, subscription_id)


@app.get("/subscriptions/{subscription_id}/audits", response_model=list[SubscriptionAuditResponse], tags=["Subscriptions"])
def get_subscription_audits(
    subscription_id: int,
    session: Session = Depends(get_session),
) -> list[SubscriptionAuditResponse]:
    return SubscriptionService.list_audits(session, subscription_id)


@app.post("/subscriptions", response_model=SubscriptionResponse, status_code=201, tags=["Subscriptions"])
def create_subscription(
    payload: SubscriptionCreate,
    session: Session = Depends(get_session),
) -> SubscriptionResponse:
    return SubscriptionService.create_subscription(session, payload)


@app.put("/subscriptions/{subscription_id}", response_model=SubscriptionResponse, tags=["Subscriptions"])
def update_subscription(
    subscription_id: int,
    payload: SubscriptionUpdate,
    session: Session = Depends(get_session),
) -> SubscriptionResponse:
    return SubscriptionService.update_subscription(session, subscription_id, payload)


@app.delete("/subscriptions/{subscription_id}", status_code=204, tags=["Subscriptions"])
def delete_subscription(subscription_id: int, session: Session = Depends(get_session)) -> Response:
    SubscriptionService.delete_subscription(session, subscription_id)
    return Response(status_code=204)
