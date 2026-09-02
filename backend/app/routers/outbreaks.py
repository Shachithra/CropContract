from fastapi import APIRouter, Depends

from app.database import get_db
from app.routers.auth import get_current_user
from app.schemas.alert import OutbreakOut

router = APIRouter(tags=["outbreaks"])


@router.get("/outbreaks/region/{region}", response_model=OutbreakOut)
async def get_outbreak(region: str, user: dict = Depends(get_current_user)):
    db = get_db()
    outbreak = await db.outbreaks.find_one({"region": region})
    if not outbreak:
        return OutbreakOut(
            disease="None",
            case_count=0,
            risk_level="low",
            trend="flat",
            trend_pct=0,
            cases_by_week={},
            week_of="",
            generated_at="",
        )
    return OutbreakOut(**outbreak)
