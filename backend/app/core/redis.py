import redis.asyncio as aioredis
from app.core.config import settings


class RedisManager:
    redis: aioredis.Redis | None = None


redis_manager = RedisManager()


async def connect_to_redis():
    redis_manager.redis = aioredis.from_url(
        settings.REDIS_URL,
        encoding="utf-8",
        decode_responses=True,
        max_connections=50,
        socket_timeout=5.0,
    )


async def close_redis_connection():
    if redis_manager.redis:
        await redis_manager.redis.aclose()


def get_redis() -> aioredis.Redis:
    if redis_manager.redis is None:
        raise RuntimeError("Redis connection is not initialized.")
    return redis_manager.redis