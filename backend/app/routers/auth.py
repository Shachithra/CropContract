from datetime import datetime, timedelta, timezone

import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.database import get_db, to_oid
from app.database_stub import hash_password, verify_password
from app.schemas.user import OTPVerify, PasswordChange, ProfileUpdate, TokenResponse, UserLogin, UserOut, UserRegister

router = APIRouter(prefix="/auth", tags=["auth"])
bearer = HTTPBearer(auto_error=False)

# Default OTP for demo
DEFAULT_OTP = "123456"


def create_token(user: dict) -> str:
    payload = {
        "sub": str(user["_id"]),
        "role": user["role"],
        "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")


def _check_ban_status(user: dict) -> dict:
    """Check if user is banned. Returns ban info dict."""
    warning_count = user.get("warning_count", 0)
    banned_permanently = user.get("banned_permanently", False)
    banned_until = user.get("banned_until")

    if banned_permanently:
        return {
            "is_banned": True,
            "ban_type": "permanent",
            "banned_until": None,
            "remaining_days": 0,
            "remaining_hours": 0,
            "remaining_minutes": 0,
            "total_warnings": warning_count,
            "reason": "Account permanently banned due to repeated violations",
        }

    if banned_until:
        ban_dt = datetime.fromisoformat(banned_until)
        now = datetime.now(timezone.utc)
        if ban_dt > now:
            remaining = ban_dt - now
            days = remaining.days
            hours = remaining.seconds // 3600
            minutes = (remaining.seconds % 3600) // 60
            return {
                "is_banned": True,
                "ban_type": "temporary",
                "banned_until": banned_until,
                "remaining_days": days,
                "remaining_hours": hours,
                "remaining_minutes": minutes,
                "total_warnings": warning_count,
                "reason": f"Account banned for 7 days due to {warning_count} warnings",
            }
        else:
            # Ban expired — would need to be reset via separate endpoint
            pass

    return {"is_banned": False, "ban_type": "none", "total_warnings": warning_count}


async def get_current_user(creds: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if creds is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Not authenticated")
    try:
        payload = jwt.decode(creds.credentials, settings.JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token")
    
    db = get_db()
    user = await db.users.find_one({"_id": to_oid(payload.get("sub", ""))})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    return user


def require_role(*roles: str):
    async def checker(user: dict = Depends(get_current_user)) -> dict:
        if user["role"] not in roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, f"Requires role: {'/'.join(roles)}")
        return user
    return checker


@router.post("/register", response_model=dict, status_code=201)
async def register(body: UserRegister):
    db = get_db()
    email = body.email.lower()
    
    # Check if email already exists
    existing_user = await db.users.find_one({"email": email})
    if existing_user:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    
    # Check if phone matches a permanently banned user
    if body.phone:
        banned_user = await db.users.find_one({
            "phone": body.phone.strip(),
            "banned_permanently": True,
        })
        if banned_user:
            raise HTTPException(
                status.HTTP_403_FORBIDDEN,
                "This phone number is permanently banned from the platform",
            )
    
    # Check if email matches a permanently banned user
    banned_user = await db.users.find_one({
        "email": email,
        "banned_permanently": True,
    })
    if banned_user:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            "This email is permanently banned from the platform",
        )
    
    # Create user document
    user_doc = {
        "name": body.name,
        "email": email,
        "role": body.role,
        "region": body.region,
        "phone": body.phone,
        "preferred_language": body.preferred_language,
        "hashed_password": hash_password(body.password),
        "warning_count": 0,
        "banned_until": None,
        "banned_permanently": False,
        "had_temp_ban": False,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    
    # Add role-specific fields
    if body.role == "farmer":
        user_doc["farm_location"] = body.farm_location
        user_doc["crop_types"] = body.crop_types
    elif body.role == "buyer":
        user_doc["company_name"] = body.company_name
        user_doc["company_location"] = body.company_location
        user_doc["delivery_address"] = body.delivery_address
        user_doc["delivery_address_2"] = body.delivery_address_2
    elif body.role == "officer":
        user_doc["officer_id"] = body.officer_id
        user_doc["department"] = body.department
        user_doc["district"] = body.district
        user_doc["designation"] = body.designation
    
    # Insert into MongoDB
    result = await db.users.insert_one(user_doc)
    user_doc["_id"] = str(result.inserted_id)
    user_doc["id"] = str(result.inserted_id)
    
    user_out = UserOut(**user_doc)
    token = create_token(user_doc)
    return {"access_token": token, "token_type": "bearer", "user": user_out}


@router.post("/login")
async def login(body: UserLogin):
    db = get_db()
    phone = body.phone.strip()
    
    # Find user by phone number
    user = await db.users.find_one({"phone": phone})
    if not user or not verify_password(body.password, user["hashed_password"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect phone number or password")
    
    # Check ban status
    ban_info = _check_ban_status(user)
    if ban_info["is_banned"]:
        # If permanent ban, also check if 7-day ban has expired
        if ban_info["ban_type"] == "temporary":
            ban_dt = datetime.fromisoformat(user["banned_until"])
            now = datetime.now(timezone.utc)
            if ban_dt <= now:
                # Ban expired — reset warning count
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"warning_count": 0, "banned_until": None}},
                )
                ban_info = {"is_banned": False, "ban_type": "none", "total_warnings": 0}
        
        if ban_info["is_banned"]:
            return {
                "banned": True,
                "ban_info": ban_info,
                "message": ban_info["reason"],
            }
    
    # Store OTP in MongoDB (in production, generate and send via SMS)
    await db.otps.update_one(
        {"phone": phone},
        {"$set": {"otp": DEFAULT_OTP, "created_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    
    return {
        "message": "OTP sent to your phone",
        "phone": phone,
        "role": user["role"],
        "ban_info": ban_info,
    }


@router.post("/verify-otp")
async def verify_otp(body: OTPVerify):
    db = get_db()
    phone = body.phone.strip()
    
    # Check OTP from MongoDB
    otp_doc = await db.otps.find_one({"phone": phone})
    if not otp_doc or otp_doc["otp"] != body.otp:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid OTP")
    
    # Remove used OTP
    await db.otps.delete_one({"phone": phone})
    
    # Find user by phone number
    user = await db.users.find_one({"phone": phone})
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "User not found")
    
    # Check ban status
    ban_info = _check_ban_status(user)
    if ban_info["is_banned"]:
        if ban_info["ban_type"] == "temporary":
            ban_dt = datetime.fromisoformat(user["banned_until"])
            now = datetime.now(timezone.utc)
            if ban_dt <= now:
                await db.users.update_one(
                    {"_id": user["_id"]},
                    {"$set": {"warning_count": 0, "banned_until": None}},
                )
                ban_info = {"is_banned": False, "ban_type": "none", "total_warnings": 0}
        
        if ban_info["is_banned"]:
            return {
                "banned": True,
                "ban_info": ban_info,
                "message": ban_info["reason"],
            }
    
    user["id"] = str(user["_id"])
    return TokenResponse(access_token=create_token(user), user=UserOut(**user))


@router.get("/me", response_model=UserOut)
async def get_me(user: dict = Depends(get_current_user)):
    user["id"] = str(user["_id"])
    return UserOut(**user)


@router.put("/profile", response_model=UserOut)
async def update_profile(body: ProfileUpdate, user: dict = Depends(get_current_user)):
    db = get_db()
    updates = body.model_dump(exclude_unset=True)
    
    if updates:
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": updates}
        )
    
    updated_user = await db.users.find_one({"_id": user["_id"]})
    updated_user["id"] = str(updated_user["_id"])
    return UserOut(**updated_user)


@router.post("/change-password")
async def change_password(body: PasswordChange, user: dict = Depends(get_current_user)):
    db = get_db()
    if not verify_password(body.current_password, user["hashed_password"]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"hashed_password": hash_password(body.new_password)}}
    )
    return {"message": "Password updated successfully"}
