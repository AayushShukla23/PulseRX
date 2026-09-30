from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import settings


class MongoDB:
    client: AsyncIOMotorClient | None = None
    db: AsyncIOMotorDatabase | None = None


db_manager = MongoDB()


async def connect_to_mongo():
    db_manager.client = AsyncIOMotorClient(
        settings.MONGO_URI,
        maxPoolSize=50,
        minPoolSize=10,
        serverSelectionTimeoutMS=5000,
    )
    db_manager.db = db_manager.client[settings.MONGO_DB_NAME]


async def close_mongo_connection():
    if db_manager.client:
        db_manager.client.close()


def get_database() -> AsyncIOMotorDatabase:
    if db_manager.db is None:
        raise RuntimeError("MongoDB connection is not initialized.")
    return db_manager.db