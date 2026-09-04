from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db, to_oid
from app.routers.auth import get_current_user, require_role
from app.schemas.contract import CommitmentCreate, CommitmentOut, ContractCreate, ContractOut

router = APIRouter(tags=["contracts"])


async def _contract_out(c: dict) -> ContractOut:
    db = get_db()
    buyer_id = str(c["buyer_id"])
    buyer = await db.users.find_one({"_id": to_oid(buyer_id)})
    data = {k: v for k, v in c.items() if k != "_id"}
    data["id"] = str(c["_id"])
    data["buyer_id"] = buyer_id
    data["buyer_name"] = buyer["name"] if buyer else None
    return ContractOut(**data)


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
    
    # Server-side price range validation
    price_range = await db.price_ranges.find_one({
        "crop_type": {"$regex": f"^{body.crop_type}$", "$options": "i"},
        "region": {"$regex": f"^{body.region}$", "$options": "i"},
    })
    if not price_range:
        price_range = await db.price_ranges.find_one({
            "crop_type": {"$regex": f"^{body.crop_type}$", "$options": "i"},
            "region": "All Regions",
        })

    price_warning_issued = False
    if price_range:
        min_price = price_range["min_price_per_kg"]
        if body.price_per_kg < min_price:
            # Auto-issue a warning to the buyer for below-minimum pricing
            existing_warning_count = await db.warnings.count_documents({
                "target_user_id": str(user["_id"]),
                "violation_type": "pricing",
            })
            warning_doc = {
                "target_user_id": str(user["_id"]),
                "target_user_role": "buyer",
                "target_user_name": user["name"],
                "reason": f"Posted {body.crop_type} contract at Rs. {body.price_per_kg}/kg in {body.region}, which is below the minimum price of Rs. {min_price}/kg",
                "violation_type": "pricing",
                "warning_number": existing_warning_count + 1,
                "issued_by": "system",
                "issued_by_name": "System (auto-detected)",
                "issued_at": datetime.now(timezone.utc).isoformat(),
            }
            await db.warnings.insert_one(warning_doc)
            
            # Increment the buyer's warning count
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$inc": {"warning_count": 1}},
            )
            price_warning_issued = True

    contract = {
        "buyer_id": str(user["_id"]),
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
    c = await db.contracts.find_one({"_id": to_oid(contract_id)})
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
    c = await db.contracts.find_one({"_id": to_oid(contract_id)})
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
            data = {k: v for k, v in existing.items() if k != "_id"}
            data["id"] = str(existing["_id"])
            data["farmer_name"] = user["name"]
            return CommitmentOut(**data)

    commitment = {
        "contract_id": contract_id,
        "farmer_id": str(user["_id"]),
        "quantity_kg": qty,
        "status": "active",
        "sync_status": "synced",
        "committed_at": date.today().isoformat(),
        "client_action_id": body.client_action_id,
    }
    
    result = await db.commitments.insert_one(commitment)
    commitment["_id"] = str(result.inserted_id)

    await db.contracts.update_one(
        {"_id": to_oid(contract_id)},
        {"$inc": {"committed_kg": qty}}
    )
    
    if c["committed_kg"] + qty >= c["total_kg"]:
        await db.contracts.update_one(
            {"_id": to_oid(contract_id)},
            {"$set": {"status": "fulfilled"}}
        )

    return CommitmentOut(**{**{k: v for k, v in commitment.items() if k != "_id"}, "id": str(commitment["_id"]), "farmer_name": user["name"]})


@router.patch("/commitments/{commitment_id}/status")
async def update_commitment_status(
    commitment_id: str,
    body: dict,
    user: dict = Depends(get_current_user),
):
    db = get_db()
    commitment = await db.commitments.find_one({"_id": to_oid(commitment_id)})
    if not commitment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Commitment not found")

    new_status = body.get("status")

    if user["role"] == "farmer":
        if commitment["farmer_id"] != str(user["_id"]):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your commitment")
        allowed = ["active", "growing", "ready", "harvested", "delivered", "paid"]
    elif user["role"] == "buyer":
        contract = await db.contracts.find_one({"_id": to_oid(commitment["contract_id"])})
        if not contract or contract["buyer_id"] != str(user["_id"]):
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your contract")
        allowed = ["delivered", "paid"]
    else:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not authorized")

    if new_status not in allowed:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, f"Invalid status. Allowed: {allowed}")

    await db.commitments.update_one(
        {"_id": to_oid(commitment_id)},
        {"$set": {"status": new_status}},
    )
    return {"ok": True, "status": new_status}


@router.post("/commitments/{commitment_id}/delivery")
async def farmer_submit_delivery(
    commitment_id: str,
    body: dict,
    user: dict = Depends(require_role("farmer")),
):
    db = get_db()
    commitment = await db.commitments.find_one({"_id": to_oid(commitment_id)})
    if not commitment:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Commitment not found")
    if commitment["farmer_id"] != str(user["_id"]):
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Not your commitment")

    delivered_qty = body.get("delivered_qty_kg", 0)
    if delivered_qty <= 0:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "delivered_qty_kg must be > 0")

    delivery = {
        "commitment_id": commitment_id,
        "delivered_qty_kg": delivered_qty,
        "quality_grade": body.get("quality_grade", "Grade A"),
        "delivered_at": date.today().isoformat(),
        "payment_status": "pending",
    }
    await db.deliveries.insert_one(delivery)

    await db.commitments.update_one(
        {"_id": to_oid(commitment_id)},
        {"$set": {"status": "delivered"}},
    )
    return {"ok": True, "delivered_qty_kg": delivered_qty}


@router.get("/commitments/mine", response_model=list[CommitmentOut])
async def my_commitments(user: dict = Depends(get_current_user)):
    db = get_db()
    query = {}
    if user["role"] == "farmer":
        query["farmer_id"] = str(user["_id"])
    else:
        # For buyer, find commitments for their contracts
        buyer_contracts = await db.contracts.find({"buyer_id": str(user["_id"])}).to_list(1000)
        contract_ids = [str(c["_id"]) for c in buyer_contracts]
        query["contract_id"] = {"$in": contract_ids}
    
    commitments = await db.commitments.find(query).to_list(1000)
    out = []
    for m in commitments:
        farmer = await db.users.find_one({"_id": to_oid(m["farmer_id"])})
        data = {k: v for k, v in m.items() if k != "_id"}
        data["id"] = str(m["_id"])
        data["farmer_name"] = farmer["name"] if farmer else None
        # Aggregate delivered qty from deliveries collection
        deliveries = await db.deliveries.find({"commitment_id": str(m["_id"])}).to_list(100)
        data["delivered_qty_kg"] = sum(d.get("delivered_qty_kg", 0) for d in deliveries)
        out.append(CommitmentOut(**data))
    return sorted(out, key=lambda x: x.id)
