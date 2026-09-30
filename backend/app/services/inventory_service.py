import asyncio
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
import redis.asyncio as aioredis


class InventoryService:
    def __init__(self, db: AsyncIOMotorDatabase, redis: aioredis.Redis):
        self.db = db
        self.redis = redis

    async def _acquire_redis_lock(self, store_id: str, medicine_id: str, timeout_seconds: float = 3.0) -> Optional[str]:
        """
        Acquires a distributed lock key in Redis for specific (store_id, medicine_id).
        Uses SET key value NX PX timeout to prevent race conditions during reservation.
        """
        lock_key = f"lock:inventory:{store_id}:{medicine_id}"
        token = str(uuid.uuid4())
        acquired = await self.redis.set(lock_key, token, nx=True, px=int(timeout_seconds * 1000))
        return token if acquired else None

    async def _release_redis_lock(self, store_id: str, medicine_id: str, token: str) -> None:
        """Safe lock release using Lua script so we only release our own token."""
        lock_key = f"lock:inventory:{store_id}:{medicine_id}"
        lua_script = """
        if redis.call("get", KEYS[1]) == ARGV[1] then
            return redis.call("del", KEYS[1])
        else
            return 0
        end
        """
        try:
            await self.redis.eval(lua_script, 1, lock_key, token)
        except Exception:
            pass

    async def check_availability(self, store_id: str, medicine_id: str) -> Dict[str, Any]:
        """Check available stock in a given dark store."""
        inv = await self.db.inventory.find_one({"store_id": store_id, "medicine_id": medicine_id})
        if not inv:
            return {"available": False, "quantity": 0, "reserved": 0, "available_quantity": 0}

        qty = inv.get("quantity", 0)
        reserved = inv.get("reserved_quantity", 0)
        avail = max(0, qty - reserved)

        return {
            "available": avail > 0,
            "quantity": qty,
            "reserved": reserved,
            "available_quantity": avail,
        }

    async def reserve_inventory(
        self,
        order_id: str,
        store_id: str,
        medicine_id: str,
        quantity: int,
        ttl_minutes: int = 15,
    ) -> Dict[str, Any]:
        """
        ATOMIC INVENTORY RESERVATION UNDER HIGH CONCURRENCY.
        """
        if quantity <= 0:
            return {"success": False, "reason": "Quantity must be greater than 0"}

        # Step 1: Redis Lock Acquisition
        lock_token = None
        for _ in range(3):
            lock_token = await self._acquire_redis_lock(store_id, medicine_id, timeout_seconds=2.0)
            if lock_token:
                break
            await asyncio.sleep(0.05)

        try:
            # Step 2: Atomic MongoDB Update Operation
            filter_query = {
                "store_id": store_id,
                "medicine_id": medicine_id,
                "$expr": {
                    "$gte": [
                        {"$subtract": ["$quantity", "$reserved_quantity"]},
                        quantity,
                    ]
                },
            }

            update_query = {
                "$inc": {"reserved_quantity": quantity},
                "$set": {"updated_at": datetime.now(timezone.utc)},
            }

            updated_doc = await self.db.inventory.find_one_and_update(
                filter_query,
                update_query,
                return_document=True,
            )

            if not updated_doc:
                return {
                    "success": False,
                    "reason": "Insufficient inventory available at this store.",
                }

            # Step 3: Create Reservation Record
            reservation_id = f"res_{uuid.uuid4().hex[:12]}"
            now = datetime.now(timezone.utc)
            expires_at = now + timedelta(minutes=ttl_minutes)

            reservation_doc = {
                "_id": reservation_id,
                "order_id": order_id,
                "store_id": store_id,
                "medicine_id": medicine_id,
                "quantity": quantity,
                "status": "RESERVED",
                "created_at": now,
                "expires_at": expires_at,
            }

            await self.db.reservations.insert_one(reservation_doc)

            return {
                "success": True,
                "reservation_id": reservation_id,
                "store_id": store_id,
                "medicine_id": medicine_id,
                "quantity_reserved": quantity,
                "available_remaining": updated_doc["quantity"] - updated_doc["reserved_quantity"],
                "expires_at": expires_at.isoformat(),
            }

        finally:
            if lock_token:
                await self._release_redis_lock(store_id, medicine_id, lock_token)