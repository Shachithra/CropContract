"""MongoDB connection for CropContract."""

from datetime import date, timedelta

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING

from app.config import settings


def to_oid(value) -> ObjectId:
    """Convert a string or ObjectId to ObjectId. Raises ValueError on bad input."""
    if isinstance(value, ObjectId):
        return value
    return ObjectId(value)

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    """Connect to MongoDB."""
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]
    
    # Create indexes
    await db.users.create_indexes([
        IndexModel([("email", ASCENDING)], unique=True),
        IndexModel([("role", ASCENDING)]),
        IndexModel([("region", ASCENDING)]),
    ])
    
    await db.contracts.create_indexes([
        IndexModel([("buyer_id", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("crop_type", ASCENDING)]),
    ])
    
    await db.commitments.create_indexes([
        IndexModel([("contract_id", ASCENDING)]),
        IndexModel([("farmer_id", ASCENDING)]),
    ])
    
    await db.scans.create_indexes([
        IndexModel([("farmer_id", ASCENDING)]),
    ])
    
    await db.alerts.create_indexes([
        IndexModel([("region", ASCENDING)]),
    ])
    
    print(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def seed_db():
    """Seed demo data into MongoDB (idempotent)."""
    from app.database_stub import hash_password
    
    # Check if already seeded
    user_count = await db.users.count_documents({})
    if user_count > 0:
        print("Database already seeded, skipping.")
        return

    today = date.today()

    # Demo users
    users = [
        {
            "name": "Kumari Silva",
            "email": "farmer@demo.lk",
            "role": "farmer",
            "region": "Dambulla",
            "phone": "0771234567",
            "preferred_language": "en",
            "hashed_password": hash_password("demo1234"),
            "farm_name": "Silva Farm",
            "farm_location": "Dambulla",
            "farm_size_acres": 5.0,
            "crop_types": ["Tomato", "Green Chilli"],
            "years_experience": 8,
            "created_at": today.isoformat(),
        },
        {
            "name": "Ravi Perera",
            "email": "buyer@demo.lk",
            "role": "buyer",
            "region": "Colombo",
            "phone": "0779876543",
            "preferred_language": "en",
            "hashed_password": hash_password("demo1234"),
            "company_name": "Perera Exports",
            "company_location": "Colombo",
            "business_type": "Wholesale",
            "delivery_address": "123 Export Lane, Colombo",
            "created_at": today.isoformat(),
        },
        {
            "name": "Officer Nimal",
            "email": "officer@demo.lk",
            "role": "officer",
            "region": "Nuwara Eliya",
            "phone": "0775551234",
            "preferred_language": "en",
            "hashed_password": hash_password("demo1234"),
            "officer_id": "AGR-001",
            "department": "Agriculture",
            "district": "Nuwara Eliya",
            "designation": "Senior Officer",
            "years_of_service": 12,
            "created_at": today.isoformat(),
        },
    ]

    result = await db.users.insert_many(users)
    farmer_id = str(result.inserted_ids[0])
    buyer_id = str(result.inserted_ids[1])
    officer_id = str(result.inserted_ids[2])

    # Demo contracts
    contracts = [
        {
            "buyer_id": buyer_id,
            "crop_type": "Tomato",
            "grade": "Grade A",
            "total_kg": 2000,
            "committed_kg": 1250,
            "price_per_kg": 185.0,
            "region": "Dambulla",
            "notes": "Fresh tomatoes for export",
            "commit_deadline": (today + timedelta(days=14)).isoformat(),
            "delivery_date": (today + timedelta(days=59)).isoformat(),
            "status": "open",
            "created_at": today.isoformat(),
        },
        {
            "buyer_id": buyer_id,
            "crop_type": "Green Chilli",
            "grade": "Grade A",
            "total_kg": 800,
            "committed_kg": 300,
            "price_per_kg": 420.0,
            "region": "Jaffna",
            "notes": "Organic green chilli",
            "commit_deadline": (today + timedelta(days=21)).isoformat(),
            "delivery_date": (today + timedelta(days=66)).isoformat(),
            "status": "open",
            "created_at": today.isoformat(),
        },
        {
            "buyer_id": buyer_id,
            "crop_type": "Carrot",
            "grade": "Export",
            "total_kg": 3500,
            "committed_kg": 3500,
            "price_per_kg": 160.0,
            "region": "Nuwara Eliya",
            "notes": "Export quality carrots",
            "commit_deadline": (today + timedelta(days=30)).isoformat(),
            "delivery_date": (today + timedelta(days=75)).isoformat(),
            "status": "fulfilled",
            "created_at": today.isoformat(),
        },
    ]

    result = await db.contracts.insert_many(contracts)
    c1_id = str(result.inserted_ids[0])

    # Demo commitment
    commitment = {
        "contract_id": c1_id,
        "farmer_id": farmer_id,
        "quantity_kg": 250,
        "status": "active",
        "sync_status": "synced",
        "committed_at": today.isoformat(),
        "client_action_id": None,
    }
    await db.commitments.insert_one(commitment)

    # Demo alert
    alert = {
        "region": "Dambulla",
        "disease": "Tomato Early Blight",
        "message": "Moderate outbreak of Early Blight detected in Dambulla region. Farmers should inspect crops and apply preventive fungicide.",
        "issued_by": officer_id,
        "issued_by_name": "Officer Nimal",
        "issued_at": today.isoformat(),
    }
    await db.alerts.insert_one(alert)

    # Demo outbreak
    outbreak = {
        "region": "Dambulla",
        "disease": "Tomato Early Blight",
        "case_count": 12,
        "risk_level": "moderate",
        "trend": "up",
        "trend_pct": 15.0,
        "cases_by_week": {"W28": 5, "W29": 7, "W30": 12},
        "week_of": "W30",
        "generated_at": today.isoformat(),
    }
    await db.outbreaks.insert_one(outbreak)

    print("Seeded demo data: 3 users, 3 contracts, 1 commitment, 1 alert, 1 outbreak")


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")


def get_db():
    """Get database instance."""
    if db is None:
        raise RuntimeError("Database not connected. Is the app lifespan running?")
    return db
