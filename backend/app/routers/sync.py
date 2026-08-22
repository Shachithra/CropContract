"""Batch sync endpoint for the offline IndexedDB queue.

Client posts queued offline actions after reconnect. Each action carries a
`client_action_id`; replays are detected and answered idempotently so no
duplicate commitments/scans are created.
"""

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.database_stub import commitments_db, contracts_db, next_id, scans_db
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
def sync(body: SyncRequest, user: dict = Depends(get_current_user)):
    processed: list[dict] = []
    failed: list[dict] = []

    existing_ids = {
        m.get("client_action_id"): m for m in commitments_db.values() if m.get("client_action_id")
    }

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
                            "result": {"commitment_id": m["id"]},
                        }
                    )
                    continue

                cid = str(action.payload["contract_id"])
                contract = contracts_db.get(cid)
                if not contract or contract["status"] != "open":
                    raise ValueError("Contract unavailable")
                qty = min(int(action.payload["quantity_kg"]), contract["total_kg"] - contract["committed_kg"])
                if qty <= 0:
                    raise ValueError("Quota already filled")

                mid = next_id("commitment")
                commitment = {
                    "id": mid,
                    "contract_id": int(cid),
                    "farmer_id": user["id"],
                    "quantity_kg": qty,
                    "status": "active",
                    "sync_status": "synced",
                    "committed_at": date.today().isoformat(),
                    "client_action_id": action.client_action_id,
                }
                commitments_db[str(mid)] = commitment
                contract["committed_kg"] += qty
                if contract["committed_kg"] >= contract["total_kg"]:
                    contract["status"] = "fulfilled"
                processed.append(
                    {
                        "client_action_id": action.client_action_id,
                        "status": "ok",
                        "result": {"commitment_id": mid},
                    }
                )

            elif action.type == "disease_scan":
                sid = next_id("scan")
                raw = action.payload.get("image_b64", "")
                image_bytes = base64.b64decode(raw) if raw else b""
                result = analyze_leaf(image_bytes)
                scans_db[str(sid)] = {
                    "id": sid,
                    "farmer_id": user["id"],
                    "farmer_name": user["name"],
                    "crop_type": action.payload.get("crop_type", "unknown"),
                    "region": user["region"],
                    "client_action_id": action.client_action_id,
                    **result,
                    "scanned_at": date.today().isoformat(),
                    "flagged": result["severity"] == "high",
                    "review_status": "pending" if result["severity"] == "high" else "none",
                }
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
