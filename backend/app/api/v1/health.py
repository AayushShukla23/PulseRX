import time
from fastapi import APIRouter, status
from fastapi.responses import JSONResponse

from app.core.database import get_database
from app.core.redis import get_redis
from app.core.elasticsearch import get_es

router = APIRouter(prefix="/health", tags=["Health & Observability"])


@router.get("", status_code=status.HTTP_200_OK)
async def liveness_check():
    """Liveness probe: returns 200 if FastAPI app is up."""
    return {"status": "ok", "service": "PulseRx Engine"}


@router.get("/dependencies")
async def dependency_readiness_check():
    """
    Readiness probe: Deep check for MongoDB, Redis, and Elasticsearch.
    Measures latency for each connection.
    """
    results = {}
    all_healthy = True

    # 1. MongoDB Check
    try:
        t0 = time.perf_counter()
        db = get_database()
        await db.command("ping")
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        results["mongodb"] = {"status": "healthy", "latency_ms": latency_ms}
    except Exception as exc:
        all_healthy = False
        results["mongodb"] = {"status": "unhealthy", "error": str(exc)}

    # 2. Redis Check
    try:
        t0 = time.perf_counter()
        redis = get_redis()
        pong = await redis.ping()
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        if pong:
            results["redis"] = {"status": "healthy", "latency_ms": latency_ms}
        else:
            all_healthy = False
            results["redis"] = {"status": "unhealthy", "error": "No PONG response"}
    except Exception as exc:
        all_healthy = False
        results["redis"] = {"status": "unhealthy", "error": str(exc)}

    # 3. Elasticsearch Check
    try:
        t0 = time.perf_counter()
        es = get_es()
        health = await es.cluster.health()
        latency_ms = round((time.perf_counter() - t0) * 1000, 2)
        cluster_status = health.get("status", "unknown")
        results["elasticsearch"] = {
            "status": "healthy" if cluster_status in ["green", "yellow"] else "degraded",
            "cluster_status": cluster_status,
            "latency_ms": latency_ms,
        }
    except Exception as exc:
        all_healthy = False
        results["elasticsearch"] = {"status": "unhealthy", "error": str(exc)}

    status_code = status.HTTP_200_OK if all_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if all_healthy else "degraded",
            "dependencies": results,
        },
    )