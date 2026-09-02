from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db
from app.routers.auth import get_current_user, require_role
from app.schemas.contract import CommitmentCreate, CommitmentOut, ContractCreate, ContractOut

router = APIRouter(tags=["contracts"])


async def _contract_out(c: dict) -> ContractOut:
    db = get_db()
    buyer = await db.users.find_one({"_id": c["buyer_id"]})
    return ContractOut(**{**c, "buyer_name": buyer["name"] if buyer else None})


@router.get("/contracts", response_model=list[ContractOut])
async def list_contracts(
    region: str | None = None,
    crop_type: str | None = None,
    status_filter: str = "open",
    user: dict = Depends(get_current_user),
):
    db = get_db()
    query = {}
    if region:
        query["region"] = {"$regex": region, "$options": "i"}
    if crop_type:
        query["crop_type"] = {"$regex": crop_type, "$options": "i"}
    if status_filter != "all":
        query["status"] = status_filter
    
    contracts = await db.contracts.find(query).to_list(1000)
    out = []
    for c in contracts:
        out.append(await _contract_out(c))
    return sorted(out, key=lambda x: x.id)


@router.post("/contracts", response_model=ContractOut, status_code=201)
async def create_contract(body: ContractCreate, user: dict = Depends(require_role("buyer"))):
    db = get_db()
    today = date.today()
    deadline = body.commit_deadline or (today + timedelta(days=14))
    delivery = body.delivery_date or (deadline + timedelta(days=45))
    
    contract = {
        "buyer_id": user["_id"],
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
        "created_at": date.today().isoformat(),
    }
    
    result = await db.contracts.insert_one(contract)
    contract["_id"] = str(result.inserted_id)
    
    return await _contract_out(contract)


@router.get("/contracts/{contract_id}", response_model=ContractOut)
async def get_contract(contract_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    c = await db.contracts.find_one({"_id": contract_id})
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found")
    return await _contract_out(c)


@router.post("/contracts/{contract_id}/commit", response_model=CommitmentOut, status_code=201)
async def commit_to_contract(
    contract_id: str,
    body: CommitmentCreate,
    user: dict = Depends(require_role("farmer")),
):
    db = get_db()
    c = await db.contracts.find_one({"_id": contract_id})
    if not c:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Contract not found")
    if c["status"] != "open":
        raise HTTPException(status.HTTP_409_CONFLICT, f"Contract is {c['status']}, not open")

    remaining = c["total_kg"] - c["committed_kg"]
    qty = min(body.quantity_kg, remaining)

    # Idempotency: same client_action_id -> return existing commitment
    if body.client_action_id:
        existing = await db.commitments.find_one({"client_action_id": body.client_action_id})
        if existing:
            return CommitmentOut(
                **{**existing, "farmer_name": user["name"]}
            )

    commitment = {
        "contract_id": contract_id,
        "farmer_id": user["_id"],
        "quantity_kg": qty,
        "status": "active",
        "sync_status": "synced",
        "committed_at": date.today().isoformat(),
        "client_action_id": body.client_action_id,
    }
    
    result = await db.commitments.insert_one(commitment)
    commitment["_id"] = str(result.inserted_id)

    await db.contracts.update_one(
        {"_id": contract_id},
        {"$inc": {"committed_kg": qty}}
    )
    
    if c["committed_kg"] + qty >= c["total_kg"]:
        await db.contracts.update_one(
            {"_id": contract_id},
            {"$set": {"status": "fulfilled"}}
        )

    return CommitmentOut(**{**commitment, "farmer_name": user["name"]})


@router.get("/commitments/mine", response_model=list[CommitmentOut])
async def my_commitments(user: dict = Depends(get_current_user)):
    db = get_db()
    query = {}
    if user["role"] == "farmer":
        query["farmer_id"] = user["_id"]
    else:
        # For buyer, find commitments for their contracts
        buyer_contracts = await db.contracts.find({"buyer_id": user["_id"]}).to_list(1000)
        contract_ids = [str(c["_id"]) for c in buyer_contracts]
        query["contract_id"] = {"$in": contract_ids}
    
    commitments = await db.commitments.find(query).to_list(1000)
    out = []
    for m in commitments:
        farmer = await db.users.find_one({"_id": m["farmer_id"]})
        out.append(CommitmentOut(**{**m, "farmer_name": farmer["name"] if farmer else None}))
    return sorted(out, key=lambda x: x.id)
