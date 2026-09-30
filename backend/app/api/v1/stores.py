from fastapi import APIRouter, Query, Depends, HTTPException, status
from app.core.database import get_database
from app.core.redis import get_redis
from app.services.fulfillment_service import FulfillmentService

router = APIRouter(prefix="/stores", tags=["Dark Stores & Geospatial"])


@router.get("/nearby")
async def get_nearby_stores(
    lng: float = Query(..., example=77.6412, description="Customer Longitude"),
    lat: float = Query(..., example=12.9784, description="Customer Latitude"),
    max_distance_km: float = Query(10.0, ge=1.0, le=50.0),
    db=Depends(get_database),
    redis=Depends(get_redis),
):
    """Locate dark stores nearest to customer coordinates using MongoDB 2dsphere index."""
    fulfillment_service = FulfillmentService(db, redis)
    stores = await fulfillment_service.find_nearby_stores(lng, lat, max_distance_km)
    return {"customer_location": {"lng": lng, "lat": lat}, "count": len(stores), "stores": stores}


@router.get("/fulfillment-check")
async def check_fulfillment_store(
    lng: float = Query(..., example=77.6412),
    lat: float = Query(..., example=12.9784),
    medicine_id: str = Query(..., example="med_crocin_650"),
    quantity: int = Query(1, ge=1),
    db=Depends(get_database),
    redis=Depends(get_redis),
):
    """Finds nearest dark store capable of fulfilling requested medicine quantity."""
    fulfillment_service = FulfillmentService(db, redis)
    store = await fulfillment_service.find_optimal_fulfillment_store(lng, lat, medicine_id, quantity)
    if not store:
        return {
            "fulfillable": False,
            "reason": "No nearby dark store has sufficient stock for this medicine.",
        }
    return {"fulfillable": True, "fulfillment_store": store}