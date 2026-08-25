from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from app.database_stub import alerts_db, next_id, users_db
from app.routers.auth import get_current_user, require_role
from app.schemas.alert import AlertCreate, AlertOut

router = APIRouter(tags=["alerts"])


@router.post("/alerts", response_model=AlertOut, status_code=201)
def create_alert(body: AlertCreate, user: dict = Depends(require_role("officer"))):
    aid = next_id("alert")
    alert = {
        "id": aid,
        "region": body.region,
        "disease": body.disease,
        "message": body.message,
        "issued_by": user["id"],
        "issued_by_name": user["name"],
        "issued_at": date.today().isoformat(),
    }
    alerts_db[str(aid)] = alert
    return AlertOut(**alert)


@router.get("/alerts/region/{region}", response_model=list[AlertOut])
def get_alerts(region: str):
    return sorted(
        [AlertOut(**a) for a in alerts_db.values() if a["region"].lower() == region.lower()],
        key=lambda x: x.id,
        reverse=True,
    )
