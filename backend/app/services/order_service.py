import uuid
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import redis.asyncio as aioredis

from app.schemas.order import OrderStatus, OrderCreateRequest
from app.services.fulfillment_service import FulfillmentService
from app.services.inventory_service import InventoryService
from app.websocket.connection_manager import ws_manager


# Valid transition state graph
VALID_TRANSITIONS = {
    OrderStatus.CREATED: [OrderStatus.SEARCHING_FULFILLMENT, OrderStatus.CANCELLED],
    OrderStatus.SEARCHING_FULFILLMENT: [OrderStatus.INVENTORY_RESERVED, OrderStatus.ALTERNATIVE_REVIEW, OrderStatus.OUT_OF_STOCK, OrderStatus.FULFILLMENT_FAILED],
    OrderStatus.INVENTORY_RESERVED: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    OrderStatus.ALTERNATIVE_REVIEW: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED, OrderStatus.OUT_OF_STOCK],
    OrderStatus.CONFIRMED: [OrderStatus.PACKING, OrderStatus.CANCELLED],
    OrderStatus.PACKING: [OrderStatus.READY_FOR_DISPATCH, OrderStatus.CANCELLED],
    OrderStatus.READY_FOR_DISPATCH: [OrderStatus.DISPATCHED, OrderStatus.CANCELLED],
    OrderStatus.DISPATCHED: [OrderStatus.DELIVERED],
    OrderStatus.DELIVERED: [],
    OrderStatus.CANCELLED: [],
    OrderStatus.OUT_OF_STOCK: [],
    OrderStatus.FULFILLMENT_FAILED: [],
}


class OrderService:
    def __init__(self, db: AsyncIOMotorDatabase, redis: aioredis.Redis):
        self.db = db
        self.redis = redis
        self.fulfillment_service = FulfillmentService(db, redis)
        self.inventory_service = InventoryService(db, redis)

    async def create_order(self, req: OrderCreateRequest) -> Dict[str, Any]:
        """Creates a new order in CREATED state and publishes event to Redis Stream."""
        order_id = f"ord_{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc)

        # Calculate total price & fetch item snapshots
        processed_items = []
        total_amount = 0.0

        for item in req.items:
            med = await self.db.medicines.find_one({"_id": item.medicine_id})
            if not med:
                raise ValueError(f"Medicine '{item.medicine_id}' does not exist.")

            unit_price = med.get("price", 0.0)
            item_total = unit_price * item.quantity
            total_amount += item_total

            processed_items.append({
                "medicine_id": item.medicine_id,
                "name": med.get("name"),
                "quantity": item.quantity,
                "unit_price": unit_price,
                "total_price": item_total,
            })

        order_doc = {
            "_id": order_id,
            "customer_name": req.customer_name,
            "customer_phone": req.customer_phone,
            "customer_location": req.location.model_dump(),
            "status": OrderStatus.CREATED,
            "store_id": None,
            "items": processed_items,
            "total_amount": round(total_amount, 2),
            "created_at": now,
            "updated_at": now,
            "status_history": [
                {"status": OrderStatus.CREATED, "timestamp": now.isoformat(), "note": "Order created."}
            ],
        }

        await self.db.orders.insert_one(order_doc)

        # Push to Redis Stream for Async Worker Processing
        await self.redis.xadd(
            "stream:orders",
            {"order_id": order_id, "action": "PROCESS_FULFILLMENT"},
        )

        return order_doc

    async def update_order_status(
        self,
        order_id: str,
        new_status: OrderStatus,
        note: str = "",
        store_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Validated Order State Machine Transition."""
        order = await self.db.orders.find_one({"_id": order_id})
        if not order:
            raise ValueError(f"Order '{order_id}' not found.")

        current_status = OrderStatus(order["status"])

        # Validate Transition
        allowed_next = VALID_TRANSITIONS.get(current_status, [])
        if new_status not in allowed_next:
            raise ValueError(f"Invalid transition from {current_status.value} -> {new_status.value}.")

        now = datetime.now(timezone.utc)
        update_fields = {
            "status": new_status,
            "updated_at": now,
        }
        if store_id:
            update_fields["store_id"] = store_id

        history_entry = {"status": new_status, "timestamp": now.isoformat(), "note": note}

        updated_doc = await self.db.orders.find_one_and_update(
            {"_id": order_id},
            {
                "$set": update_fields,
                "$push": {"status_history": history_entry},
            },
            return_document=True,
        )

        # Broadcast via WebSockets to active clients
        payload = {
            "order_id": order_id,
            "status": new_status,
            "store_id": store_id or order.get("store_id"),
            "note": note,
            "updated_at": now.isoformat(),
        }
        await ws_manager.broadcast_order_update(order_id, payload)

        return updated_doc

    async def process_fulfillment_workflow(self, order_id: str) -> None:
        """Fulfillment state pipeline invoked by async background worker."""
        order = await self.db.orders.find_one({"_id": order_id})
        if not order or order["status"] != OrderStatus.CREATED:
            return

        # Step 1: Transition to SEARCHING_FULFILLMENT
        await self.update_order_status(
            order_id,
            OrderStatus.SEARCHING_FULFILLMENT,
            note="Locating optimal nearby dark store...",
        )

        location = order["customer_location"]
        lng, lat = location["lng"], location["lat"]
        first_item = order["items"][0]
        med_id = first_item["medicine_id"]
        qty = first_item["quantity"]

        # Step 2: Find Optimal Store
        store_match = await self.fulfillment_service.find_optimal_fulfillment_store(
            lng, lat, med_id, qty
        )

        if not store_match:
            # Check for alternative recommendations
            await self.update_order_status(
                order_id,
                OrderStatus.ALTERNATIVE_REVIEW,
                note="Requested medicine out of stock at nearby stores. Alternative recommended.",
            )
            return

        matched_store_id = store_match["store_id"]

        # Step 3: Reserve Inventory Atomically
        res = await self.inventory_service.reserve_inventory(
            order_id, matched_store_id, med_id, qty
        )

        if not res["success"]:
            await self.update_order_status(
                order_id,
                OrderStatus.OUT_OF_STOCK,
                note="Inventory reservation failed due to contention.",
            )
            return

        # Step 4: Confirm Order
        await self.update_order_status(
            order_id,
            OrderStatus.INVENTORY_RESERVED,
            note=f"Stock reserved at store {store_match['store_name']}.",
            store_id=matched_store_id,
        )

        await self.update_order_status(
            order_id,
            OrderStatus.CONFIRMED,
            note="Order confirmed and sent to dark store operations team.",
        )