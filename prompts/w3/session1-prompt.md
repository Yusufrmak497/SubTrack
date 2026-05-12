# W3 Session 1 – Service Layer + Validation + Audit Log

The backend is working but all the logic is crammed into `main.py`. I want to refactor it so route handlers are thin and all the actual logic lives in a `services.py` file. Also I want to add an audit log so I can track what changed on each subscription.

## Service layer refactor

Create `tinyvault-api/services.py` with a `SubscriptionService` class (or just plain functions, either is fine).

Move these things out of `main.py` into the service:
- The `enrich()` logic for computed fields
- The filter/sort/search query building for the list endpoint
- The create logic (normalize the category string before saving – strip whitespace, title case)
- The update logic (only update fields that were actually sent using `exclude_unset=True`)
- The monthly summary calculation

Route handlers in `main.py` should just call the service and return the result. No database queries or business logic directly in the route function body.

## Audit log

Add a `SubscriptionAudit` table to `models.py`:

```python
class SubscriptionAudit(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    subscription_id: int = Field(foreign_key="subscription.id")
    action: str        # "CREATED" or "UPDATED"
    note: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

In the service layer, after every successful create or update, insert a new `SubscriptionAudit` row in the same session. For create, `action="CREATED"`, note can be something like "Subscription created". For update, `action="UPDATED"`, note should summarize what changed, e.g. "amount changed to 19.99".

Add a new endpoint to `main.py`:
```
GET /subscriptions/{id}/audits
```
Returns `list[SubscriptionAudit]` ordered by `created_at DESC` (newest first). Returns `404` if the subscription doesn't exist.

## Better error handling

Right now if someone sends invalid JSON FastAPI returns a huge nested error object. Add a global exception handler to return clean `{"error": "message"}` responses:

```python
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_error_handler(request, exc):
    errors = exc.errors()
    first = errors[0] if errors else {}
    field = " -> ".join(str(x) for x in first.get("loc", []))
    msg = first.get("msg", "Validation error")
    return JSONResponse(status_code=422, content={"error": f"{field}: {msg}"})

@app.exception_handler(Exception)
async def generic_error_handler(request, exc):
    return JSONResponse(status_code=500, content={"error": "Internal server error"})
```

Also check that 404 errors return `{"error": "..."}` not `{"detail": "..."}` – use `HTTPException` with `detail={"error": "Subscription not found"}` and add an HTTPException handler too.
