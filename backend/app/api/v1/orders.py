from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from typing import List
from app.core.database import get_database
from app.core.redis import get_redis
from app.schemas.order import OrderCreateRequest, OrderStatus
from app.services.order_service import OrderService
from app.websocket.connection_manager import ws_manager

router = APIRouter(prefix="/orders", tags=["Orders & State Machine"])


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_new_order(
    req: OrderCreateRequest,
    db=Depends(get_database),
    redis=Depends(get_redis),
):
    """
    Creates a new customer order and triggers async background fulfillment.
    """
    order_service = OrderService(db, redis)
    try:
        order = await order_service.create_order(req)
        # Instantly run fulfillment workflow (simulating asynchronous event worker)
        await order_service.process_fulfillment_workflow(order["_id"])
        return await db.orders.find_one({"_id": order["_id"]})
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/{order_id}")
async def get_order_by_id(order_id: str, db=Depends(get_database)):
    """Fetch order status details by ID."""
    order = await db.orders.find_one({"_id": order_id})
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Order '{order_id}' not found.")
    return order


@router.get("")
async def list_orders(limit: int = 20, db=Depends(get_database)):
    """List recent orders for operations dashboard."""
    orders = await db.orders.find().sort("created_at", -1).to_list(length=limit)
    return orders


@router.post("/{order_id}/advance-status")
async def advance_order_status(
    order_id: str,
    next_status: OrderStatus,
    db=Depends(get_database),
    redis=Depends(get_redis),
):
    """Operations endpoint to manually push order through state machine phases."""
    order_service = OrderService(db, redis)
    try:
        updated = await order_service.update_order_status(
            order_id, new_status=next_status, note=f"Advanced by operations team to {next_status.value}"
        )
        return updated
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


# WEBSOCKET REAL-TIME TRACKER ENDPOINT
@router.websocket("/ws/{order_id}")
async def websocket_order_tracker(websocket: WebSocket, order_id: str):
    """WebSocket connection endpoint for live customer order state stream."""
    await ws_manager.connect_order(websocket, order_id)
    try:
        while True:
            # Keep connection open and listen for client pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect_order(websocket, order_id)