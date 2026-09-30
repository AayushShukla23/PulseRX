from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class InventoryItemBase(BaseModel):
    store_id: str
    medicine_id: str
    quantity: int = Field(..., ge=0)
    reserved_quantity: int = Field(default=0, ge=0)


class InventoryItemResponse(InventoryItemBase):
    id: str = Field(..., alias="_id")
    available_quantity: int
    updated_at: datetime

    class Config:
        populate_by_name = True