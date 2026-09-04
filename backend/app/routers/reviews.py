from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.database import get_db, to_oid
from app.routers.auth import get_current_user, require_role
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/reviews", tags=["reviews"])


@router.post("", response_model=ReviewOut, status_code=201)
async def create_review(body: ReviewCreate, user: dict = Depends(require_role("farmer", "buyer"))):
    db = get_db()

    if body.reviewee_id == str(user["_id"]):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot review yourself")

    reviewee = await db.users.find_one({"_id": to_oid(body.reviewee_id)})
    if not reviewee:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Reviewee not found")

    if reviewee["role"] not in ("farmer", "buyer"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Can only review farmers and buyers")

    if user["role"] == reviewee["role"]:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Cannot review users with the same role")

    existing = await db.reviews.find_one({
        "reviewer_id": str(user["_id"]),
        "reviewee_id": body.reviewee_id,
        "contract_id": body.contract_id,
    })
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "You have already reviewed this user for this contract")

    review_doc = {
        "reviewer_id": str(user["_id"]),
        "reviewer_name": user["name"],
        "reviewer_role": user["role"],
        "reviewee_id": body.reviewee_id,
        "reviewee_name": reviewee["name"],
        "reviewee_role": reviewee["role"],
        "contract_id": body.contract_id,
        "rating": body.rating,
        "comment": body.comment,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    result = await db.reviews.insert_one(review_doc)
    review_doc["id"] = str(result.inserted_id)
    return ReviewOut(**review_doc)


@router.get("/user/{user_id}", response_model=list[ReviewOut])
async def get_user_reviews(user_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.reviews.find({"reviewee_id": user_id}).sort("created_at", -1)
    reviews = []
    async for r in cursor:
        r["id"] = str(r["_id"])
        reviews.append(ReviewOut(**r))
    return reviews


@router.get("/mine", response_model=list[ReviewOut])
async def get_my_reviews(user: dict = Depends(get_current_user)):
    db = get_db()
    cursor = db.reviews.find({"reviewer_id": str(user["_id"])}).sort("created_at", -1)
    reviews = []
    async for r in cursor:
        r["id"] = str(r["_id"])
        reviews.append(ReviewOut(**r))
    return reviews


@router.get("/stats/{user_id}")
async def get_user_review_stats(user_id: str, user: dict = Depends(get_current_user)):
    db = get_db()
    pipeline = [
        {"$match": {"reviewee_id": user_id}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1},
        }},
    ]
    result = await db.reviews.aggregate(pipeline).to_list(1)
    if not result:
        return {"avg_rating": 0, "total_reviews": 0}
    return {
        "avg_rating": round(result[0]["avg_rating"], 1),
        "total_reviews": result[0]["total_reviews"],
    }


@router.get("/check/{user_id}")
async def check_reviewed(user_id: str, contract_id: str = "", user: dict = Depends(get_current_user)):
    db = get_db()
    query = {"reviewer_id": str(user["_id"]), "reviewee_id": user_id}
    if contract_id:
        query["contract_id"] = contract_id
    existing = await db.reviews.find_one(query)
    return {"reviewed": existing is not None}
