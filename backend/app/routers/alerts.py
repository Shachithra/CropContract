from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.routers.auth import get_current_user, require_role
from app.schemas.alert import AlertCreate, AlertOut

router = APIRouter(tags=["alerts"])


def _serialize_alert(a: dict) -> AlertOut:
    return AlertOut(**{**{k: v for k, v in a.items() if k != "_id"}, "id": str(a["_id"])})


@router.post("/alerts", response_model=AlertOut, status_code=201)
async def create_alert(body: AlertCreate, user: dict = Depends(require_role("officer"))):
    db = get_db()
    alert = {
        "region": body.region,
        "disease": body.disease,
        "message": body.message,
        "issued_by": str(user["_id"]),
        "issued_by_name": user["name"],
        "issued_at": date.today().isoformat(),
    }
    
    result = await db.alerts.insert_one(alert)
    alert["id"] = str(result.inserted_id)
    
    return _serialize_alert(alert)


@router.get("/alerts", response_model=list[AlertOut])
async def get_all_alerts(user: dict = Depends(require_role("officer"))):
    db = get_db()
    alerts = await db.alerts.find().sort("_id", -1).to_list(1000)
    return [_serialize_alert(a) for a in alerts]


@router.get("/alerts/mine", response_model=list[AlertOut])
async def get_my_alerts(user: dict = Depends(get_current_user)):
    """Return alerts matching the user's region (or all-region alerts)."""
    db = get_db()
    region = user.get("region", "")
    if not region:
        return []
    alerts = await db.alerts.find(
        {"$or": [
            {"region": region},
            {"region": "All Regions"},
            {"region": {"$regex": f"^{region}$", "$options": "i"}},
        ]}
    ).sort("_id", -1).to_list(1000)
    return [_serialize_alert(a) for a in alerts]


@router.get("/alerts/region/{region}", response_model=list[AlertOut])
async def get_alerts(region: str):
    db = get_db()
    alerts = await db.alerts.find(
        {"region": {"$regex": f"^{region}$", "$options": "i"}}
    ).sort("_id", -1).to_list(1000)
    return [_serialize_alert(a) for a in alerts]
