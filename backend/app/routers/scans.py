import uuid
from datetime import date

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from app.database_stub import next_id, scans_db
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
    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(status_code=400, detail="Empty upload")

    result = analyze_leaf(image_bytes)

    scan_id = next_id("scan")
    scans_db[str(scan_id)] = {
        "id": scan_id,
        "farmer_id": user["id"],
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
    return {"scan_id": scan_id, **result}


@router.get("/scans/mine")
def my_scans(user: dict = Depends(get_current_user)):
    return sorted(
        (s for s in scans_db.values() if s["farmer_id"] == user["id"]),
        key=lambda s: s["id"],
        reverse=True,
    )


@router.get("/scans/flagged")
def flagged_scans(user: dict = Depends(require_role("officer"))):
    return sorted(
        (s for s in scans_db.values() if s["flagged"]),
        key=lambda s: (s["review_status"], -s["id"]),
    )


@router.post("/scans/{scan_id}/review")
def review_scan(scan_id: int, action: str, user: dict = Depends(require_role("officer"))):
    scan = scans_db.get(str(scan_id))
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    if action not in ("confirmed", "dismissed"):
        raise HTTPException(status_code=400, detail="action must be confirmed|dismissed")
    scan["review_status"] = action
    return scan


def new_action_id() -> str:
    return str(uuid.uuid4())
