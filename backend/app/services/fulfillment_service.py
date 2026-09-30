from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import redis.asyncio as aioredis
from app.services.inventory_service import InventoryService


class FulfillmentService:
    def __init__(self, db: AsyncIOMotorDatabase, redis: aioredis.Redis):
        self.db = db
        self.inventory_service = InventoryService(db, redis)

    async def find_nearby_stores(
        self,
        longitude: float,
        latitude: float,
        max_distance_km: float = 10.0,
    ) -> List[Dict[str, Any]]:
        """
        Uses MongoDB $geoNear aggregation pipeline to locate dark stores within service radius.
        Returns stores ordered by distance in kilometers.
        """
        max_distance_meters = max_distance_km * 1000.0

        pipeline = [
            {
                "$geoNear": {
                    "near": {"type": "Point", "coordinates": [longitude, latitude]},
                    "distanceField": "distance_meters",
                    "maxDistance": max_distance_meters,
                    "spherical": True,
                    "query": {"is_active": True},
                }
            },
            {
                "$addFields": {
                    "distance_km": {"$round": [{"$divide": ["$distance_meters", 1000.0]}, 2]}
                }
            },
        ]

        stores = await self.db.stores.aggregate(pipeline).to_list(length=20)

        eligible_stores = []
        for store in stores:
            if store["distance_km"] <= store.get("service_radius_km", 5.0):
                eligible_stores.append(store)

        return eligible_stores

    async def find_optimal_fulfillment_store(
        self,
        longitude: float,
        latitude: float,
        medicine_id: str,
        requested_quantity: int = 1,
    ) -> Optional[Dict[str, Any]]:
        """
        Finds nearest dark store with sufficient available stock.
        """
        nearby_stores = await self.find_nearby_stores(longitude, latitude)

        for store in nearby_stores:
            store_id = store["_id"]
            stock_info = await self.inventory_service.check_availability(store_id, medicine_id)

            if stock_info["available_quantity"] >= requested_quantity:
                return {
                    "store_id": store_id,
                    "store_name": store["name"],
                    "store_code": store["code"],
                    "distance_km": store["distance_km"],
                    "available_stock": stock_info["available_quantity"],
                }

        return None