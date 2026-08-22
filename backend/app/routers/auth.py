from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

from app.config import settings
from app.database_stub import hash_password, next_id, users_db, verify_password
from app.schemas.user import TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)


def create_token(user: dict) -> str:
    payload = {
        "sub": str(user["id"]),
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    user = users_db.get(payload.get("sub", ""))
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def require_role(*roles: str):
    def checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires role: {'/'.join(roles)}")
        return user
    return checker


@router.post("/register", response_model=TokenResponse, status_code=201)
def register(body: UserRegister):
    email = body.email.lower()
    if any(u["email"] == email for u in users_db.values()):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")

    uid = next_id("user")
    users_db[str(uid)] = {
        "id": uid,
        "name": body.name,
        "email": email,
        "role": body.role,
        "region": body.region,
        "phone": body.phone,
        "preferred_language": body.preferred_language,
        "hashed_password": hash_password(body.password),
    }
    user = users_db[str(uid)]
    return TokenResponse(access_token=create_token(user), user=UserOut(**user))


@router.post("/login", response_model=TokenResponse)
def login(body: UserLogin):
    email = body.email.lower()
    user = next((u for u in users_db.values() if u["email"] == email), None)
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return TokenResponse(access_token=create_token(user), user=UserOut(**user))
