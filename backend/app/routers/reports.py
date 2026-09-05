"""Reports router — farmers report buyers and vice versa."""

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db, to_oid
from app.routers.auth import get_current_user, require_role
from app.schemas.report import ReportCreate, ReportOut

router = APIRouter(tags=["reports"])


async def _report_out(r: dict) -> ReportOut:
    db = get_db()
    reporter = await db.users.find_one({"_id": to_oid(r["reporter_id"])})
    reported = await db.users.find_one({"_id": to_oid(r["reported_user_id"])})
    return ReportOut(
        id=str(r["_id"]),
        reporter_id=r["reporter_id"],
        reporter_name=reporter["name"] if reporter else None,
        reporter_role=r["reporter_role"],
        reported_user_id=r["reported_user_id"],
        reported_user_name=reported["name"] if reported else None,
        reported_user_role=r["reported_user_role"],
        contract_id=r.get("contract_id"),
        reason=r["reason"],
        category=r["category"],
        status=r.get("status", "pending"),
        created_at=r["created_at"],
    )


@router.post("/reports", response_model=ReportOut, status_code=201)
async def submit_report(body: ReportCreate, user: dict = Depends(get_current_user)):
    db = get_db()

    reported_user = await db.users.find_one({"_id": to_oid(body.reported_user_id)})
    if not reported_user:
        raise HTTPException(status_code=404, detail="Reported user not found")

    if str(user["_id"]) == body.reported_user_id:
        raise HTTPException(status_code=400, detail="Cannot report yourself")

    if user["role"] not in ("farmer", "buyer"):
        raise HTTPException(status_code=403, detail="Only farmers and buyers can submit reports")

    if user["role"] == "farmer" and reported_user["role"] != "buyer":
        raise HTTPException(status_code=400, detail="Farmers can only report buyers")
    if user["role"] == "buyer" and reported_user["role"] != "farmer":
        raise HTTPException(status_code=400, detail="Buyers can only report farmers")

    duplicate = await db.reports.find_one({
        "reporter_id": str(user["_id"]),
        "reported_user_id": body.reported_user_id,
        "contract_id": body.contract_id,
    })
    if duplicate:
        raise HTTPException(status_code=409, detail="You have already reported this user for this contract")

    doc = {
        "reporter_id": str(user["_id"]),
        "reporter_name": user["name"],
        "reporter_role": user["role"],
        "reported_user_id": body.reported_user_id,
        "reported_user_name": reported_user["name"],
        "reported_user_role": reported_user["role"],
        "contract_id": body.contract_id,
        "reason": body.reason,
        "category": body.category,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.reports.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return await _report_out(doc)


@router.get("/reports/mine", response_model=list[ReportOut])
async def my_reports(user: dict = Depends(get_current_user)):
    db = get_db()
    reports = await db.reports.find({"reporter_id": str(user["_id"])}).sort("created_at", -1).to_list(100)
    return [await _report_out(r) for r in reports]


@router.get("/reports/check/{reported_user_id}")
async def check_report(reported_user_id: str, contract_id: str | None = None, user: dict = Depends(get_current_user)):
    db = get_db()
    query = {"reporter_id": str(user["_id"]), "reported_user_id": reported_user_id}
    if contract_id:
        query["contract_id"] = contract_id
    existing = await db.reports.find_one(query)
    return {"reported": existing is not None}


@router.get("/reports", response_model=list[ReportOut])
async def list_all_reports(user: dict = Depends(require_role("officer"))):
    db = get_db()
    reports = await db.reports.find().sort("created_at", -1).to_list(500)
    return [await _report_out(r) for r in reports]


@router.patch("/reports/{report_id}")
async def update_report_status(report_id: str, body: dict, user: dict = Depends(require_role("officer"))):
    db = get_db()
    new_status = body.get("status")
    if new_status not in ("pending", "reviewed", "resolved", "dismissed"):
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.reports.update_one({"_id": to_oid(report_id)}, {"$set": {"status": new_status}})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"ok": True, "status": new_status}
