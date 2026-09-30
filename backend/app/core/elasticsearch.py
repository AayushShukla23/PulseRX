from elasticsearch import AsyncElasticsearch
from app.core.config import settings


class ElasticsearchManager:
    client: AsyncElasticsearch | None = None


es_manager = ElasticsearchManager()


async def connect_to_es():
    es_manager.client = AsyncElasticsearch(
        hosts=[settings.ELASTICSEARCH_URL],
        request_timeout=5.0,
        max_retries=3,
        retry_on_timeout=True,
    )


async def close_es_connection():
    if es_manager.client:
        await es_manager.client.close()


def get_es() -> AsyncElasticsearch:
    if es_manager.client is None:
        raise RuntimeError("Elasticsearch client is not initialized.")
    return es_manager.client