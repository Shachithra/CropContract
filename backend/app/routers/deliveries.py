from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db, to_oid
from app.routers.auth import require_role
from app.schemas.alert import DeliveryCreate, DeliveryOut

router = APIRouter(tags=["deliveries"])


@router.post("/deliveries", response_model=DeliveryOut, status_code=201)
async def create_delivery(body: DeliveryCreate, user: dict = Depends(require_role("buyer"))):
    db = get_db()
    
    commitment = await db.commitments.find_one({"_id": to_oid(body.commitment_id)})
    if not commitment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Commitment not found")

    contract = await db.contracts.find_one({"_id": to_oid(commitment["contract_id"])})
    if not contract or contract["buyer_id"] != user["_id"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your contract")

    delivery = {
        "commitment_id": body.commitment_id,
        "delivered_qty_kg": body.delivered_qty_kg,
        "quality_grade": body.quality_grade,
        "delivered_at": date.today().isoformat(),
        "payment_status": "pending",
    }
    
    result = await db.deliveries.insert_one(delivery)
    delivery["_id"] = str(result.inserted_id)

    await db.commitments.update_one(
        {"_id": to_oid(body.commitment_id)},
        {"$set": {"status": "delivered"}}
    )
    
    return DeliveryOut(**delivery)
