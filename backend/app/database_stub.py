"""In-memory storage for CropContract demo.

All state lives in plain dicts keyed by id, seeded with demo accounts &
contracts so the app is usable the moment it boots.
"""

import threading
from datetime import date, timedelta

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

_lock = threading.Lock()

users_db: dict[str, dict] = {}
contracts_db: dict[str, dict] = {}
commitments_db: dict[str, dict] = {}
scans_db: dict[str, dict] = {}
alerts_db: dict[str, dict] = {}
outbreaks_db: dict[str, dict] = {}
deliveries_db: dict[str, dict] = {}

_counters = {
    "user": 0,
    "contract": 0,
    "commitment": 0,
    "scan": 0,
    "alert": 0,
    "delivery": 0,
}


def next_id(kind: str) -> int:
    with _lock:
        _counters[kind] += 1
        return _counters[kind]


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return pwd_context.verify(plain, hashed)
    except Exception:
        return False


def seed() -> None:
    """Populate demo users + contracts (idempotent)."""
    if users_db:
        return

    today = date.today()

    def add_user(name, email, role, region, password, language="en", **extra):
        uid = next_id("user")
        users_db[str(uid)] = {
            "id": uid,
            "name": name,
            "email": email.lower(),
            "role": role,
            "region": region,
            "preferred_language": language,
            "hashed_password": hash_password(password),
            "created_at": today.isoformat(),
            **extra,
        }
        return uid

    buyer_id = add_user("Ravi Perera", "buyer@demo.lk", "buyer", "Colombo", "demo1234",
                        phone="0779876543", company_name="Perera Exports", business_type="Wholesale")
    farmer_id = add_user("Kumari Silva", "farmer@demo.lk", "farmer", "Dambulla", "demo1234",
                         phone="0771234567", farm_name="Silva Farm", farm_location="Dambulla", farm_size_acres=5.0,
                         crop_types=["Tomato", "Green Chilli"], years_experience=8)
    add_user("Officer Nimal", "officer@demo.lk", "officer", "Nuwara Eliya", "demo1234",
             phone="0775551234", officer_id="AGR-001", department="Agriculture", district="Nuwara Eliya",
             designation="Senior Officer", years_of_service=12)

    def add_contract(crop_type, grade, total_kg, committed_kg, price, region, days):
        cid = next_id("contract")
        contracts_db[str(cid)] = {
            "id": cid,
            "buyer_id": buyer_id,
            "crop_type": crop_type,
            "grade": grade,
            "total_kg": total_kg,
            "committed_kg": committed_kg,
            "price_per_kg": price,
            "region": region,
            "commit_deadline": (today + timedelta(days=days)).isoformat(),
            "delivery_date": (today + timedelta(days=days + 45)).isoformat(),
            "status": "open" if committed_kg < total_kg else "fulfilled",
            "created_at": today.isoformat(),
        }
        return cid

    c1 = add_contract("Tomato", "Grade A", 2000, 1250, 185.0, "Dambulla", 14)
    c2 = add_contract("Green Chilli", "Grade A", 800, 300, 420.0, "Jaffna", 21)
    add_contract("Carrot", "Export", 3500, 3500, 160.0, "Nuwara Eliya", 30)

    cm_id = next_id("commitment")
    commitments_db[str(cm_id)] = {
        "id": cm_id,
        "contract_id": c1,
        "farmer_id": farmer_id,
        "quantity_kg": 250,
        "status": "active",
        "sync_status": "synced",
        "committed_at": today.isoformat(),
        "client_action_id": None,
    }
    contracts_db[str(c1)]["committed_kg"] = 1250

    # Demo alert
    alert_id = next_id("alert")
    alerts_db[str(alert_id)] = {
        "id": alert_id,
        "region": "Dambulla",
        "disease": "Tomato Early Blight",
        "message": "Moderate outbreak of Early Blight detected in Dambulla region. Farmers should inspect crops and apply preventive fungicide.",
        "issued_by": 3,
        "issued_by_name": "Officer Nimal",
        "issued_at": today.isoformat(),
    }

    # Demo outbreak
    outbreaks_db["Dambulla"] = {
        "disease": "Tomato Early Blight",
        "case_count": 12,
        "risk_level": "moderate",
        "trend": "up",
        "trend_pct": 15.0,
        "cases_by_week": {"W28": 5, "W29": 7, "W30": 12},
        "week_of": "W30",
        "generated_at": today.isoformat(),
    }
