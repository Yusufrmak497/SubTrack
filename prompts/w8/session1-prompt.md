# W8 Session 1 – JWT Authentication Backend

Now I want to add real authentication to SubTrack. This session covers the backend: JWT tokens, user registration/login, role-based access control, and protecting the write endpoints.

## Dependencies to add

```
python-jose[cryptography]>=3.3.0
passlib[bcrypt]>=1.7.4
python-multipart
bcrypt>=4.0.0,<5.0.0
```

Add them to `requirements.txt`.

## Auth config

Add to `.env`:
```
JWT_SECRET_KEY=your-secret-key-here
ADMIN_PASSWORD=admin123
DEMO_USER_PASSWORD=user123
```

In `main.py` (or a new `auth.py`), read `JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")`. Use `HS256` algorithm and 60-minute token expiry.

## Password hashing

Use `passlib`:
```python
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

## Seeded users

Update the startup seed to create 3 users if no users exist:
- `admin_rojhat` / `ADMIN_PASSWORD` / role `"admin"`
- `demo_user` / `DEMO_USER_PASSWORD` / role `"user"`
- `demo_viewer` / `viewer123` / role `"viewer"`

Hash the passwords before storing.

## Auth endpoints

**`POST /auth/register`** – accepts `{username, password, email}`. Check username is not already taken (return `400` if it is). Hash the password, create the User row, create a UserPreference row with defaults. Return `{"message": "User created"}`.

**`POST /auth/login`** – accepts `{username, password}` as form data (`OAuth2PasswordRequestForm`). Look up the user, verify the password with `verify_password()`. If wrong, return `401 {"error": "Invalid credentials"}`. If correct, create a JWT token:

```python
from jose import jwt
from datetime import datetime, timedelta

def create_access_token(data: dict) -> str:
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(minutes=60)
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm="HS256")
```

Return `{"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}`.

## `get_current_user` dependency

```python
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

security = HTTPBearer(auto_error=False)

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), session: Session = Depends(get_session)):
    if not credentials:
        raise HTTPException(status_code=401, detail={"error": "Not authenticated"})
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET_KEY, algorithms=["HS256"])
        username = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail={"error": "Invalid or expired token"})
    user = session.exec(select(User).where(User.username == username)).first()
    if not user:
        raise HTTPException(status_code=401, detail={"error": "User not found"})
    return user
```

## Protect write endpoints

Add `current_user: User = Depends(get_current_user)` to `POST /subscriptions`, `PUT /subscriptions/{id}`, and `DELETE /subscriptions/{id}`.

Also add a `GET /auth/me` endpoint that returns the current user info (requires auth).

## Role check helper

```python
def require_role(allowed: list[str]):
    def check(user: User = Depends(get_current_user)):
        if user.role not in allowed:
            raise HTTPException(status_code=403, detail={"error": "Insufficient permissions"})
        return user
    return check
```

Protect `DELETE` with `Depends(require_role(["admin"]))` – only admins can delete.

## Test in Swagger

- `POST /auth/login` with `admin_rojhat` / `admin123` → get token
- Click "Authorize" in Swagger, paste token
- `POST /subscriptions` → 201 (authorized)
- `DELETE /subscriptions/1` → 204 (admin only)
- `POST /subscriptions` without token → 401
- `DELETE` as `demo_user` → 403
