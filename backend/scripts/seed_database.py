import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path

# Add backend directory to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, GEOSPHERE
from app.core.config import settings

# 1. DARK STORES DATA (Coordinates: [Longitude, Latitude])
DARK_STORES = [
    {
        "_id": "store_blr_indiranagar",
        "name": "Indiranagar Central Fulfillment Hub",
        "code": "DS-BLR-01",
        "location": {"type": "Point", "coordinates": [77.6412, 12.9784]},
        "address": "12th Main Rd, Indiranagar, Bengaluru, Karnataka 560038",
        "service_radius_km": 5.0,
        "is_active": True,
        "operating_hours": "24x7",
    },
    {
        "_id": "store_blr_koramangala",
        "name": "Koramangala 4th Block Hub",
        "code": "DS-BLR-02",
        "location": {"type": "Point", "coordinates": [77.6245, 12.9352]},
        "address": "80 Feet Rd, 4th Block, Koramangala, Bengaluru, Karnataka 560034",
        "service_radius_km": 4.5,
        "is_active": True,
        "operating_hours": "24x7",
    },
    {
        "_id": "store_blr_hsr",
        "name": "HSR Layout Sector 1 Express",
        "code": "DS-BLR-03",
        "location": {"type": "Point", "coordinates": [77.6389, 12.9121]},
        "address": "27th Main Rd, Sector 1, HSR Layout, Bengaluru, Karnataka 560102",
        "service_radius_km": 6.0,
        "is_active": True,
        "operating_hours": "06:00 - 02:00",
    },
    {
        "_id": "store_blr_whitefield",
        "name": "Whitefield ITPL Dark Store",
        "code": "DS-BLR-04",
        "location": {"type": "Point", "coordinates": [77.7289, 12.9863]},
        "address": "ITPB Main Rd, Whitefield, Bengaluru, Karnataka 560066",
        "service_radius_km": 7.0,
        "is_active": True,
        "operating_hours": "24x7",
    },
    {
        "_id": "store_blr_jayanagar",
        "name": "Jayanagar 4th Block Store",
        "code": "DS-BLR-05",
        "location": {"type": "Point", "coordinates": [77.5833, 12.9298]},
        "address": "11th Main Rd, 4th Block, Jayanagar, Bengaluru, Karnataka 560011",
        "service_radius_km": 4.0,
        "is_active": True,
        "operating_hours": "07:00 - 23:00",
    },
]

# 2. MEDICINES CATALOG
MEDICINES = [
    # --- Paracetamol / Antipyretic Formulations ---
    {
        "_id": "med_crocin_650",
        "name": "Crocin 650 Advance Tablet",
        "brand": "Crocin",
        "generic_name": "Paracetamol",
        "salt": "Paracetamol",
        "strength": "650mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "15 tablets",
        "price": 33.50,
        "prescription_required": False,
        "category": "Pain & Fever",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Fast-acting relief from fever, headache, body ache, and mild-to-moderate pain.",
        "is_active": True,
    },
    {
        "_id": "med_dolo_650",
        "name": "Dolo 650 Tablet",
        "brand": "Dolo",
        "generic_name": "Paracetamol",
        "salt": "Paracetamol",
        "strength": "650mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "15 tablets",
        "price": 34.00,
        "prescription_required": False,
        "category": "Pain & Fever",
        "manufacturer": "Micro Labs Ltd",
        "description": "Widely prescribed antipyretic for persistent fever and severe body pain.",
        "is_active": True,
    },
    {
        "_id": "med_calpol_650",
        "name": "Calpol 650mg Tablet",
        "brand": "Calpol",
        "generic_name": "Paracetamol",
        "salt": "Paracetamol",
        "strength": "650mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "15 tablets",
        "price": 31.80,
        "prescription_required": False,
        "category": "Pain & Fever",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Standard therapeutic paracetamol dose for pyrexia and headache.",
        "is_active": True,
    },
    {
        "_id": "med_pacimol_650",
        "name": "Pacimol 650 Tablet",
        "brand": "Pacimol",
        "generic_name": "Paracetamol",
        "salt": "Paracetamol",
        "strength": "650mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "15 tablets",
        "price": 29.00,
        "prescription_required": False,
        "category": "Pain & Fever",
        "manufacturer": "Ipca Laboratories Ltd",
        "description": "High purity paracetamol formulation for pain and pyrexia.",
        "is_active": True,
    },
    {
        "_id": "med_crocin_suspension",
        "name": "Crocin 120 Suspension Peppermint Flavour",
        "brand": "Crocin",
        "generic_name": "Paracetamol Paediatric",
        "salt": "Paracetamol",
        "strength": "120mg/5ml",
        "dosage_form": "Suspension",
        "route": "Oral",
        "pack_size": "60 ml",
        "price": 42.00,
        "prescription_required": False,
        "category": "Pediatrics",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Paediatric formulation for children fever and post-vaccination fever.",
        "is_active": True,
    },
    {
        "_id": "med_calpol_suspension",
        "name": "Calpol 120 Peppermint Paediatric Suspension",
        "brand": "Calpol",
        "generic_name": "Paracetamol Paediatric",
        "salt": "Paracetamol",
        "strength": "120mg/5ml",
        "dosage_form": "Suspension",
        "route": "Oral",
        "pack_size": "60 ml",
        "price": 41.50,
        "prescription_required": False,
        "category": "Pediatrics",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Gentle on stomach liquid paracetamol for infants and toddlers.",
        "is_active": True,
    },

    # --- Gastro & Antacids ---
    {
        "_id": "med_pan_40",
        "name": "Pan 40 Tablet",
        "brand": "Pan",
        "generic_name": "Pantoprazole Gastro-Resistant",
        "salt": "Pantoprazole",
        "strength": "40mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "15 tablets",
        "price": 155.00,
        "prescription_required": True,
        "category": "Gastro Care",
        "manufacturer": "Alkem Laboratories Ltd",
        "description": "Proton pump inhibitor used to treat acidity, GERD, and stomach ulcers.",
        "is_active": True,
    },
    {
        "_id": "med_pantocid_40",
        "name": "Pantocid 40 Tablet",
        "brand": "Pantocid",
        "generic_name": "Pantoprazole Gastro-Resistant",
        "salt": "Pantoprazole",
        "strength": "40mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "15 tablets",
        "price": 162.00,
        "prescription_required": True,
        "category": "Gastro Care",
        "manufacturer": "Sun Pharmaceutical Industries Ltd",
        "description": "Reduces the amount of acid produced in the stomach.",
        "is_active": True,
    },
    {
        "_id": "med_pan_d",
        "name": "Pan-D Capsule",
        "brand": "Pan-D",
        "generic_name": "Pantoprazole + Domperidone",
        "salt": "Pantoprazole + Domperidone",
        "strength": "40mg/30mg",
        "dosage_form": "Capsule",
        "route": "Oral",
        "pack_size": "15 capsules",
        "price": 199.00,
        "prescription_required": True,
        "category": "Gastro Care",
        "manufacturer": "Alkem Laboratories Ltd",
        "description": "Relieves symptoms of gastroesophageal reflux disease (GERD) and nausea.",
        "is_active": True,
    },

    # --- Allergy & Antihistamines ---
    {
        "_id": "med_allegra_120",
        "name": "Allegra 120mg Tablet",
        "brand": "Allegra",
        "generic_name": "Fexofenadine Hydrochloride",
        "salt": "Fexofenadine",
        "strength": "120mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "10 tablets",
        "price": 218.00,
        "prescription_required": False,
        "category": "Allergy & Cold",
        "manufacturer": "Sanofi India Ltd",
        "description": "Non-sedating antihistamine for allergic rhinitis, sneezing, runny nose.",
        "is_active": True,
    },
    {
        "_id": "med_fexova_120",
        "name": "Fexova 120mg Tablet",
        "brand": "Fexova",
        "generic_name": "Fexofenadine Hydrochloride",
        "salt": "Fexofenadine",
        "strength": "120mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "10 tablets",
        "price": 175.00,
        "prescription_required": False,
        "category": "Allergy & Cold",
        "manufacturer": "Torrent Pharmaceuticals Ltd",
        "description": "Effective anti-allergy relief from pollen, dust, and pet dander.",
        "is_active": True,
    },
    {
        "_id": "med_cetirizine_10",
        "name": "Cetzine 10mg Tablet",
        "brand": "Cetzine",
        "generic_name": "Cetirizine Hydrochloride",
        "salt": "Cetirizine",
        "strength": "10mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "15 tablets",
        "price": 24.50,
        "prescription_required": False,
        "category": "Allergy & Cold",
        "manufacturer": "Dr Reddy's Laboratories Ltd",
        "description": "Quick relief from running nose, watery eyes, and itching.",
        "is_active": True,
    },
    {
        "_id": "med_montair_lc",
        "name": "Montair-LC Tablet",
        "brand": "Montair-LC",
        "generic_name": "Montelukast + Levocetirizine",
        "salt": "Montelukast + Levocetirizine",
        "strength": "10mg/5mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "10 tablets",
        "price": 310.00,
        "prescription_required": True,
        "category": "Respiratory",
        "manufacturer": "Cipla Ltd",
        "description": "Dual action relief from allergic asthma and perennial rhinitis.",
        "is_active": True,
    },

    # --- Antibiotics ---
    {
        "_id": "med_augmentin_625",
        "name": "Augmentin 625 Duo Tablet",
        "brand": "Augmentin",
        "generic_name": "Amoxicillin + Clavulanic Acid",
        "salt": "Amoxicillin + Clavulanic Acid",
        "strength": "500mg/125mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "10 tablets",
        "price": 204.00,
        "prescription_required": True,
        "category": "Antibiotics",
        "manufacturer": "GlaxoSmithKline Pharmaceuticals Ltd",
        "description": "Broad-spectrum penicillin antibiotic against bacterial infections.",
        "is_active": True,
    },
    {
        "_id": "med_moxclav_625",
        "name": "Moxclav 625 Tablet",
        "brand": "Moxclav",
        "generic_name": "Amoxicillin + Clavulanic Acid",
        "salt": "Amoxicillin + Clavulanic Acid",
        "strength": "500mg/125mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "10 tablets",
        "price": 188.00,
        "prescription_required": True,
        "category": "Antibiotics",
        "manufacturer": "Sun Pharmaceutical Industries Ltd",
        "description": "Bacterial infection antibiotic for respiratory tract, ear, and sinus.",
        "is_active": True,
    },
    {
        "_id": "med_azithral_500",
        "name": "Azithral 500 Tablet",
        "brand": "Azithral",
        "generic_name": "Azithromycin",
        "salt": "Azithromycin",
        "strength": "500mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "5 tablets",
        "price": 132.00,
        "prescription_required": True,
        "category": "Antibiotics",
        "manufacturer": "Alembic Pharmaceuticals Ltd",
        "description": "Macrolide antibiotic used to treat bacterial throat, chest, and nasal infections.",
        "is_active": True,
    },

    # --- Pain & Anti-inflammatory ---
    {
        "_id": "med_combiflam",
        "name": "Combiflam Tablet",
        "brand": "Combiflam",
        "generic_name": "Ibuprofen + Paracetamol",
        "salt": "Ibuprofen + Paracetamol",
        "strength": "400mg/325mg",
        "dosage_form": "Tablet",
        "route": "Oral",
        "pack_size": "20 tablets",
        "price": 45.00,
        "prescription_required": False,
        "category": "Pain & Fever",
        "manufacturer": "Sanofi India Ltd",
        "description": "Dual action analgesic for muscular pain, joint pain, toothache, and fever.",
        "is_active": True,
    },
    {
        "_id": "med_volini_gel",
        "name": "Volini Pain Relief Gel",
        "brand": "Volini",
        "generic_name": "Diclofenac Diethylamine + Methyl Salicylate",
        "salt": "Diclofenac Diethylamine",
        "strength": "1.16% w/w",
        "dosage_form": "Gel",
        "route": "Topical",
        "pack_size": "50g tube",
        "price": 150.00,
        "prescription_required": False,
        "category": "Pain & Fever",
        "manufacturer": "Sun Pharmaceutical Industries Ltd",
        "description": "Deep penetration pain relief gel for back pain, joint stiffness, and neck sprains.",
        "is_active": True,
    },

    # --- Cough & Respiratory ---
    {
        "_id": "med_benadryl_syrup",
        "name": "Benadryl Cough Syrup",
        "brand": "Benadryl",
        "generic_name": "Diphenhydramine + Ammonium Chloride",
        "salt": "Diphenhydramine + Ammonium Chloride",
        "strength": "14.08mg/138mg per 5ml",
        "dosage_form": "Syrup",
        "route": "Oral",
        "pack_size": "100 ml",
        "price": 128.00,
        "prescription_required": False,
        "category": "Respiratory",
        "manufacturer": "Johnson & Johnson Ltd",
        "description": "Effective relief from cough, scratchy throat, and chest congestion.",
        "is_active": True,
    },
    {
        "_id": "med_ascoril_d",
        "name": "Ascoril-D Plus Syrup",
        "brand": "Ascoril",
        "generic_name": "Dextromethorphan + Phenylephrine + Chlorpheniramine",
        "salt": "Dextromethorphan + Phenylephrine + Chlorpheniramine",
        "strength": "10mg/5mg/2mg per 5ml",
        "dosage_form": "Syrup",
        "route": "Oral",
        "pack_size": "100 ml",
        "price": 139.00,
        "prescription_required": False,
        "category": "Respiratory",
        "manufacturer": "Glenmark Pharmaceuticals Ltd",
        "description": "Sugar-free dry cough syrup soothing irritated airways.",
        "is_active": True,
    },
]


async def seed():
    print(f"Connecting to MongoDB at {settings.MONGO_URI}...")
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]
    now = datetime.now(timezone.utc)

    # 1. Clean existing collections
    print("Clearing collections...")
    await db.stores.delete_many({})
    await db.medicines.delete_many({})
    await db.inventory.delete_many({})
    await db.orders.delete_many({})
    await db.reservations.delete_many({})

    # 2. Create Indexes
    print("Building MongoDB indexes...")
    # Stores 2dsphere index
    await db.stores.create_index([("location", GEOSPHERE)])
    await db.stores.create_index([("code", ASCENDING)], unique=True)

    # Medicines indexes
    await db.medicines.create_index([("salt", ASCENDING)])
    await db.medicines.create_index([("category", ASCENDING)])
    await db.medicines.create_index([("brand", ASCENDING)])

    # Inventory compound unique index & foreign lookup index
    await db.inventory.create_index(
        [("store_id", ASCENDING), ("medicine_id", ASCENDING)], 
        unique=True
    )
    await db.inventory.create_index([("medicine_id", ASCENDING)])

    # Orders & Reservations indexes
    await db.orders.create_index([("status", ASCENDING)])
    await db.orders.create_index([("created_at", ASCENDING)])
    await db.reservations.create_index([("order_id", ASCENDING)])
    await db.reservations.create_index([("expires_at", ASCENDING)])

    # 3. Seed Dark Stores
    print(f"Seeding {len(DARK_STORES)} Dark Stores...")
    for store in DARK_STORES:
        store["created_at"] = now
        store["updated_at"] = now
    await db.stores.insert_many(DARK_STORES)

    # 4. Seed Medicines
    print(f"Seeding {len(MEDICINES)} Medicines...")
    for med in MEDICINES:
        med["created_at"] = now
        med["updated_at"] = now
    await db.medicines.insert_many(MEDICINES)

    # 5. Seed Inventory Matrix across stores
    print("Generating Inventory Matrix across Dark Stores...")
    inventory_records = []
    
    # Store stock patterns (for demonstration of stockout & substitutions):
    # - Indiranagar: High stock on Crocin & Dolo, but OOS on Pan 40 (has Pantocid alternative)
    # - Koramangala: High stock across all
    # - HSR: OOS on Crocin 650 (triggers substitution to Dolo 650 or Calpol 650)
    
    stock_rules = {
        "store_blr_hsr": {
            "med_crocin_650": 0,  # Deliberate OOS for substitution demo
            "med_dolo_650": 45,
            "med_calpol_650": 30,
        },
        "store_blr_indiranagar": {
            "med_crocin_650": 1,  # Contention demo item (1 left!)
            "med_pan_40": 0,      # Triggers Pantocid 40 alternative
            "med_pantocid_40": 25,
        }
    }

    for store in DARK_STORES:
        store_id = store["_id"]
        for med in MEDICINES:
            med_id = med["_id"]
            
            # Check specific rule or assign default healthy stock
            if store_id in stock_rules and med_id in stock_rules[store_id]:
                qty = stock_rules[store_id][med_id]
            else:
                qty = 50  # Standard stock

            inventory_records.append({
                "store_id": store_id,
                "medicine_id": med_id,
                "quantity": qty,
                "reserved_quantity": 0,
                "updated_at": now,
            })

    await db.inventory.insert_many(inventory_records)
    print(f"Seeded {len(inventory_records)} inventory records.")

    # 6. Summary check
    store_count = await db.stores.count_documents({})
    med_count = await db.medicines.count_documents({})
    inv_count = await db.inventory.count_documents({})
    
    print("\n✅ SEEDING COMPLETE!")
    print(f"📦 Dark Stores: {store_count}")
    print(f"💊 Medicines:   {med_count}")
    print(f"📊 Inventory:   {inv_count}")

    client.close()


if __name__ == "__main__":
    asyncio.run(seed())