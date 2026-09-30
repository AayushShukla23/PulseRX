from fastapi import APIRouter, Query, Depends, HTTPException, status
from typing import Optional
from app.core.database import get_database
from app.core.redis import get_redis
from app.services.substitution_service import SubstitutionService

router = APIRouter(prefix="/alternatives", tags=["Medicine Substitution Engine"])


@router.get("/{medicine_id}")
async def get_medicine_alternatives(
    medicine_id: str,
    store_id: Optional[str] = Query(None, description="Optional store ID to filter only in-stock alternatives"),
    limit: int = Query(5, ge=1, le=20),
    db=Depends(get_database),
    redis=Depends(get_redis),
):
    """
    Finds substitute candidate medicines based on salt, strength, and dosage form.
    Returns transparent match scores and safety warnings.
    """
    sub_service = SubstitutionService(db, redis)
    results = await sub_service.find_alternatives(medicine_id, store_id=store_id, limit=limit)
    if "error" in results:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=results["error"])
    return results