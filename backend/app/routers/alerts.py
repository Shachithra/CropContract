from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.routers.auth import get_current_user, require_role
from app.schemas.alert import AlertCreate, AlertOut

router = APIRouter(tags=["alerts"])


@router.post("/alerts", response_model=AlertOut, status_code=201)
async def create_alert(body: AlertCreate, user: dict = Depends(require_role("officer"))):
    db = get_db()
    alert = {
        "region": body.region,
        "disease": body.disease,
        "message": body.message,
        "issued_by": user["_id"],
        "issued_by_name": user["name"],
        "issued_at": date.today().isoformat(),
    }
    
    result = await db.alerts.insert_one(alert)
    alert["_id"] = str(result.inserted_id)
    
    return AlertOut(**alert)


@router.get("/alerts/region/{region}", response_model=list[AlertOut])
async def get_alerts(region: str):
    db = get_db()
    alerts = await db.alerts.find(
        {"region": {"$regex": f"^{region}$", "$options": "i"}}
    ).sort("_id", -1).to_list(1000)
    return [AlertOut(**a) for a in alerts]
