from fastapi import APIRouter
from app.api.v1.health import router as health_router
from app.api.v1.search import router as search_router
from app.api.v1.medicines import router as medicines_router
from app.api.v1.stores import router as stores_router
from app.api.v1.alternatives import router as alternatives_router
from app.api.v1.orders import router as orders_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(search_router)
api_router.include_router(medicines_router)
api_router.include_router(stores_router)
api_router.include_router(alternatives_router)
api_router.include_router(orders_router)