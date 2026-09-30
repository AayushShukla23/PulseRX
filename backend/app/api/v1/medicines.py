from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from app.core.database import get_database

router = APIRouter(prefix="/medicines", tags=["Medicine Catalog"])


@router.get("/{medicine_id}")
async def get_medicine_by_id(medicine_id: str, db=Depends(get_database)):
    """Fetch single medicine details from MongoDB (Source of Truth)."""
    medicine = await db.medicines.find_one({"_id": medicine_id})
    if not medicine:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Medicine with ID '{medicine_id}' not found.",
        )
    return medicine


@router.get("")
async def list_all_medicines(limit: int = 50, db=Depends(get_database)):
    """List medicines directly from MongoDB source of truth."""
    medicines = await db.medicines.find({"is_active": True}).to_list(length=limit)
    return medicines