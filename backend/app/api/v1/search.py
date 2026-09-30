from fastapi import APIRouter, Query, Depends
from typing import Optional
from app.core.elasticsearch import get_es
from app.services.search_service import SearchService

router = APIRouter(prefix="/search", tags=["Medicine Search Engine"])


@router.get("/medicines")
async def search_medicines(
    q: str = Query("", description="Search term e.g. 'crocin', 'paracitamol', 'dolo'"),
    category: Optional[str] = Query(None, description="Filter by category"),
    dosage_form: Optional[str] = Query(None, description="Filter by dosage form (Tablet, Syrup, Gel)"),
    prescription_required: Optional[bool] = Query(None, description="Filter RX requirement"),
    max_price: Optional[float] = Query(None, description="Filter max price limit"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    es_client=Depends(get_es),
):
    search_service = SearchService(es_client)
    return await search_service.search_medicines(
        query=q,
        category=category,
        dosage_form=dosage_form,
        prescription_required=prescription_required,
        max_price=max_price,
        page=page,
        page_size=page_size,
    )