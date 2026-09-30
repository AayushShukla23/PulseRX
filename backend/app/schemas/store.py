from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class GeoLocation(BaseModel):
    type: str = Field(default="Point")
    coordinates: List[float] = Field(..., example=[77.6375, 12.9716], description="[longitude, latitude]")


class DarkStoreBase(BaseModel):
    name: str = Field(..., example="Indiranagar Dark Store #01")
    code: str = Field(..., example="DS-BLR-01")
    location: GeoLocation
    address: str = Field(..., example="100 Feet Rd, Indiranagar, Bengaluru")
    service_radius_km: float = Field(default=5.0, example=5.0)
    is_active: bool = Field(default=True)
    operating_hours: str = Field(default="24x7")


class DarkStoreCreate(DarkStoreBase):
    pass


class DarkStoreResponse(DarkStoreBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime
    distance_km: Optional[float] = None

    class Config:
        populate_by_name = True