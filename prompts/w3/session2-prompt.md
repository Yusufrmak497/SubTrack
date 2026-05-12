# W3 Session 2 – External FX API + iCalendar Export

Two new backend features this session: real-time currency conversion using an external API, and generating `.ics` calendar files for subscription reminders.

## Currency conversion endpoint

Add `GET /subscriptions/summary/converted?currency=TRY` that returns the total monthly cost converted to the requested currency.

Use the **Frankfurter API** (`https://api.frankfurter.app/latest?from=USD&to=TRY`) to get the exchange rate. Use `httpx` for the HTTP request because it supports async and has better timeout handling than the `requests` library.

Add `httpx>=0.27.0` to `requirements.txt`.

In the service layer, create an async function:
```python
async def fetch_converted_summary(currency: str, session: Session) -> dict:
    if currency not in ("USD", "TRY", "EUR"):
        raise HTTPException(status_code=422, detail={"error": f"Unsupported currency: {currency}"})
    
    # get monthly total in USD first
    total_usd = # ... same calculation as monthly-total endpoint
    
    if currency == "USD":
        return {"currency": "USD", "total_monthly_estimate": total_usd}
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"https://api.frankfurter.app/latest",
                params={"from": "USD", "to": currency}
            )
            response.raise_for_status()
            rate = response.json()["rates"][currency]
    except Exception:
        raise HTTPException(status_code=502, detail={"error": "Currency conversion service unavailable"})
    
    return {
        "currency": currency,
        "total_monthly_estimate": round(total_usd * rate, 2),
        "exchange_rate": rate
    }
```

The route handler must be `async def` to use `await` on the service function.

Important: this endpoint must be defined **before** `GET /subscriptions/{id}` in `main.py` otherwise FastAPI will try to match `"summary"` as a subscription ID and return 404.

## iCalendar export

Add `GET /subscriptions/{id}/calendar` that generates and downloads an `.ics` file for the subscription's next payment date.

The `.ics` format isn't complicated, just build the string manually – no extra library needed:

```python
from fastapi.responses import Response

@app.get("/subscriptions/{subscription_id}/calendar")
def get_calendar(subscription_id: int, session: Session = Depends(get_session)):
    sub = session.get(Subscription, subscription_id)
    if not sub:
        raise HTTPException(status_code=404, detail={"error": "Subscription not found"})
    
    dt = sub.next_payment_date
    dtstr = dt.strftime("%Y%m%d")
    
    ics = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SubTrack//EN
BEGIN:VEVENT
UID:{sub.id}-{dtstr}@subtrack
DTSTAMP:{dtstr}T000000Z
DTSTART;VALUE=DATE:{dtstr}
DTEND;VALUE=DATE:{dtstr}
SUMMARY:{sub.service_name} payment due
DESCRIPTION:{sub.service_name} - ${sub.amount:.2f} ({sub.billing_cycle})
END:VEVENT
END:VCALENDAR"""
    
    return Response(
        content=ics,
        media_type="text/calendar",
        headers={"Content-Disposition": f'attachment; filename="{sub.service_name}.ics"'}
    )
```

Test by downloading the file and opening it in Calendar – it should create an all-day event on the payment date.

## Test both in Swagger

- `GET /subscriptions/summary/converted?currency=TRY` → returns total in TRY with exchange rate
- `GET /subscriptions/summary/converted?currency=EUR` → returns total in EUR
- `GET /subscriptions/summary/converted?currency=JPY` → 422 unsupported currency
- `GET /subscriptions/1/calendar` → downloads an `.ics` file
- Disconnect from internet and retry the FX endpoint → should return 502, not 500/crash
