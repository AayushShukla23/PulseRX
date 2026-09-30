from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.core.redis import connect_to_redis, close_redis_connection
from app.core.elasticsearch import connect_to_es, close_es_connection
from app.api.v1 import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: connect to all services
    await connect_to_mongo()
    await connect_to_redis()
    await connect_to_es()
    print("🚀 All infrastructure connections established successfully.")
    yield
    # Teardown: close connections cleanly
    await close_mongo_connection()
    await close_redis_connection()
    await close_es_connection()
    print("🛑 All infrastructure connections closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS configuration for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health/dependencies",
    }