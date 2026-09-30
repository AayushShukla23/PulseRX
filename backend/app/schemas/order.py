from enum import Enum
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class OrderStatus(str, Enum):
    CREATED = "CREATED"
    SEARCHING_FULFILLMENT = "SEARCHING_FULFILLMENT"
    INVENTORY_RESERVED = "INVENTORY_RESERVED"
    ALTERNATIVE_REVIEW = "ALTERNATIVE_REVIEW"
    CONFIRMED = "CONFIRMED"
    PACKING = "PACKING"
    READY_FOR_DISPATCH = "READY_FOR_DISPATCH"
    DISPATCHED = "DISPATCHED"
    DELIVERED = "DELIVERED"
    CANCELLED = "CANCELLED"
    OUT_OF_STOCK = "OUT_OF_STOCK"
    FULFILLMENT_FAILED = "FULFILLMENT_FAILED"


class OrderItemCreate(BaseModel):
    medicine_id: str
    quantity: int = Field(..., ge=1)


class CustomerLocation(BaseModel):
    lng: float = Field(..., example=77.6412)
    lat: float = Field(..., example=12.9784)
    address: str = Field(..., example="12th Main, Indiranagar, Bengaluru")


class OrderCreateRequest(BaseModel):
    customer_name: str = Field(..., example="Rahul Sharma")
    customer_phone: str = Field(..., example="+919876543210")
    location: CustomerLocation
    items: List[OrderItemCreate]


class OrderResponse(BaseModel):
    id: str = Field(..., alias="_id")
    customer_name: str
    customer_phone: str
    status: OrderStatus
    store_id: Optional[str] = None
    items: List[dict]
    total_amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True