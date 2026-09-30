from typing import Optional, List, Dict, Any
from elasticsearch import AsyncElasticsearch
from app.core.elasticsearch import get_es

INDEX_NAME = "medicines"


class SearchService:
    def __init__(self, es_client: AsyncElasticsearch):
        self.es = es_client

    async def search_medicines(
        self,
        query: str,
        category: Optional[str] = None,
        dosage_form: Optional[str] = None,
        prescription_required: Optional[bool] = None,
        max_price: Optional[float] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Dict[str, Any]:
        from_record = (page - 1) * page_size

        # 1. Build Search Query
        must_clauses = []
        should_clauses = []
        filter_clauses = [{"term": {"is_active": True}}]

        if query and query.strip():
            cleaned_query = query.strip()
            
            # Phrase match (exact/high relevance boost)
            should_clauses.append({
                "multi_match": {
                    "query": cleaned_query,
                    "fields": ["name^4", "salt^3", "brand^2.5", "generic_name^2"],
                    "type": "phrase",
                    "boost": 3.0
                }
            })

            # Fuzzy match (typo tolerance e.g., 'crocin suspention', 'paracitamol')
            should_clauses.append({
                "multi_match": {
                    "query": cleaned_query,
                    "fields": ["name^3", "salt^2.5", "brand^2", "generic_name^1.5", "description"],
                    "fuzziness": "AUTO",
                    "operator": "or",
                    "minimum_should_match": "75%"
                }
            })

            must_clauses.append({
                "bool": {
                    "should": should_clauses,
                    "minimum_should_match": 1
                }
            })
        else:
            must_clauses.append({"match_all": {}})

        # 2. Build Filters
        if category:
            filter_clauses.append({"term": {"category": category}})
        if dosage_form:
            filter_clauses.append({"term": {"dosage_form": dosage_form}})
        if prescription_required is not None:
            filter_clauses.append({"term": {"prescription_required": prescription_required}})
        if max_price is not None:
            filter_clauses.append({"range": {"price": {"lte": max_price}}})

        es_query = {
            "query": {
                "bool": {
                    "must": must_clauses,
                    "filter": filter_clauses
                }
            },
            "from": from_record,
            "size": page_size,
        }

        # 3. Execute Query
        response = await self.es.search(index=INDEX_NAME, body=es_query)

        hits = response["hits"]["hits"]
        total = response["hits"]["total"]["value"]

        results = []
        for hit in hits:
            doc = hit["_source"]
            doc["_score"] = hit["_score"]
            results.append(doc)

        return {
            "query": query,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": (total + page_size - 1) // page_size if total > 0 else 0,
            "results": results,
        }