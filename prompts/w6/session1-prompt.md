# W6 Session 1 – Advanced Schema + PostgreSQL Migration

The project is growing and I need a proper relational database. This session I'm migrating from SQLite to PostgreSQL and expanding the schema from 1 table to a full multi-entity design.

## PostgreSQL setup

Update `database.py` to read `DATABASE_URL` from environment variable using `python-dotenv`. For local dev, the `.env` file should have:
```
DATABASE_URL=postgresql://username@localhost:5432/tinyvault
```

Use `psycopg2-binary` as the driver. Add it to `requirements.txt`.

## New entities in `models.py`

I need these additional tables (11 total including the existing ones):

**`User`** – system user anchor. Fields: id, username (unique), hashed_password, email, role (`"admin"/"user"/"viewer"`), is_active, created_at.

**`UserPreference`** – 1:1 with User. Fields: id, user_id (FK), preferred_currency (default "USD"), theme (default "light").

**`Category`** – proper table instead of a plain string. Fields: id, name (unique, 1-50 chars).

**`Tag`** – user-defined labels. Fields: id, name (unique).

**`SubscriptionTagLink`** – M:N junction table between Subscription and Tag. Fields: subscription_id (FK), tag_id (FK), composite primary key.

**`SubscriptionAudit`** – already exists, keep it. Add `ON DELETE CASCADE` so deleting a subscription deletes its audit rows.

**`Bill`** – historical payments. Fields: id, subscription_id (FK cascade), amount_paid, paid_at.

**`Reminder`** – alert config. Fields: id, subscription_id (FK cascade), days_before (e.g. 7), is_active.

**`PaymentMethod`** – Fields: id, user_id (FK), name (e.g. "Visa"), last_four.

Update `Subscription` to have foreign keys: `user_id` (FK to User), `category_id` (FK to Category), `payment_method_id` (optional FK to PaymentMethod).

## Service layer updates

**Category auto-resolution:** When creating/updating a subscription, the `category` field in the API still accepts a string. The service should look up the Category row by name, or create it if it doesn't exist yet. Store the `category_id` on the subscription.

**Tag sync:** The API accepts `tags: list[str]` on create/update. The service should:
1. For each tag name, get or create the `Tag` row
2. Delete all existing `SubscriptionTagLink` rows for this subscription
3. Insert new `SubscriptionTagLink` rows for the resolved tag ids

**Response schema:** Update `SubscriptionRead` to include `tags: list[str]` and `category: str` (the name, not the id).

## Updated seed data

The startup seed should now create the full chain: 1 User, 1 UserPreference, 1 PaymentMethod, 5 Category rows, 2 Tag rows, 3 Subscriptions linked to categories/tags/user, and 3 SubscriptionAudit rows (one CREATED event per subscription).
