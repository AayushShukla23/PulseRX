import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as aioredis
from app.core.config import settings
from app.services.inventory_service import InventoryService


async def run_concurrency_stress_test():
    print("\n🔥 STARTING INVENTORY CONCURRENCY STRESS TEST 🔥")
    print("--------------------------------------------------")

    # Connect to MongoDB & Redis
    mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    db = mongo_client[settings.MONGO_DB_NAME]
    redis_client = aioredis.from_url(settings.REDIS_URL, decode_responses=True)

    store_id = "store_blr_indiranagar"
    medicine_id = "med_crocin_650"

    # 1. Reset inventory for this item to EXACTLY 1 unit
    await db.inventory.update_one(
        {"store_id": store_id, "medicine_id": medicine_id},
        {"$set": {"quantity": 1, "reserved_quantity": 0}}
    )
    print(f"Initial State for [{medicine_id}] at [{store_id}]: Total Qty = 1, Reserved Qty = 0")

    inventory_service = InventoryService(db, redis_client)

    # 2. Prepare 10 concurrent reservation tasks
    num_concurrent_users = 10
    tasks = []
    
    print(f"Simulating {num_concurrent_users} users clicking 'Buy Now' at the exact same millisecond...")

    for i in range(num_concurrent_users):
        order_id = f"order_test_race_{i+1}"
        # Launch all tasks simultaneously without await
        task = inventory_service.reserve_inventory(
            order_id=order_id,
            store_id=store_id,
            medicine_id=medicine_id,
            quantity=1,
        )
        tasks.append(task)

    # 3. Fire all 10 requests concurrently using asyncio.gather
    results = await asyncio.gather(*tasks)

    # 4. Evaluate results
    success_count = sum(1 for r in results if r.get("success") is True)
    failure_count = sum(1 for r in results if r.get("success") is False)

    print("\n📊 STRESS TEST RESULTS:")
    print(f"Total Concurrent Reservation Attempts: {num_concurrent_users}")
    print(f"✅ Successful Reservations:            {success_count}")
    print(f"❌ Failed Reservations (OOS):           {failure_count}")

    # 5. Check final database state
    final_inv = await db.inventory.find_one({"store_id": store_id, "medicine_id": medicine_id})
    print("\nDATABASE FINAL STATE:")
    print(f"Total Quantity:    {final_inv['quantity']}")
    print(f"Reserved Quantity: {final_inv['reserved_quantity']}")
    print(f"Available Stock:   {final_inv['quantity'] - final_inv['reserved_quantity']}")

    # Verification Assertion
    if success_count == 1 and failure_count == 9 and final_inv['reserved_quantity'] == 1:
        print("\n🎉 TEST PASSED! Concurrency safety verified. ZERO OVERSELLING OCCURRED.")
    else:
        print("\n❌ TEST FAILED! Race condition detected.")

    await mongo_client.close()
    await redis_client.aclose()


if __name__ == "__main__":
    asyncio.run(run_concurrency_stress_test())