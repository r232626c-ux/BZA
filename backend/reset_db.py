import asyncio
from passlib.hash import bcrypt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import async_session, engine, Base
from app.models import User, LabTest, TestCategory

# Structured new Food Safety catalogue: codes, display names, and tests
DEFAULT_LAB_TESTS = [
    {
        "code": "D1",
        "name": "Microbiology",
        "display": "D1 - Microbiology",
        "tests": [
            "Total Viable Count (TVC)",
            "Yeasts and Molds",
            "Coliforms (Colony Count)",
            "Coliforms / E.coli MPN",
            "E.coli beta-glucuronidase +",
            "Enterobacteriaceae",
            "Salmonella spp. (Detection)",
            "Listeria monocytogenes / Listeria spp.",
            "Staphylococcus aureus (Coag+)",
            "Bacillus cereus",
            "Clostridium perfringens",
            "Pseudomonas spp. / P.aeruginosa",
            "Cronobacter spp.",
            "Campylobacter spp.",
            "Sulphite-reducing Clostridia",
            "Other (Specify)"
        ]
    },
    {
        "code": "D2",
        "name": "Chemistry (Proximate / Nutritional / Quality)",
        "display": "D2 - Chemistry",
        "tests": [
            "pH",
            "Acidity / Titratable Acidity",
            "Salty Content (NaCl)",
            "Moisture Content",
            "Ash",
            "Crude Protein (Kjeldahl / Dumas)",
            "Crude Fat",
            "Crude Fiber",
            "Carbohydrate (By Difference)",
            "Total Sugars / Reducing Sugars",
            "Water Activity (aw)",
            "Peroxide Value (Oils & Fats)",
            "Free Fatty Acids (FFA)",
            "Pesticide Residues Analysis",
            "Antibiotic Residues",
            "Other (Specify)"
        ]
    },
    {
        "code": "D3",
        "name": "Allergens",
        "display": "D3 - Allergens",
        "tests": [
            "Gluten",
            "Peanut",
            "Tree Nuts (Specify)",
            "Soy",
            "Milk / Casein / Beta-lactoglobulin",
            "Egg",
            "Fish",
            "Crustacean Shellfish",
            "Mollusc",
            "Sesame",
            "Mustard",
            "Celery",
            "Sulphites",
            "Lupin",
            "Other (Specify)"
        ]
    },
    {
        "code": "D4",
        "name": "Mycotoxins",
        "display": "D4 - Mycotoxins",
        "tests": [
            "Aflatoxin B1",
            "Total Aflatoxins (B1+B2+G1+G2)",
            "Aflatoxin M1",
            "Ochratoxin A",
            "Zearalenone",
            "Deoxynivalenol (DON)",
            "Fumonisins (B1+B2)",
            "T-2 / HT-2",
            "Other (Specify)"
        ]
    },
    {
        "code": "D5",
        "name": "Heavy Metals",
        "display": "D5 - Heavy Metals",
        "tests": [
            "Lead (Pb)",
            "Cadmium (Cd)",
            "Mercury (Hg)",
            "Arsenic (Total)",
            "Arsenic (Inorganic)",
            "Copper (Cu)",
            "Iron (Fe)",
            "Zinc (Zn)",
            "Nickel (Ni)",
            "Tin (Sn)",
            "Aluminium (Al)",
            "Other (Specify)"
        ]
    },
    {
        "code": "D6",
        "name": "GMO Detection",
        "display": "D6 - GMO Detection",
        "tests": [
            "Qualitative GMO Screening (35S/NOS/FMV)",
            "Quantitative GMO Screening (CP4 EPSPS)",
            "Qualitative GMO Screening (BT Cry1Ab/Ac)",
            "Qualitative GMO Screening (PAT/BAR)",
            "Event-specific GMO Identification",
            "Other (Specify)"
        ]
    },
    {
        "code": "D7",
        "name": "Meat Authenticity / Species Identification",
        "display": "D7 - Meat Authenticity / Species Identification",
        "tests": [
            "Species Identification – Beef",
            "Species Identification – Pork",
            "Species Identification – Poultry",
            "Species Identification – Horse",
            "Species Identification – Donkey",
            "Species Identification – Sheep / Goat",
            "Species Identification – Other (Specify)",
            "Milk Authentication",
            "Expected Species",
            "Other (Specify)"
        ]
    },
    {
        "code": "D8",
        "name": "Water Analysis",
        "display": "D8 - Water Analysis",
        "tests": [
            "pH",
            "Conductivity",
            "Turbidity",
            "Total Dissolved Solids (TDS)",
            "Salinity",
            "Chemical Oxygen Demand (COD)",
            "Biochemical Oxygen Demand (BOD)",
            "Total / Fecal Coliforms",
            "E.coli",
            "Enterococci",
            "Heterotrophic Plate Count (HPC)",
            "Free / Total Chlorine",
            "Nitrate / Nitrite",
            "Hardness (CaCO3)",
            "Heavy Metals",
            "Other (Specify)"
        ]
    }
]

async def init_lab_tests(db: AsyncSession):
    # If lab_tests already populated, skip
    result = await db.execute(select(LabTest).limit(1))
    if result.scalars().first():
        return

    # Create normalized categories and lab tests
    for cat in DEFAULT_LAB_TESTS:
        # create category
        category_obj = TestCategory(code=cat["code"], name=cat["name"], description=None)
        db.add(category_obj)
        await db.flush()  # get id

        # add tests under this category
        for idx, test_name in enumerate(cat["tests"]):
            db.add(LabTest(name=test_name, category=f"{cat['code']} - {cat['name']}", category_id=category_obj.id))

    await db.commit()

async def reset_and_init():
    # Drop and recreate all tables
    async with engine.begin() as conn:
        print("Dropping all tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating all tables...")
        await conn.run_sync(Base.metadata.create_all)

  
    # Initialize lab tests
    async with async_session() as db:
        print("Initializing lab tests...")
        await init_lab_tests(db)

    print("✅ Database reset and initialization complete.")

if __name__ == "__main__":
    asyncio.run(reset_and_init())
