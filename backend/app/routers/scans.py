import uuid
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.database import get_db, to_oid
from app.routers.auth import get_current_user, require_role
from app.services.disease_model import analyze_leaf

router = APIRouter(tags=["scans"])


@router.post("/disease-scan")
async def disease_scan(
    file: UploadFile = File(...),
    crop_type: str | None = None,
    lat: float | None = None,
    lng: float | None = None,
    client_action_id: str | None = None,
    user: dict = Depends(require_role("farmer", "officer")),
):
    db = get_db()
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty upload")

    result = analyze_leaf(image_bytes)

    scan = {
        "farmer_id": str(user["_id"]),
        "farmer_name": user["name"],
        "crop_type": crop_type or "unknown",
        "region": user["region"],
        "lat": lat,
        "lng": lng,
        "client_action_id": client_action_id,
        **result,
        "scanned_at": date.today().isoformat(),
        "flagged": result["severity"] == "high",
        "review_status": "pending" if result["severity"] == "high" else "none",
    }
    
    insert_result = await db.scans.insert_one(scan)
    scan_id = str(insert_result.inserted_id)
    
    return {"scan_id": scan_id, **result}


@router.get("/scans/mine")
async def my_scans(user: dict = Depends(get_current_user)):
    db = get_db()
    scans = await db.scans.find({"farmer_id": user["_id"]}).sort("_id", -1).to_list(1000)
    return scans


@router.get("/scans/flagged")
async def flagged_scans(user: dict = Depends(require_role("officer"))):
    db = get_db()
    scans = await db.scans.find({"flagged": True}).sort([("review_status", 1), ("_id", -1)]).to_list(1000)
    return scans


@router.post("/scans/{scan_id}/review")
async def review_scan(scan_id: str, action: str, user: dict = Depends(require_role("officer"))):
    db = get_db()
    if action not in ("confirmed", "dismissed"):
        raise HTTPException(status_code=400, detail="action must be confirmed|dismissed")
    
    result = await db.scans.update_one(
        {"_id": to_oid(scan_id)},
        {"$set": {"review_status": action}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    scan = await db.scans.find_one({"_id": to_oid(scan_id)})
    return scan


def new_action_id() -> str:
    return str(uuid.uuid4())
