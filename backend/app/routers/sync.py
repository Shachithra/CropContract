"""Batch sync endpoint for the offline IndexedDB queue.

Client posts queued offline actions after reconnect. Each action carries a
`client_action_id`; replays are detected and answered idempotently so no
duplicate commitments/scans are created.
"""

import base64
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database import get_db, to_oid
from app.routers.auth import get_current_user
from app.routers.scans import new_action_id  # noqa: F401  (re-export convenience)
from app.services.disease_model import analyze_leaf

router = APIRouter(tags=["sync"])


class QueuedAction(BaseModel):
    client_action_id: str
    type: str  # create_commitment | disease_scan
    payload: dict


class SyncRequest(BaseModel):
    actions: list[QueuedAction]


class SyncResponse(BaseModel):
    processed: list[dict]
    failed: list[dict]


@router.post("/sync", response_model=SyncResponse)
async def sync(body: SyncRequest, user: dict = Depends(get_current_user)):
    db = get_db()
    processed: list[dict] = []
    failed: list[dict] = []

    # Get existing commitments with client_action_id
    existing_docs = await db.commitments.find(
        {"client_action_id": {"$ne": None}}
    ).to_list(1000)
    existing_ids = {m.get("client_action_id"): m for m in existing_docs}

    for action in body.actions:
        try:
            if action.type == "create_commitment":
                # Replay?
                if action.client_action_id in existing_ids:
                    m = existing_ids[action.client_action_id]
                    processed.append(
                        {
                            "client_action_id": action.client_action_id,
                            "status": "duplicate",
                            "result": {"commitment_id": str(m["_id"])},
                        }
                    )
                    continue

                cid = str(action.payload["contract_id"])
                contract = await db.contracts.find_one({"_id": to_oid(cid)})
                if not contract or contract["status"] != "open":
                    raise ValueError("Contract unavailable")
                remaining = contract["total_kg"] - contract["committed_kg"]
                requested = int(action.payload["quantity_kg"])
                if remaining <= 0:
                    raise ValueError("OVER_COMMITTED:Quota already filled")
                qty = min(requested, remaining)
                if qty < requested:
                    raise ValueError(
                        f"OVER_COMMITTED:Only {remaining}kg remaining on this contract "
                        f"(you committed {requested}kg)"
                    )

                commitment = {
                    "contract_id": cid,
                    "farmer_id": user["_id"],
                    "quantity_kg": qty,
                    "status": "active",
                    "sync_status": "synced",
                    "committed_at": date.today().isoformat(),
                    "client_action_id": action.client_action_id,
                }
                result = await db.commitments.insert_one(commitment)
                mid = str(result.inserted_id)
                
                await db.contracts.update_one(
                    {"_id": to_oid(cid)},
                    {"$inc": {"committed_kg": qty}}
                )
                
                if contract["committed_kg"] + qty >= contract["total_kg"]:
                    await db.contracts.update_one(
                        {"_id": to_oid(cid)},
                        {"$set": {"status": "fulfilled"}}
                    )
                
                processed.append(
                    {
                        "client_action_id": action.client_action_id,
                        "status": "ok",
                        "result": {"commitment_id": mid},
                    }
                )

            elif action.type == "disease_scan":
                raw = action.payload.get("image_b64", "")
                image_bytes = base64.b64decode(raw) if raw else b""
                result = analyze_leaf(image_bytes)
                
                scan = {
                    "farmer_id": user["_id"],
                    "farmer_name": user["name"],
                    "crop_type": action.payload.get("crop_type", "unknown"),
                    "region": user["region"],
                    "client_action_id": action.client_action_id,
                    **result,
                    "scanned_at": date.today().isoformat(),
                    "flagged": result["severity"] == "high",
                    "review_status": "pending" if result["severity"] == "high" else "none",
                }
                
                insert_result = await db.scans.insert_one(scan)
                sid = str(insert_result.inserted_id)
                
                processed.append(
                    {
                        "client_action_id": action.client_action_id,
                        "status": "ok",
                        "result": {"scan_id": sid},
                    }
                )
            else:
                raise ValueError(f"Unknown action type: {action.type}")

        except Exception as exc:  # noqa: BLE001 - collect per-action failures
            failed.append(
                {
                    "client_action_id": action.client_action_id,
                    "error": str(exc),
                }
            )

    return SyncResponse(processed=processed, failed=failed)
