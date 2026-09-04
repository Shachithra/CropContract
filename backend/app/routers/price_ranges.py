"""Price range management router.

Officers set minimum/maximum prices per crop+region.
Buyers are warned if they post contracts below minimum price.
"""

from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db, to_oid
from app.routers.auth import get_current_user, require_role
from app.schemas.contract import PriceRangeCreate, PriceRangeOut

router = APIRouter(tags=["price-ranges"])


@router.post("/price-ranges", response_model=PriceRangeOut, status_code=201)
async def create_price_range(body: PriceRangeCreate, user: dict = Depends(require_role("officer"))):
    db = get_db()

    if body.min_price_per_kg >= body.max_price_per_kg:
        raise HTTPException(status_code=400, detail="Min price must be less than max price")

    # Upsert: update if exists for same crop+region, insert otherwise
    existing = await db.price_ranges.find_one({
        "crop_type": body.crop_type,
        "region": body.region,
    })

    doc = {
        "crop_type": body.crop_type,
        "region": body.region,
        "min_price_per_kg": body.min_price_per_kg,
        "max_price_per_kg": body.max_price_per_kg,
        "set_by": str(user["_id"]),
        "set_by_name": user["name"],
        "set_at": datetime.now(timezone.utc).isoformat(),
    }

    if existing:
        await db.price_ranges.update_one(
            {"_id": existing["_id"]},
            {"$set": doc},
        )
        doc["id"] = str(existing["_id"])
    else:
        result = await db.price_ranges.insert_one(doc)
        doc["id"] = str(result.inserted_id)

    return PriceRangeOut(**doc)


@router.get("/price-ranges", response_model=list[PriceRangeOut])
async def list_price_ranges(user: dict = Depends(get_current_user)):
    db = get_db()
    ranges = await db.price_ranges.find().sort("crop_type", 1).to_list(1000)
    return [
        PriceRangeOut(**{**{k: v for k, v in r.items() if k != "_id"}, "id": str(r["_id"])})
        for r in ranges
    ]


@router.get("/price-ranges/check/{crop_type}/{region}")
async def check_price_range(crop_type: str, region: str, price: float, user: dict = Depends(get_current_user)):
    db = get_db()
    price_range = await db.price_ranges.find_one({
        "crop_type": {"$regex": f"^{crop_type}$", "$options": "i"},
        "region": {"$regex": f"^{region}$", "$options": "i"},
    })

    if not price_range:
        return {
            "in_range": True,
            "below_minimum": False,
            "above_maximum": False,
            "min_price": None,
            "max_price": None,
            "message": "No price range set for this crop in this region",
        }

    min_p = price_range["min_price_per_kg"]
    max_p = price_range["max_price_per_kg"]
    below = price < min_p
    above = price > max_p
    in_range = not below and not above

    msg = None
    if below:
        msg = f"Price Rs. {price}/kg is below minimum Rs. {min_p}/kg for {crop_type} in {region}"
    elif above:
        msg = f"Price Rs. {price}/kg is above maximum Rs. {max_p}/kg for {crop_type} in {region}"

    return {
        "in_range": in_range,
        "below_minimum": below,
        "above_maximum": above,
        "min_price": min_p,
        "max_price": max_p,
        "message": msg,
    }


@router.delete("/price-ranges/{range_id}")
async def delete_price_range(range_id: str, user: dict = Depends(require_role("officer"))):
    db = get_db()
    result = await db.price_ranges.delete_one({"_id": to_oid(range_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Price range not found")
    return {"ok": True}
