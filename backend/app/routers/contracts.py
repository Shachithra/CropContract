from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.database_stub import commitments_db, contracts_db, next_id, users_db
from app.routers.auth import get_current_user, require_role
from app.schemas.contract import CommitmentCreate, CommitmentOut, ContractCreate, ContractOut

router = APIRouter(tags=["contracts"])


def _contract_out(c: dict) -> ContractOut:
    buyer = users_db.get(str(c["buyer_id"]))
    return ContractOut(**{**c, "buyer_name": buyer["name"] if buyer else None})


@router.get("/contracts", response_model=list[ContractOut])
def list_contracts(
    region: str | None = None,
    crop_type: str | None = None,
    status_filter: str = "open",
    user: dict = Depends(get_current_user),
):
    out = []
    for c in contracts_db.values():
        if region and c["region"].lower() != region.lower():
            continue
        if crop_type and crop_type.lower() not in c["crop_type"].lower():
            continue
        if status_filter != "all" and c["status"] != status_filter:
            continue
        out.append(_contract_out(c))
    return sorted(out, key=lambda x: x.id)


@router.post("/contracts", response_model=ContractOut, status_code=201)
def create_contract(body: ContractCreate, user: dict = Depends(require_role("buyer"))):
    today = date.today()
    deadline = body.commit_deadline or (today + timedelta(days=14))
    delivery = body.delivery_date or (deadline + timedelta(days=45))
    cid = next_id("contract")
    contract = {
        "id": cid,
        "buyer_id": user["id"],
        "crop_type": body.crop_type,
        "grade": body.grade,
        "total_kg": body.total_kg,
        "committed_kg": 0,
        "price_per_kg": body.price_per_kg,
        "region": body.region,
        "notes": body.notes or "",
        "commit_deadline": deadline.isoformat(),
        "delivery_date": delivery.isoformat(),
        "status": "open",
    }
    contracts_db[str(cid)] = contract
    return _contract_out(contract)


@router.get("/contracts/{contract_id}", response_model=ContractOut)
def get_contract(contract_id: int, user: dict = Depends(get_current_user)):
    c = contracts_db.get(str(contract_id))
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found")
    return _contract_out(c)


@router.post("/contracts/{contract_id}/commit", response_model=CommitmentOut, status_code=201)
def commit_to_contract(
    contract_id: int,
    body: CommitmentCreate,
    user: dict = Depends(require_role("farmer")),
):
    c = contracts_db.get(str(contract_id))
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found")
    if c["status"] != "open":
        raise HTTPException(status.HTTP_409_CONFLICT, f"Contract is {c['status']}, not open")

    remaining = c["total_kg"] - c["committed_kg"]
    qty = min(body.quantity_kg, remaining)

    # Idempotency: same client_action_id -> return existing commitment
    if body.client_action_id:
        existing = next(
            (
                m
                for m in commitments_db.values()
                if m.get("client_action_id") == body.client_action_id
            ),
            None,
        )
        if existing:
            return CommitmentOut(
                **{**existing, "farmer_name": user["name"]}
            )

    cm_id = next_id("commitment")
    commitment = {
        "id": cm_id,
        "contract_id": contract_id,
        "farmer_id": user["id"],
        "quantity_kg": qty,
        "status": "active",
        "sync_status": "synced",
        "committed_at": date.today().isoformat(),
        "client_action_id": body.client_action_id,
    }
    commitments_db[str(cm_id)] = commitment

    c["committed_kg"] += qty
    if c["committed_kg"] >= c["total_kg"]:
        c["status"] = "fulfilled"

    return CommitmentOut(**{**commitment, "farmer_name": user["name"]})


@router.get("/commitments/mine", response_model=list[CommitmentOut])
def my_commitments(user: dict = Depends(get_current_user)):
    out = []
    for m in commitments_db.values():
        owner_key = "farmer_id" if user["role"] == "farmer" else "buyer_id"
        contract = contracts_db.get(str(m["contract_id"]), {})
        if owner_key == "buyer_id" and contract.get("buyer_id") != user["id"]:
            continue
        if m[owner_key] != user["id"]:
            continue
        farmer = users_db.get(str(m["farmer_id"]))
        out.append(CommitmentOut(**{**m, "farmer_name": farmer["name"] if farmer else None}))
    return sorted(out, key=lambda x: x.id)
