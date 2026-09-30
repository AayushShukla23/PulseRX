from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
import redis.asyncio as aioredis
from app.services.inventory_service import InventoryService


class SubstitutionService:
    def __init__(self, db: AsyncIOMotorDatabase, redis: Optional[aioredis.Redis] = None):
        self.db = db
        self.inventory_service = InventoryService(db, redis) if redis else None

    async def find_alternatives(
        self,
        medicine_id: str,
        store_id: Optional[str] = None,
        limit: int = 5,
    ) -> Dict[str, Any]:
        """
        Finds substitute candidate medicines based on structured medical attributes.
        Ranks candidates using a transparent scoring model.
        """
        # 1. Fetch requested original medicine
        original_med = await self.db.medicines.find_one({"_id": medicine_id})
        if not original_med:
            return {"error": f"Medicine '{medicine_id}' not found", "alternatives": []}

        salt = original_med.get("salt", "")
        strength = original_med.get("strength", "")
        dosage_form = original_med.get("dosage_form", "")
        route = original_med.get("route", "")
        price = original_med.get("price", 0.0)

        # 2. Query potential candidates with matching active salt, excluding original medicine
        cursor = self.db.medicines.find({
            "_id": {"$ne": medicine_id},
            "is_active": True,
            "$or": [
                {"salt": {"$regex": salt, "$options": "i"}},
                {"generic_name": {"$regex": salt, "$options": "i"}},
            ],
        })
        candidates = await cursor.to_list(length=100)

        scored_alternatives = []
        for cand in candidates:
            score = 0.0
            matched_attributes = []
            warnings = []

            # Factor 1: Active Salt Match (Weight: 0.40)
            cand_salt = cand.get("salt", "")
            if cand_salt.lower() == salt.lower():
                score += 0.40
                matched_attributes.append("salt")
            elif salt.lower() in cand_salt.lower() or cand_salt.lower() in salt.lower():
                score += 0.25
                matched_attributes.append("partial_salt")

            # Factor 2: Strength Match (Weight: 0.25)
            cand_strength = cand.get("strength", "")
            if cand_strength.lower() == strength.lower():
                score += 0.25
                matched_attributes.append("strength")
            else:
                warnings.append(f"Strength difference: requested {strength}, candidate is {cand_strength}")

            # Factor 3: Dosage Form Match (Weight: 0.20)
            cand_form = cand.get("dosage_form", "")
            if cand_form.lower() == dosage_form.lower():
                score += 0.20
                matched_attributes.append("dosage_form")
            else:
                warnings.append(f"Dosage form difference: requested {dosage_form}, candidate is {cand_form}")

            # Factor 4: Route Match (Weight: 0.10)
            cand_route = cand.get("route", "")
            if cand_route.lower() == route.lower():
                score += 0.10
                matched_attributes.append("route")

            # Factor 5: Price Similarity (Weight: 0.05)
            cand_price = cand.get("price", 0.0)
            if price > 0:
                price_diff_pct = abs(cand_price - price) / price
                if price_diff_pct <= 0.20:
                    score += 0.05
                    matched_attributes.append("price_similar")

            score = round(score, 2)

            # Check stock availability at specific store if provided
            available_qty = None
            is_in_stock = True
            if store_id and self.inventory_service:
                stock_info = await self.inventory_service.check_availability(store_id, cand["_id"])
                available_qty = stock_info["available_quantity"]
                is_in_stock = available_qty > 0

            if is_in_stock:
                scored_alternatives.append({
                    "candidate_medicine": cand,
                    "alternative_score": score,
                    "matched_attributes": matched_attributes,
                    "warnings": warnings,
                    "requires_approval": True,
                    "approval_disclaimer": "Candidate alternative recommendation - requires explicit user or pharmacist approval.",
                    "store_available_quantity": available_qty,
                })

        # 3. Sort by match score descending
        scored_alternatives.sort(key=lambda x: x["alternative_score"], reverse=True)

        return {
            "original_medicine": original_med,
            "store_id": store_id,
            "count": len(scored_alternatives[:limit]),
            "alternatives": scored_alternatives[:limit],
        }