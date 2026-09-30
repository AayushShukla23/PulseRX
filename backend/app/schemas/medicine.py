
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class MedicineBase(BaseModel):
    name: str = Field(..., example="Crocin 650 Advance")
    brand: str = Field(..., example="Crocin")
    generic_name: str = Field(..., example="Paracetamol")
    salt: str = Field(..., example="Paracetamol")
    strength: str = Field(..., example="650mg")
    dosage_form: str = Field(..., example="Tablet")  # Tablet, Syrup, Suspension, Capsule, Gel, Inhaler
    route: str = Field(default="Oral", example="Oral")  # Oral, Topical, Inhalation, Ophthalmic
    pack_size: str = Field(..., example="15 tablets")
    price: float = Field(..., gt=0, example=30.50)
    prescription_required: bool = Field(default=False)
    category: str = Field(..., example="Pain Relief")
    manufacturer: str = Field(..., example="GlaxoSmithKline")
    description: str = Field(default="")
    is_active: bool = Field(default=True)


class MedicineCreate(MedicineBase):
    pass


class MedicineResponse(MedicineBase):
    id: str = Field(..., alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True