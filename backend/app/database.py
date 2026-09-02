"""MongoDB connection for CropContract."""

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import IndexModel, ASCENDING

from app.config import settings

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


async def close_db():
    """Close MongoDB connection."""
    global client
    if client:
        client.close()
        print("Disconnected from MongoDB")


def get_db():
    """Get database instance."""
    return db
