"""
One-off migration script to create test_categories and seed the Food Safety catalogue.
Run with: python migrations/seed_food_safety.py (from backend folder)
"""
import asyncio
from app.database import async_session, engine, Base
from app.models import TestCategory, LabTest

FOOD_SAFETY = [
    {"code":"D1","name":"Microbiology","tests":[
        "Total Viable Count (TVC)","Yeasts and Molds","Coliforms (Colony Count)","Coliforms / E.coli MPN",
        "E.coli beta-glucuronidase +","Enterobacteriaceae","Salmonella spp. (Detection)","Listeria monocytogenes / Listeria spp.",
        "Staphylococcus aureus (Coag+)","Bacillus cereus","Clostridium perfringens","Pseudomonas spp. / P.aeruginosa",
        "Cronobacter spp.","Campylobacter spp.","Sulphite-reducing Clostridia","Other (Specify)"
    ]},
    {"code":"D2","name":"Chemistry (Proximate / Nutritional / Quality)","tests":[
        "pH","Acidity / Titratable Acidity","Salty Content (NaCl)","Moisture Content","Ash",
        "Crude Protein (Kjeldahl / Dumas)","Crude Fat","Crude Fiber","Carbohydrate (By Difference)","Total Sugars / Reducing Sugars",
        "Water Activity (aw)","Peroxide Value (Oils & Fats)","Free Fatty Acids (FFA)","Pesticide Residues Analysis","Antibiotic Residues","Other (Specify)"
    ]},
    {"code":"D3","name":"Allergens","tests":["Gluten","Peanut","Tree Nuts (Specify)","Soy","Milk / Casein / Beta-lactoglobulin","Egg","Fish","Crustacean Shellfish","Mollusc","Sesame","Mustard","Celery","Sulphites","Lupin","Other (Specify)"]},
    {"code":"D4","name":"Mycotoxins","tests":["Aflatoxin B1","Total Aflatoxins (B1+B2+G1+G2)","Aflatoxin M1","Ochratoxin A","Zearalenone","Deoxynivalenol (DON)","Fumonisins (B1+B2)","T-2 / HT-2","Other (Specify)"]},
    {"code":"D5","name":"Heavy Metals","tests":["Lead (Pb)","Cadmium (Cd)","Mercury (Hg)","Arsenic (Total)","Arsenic (Inorganic)","Copper (Cu)","Iron (Fe)","Zinc (Zn)","Nickel (Ni)","Tin (Sn)","Aluminium (Al)","Other (Specify)"]},
    {"code":"D6","name":"GMO Detection","tests":["Qualitative GMO Screening (35S/NOS/FMV)","Quantitative GMO Screening (CP4 EPSPS)","Qualitative GMO Screening (BT Cry1Ab/Ac)","Qualitative GMO Screening (PAT/BAR)","Event-specific GMO Identification","Other (Specify)"]},
    {"code":"D7","name":"Meat Authenticity / Species Identification","tests":["Species Identification – Beef","Species Identification – Pork","Species Identification – Poultry","Species Identification – Horse","Species Identification – Donkey","Species Identification – Sheep / Goat","Species Identification – Other (Specify)","Milk Authentication","Expected Species","Other (Specify)"]},
    {"code":"D8","name":"Water Analysis","tests":["pH","Conductivity","Turbidity","Total Dissolved Solids (TDS)","Salinity","Chemical Oxygen Demand (COD)","Biochemical Oxygen Demand (BOD)","Total / Fecal Coliforms","E.coli","Enterococci","Heterotrophic Plate Count (HPC)","Free / Total Chlorine","Nitrate / Nitrite","Hardness (CaCO3)","Heavy Metals","Other (Specify)"]}
]

async def run():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as db:
        # skip if categories exist
        existing = await db.execute(TestCategory.__table__.select().limit(1))
        if existing.first():
            print("Categories already seeded, skipping.")
            return

        for cat in FOOD_SAFETY:
            c = TestCategory(code=cat['code'], name=cat['name'], description=None)
            db.add(c)
            await db.flush()
            for t in cat['tests']:
                db.add(LabTest(name=t, category=f"{cat['code']} - {cat['name']}", category_id=c.id))
        await db.commit()
        print('Seed complete')

if __name__ == '__main__':
    asyncio.run(run())
