import asyncio
import sys
from pathlib import Path

sys.path.append(str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from elasticsearch import AsyncElasticsearch
from elasticsearch.helpers import async_bulk
from app.core.config import settings

INDEX_NAME = "medicines"

INDEX_SETTINGS_AND_MAPPINGS = {
    "settings": {
        "number_of_shards": 1,
        "number_of_replicas": 0,
        "analysis": {
            "analyzer": {
                "medicine_autocomplete_analyzer": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": ["lowercase", "medicine_edge_ngram_filter"],
                },
                "medicine_search_analyzer": {
                    "type": "custom",
                    "tokenizer": "standard",
                    "filter": ["lowercase"],
                },
            },
            "filter": {
                "medicine_edge_ngram_filter": {
                    "type": "edge_ngram",
                    "min_gram": 2,
                    "max_gram": 15,
                }
            },
        },
    },
    "mappings": {
        "properties": {
            "id": {"type": "keyword"},
            "name": {
                "type": "text",
                "analyzer": "medicine_autocomplete_analyzer",
                "search_analyzer": "medicine_search_analyzer",
                "fields": {"raw": {"type": "keyword"}},
            },
            "brand": {
                "type": "text",
                "analyzer": "medicine_autocomplete_analyzer",
                "search_analyzer": "medicine_search_analyzer",
                "fields": {"raw": {"type": "keyword"}},
            },
            "generic_name": {"type": "text"},
            "salt": {
                "type": "text",
                "analyzer": "medicine_autocomplete_analyzer",
                "search_analyzer": "medicine_search_analyzer",
                "fields": {"raw": {"type": "keyword"}},
            },
            "strength": {"type": "keyword"},
            "dosage_form": {"type": "keyword"},
            "route": {"type": "keyword"},
            "pack_size": {"type": "keyword"},
            "price": {"type": "double"},
            "prescription_required": {"type": "boolean"},
            "category": {"type": "keyword"},
            "manufacturer": {"type": "text"},
            "description": {"type": "text"},
            "is_active": {"type": "boolean"},
        }
    },
}


async def index_medicines():
    print("Connecting to MongoDB and Elasticsearch...")
    mongo_client = AsyncIOMotorClient(settings.MONGO_URI)
    db = mongo_client[settings.MONGO_DB_NAME]
    es_client = AsyncElasticsearch(hosts=[settings.ELASTICSEARCH_URL])

    try:
        # 1. Delete existing index if present
        try:
            await es_client.indices.delete(index=INDEX_NAME, ignore_unavailable=True)
            print(f"Cleaned existing index '{INDEX_NAME}'.")
        except Exception as e:
            print(f"Index delete notice: {e}")

        # 2. Create Index with mappings
        print(f"Creating Elasticsearch index '{INDEX_NAME}' with custom analyzers...")
        await es_client.indices.create(index=INDEX_NAME, body=INDEX_SETTINGS_AND_MAPPINGS)

        # 3. Fetch Medicines from MongoDB
        medicines = await db.medicines.find({"is_active": True}).to_list(length=1000)
        print(f"Fetched {len(medicines)} active medicines from MongoDB.")

        # 4. Build Bulk Index Actions
        actions = []
        for med in medicines:
            doc = {
                "_index": INDEX_NAME,
                "_id": str(med["_id"]),
                "id": str(med["_id"]),
                "name": med.get("name", ""),
                "brand": med.get("brand", ""),
                "generic_name": med.get("generic_name", ""),
                "salt": med.get("salt", ""),
                "strength": med.get("strength", ""),
                "dosage_form": med.get("dosage_form", ""),
                "route": med.get("route", ""),
                "pack_size": med.get("pack_size", ""),
                "price": float(med.get("price", 0.0)),
                "prescription_required": bool(med.get("prescription_required", False)),
                "category": med.get("category", ""),
                "manufacturer": med.get("manufacturer", ""),
                "description": med.get("description", ""),
                "is_active": bool(med.get("is_active", True)),
            }
            actions.append(doc)

        # 5. Execute Bulk Indexing
        success, _ = await async_bulk(es_client, actions)
        print(f"✅ Successfully indexed {success} medicines into Elasticsearch!")

    finally:
        mongo_client.close()
        await es_client.close()


if __name__ == "__main__":
    asyncio.run(index_medicines())