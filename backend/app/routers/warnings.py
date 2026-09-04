"""Warnings and ban management router.

Officers can issue warnings to farmers/buyers for rule violations.
After 3 warnings → 7-day temp ban. After ban + 3 more → permanent ban.
"""

from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db, to_oid
from app.routers.auth import get_current_user, require_role
from app.schemas.warning import WarningCreate, WarningOut

router = APIRouter(tags=["warnings"])

MAX_WARNINGS_BEFORE_TEMP_BAN = 3
MAX_WARNINGS_BEFORE_PERM_BAN = 3
TEMP_BAN_DAYS = 7


async def _get_user_warnings_count(db, user_id: str) -> int:
    """Count active (non-expired) warnings for a user."""
    count = await db.warnings.count_documents({"target_user_id": user_id})
    return count


async def _check_and_apply_ban(db, user_id: str) -> dict:
    """Check warning count and apply ban if threshold reached. Returns ban status.

    IMPORTANT: This function does NOT reset warning_count on ban expiry.
    The had_temp_ban flag preserves the fact that a ban was served, so the
    next set of 3 warnings can escalate to permanent ban.
    """
    user = await db.users.find_one({"_id": to_oid(user_id)})
    if not user:
        return {"is_banned": False, "ban_type": "none"}

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
                "reason": f"Account banned for {TEMP_BAN_DAYS} days due to {warning_count} warnings",
            }
        else:
            # Ban expired — clear the expired ban but keep warning_count and set had_temp_ban
            await db.users.update_one(
                {"_id": to_oid(user_id)},
                {"$set": {"banned_until": None, "had_temp_ban": True}},
            )

    return {"is_banned": False, "ban_type": "none", "total_warnings": warning_count}


@router.post("/warnings", response_model=WarningOut, status_code=201)
async def issue_warning(body: WarningCreate, user: dict = Depends(require_role("officer"))):
    db = get_db()

    target = await db.users.find_one({"_id": to_oid(body.target_user_id)})
    if not target:
        raise HTTPException(status_code=404, detail="Target user not found")
    if target["role"] not in ("farmer", "buyer"):
        raise HTTPException(status_code=400, detail="Can only warn farmers or buyers")

    # Increment warning count
    new_count = target.get("warning_count", 0) + 1
    update_fields = {"warning_count": new_count}

    # Check if ban should be applied
    ban_type = "none"
    had_temp_ban = target.get("had_temp_ban", False)

    if had_temp_ban:
        # User was previously banned and has completed the ban period
        # After MAX_WARNINGS_BEFORE_PERM_BAN new warnings → permanent ban
        if new_count >= MAX_WARNINGS_BEFORE_PERM_BAN:
            update_fields["banned_permanently"] = True
            ban_type = "permanent"
        # Otherwise just accumulate warnings (no temp ban — they already served one)
    else:
        # First cycle — no previous ban
        if new_count >= MAX_WARNINGS_BEFORE_TEMP_BAN:
            ban_until = datetime.now(timezone.utc) + timedelta(days=TEMP_BAN_DAYS)
            update_fields["banned_until"] = ban_until.isoformat()
            ban_type = "temporary"

    await db.users.update_one(
        {"_id": to_oid(body.target_user_id)},
        {"$set": update_fields},
    )

    warning_doc = {
        "target_user_id": body.target_user_id,
        "target_user_role": target["role"],
        "target_user_name": target["name"],
        "reason": body.reason,
        "violation_type": body.violation_type,
        "warning_number": new_count,
        "issued_by": str(user["_id"]),
        "issued_by_name": user["name"],
        "issued_at": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.warnings.insert_one(warning_doc)
    warning_doc["id"] = str(result.inserted_id)

    return WarningOut(**{k: v for k, v in warning_doc.items() if k != "_id"})


@router.get("/warnings/mine", response_model=list[WarningOut])
async def my_warnings(user: dict = Depends(get_current_user)):
    db = get_db()
    warnings = await db.warnings.find(
        {"target_user_id": str(user["_id"])}
    ).sort("issued_at", -1).to_list(100)
    return [
        WarningOut(**{**{k: v for k, v in w.items() if k != "_id"}, "id": str(w["_id"])})
        for w in warnings
    ]


@router.get("/warnings/target/{user_id}", response_model=list[WarningOut])
async def target_warnings(user_id: str, user: dict = Depends(require_role("officer"))):
    db = get_db()
    warnings = await db.warnings.find(
        {"target_user_id": user_id}
    ).sort("issued_at", -1).to_list(100)
    return [
        WarningOut(**{**{k: v for k, v in w.items() if k != "_id"}, "id": str(w["_id"])})
        for w in warnings
    ]


@router.get("/ban-status")
async def get_ban_status(user: dict = Depends(get_current_user)):
    db = get_db()
    status_info = await _check_and_apply_ban(db, str(user["_id"]))
    return status_info


@router.get("/warnings/all")
async def all_warnings(user: dict = Depends(require_role("officer"))):
    """Officer sees all warnings they have issued."""
    db = get_db()
    warnings = await db.warnings.find(
        {"issued_by": str(user["_id"])}
    ).sort("issued_at", -1).to_list(500)
    return [
        WarningOut(**{**{k: v for k, v in w.items() if k != "_id"}, "id": str(w["_id"])})
        for w in warnings
    ]
