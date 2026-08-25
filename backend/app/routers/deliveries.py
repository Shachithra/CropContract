from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status

from app.database_stub import commitments_db, contracts_db, deliveries_db, next_id
from app.routers.auth import require_role
from app.schemas.alert import DeliveryCreate, DeliveryOut

router = APIRouter(tags=["deliveries"])


@router.post("/deliveries", response_model=DeliveryOut, status_code=201)
def create_delivery(body: DeliveryCreate, user: dict = Depends(require_role("buyer"))):
    commitment = commitments_db.get(str(body.commitment_id))
    if not commitment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Commitment not found")

    contract = contracts_db.get(str(commitment["contract_id"]))
    if not contract or contract["buyer_id"] != user["id"]:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your contract")

    did = next_id("delivery")
    delivery = {
        "id": did,
        "commitment_id": body.commitment_id,
        "delivered_qty_kg": body.delivered_qty_kg,
        "quality_grade": body.quality_grade,
        "delivered_at": date.today().isoformat(),
        "payment_status": "pending",
    }
    deliveries_db[str(did)] = delivery

    commitment["status"] = "delivered"
    return DeliveryOut(**delivery)
