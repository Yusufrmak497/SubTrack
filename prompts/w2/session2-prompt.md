# W2 Session 2 – CRUD Endpoints + Search, Sort, Filter

Now I want to extend the backend with create, update, delete and a summary endpoint. Also make the list endpoint smarter with search and sorting.

## New Pydantic schemas

Add to `models.py`:

`SubscriptionCreate` – for POST requests. All fields required except `is_active` (default True). Use `Literal["Monthly", "Yearly"]` for billing_cycle. Use `Field(ge=0)` for amount.

`SubscriptionUpdate` – for PUT requests. All fields are `Optional` so I can send only the fields I want to change:
```python
class SubscriptionUpdate(SQLModel):
    service_name: Optional[str] = None
    category: Optional[str] = None
    billing_cycle: Optional[Literal["Monthly", "Yearly"]] = None
    amount: Optional[float] = None
    next_payment_date: Optional[date] = None
    is_active: Optional[bool] = None
```

## New endpoints

**`POST /subscriptions`** – Create a subscription from `SubscriptionCreate`. Return `201` with the created `SubscriptionRead`. Use `response_model=SubscriptionRead` and `status_code=201`.

**`PUT /subscriptions/{subscription_id}`** – Partial update. Fetch the existing record, apply only the fields that were sent using `data.model_dump(exclude_unset=True)`, commit, return updated `SubscriptionRead`. Return `404` if not found.

**`DELETE /subscriptions/{subscription_id}`** – Delete the record. Return `204` with no response body (`response_class=Response`). Return `404` if not found.

**`GET /subscriptions/summary/monthly-total`** – Aggregate across all active subscriptions:
```json
{
  "active_count": 5,
  "total_monthly_estimate": 48.94,
  "upcoming_payments_count": 2
}
```
Query all `is_active == True` subscriptions, enrich each one, then sum up the values.

## Extended list endpoint

Update `GET /subscriptions` to accept these additional query params:

- `search: str = None` – filter where `service_name` contains the search string, case-insensitive (use `.icontains()` in SQLModel)
- `sort_by: str = "created_at"` – column to sort by, one of `service_name`, `amount`, `next_payment_date`, `created_at`
- `sort_order: str = "asc"` – `"asc"` or `"desc"`
- `skip: int = 0` and `limit: int = 100` – pagination

Build the query like this:
```python
query = select(Subscription)
if active_only:
    query = query.where(Subscription.is_active == True)
if search:
    query = query.where(Subscription.service_name.icontains(search))
col = getattr(Subscription, sort_by, Subscription.created_at)
query = query.order_by(col.desc() if sort_order == "desc" else col.asc())
query = query.offset(skip).limit(limit)
```

## What to test in Swagger

- `POST` with valid body → 201 with new record
- `POST` with `amount: -5` → 422
- `POST` with `billing_cycle: "Weekly"` → 422
- `PUT /subscriptions/1` with `{"is_active": false}` → 200, only is_active changed
- `DELETE /subscriptions/2` → 204
- `GET /subscriptions/2` after delete → 404
- `GET /subscriptions?search=spotify` → only Spotify returned
- `GET /subscriptions?sort_by=amount&sort_order=desc` → most expensive first
- `GET /subscriptions/summary/monthly-total` → correct totals
