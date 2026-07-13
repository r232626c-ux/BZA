# app/main.py
from app import models
from sqlalchemy import or_
from fastapi import Request
from sqlalchemy import select, inspect, text
from typing import List, Dict, Any
from fastapi import FastAPI, Depends, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, StreamingResponse
import os
from pathlib import Path
import io
import csv
import json
import calendar
import re
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from passlib.context import CryptContext
import app.schemas as schemas
from starlette.middleware.base import BaseHTTPMiddleware
import asyncio
from datetime import datetime, timedelta
from datetime import date as date_cls
from sqlalchemy import create_engine, Column, Integer, String, Float, Date, JSON, ForeignKey, DateTime
from jose import jwt
import requests
from app.schemas import LabTestOut, TestCategoryOut
from app.models import TestCategory
from app import crud
from app.database import async_session, init_db, get_db, Base, engine
from app.crud import (
    create_user, authenticate_user, create_patient, get_patient, update_patient,
    create_lab_test, get_lab_test, create_lab_request, get_lab_request,
    create_lab_result,create_password_reset_token,
    verify_password_reset_token,
    reset_user_password, get_audit_logs
   
)
from app.schemas import (
    UserCreate, PatientCreate, PatientUpdate, LabTestCreate, 
    LabRequestCreate, LabResultCreate,  UserOut, PatientOut, LabRequestOut, PasswordResetRequest,
    PasswordResetConfirm,
    AdminCreateUser, AuditLogOut, LabRequestUpdate

)
from app.models import User, LabTest, Patient, SystemSettings, PaymentCode, Email, Appointment # Ensure you have models defined




# ==============================
# CONFIG
# ==============================
SECRET_KEY = "SUPERSECRETKEY"  # Change for production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

app = FastAPI(title="Biozone Analytics (BZA) API")

# CORS
# Allow localhost during development and optionally a production frontend URL
frontend_url = os.getenv("FRONTEND_URL")  # set this in Render/Vercel to your deployed frontend
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]
if frontend_url:
    origins.append(frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==============================
# LAB REFERENCE RANGES
# ==============================
lab_reference_ranges = {
    "CD4": {"range": "410 - 1590", "unit": "cells/µl", "comment": "Normal CD4 range for healthy immune function."},
    "ESR": {"range": "1 - 25", "unit": "mm/hr", "comment": "Elevated ESR can indicate inflammation."},
    "WBC": {"range": "4 - 10", "unit": "10⁹/L", "comment": "High WBC suggests infection or inflammation."},
    "Neutrophil(%)": {"range": "40 - 75", "unit": "%", "comment": "Neutrophils are first responders to microbial infection."},
    "Lymphocytes(%)": {"range": "25 - 40", "unit": "%", "comment": "Lymphocytes defend against viral infections."},
    "Granulocyte(%)": {"range": "2 - 10", "unit": "%", "comment": "Part of WBC count, elevated in allergic reactions and infections."},
    "Neutrophils": {"range": "1.5 - 7.5", "unit": "x10⁹/µL", "comment": "Increased in bacterial infections, decreased in certain viral infections."},
    "Lymphocytes": {"range": "1 - 4", "unit": "x10⁹/µL", "comment": "Can increase in viral infections and lymphocytic leukemia."},
    "Granulocyte": {"range": "0.2 - 1", "unit": "x10⁹/µL", "comment": "Helps indicate inflammation or allergy."},
    "HS CRP": {"range": "0.5 - 10", "unit": "mg/L", "comment": "High-sensitivity CRP indicates cardiovascular risk."},
    "Blood Glucose": {"range": "3.3 - 7.8", "unit": "mmol/L", "comment": "Used to monitor diabetes or hypoglycemia."},
    "Calcium": {"range": "2.1 - 2.55", "unit": "mmol/L", "comment": "Low calcium may indicate parathyroid disorder or vitamin D deficiency."},
    "Corrected Calcium": {"range": "2.1 - 2.55", "unit": "mmol/L", "comment": "Adjusted for albumin levels."},
    "Myoglobin": {"range": "0 - 65", "unit": "ng/ml", "comment": "Elevated in muscle injury, including myocardial infarction."},
    "Glycosylated Hb (%)": {"range": "4.8 - 6.5", "unit": "%", "comment": "Used to assess long-term glucose control."},
    "Estimated Average Glucose": {"range": "", "unit": "mmol/L", "comment": "Calculated from HbA1c levels to estimate average blood sugar."},
    "ALT": {"range": "7 - 56", "unit": "U/L", "comment": "Marker for liver function and damage."},
    "Globulin": {"range": "25 - 30", "unit": "g/L", "comment": "Elevated levels may indicate chronic inflammation."},
    "TOTAL CHOLESTEROL": {"range": "0 - 5.2", "unit": "mmol/L", "comment": "High levels associated with cardiovascular risk."},
    "LDL CHOLESTEROL": {"range": "0 - 3.1", "unit": "mmol/L", "comment": "\"Bad\" cholesterol, high levels increase risk of heart disease."},
    "VLDL CHOLESTEROL": {"range": "0 - 0.6", "unit": "mmol/L", "comment": "Associated with triglyceride levels and heart disease."},
    "NON-HDL CHOLESTEROL": {"range": "< 3.8", "unit": "mmol/L", "comment": "Better predictor of cardiovascular risk than LDL alone."},
    "TOTAL CHOL/ HDL RATIO": {"range": "< 4.1", "unit": "", "comment": "Lower ratios are generally better."},
    "RBS": {"range": "3.3 - 7.8", "unit": "mmol/L", "comment": "Random Blood Sugar; elevated in diabetes."},
    "Sodium": {"range": "135 - 147", "unit": "mmol/L", "comment": "Essential for fluid balance and nerve function."},
    "Anion-Gap": {"range": "8 - 17", "unit": "mmol/L", "comment": "Used to detect metabolic acidosis."},
    "eGFR": {"range": "80 - 100", "unit": "mls/min/1.73m²", "comment": "Estimates kidney filtration rate."},
    "Uric Acid": {"range": "155 - 428", "unit": "µmol/L", "comment": "Elevated levels can cause gout."},
    "TSH": {"range": "0.4 - 4.5", "unit": "mIU/L", "comment": "Thyroid-stimulating hormone; high in hypothyroidism."},
    "Vitamin B12": {"range": "200 - 914", "unit": "pg/mL", "comment": "Low levels can cause anemia and neurological issues."},
    "BhCG": {"range": "0 - 5", "unit": "mlU/ml", "comment": "Used to confirm pregnancy."},
    "PSA": {"range": "0 - 4", "unit": "ng/ml", "comment": "Elevated levels may indicate prostate cancer or BPH."}
}

def evaluate_result(test_name: str, value: float):
    ref = lab_reference_ranges.get(test_name)
    if not ref or not ref["range"]:
        return "Unknown"
    try:
        if "-" in ref["range"]:
            low, high = map(float, ref["range"].split("-"))
            if value < low:
                return "Low"
            elif value > high:
                return "High"
            else:
                return "Normal"
        elif "<" in ref["range"]:
            limit = float(ref["range"].replace("<", "").strip())
            return "High" if value > limit else "Normal"
        elif ">" in ref["range"]:
            limit = float(ref["range"].replace(">", "").strip())
            return "Low" if value < limit else "Normal"
        else:
            return "Unknown"
    except Exception:
        return "Unknown"



@app.on_event("startup")
async def on_startup():
    # Create tables using async context
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await ensure_lab_test_category_id_column()
    await ensure_patient_lookup_columns()

    # Initialize admin and lab tests
    db = async_session()
    try:
        await init_default_admin(db)
        await init_lab_tests(db)
        await init_default_permissions(db)
    finally:
        await db.close()


async def ensure_lab_test_category_id_column():
    """Backfill the category_id column for older PostgreSQL databases."""
    async with engine.begin() as conn:
        table_exists = await conn.run_sync(lambda sync_conn: inspect(sync_conn).has_table("lab_tests"))
        if not table_exists:
            return

        columns = await conn.run_sync(lambda sync_conn: {
            column["name"] for column in inspect(sync_conn).get_columns("lab_tests")
        })
        if "category_id" in columns:
            return

        await conn.execute(text("ALTER TABLE lab_tests ADD COLUMN IF NOT EXISTS category_id INTEGER"))
        await conn.execute(text("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.table_constraints
                WHERE constraint_name = 'fk_lab_tests_category_id_test_categories'
                  AND table_schema = 'public'
            ) THEN
                ALTER TABLE lab_tests
                ADD CONSTRAINT fk_lab_tests_category_id_test_categories
                FOREIGN KEY (category_id) REFERENCES test_categories(id) ON DELETE SET NULL;
            END IF;
        END $$;
        """))


async def ensure_patient_lookup_columns():
    """Ensure optional patient lookup columns exist for medical-aid claims."""
    async with engine.begin() as conn:
        table_exists = await conn.run_sync(lambda sync_conn: inspect(sync_conn).has_table("patients"))
        if not table_exists:
            return

        columns = await conn.run_sync(lambda sync_conn: {
            column["name"] for column in inspect(sync_conn).get_columns("patients")
        })

        for column_name, column_type in {
            "initials": "VARCHAR",
            "title": "VARCHAR",
            "id_number": "VARCHAR",
            "membership_status": "VARCHAR",
            "enrolment_status": "VARCHAR",
            "option": "VARCHAR",
        }.items():
            if column_name not in columns:
                await conn.execute(text(f"ALTER TABLE patients ADD COLUMN IF NOT EXISTS {column_name} {column_type}"))


async def init_default_admin(db: AsyncSession):
    """Ensure default login users exist for core BIOZONE roles."""
    default_users = [
        {
            "username": "reception",
            "email": "reception@bza.local",
            "role": "Reception",
            "password": "Reception@123",
        },
        {
            "username": "lab_technician",
            "email": "lab.technician@bza.local",
            "role": "Lab Technician",
            "password": "LabTech@123",
        },
        {
            "username": "technical_manager",
            "email": "technical.manager@bza.local",
            "role": "Technical Manager",
            "password": "TechManager@123",
        },
        {
            "username": "lab_manager",
            "email": "lab.manager@bza.local",
            "role": "Lab Manager",
            "password": "LabManager@123",
        },
        {
            "username": "scientific_director",
            "email": "scientific.director@bza.local",
            "role": "Scientific Director",
            "password": "SciDirector@123",
        },
        {
            "username": "finance",
            "email": "finance@bza.local",
            "role": "Finance",
            "password": "Finance@123",
        },
        {
            "username": "admin",
            "email": "admin@bza.local",
            "role": "Admin",
            "password": "admin123",
        },
    ]

    created_usernames = []
    for default_user in default_users:
        existing_user = (
            await db.execute(select(User).where(User.username == default_user["username"]))
        ).scalars().first()
        if existing_user:
            continue

        user = User(
            username=default_user["username"],
            email=default_user["email"],
            role=default_user["role"],
        )
        user.set_password(default_user["password"])
        db.add(user)
        created_usernames.append(default_user["username"])

    if created_usernames:
        await db.commit()
        print(f"✓ Default users created: {', '.join(created_usernames)}")


async def ensure_test_catalogue_seeded(db: AsyncSession):
    """Seed the food safety test catalogue if needed and avoid duplicate records."""
    food_safety_catalogue = [
        {"code": "D1", "name": "Microbiology", "tests": [
            "Total Viable Count (TVC)", "Yeasts and Molds", "Coliforms (Colony Count)",
            "Coliforms / E.coli MPN", "E.coli beta-glucuronidase +", "Enterobacteriaceae",
            "Salmonella spp. (Detection)", "Listeria monocytogenes / Listeria spp.",
            "Staphylococcus aureus (Coag+)", "Bacillus cereus", "Clostridium perfringens",
            "Pseudomonas spp. / P.aeruginosa", "Cronobacter spp.", "Campylobacter spp.",
            "Sulphite-reducing Clostridia", "Other (Specify)"
        ]},
        {"code": "D2", "name": "Chemistry (Proximate / Nutritional / Quality)", "tests": [
            "pH", "Acidity / Titratable Acidity", "Salty Content (NaCl)", "Moisture Content",
            "Ash", "Crude Protein (Kjeldahl / Dumas)", "Crude Fat", "Crude Fiber",
            "Carbohydrate (By Difference)", "Total Sugars / Reducing Sugars", "Water Activity (aw)",
            "Peroxide Value (Oils & Fats)", "Free Fatty Acids (FFA)", "Pesticide Residues Analysis",
            "Antibiotic Residues", "Other (Specify)"
        ]},
        {"code": "D3", "name": "Allergens", "tests": [
            "Gluten", "Peanut", "Tree Nuts (Specify)", "Soy",
            "Milk / Casein / Beta-lactoglobulin", "Egg", "Fish", "Crustacean Shellfish",
            "Mollusc", "Sesame", "Mustard", "Celery", "Sulphites", "Lupin", "Other (Specify)"
        ]},
        {"code": "D4", "name": "Mycotoxins", "tests": [
            "Aflatoxin B1", "Total Aflatoxins (B1+B2+G1+G2)", "Aflatoxin M1", "Ochratoxin A",
            "Zearalenone", "Deoxynivalenol (DON)", "Fumonisins (B1+B2)", "T-2 / HT-2", "Other (Specify)"
        ]},
        {"code": "D5", "name": "Heavy Metals", "tests": [
            "Lead (Pb)", "Cadmium (Cd)", "Mercury (Hg)", "Arsenic (Total)", "Arsenic (Inorganic)",
            "Copper (Cu)", "Iron (Fe)", "Zinc (Zn)", "Nickel (Ni)", "Tin (Sn)", "Aluminium (Al)", "Other (Specify)"
        ]},
        {"code": "D6", "name": "GMO Detection", "tests": [
            "Qualitative GMO Screening (35S/NOS/FMV)", "Quantitative GMO Screening (CP4 EPSPS)",
            "Qualitative GMO Screening (BT Cry1Ab/Ac)", "Qualitative GMO Screening (PAT/BAR)",
            "Event-specific GMO Identification", "Other (Specify)"
        ]},
        {"code": "D7", "name": "Meat Authenticity / Species Identification", "tests": [
            "Species Identification – Beef", "Species Identification – Pork", "Species Identification – Poultry",
            "Species Identification – Horse", "Species Identification – Donkey", "Species Identification – Sheep / Goat",
            "Species Identification – Other (Specify)", "Milk Authentication", "Expected Species", "Other (Specify)"
        ]},
        {"code": "D8", "name": "Water Analysis", "tests": [
            "pH", "Conductivity", "Turbidity", "Total Dissolved Solids (TDS)", "Salinity",
            "Chemical Oxygen Demand (COD)", "Biochemical Oxygen Demand (BOD)", "Total / Fecal Coliforms",
            "E.coli", "Enterococci", "Heterotrophic Plate Count (HPC)", "Free / Total Chlorine",
            "Nitrate / Nitrite", "Hardness (CaCO3)", "Heavy Metals", "Other (Specify)"
        ]}
    ]

    try:
        for cat in food_safety_catalogue:
            cat_obj = (await db.execute(select(TestCategory).where(TestCategory.code == cat["code"]))).scalars().first()
            if not cat_obj:
                cat_obj = TestCategory(code=cat["code"], name=cat["name"], description=None)
                db.add(cat_obj)
                await db.flush()

            for test_name in cat["tests"]:
                existing_test = (await db.execute(
                    select(LabTest).where(LabTest.category_id == cat_obj.id, LabTest.name == test_name)
                )).scalars().first()
                if existing_test:
                    continue

                db.add(LabTest(
                    name=test_name,
                    category=f"{cat['code']} - {cat['name']}",
                    category_id=cat_obj.id,
                ))

        await db.commit()
    except Exception:
        await db.rollback()
        raise


async def init_lab_tests(db: AsyncSession):
    await ensure_test_catalogue_seeded(db)


async def init_default_permissions(db: AsyncSession):
    """Initialize default permissions for all roles if they don't exist"""
    # Check if permissions already exist
    existing = await db.execute(select(models.RolePermission).limit(1))
    if existing.scalars().first():
        return  # Permissions already initialized
    
    admin_permissions = [
        "Manage users and roles",
        "Configure system settings",
        "Access audit logs",
        "Add lab tests",
        "Delete lab tests",
        "Access food test results",
        "Manage lab requests",
        "Enter results accurately",
        "Mark requests as completed",
        "Register new food clients",
        "Initiate food test requests",
        "Access food test history",
        "Analyze test results",
        "Generate reports",
        "View lab inventory",
    ]

    # Default permissions for each role
    default_permissions = {
        "Admin": admin_permissions,
        "Reception": [
            "Register new food clients",
            "Initiate food test requests",
            "Access food test history",
        ],
        "Lab Technician": [
            "Add lab tests",
            "Access food test results",
            "Manage lab requests",
            "Enter results accurately",
            "Mark requests as completed",
            "Access food test history",
            "View lab inventory",
        ],
        "Scientist": [
            "Access food test results",
            "Manage lab requests",
            "Enter results accurately",
            "Access food test history",
            "Analyze test results",
            "Generate reports",
            "Configure system settings",
            "Access audit logs",
        ],
        "Technical Manager": [
            "Access food test results",
            "Manage lab requests",
            "Analyze test results",
            "Generate reports",
            "Configure system settings",
            "Access audit logs",
        ],
        "Lab Manager": list(admin_permissions),
        "Scientific Director": list(admin_permissions),
        "Finance": [
            "Access food test history",
            "View lab inventory",
        ],
        "User": [],
    }
    
    # Insert default permissions
    for role, permissions in default_permissions.items():
        for permission in permissions:
            perm_obj = models.RolePermission(role=role, permission=permission)
            db.add(perm_obj)
    
    await db.commit()



@app.post("/lab-tests/add", response_model=LabTestOut)
async def add_lab_test(lab_test: LabTestCreate, db: AsyncSession = Depends(get_db)):
    new_test = LabTest(name=lab_test.name, category=lab_test.category)
    try:
        db.add(new_test)
        await db.commit()
        await db.refresh(new_test)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not add lab test: {str(e)}")
    return new_test

# Get all lab tests
@app.get("/lab-tests", response_model=list[LabTestOut])
async def get_lab_tests(db: AsyncSession = Depends(get_db)):
    return await crud.get_all_lab_tests(db)


@app.get("/api/tests", response_model=list[LabTestOut])
async def api_get_tests(db: AsyncSession = Depends(get_db)):
    # Return all lab tests
    result = await db.execute(select(models.LabTest))
    tests = result.scalars().all()
    return tests


@app.get("/api/tests/categories", response_model=list[TestCategoryOut])
async def api_get_test_categories(db: AsyncSession = Depends(get_db)):
    await ensure_test_catalogue_seeded(db)

    result = await db.execute(select(TestCategory))
    categories = result.scalars().all()

    # attach tests for each category
    out = []
    for c in categories:
        tests_q = await db.execute(select(models.LabTest).where(models.LabTest.category_id == c.id))
        tests = tests_q.scalars().all()
        c.tests = tests
        out.append(c)
    return out


@app.get("/api/tests/category/{category_id}", response_model=TestCategoryOut)
async def api_get_tests_for_category(category_id: int, db: AsyncSession = Depends(get_db)):
    c = await db.get(TestCategory, category_id)
    if not c:
        raise HTTPException(status_code=404, detail="Category not found")
    tests_q = await db.execute(select(models.LabTest).where(models.LabTest.category_id == c.id))
    c.tests = tests_q.scalars().all()
    return c

# Optional: delete a test
@app.delete("/lab-tests/{test_id}")
async def delete_lab_test(test_id: int, db: AsyncSession = Depends(get_db)):
    test = await db.get(LabTest, test_id)
    if not test:
        raise HTTPException(404, detail="Lab test not found")
    await db.delete(test)
    await db.commit()
    return {"message": "Lab test deleted successfully"}


# ==============================
# TOKEN UTILITY
# ==============================
def create_access_token(data: dict, expires_delta: timedelta = None):
    payload = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    payload.update({"exp": expire})
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)
):
    if not token:
        raise HTTPException(status_code=401, detail="Token missing")

    try:
        # Decode JWT safely
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token format")

    result = await db.execute(select(User).where(User.username == username))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def role_required(*roles):
    async def wrapper(user=Depends(get_current_user)):
        if not user or user.role not in roles:
            raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")
        return user
    return wrapper


async def _get_permissions_for_role(db: AsyncSession, role: str) -> List[str]:
    role_value = str(role or "").strip()
    if not role_value:
        return []

    result = await db.execute(select(models.RolePermission))
    perms = result.scalars().all()
    role_normalized = role_value.lower()

    return [
        perm.permission
        for perm in perms
        if str(perm.role or "").strip().lower() == role_normalized
    ]


async def _has_permission(db: AsyncSession, role: str, permission: str) -> bool:
    # Fallback when permissions table is empty: allow legacy Admin/Colly access.
    has_any_permissions = (await db.execute(select(models.RolePermission).limit(1))).scalars().first()
    if not has_any_permissions:
        return str(role or "").strip().lower() in {"admin", "colly"}

    role_permissions = await _get_permissions_for_role(db, role)
    return permission in role_permissions


def permission_required(permission: str):
    async def wrapper(
        user: User = Depends(get_current_user),
        db: AsyncSession = Depends(get_db),
    ):
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")

        allowed = await _has_permission(db, user.role, permission)
        if not allowed:
            raise HTTPException(status_code=403, detail="Forbidden: insufficient permissions")
        return user

    return wrapper


# ==============================
# AUTHENTICATION ROUTES
# ==============================
@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    user = await crud.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    # Create token with username + role
    token_data = {"sub": user.username, "role": user.role}
    token = create_access_token(token_data)
    return {"access_token": token, "token_type": "bearer", "role": user.role, "username": user.username}

# ==============================
# USER ROUTES
# ==============================
@app.post("/users/", response_model=UserOut)
async def register_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    if result.scalars().first():
        raise HTTPException(status_code=403, detail="User registration disabled. Only Admin can add users.")
    user.role = "Admin"
    new_user = User(username=user.username, email=user.email, role=user.role)
    new_user.set_password(user.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return new_user

@app.get("/users/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user

@app.post("/admin/create-user")
async def create_user_admin(
    data: AdminCreateUser, 
    db: AsyncSession = Depends(get_db), 
    current_user=Depends(permission_required("Manage users and roles"))
):
    # Check if user already exists
    result = await db.execute(select(User).where(User.username == data.username))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    new_user = User(
        username=data.username,
        email=data.email,
        role=data.role  # use role from AdminCreateUser
    )
    new_user.set_password(data.password)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return {"message": f"User '{new_user.username}' created successfully", "user": new_user}

@app.get("/admin/users")
async def get_all_users(db: AsyncSession = Depends(get_db), current_user=Depends(permission_required("Manage users and roles"))):
    result = await db.execute(select(User))
    return result.scalars().all()

@app.put("/admin/users/{user_id}")
async def update_user(
    user_id: int,
    data: AdminCreateUser,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(permission_required("Manage users and roles")),
):
    """
    Update user information (username, email, role, password optional).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Update user fields
    user.username = data.username
    user.email = data.email
    user.role = data.role

    # Only update password if provided
    if data.password:
        user.hashed_password = pwd_context.hash(data.password)

    try:
        await db.commit()
        await db.refresh(user)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update user: {str(e)}")

    return {"message": f"User {user.username} updated successfully", "user": user}


@app.patch("/admin/users/{user_id}/deactivate")
async def deactivate_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(permission_required("Manage users and roles")),
):
    """
    Deactivate a user account (set is_active to False).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False

    try:
        await db.commit()
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to deactivate user: {str(e)}")

    return {"message": f"User {user.username} deactivated successfully"}


@app.get("/api/audit-logs")
async def read_audit_logs(db: AsyncSession = Depends(get_db)):
    logs = await get_audit_logs(db)
    return logs

@app.middleware("http")
async def log_requests(request: Request, call_next):
    response = await call_next(request)
    return response

class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only log POST, PUT, DELETE requests
        if request.method in ("POST", "PUT", "DELETE"):
            try:
                # Get role from headers / auth (replace with real auth logic)
                role = request.headers.get("x-role", "Unknown")  

                # Path and method
                action = f"{request.method} {request.url.path}"

                # IP address
                ip_address = request.client.host

                # Get body as string
                body_bytes = await request.body()
                details = body_bytes.decode("utf-8") if body_bytes else None

                # TODO: Implement audit logging if needed
                # Use a separate async task to avoid blocking response
                # async def log_task():
                #     async with get_db() as db:
                #         await create_audit_log(db=db, role=role, action=action, details=details, ip_address=ip_address)
                # asyncio.create_task(log_task())
            except Exception as e:
                print(f"Failed to log audit: {e}")

        response = await call_next(request)
        return response

# ==============================
# PATIENT ROUTES
# ==============================
@app.post("/patients/", response_model=PatientOut)
async def create_patient_route(patient: PatientCreate, db: AsyncSession = Depends(get_db), user=Depends(role_required("Admin", "Lab Technician"))):
    return await crud.create_patient(db, patient)

@app.get("/patients/{patient_id}", response_model=PatientOut)
async def get_patient_route(
    patient_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Lab Technician"))
):
    patient = await crud.get_patient(db, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.put("/patients/{patient_id}", response_model=PatientOut)
async def update_patient_route(
    patient_id: int,
    patient_update: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Lab Technician"))
):
    patient = await crud.update_patient(db, patient_id, patient_update)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@app.get("/patients/", response_model=List[PatientOut])
async def list_patients(
    token: str = Depends(oauth2_scheme),  # ensures valid JWT is passed
    db: AsyncSession = Depends(get_db)
):
    # Optional: verify token and get current user here
    result = await db.execute(select(Patient))
    return result.scalars().all()

@app.get("/patients/search/", response_model=list[PatientOut])
async def search_patients_route(
    query: str = Query(..., min_length=1),
    funder: str | None = None,
    suffix: str | None = None,
    lookup_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    q = f"%{query.strip()}%"
    filters = []

    if lookup_type == "memberNumber":
        filters.append(Patient.member_number.ilike(q))
    elif lookup_type == "idNumber":
        filters.append(Patient.id_number.ilike(q))
    else:
        filters.extend([
            Patient.first_name.ilike(q),
            Patient.last_name.ilike(q),
            Patient.member_number.ilike(q),
            Patient.funding.ilike(q),
        ])

    if funder:
        filters.append(Patient.funding.ilike(f"%{funder.strip()}%"))
    if suffix:
        filters.append(Patient.member_suffix.ilike(f"%{suffix.strip()}%"))

    result = await db.execute(
        select(Patient).where(or_(*filters)).options(selectinload(Patient.lab_requests))
    )

    return result.scalars().unique().all()


# Client aliases (food workflow terminology)
@app.post("/clients/", response_model=PatientOut)
async def create_client_route(client: PatientCreate, db: AsyncSession = Depends(get_db), user=Depends(role_required("Admin", "Lab Technician"))):
    return await crud.create_patient(db, client)


@app.get("/clients/{client_id}", response_model=PatientOut)
async def get_client_route(
    client_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Lab Technician"))
):
    client = await crud.get_patient(db, client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@app.put("/clients/{client_id}", response_model=PatientOut)
async def update_client_route(
    client_id: int,
    client_update: PatientUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Lab Technician"))
):
    client = await crud.update_patient(db, client_id, client_update)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@app.get("/clients/", response_model=List[PatientOut])
async def list_clients(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Patient))
    return result.scalars().all()


@app.get("/clients/search/", response_model=list[PatientOut])
async def search_clients_route(
    query: str = Query(..., min_length=1),
    funder: str | None = None,
    suffix: str | None = None,
    lookup_type: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    return await search_patients_route(
        query=query,
        funder=funder,
        suffix=suffix,
        lookup_type=lookup_type,
        db=db,
    )


# ==============================
# LAB TEST ROUTES
# ==============================
@app.post("/lab-tests/add", response_model=LabTestOut)
async def add_lab_test_route(lab_test: LabTestCreate, db: AsyncSession = Depends(get_db)):
    new_test = LabTest(name=lab_test.name, category=lab_test.category)
    try:
        db.add(new_test)
        await db.commit()
        await db.refresh(new_test)
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Could not add lab test: {str(e)}")
    return new_test

@app.get("/lab-requests/", response_model=List[LabRequestOut])
async def list_lab_requests_route(
    patient_id: int | None = None,
    client_id: int | None = None,
    db: AsyncSession = Depends(get_db),
    user=Depends(get_current_user)
):
    patient_id = patient_id or client_id
    if patient_id:
        result = await db.execute(
            select(models.LabRequest).where(models.LabRequest.patient_id == patient_id)
            .options(
                selectinload(models.LabRequest.patient)
            )
            .order_by(models.LabRequest.created_at.desc())
        )
        return result.scalars().unique().all()

    # If no patient_id, return all requests
    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient)
        )
        .order_by(models.LabRequest.created_at.desc())
    )
    return result.scalars().unique().all()

@app.delete("/lab-tests/{test_id}")
async def delete_lab_test_route(test_id: int, db: AsyncSession = Depends(get_db)):
    test = await db.get(LabTest, test_id)
    if not test:
        raise HTTPException(404, detail="Lab test not found")
    await db.delete(test)
    await db.commit()
    return {"message": "Lab test deleted successfully"}

# ==============================
# LAB REQUESTS & RESULTS
# ==============================

# -------------------------------
# CREATE lab request
# -------------------------------
@app.post("/lab-requests/", response_model=schemas.LabRequestOut)
async def create_lab_request_endpoint(payload: schemas.LabRequestCreate, db: AsyncSession = Depends(get_db)):
    if getattr(payload, "patient_id", None) is None and getattr(payload, "client_id", None) is not None:
        payload.patient_id = payload.client_id
    lab_request = await crud.create_lab_request(db, payload)
    return lab_request

@app.get("/lab-requests/{request_id}", response_model=schemas.LabRequestOut)
async def get_lab_request_endpoint(request_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient),
            selectinload(models.LabRequest.lab_results)
        )
        .where(models.LabRequest.id == request_id)
    )
    lab_request = result.scalar_one_or_none()
    if not lab_request:
        raise HTTPException(status_code=404, detail="Lab request not found")
    return lab_request

@app.put("/lab-requests/{request_id}", response_model=schemas.LabRequestOut)
async def update_lab_request_endpoint(
    request_id: int,
    payload: schemas.LabRequestUpdate,
    db: AsyncSession = Depends(get_db)
):
    # Use sync update since it’s a single object
    from sqlalchemy.orm import Session
    sync_db = Session(db.sync_session)  # Convert async session to sync for ORM update
    updated = crud.update_lab_request(sync_db, request_id, payload)
    if not updated:
        raise HTTPException(status_code=404, detail="Lab request not found")
    
    # Reload request with relationships
    result = await db.execute(
        select(models.LabRequest)
        .options(
            selectinload(models.LabRequest.patient),
            selectinload(models.LabRequest.lab_results).selectinload(models.LabResult.lab_test)
        )
        .where(models.LabRequest.id == request_id)
    )
    return result.scalar_one()

@app.post("/lab-results/", response_model=schemas.LabResultRead, status_code=201)
async def create_lab_result_route(payload: LabResultCreate, db: AsyncSession = Depends(get_db), user=Depends(role_required("Lab Technician", "Admin"))):
    if getattr(payload, "patient_id", None) is None and getattr(payload, "client_id", None) is not None:
        payload.patient_id = payload.client_id
    return await crud.create_lab_result(db, payload)

@app.get("/lab-requests/{request_id}/results/", response_model=List[schemas.LabResultRead])
async def lab_results_by_request_route(request_id: int, db: AsyncSession = Depends(get_db), user=Depends(get_current_user)):
    return await crud.get_lab_test_results_by_request(db, request_id)

@app.post("/lab-results/save", response_model=schemas.LabResultRead)
async def save_lab_result(
    payload: schemas.LabResultSave,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Lab Technician", "Admin")),
):
    if getattr(payload, "patient_id", None) is None and getattr(payload, "client_id", None) is not None:
        payload.patient_id = payload.client_id
    result = await crud.create_lab_result(db, payload)
    return result
 
 

@app.patch("/lab-requests/{request_id}", response_model=LabRequestOut)
async def update_lab_request_route(
    request_id: int,
    payload: LabRequestUpdate,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Lab Technician")),
):
    request = await db.get(models.LabRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Lab request not found")

    if payload.status is not None:
        request.status = payload.status
    if payload.notes is not None:
        request.notes = payload.notes

    await db.commit()
    await db.refresh(request)
    return request

@app.patch(
    "/lab-requests/{request_id}/recalculate-status",
    response_model=LabRequestOut
)
async def recalc_lab_request_status(
    request_id: int,
    db: AsyncSession = Depends(get_db),
    user=Depends(role_required("Admin", "Lab Technician"))
):
    result = await db.get(models.LabRequest, request_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Lab request not found")

    await db.refresh(result)
    return result


# ==============================
# FSH SAMPLE MANAGEMENT
# ==============================
SAMPLE_STATUS_VALUES = {"Pending", "Collected", "Received", "Processing", "Completed", "Rejected", "Cancelled"}


def _safe_json_parse(payload: str | None) -> Dict[str, Any]:
    if not payload:
        return {}
    try:
        data = json.loads(payload)
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def _to_date(value: str | None) -> date_cls | None:
    if not value:
        return None
    try:
        return datetime.fromisoformat(value).date()
    except Exception:
        try:
            return datetime.strptime(value, "%Y-%m-%d").date()
        except Exception:
            return None


def _to_time(value: str | None) -> str | None:
    if not value:
        return None
    return value.strip() or None


def _compute_age(dob: date_cls | None) -> int | None:
    if not dob:
        return None
    today = date_cls.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def _sample_rows_from_request(lab_request: models.LabRequest, patient: models.Patient) -> List[Dict[str, Any]]:
    clinical_data = _safe_json_parse(patient.clinical_data)
    submission_form = clinical_data.get("submissionForm") or {}
    samples = clinical_data.get("samples") or []
    if not isinstance(samples, list):
        samples = []

    if samples:
        samples = [
            sample
            for sample in samples
            if isinstance(sample, dict) and str(sample.get("sampleName") or "").strip()
        ]
        if not samples:
            return []

    test_names = []
    if lab_request.lab_results:
        test_names = sorted({(result.test_name or "").strip() for result in lab_request.lab_results if (result.test_name or "").strip()})

    status = (lab_request.status or "Pending").strip()
    if status not in SAMPLE_STATUS_VALUES:
        status = "Pending"

    request_number = str(lab_request.id)
    base_created = lab_request.created_at
    base_updated = lab_request.created_at

    def build_row(sample: Dict[str, Any], index: int) -> Dict[str, Any]:
        sample_number = (sample.get("sampleNumber") or f"S{index + 1}").strip()
        sample_id = (sample.get("sampleId") or sample_number or "").strip()
        job_reference = (submission_form.get("labJobReference") or "").strip()
        unique_identifier = job_reference or sample_id or f"REQ-{request_number}-{sample_number}"
        collection_date = _to_date(sample.get("samplingDate") or submission_form.get("submissionDate"))
        collection_time = _to_time(sample.get("collectionTime"))
        received_date = _to_date(submission_form.get("labSubmissionDate") or submission_form.get("submissionDate"))
        received_time = _to_time(submission_form.get("receivedTime"))

        return {
            "id": f"{lab_request.id}-{sample_number}",
            "sample_number": sample_number,
            "sample_id": sample_id or unique_identifier,
            "request_number": request_number,
            "patient_name": f"{patient.first_name or ''} {patient.last_name or ''}".strip(),
            "client_name": f"{patient.first_name or ''} {patient.last_name or ''}".strip(),
            "national_id": patient.id_number,
            "age": _compute_age(patient.dob),
            "sex": patient.gender,
            "date_of_birth": patient.dob.isoformat() if patient.dob else None,
            "phone": submission_form.get("telephoneEmail"),
            "facility": patient.facility,
            "ward": sample.get("ward") or submission_form.get("ward"),
            "department": sample.get("department") or submission_form.get("department"),
            "requesting_clinician": patient.doctor_name,
            "sample_type": sample.get("type"),
            "specimen": sample.get("matrix") or sample.get("sampleName"),
            "test_requested": ", ".join(test_names),
            "collection_date": collection_date.isoformat() if collection_date else None,
            "collection_time": collection_time,
            "received_date": received_date.isoformat() if received_date else None,
            "received_time": received_time,
            "priority": sample.get("priority") or submission_form.get("priority") or "Routine",
            "funding_type": patient.funding,
            "medical_aid": patient.funding,
            "membership_number": patient.member_number,
            "status": status,
            "laboratory": "BZA",
            "notes": sample.get("specialInstructions") or lab_request.notes,
            "barcode": unique_identifier,
            "created_by": submission_form.get("contactPerson") or "System",
            "created_date": base_created.isoformat() if base_created else None,
            "updated_date": base_updated.isoformat() if base_updated else None,
            "month": (collection_date.month if collection_date else (base_created.month if base_created else None)),
            "year": (collection_date.year if collection_date else (base_created.year if base_created else None)),
        }

    if not samples:
        return [build_row({}, 0)]

    normalized_rows = []
    for idx, sample in enumerate(samples):
        if not isinstance(sample, dict):
            sample = {}
        normalized_rows.append(build_row(sample, idx))
    return normalized_rows


async def _query_requests_for_sample_management(
    db: AsyncSession,
    year: int | None,
    month: int | None,
    status_filter: str | None,
    facility: str | None,
    clinician: str | None,
    funding_type: str | None,
    date_from: date_cls | None,
    date_to: date_cls | None,
) -> List[models.LabRequest]:
    query = (
        select(models.LabRequest)
        .join(models.Patient, models.Patient.id == models.LabRequest.patient_id)
        .options(
            selectinload(models.LabRequest.patient),
            selectinload(models.LabRequest.lab_results),
        )
    )

    if year:
        query = query.where(text("EXTRACT(YEAR FROM lab_requests.created_at) = :year")).params(year=year)
    if month:
        query = query.where(text("EXTRACT(MONTH FROM lab_requests.created_at) = :month")).params(month=month)
    if status_filter:
        query = query.where(models.LabRequest.status.ilike(status_filter.strip()))
    if facility:
        query = query.where(models.Patient.facility.ilike(f"%{facility.strip()}%"))
    if clinician:
        query = query.where(models.Patient.doctor_name.ilike(f"%{clinician.strip()}%"))
    if funding_type:
        query = query.where(models.Patient.funding.ilike(f"%{funding_type.strip()}%"))
    if date_from:
        query = query.where(models.LabRequest.created_at >= datetime.combine(date_from, datetime.min.time()))
    if date_to:
        query = query.where(models.LabRequest.created_at <= datetime.combine(date_to, datetime.max.time()))

    query = query.order_by(models.LabRequest.created_at.desc())
    result = await db.execute(query)
    return result.scalars().unique().all()


def _filter_rows(
    rows: List[Dict[str, Any]],
    month: int | None,
    sample_type: str | None,
    department: str | None,
    priority: str | None,
    search: str | None,
) -> List[Dict[str, Any]]:
    filtered = rows

    if month:
        filtered = [row for row in filtered if row.get("month") == month]
    if sample_type:
        pattern = sample_type.strip().lower()
        filtered = [row for row in filtered if (row.get("sample_type") or "").lower().find(pattern) >= 0]
    if department:
        pattern = department.strip().lower()
        filtered = [row for row in filtered if (row.get("department") or "").lower().find(pattern) >= 0]
    if priority:
        pattern = priority.strip().lower()
        filtered = [row for row in filtered if (row.get("priority") or "").lower().find(pattern) >= 0]

    if search:
        q = search.strip().lower()
        filtered = [
            row
            for row in filtered
            if q in (row.get("sample_id") or "").lower()
            or q in (row.get("sample_number") or "").lower()
            or q in (row.get("patient_name") or "").lower()
            or q in (row.get("client_name") or "").lower()
            or q in (row.get("national_id") or "").lower()
            or q in (row.get("barcode") or "").lower()
            or q in (row.get("phone") or "").lower()
            or q in (row.get("request_number") or "").lower()
        ]

    return filtered


def _sort_rows(rows: List[Dict[str, Any]], sort_by: str, sort_order: str) -> List[Dict[str, Any]]:
    reverse = sort_order.lower() == "desc"
    return sorted(rows, key=lambda row: (row.get(sort_by) is None, str(row.get(sort_by) or "").lower()), reverse=reverse)


def _group_rows_by_request(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    grouped: Dict[tuple[str, str], Dict[str, Any]] = {}

    for row in rows:
        request_number = str(row.get("request_number") or "-")
        test_requested = str(row.get("test_requested") or "")
        key = (request_number, test_requested)

        if key not in grouped:
            grouped[key] = dict(row)
            grouped[key]["_sample_numbers"] = set()

        sample_number = (row.get("sample_number") or "").strip()
        if sample_number:
            grouped[key]["_sample_numbers"].add(sample_number)

    compacted_rows: List[Dict[str, Any]] = []
    for (request_number, test_requested), row in grouped.items():
        sample_numbers = sorted(row.pop("_sample_numbers", set()))
        merged_numbers = ", ".join(sample_numbers) if sample_numbers else "-"

        safe_tests = re.sub(r"[^a-zA-Z0-9]+", "-", test_requested).strip("-")[:40] or "tests"
        row["id"] = f"{request_number}-{safe_tests}"
        row["sample_number"] = merged_numbers
        row["sample_id"] = merged_numbers
        compacted_rows.append(row)

    return compacted_rows


def _summary(rows: List[Dict[str, Any]]) -> Dict[str, Any]:
    today = date_cls.today().isoformat()
    this_month = date_cls.today().month
    this_year = date_cls.today().year

    status_counts = {status: 0 for status in SAMPLE_STATUS_VALUES}
    for row in rows:
        status = row.get("status") or "Pending"
        if status in status_counts:
            status_counts[status] += 1

    return {
        "total_samples": len(rows),
        "pending": status_counts.get("Pending", 0),
        "processing": status_counts.get("Processing", 0),
        "completed": status_counts.get("Completed", 0),
        "rejected": status_counts.get("Rejected", 0),
        "cancelled": status_counts.get("Cancelled", 0),
        "todays_samples": len([row for row in rows if row.get("collection_date") == today or (row.get("created_date") or "").startswith(today)]),
        "this_month": len([row for row in rows if row.get("month") == this_month]),
        "this_year": len([row for row in rows if row.get("year") == this_year]),
    }


@app.get("/sample-management")
async def sample_management_list(
    year: int | None = Query(default=None, ge=2000),
    month: int | None = Query(default=None, ge=1, le=12),
    status_filter: str | None = Query(default=None, alias="status"),
    sample_type: str | None = Query(default=None),
    facility: str | None = Query(default=None),
    clinician: str | None = Query(default=None),
    department: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    funding_type: str | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=50, ge=1, le=500),
    group_by_request: bool = Query(default=False),
    sort_by: str = Query(default="created_date"),
    sort_order: str = Query(default="desc"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from_dt = _to_date(date_from)
    to_dt = _to_date(date_to)

    requests = await _query_requests_for_sample_management(
        db=db,
        year=year,
        month=month,
        status_filter=status_filter,
        facility=facility,
        clinician=clinician,
        funding_type=funding_type,
        date_from=from_dt,
        date_to=to_dt,
    )

    rows: List[Dict[str, Any]] = []
    for request in requests:
        rows.extend(_sample_rows_from_request(request, request.patient))

    if group_by_request:
        rows = _group_rows_by_request(rows)

    rows = _filter_rows(
        rows,
        month=month,
        sample_type=sample_type,
        department=department,
        priority=priority,
        search=search,
    )
    rows = _sort_rows(rows, sort_by=sort_by, sort_order=sort_order)

    total = len(rows)
    start = (page - 1) * page_size
    end = start + page_size
    paged_rows = rows[start:end]

    available_years = sorted({row.get("year") for row in rows if row.get("year") is not None})

    return {
        "rows": paged_rows,
        "total": total,
        "page": page,
        "page_size": page_size,
        "available_years": available_years,
        "summary": _summary(rows),
    }


@app.get("/sample-management/{sample_management_id}")
async def sample_management_detail(
    sample_management_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    requests = await _query_requests_for_sample_management(
        db=db,
        year=None,
        month=None,
        status_filter=None,
        facility=None,
        clinician=None,
        funding_type=None,
        date_from=None,
        date_to=None,
    )
    for request in requests:
        for row in _sample_rows_from_request(request, request.patient):
            if row["id"] == sample_management_id:
                return row
    raise HTTPException(status_code=404, detail="Sample management record not found")


@app.get("/sample-management/month/{month}")
async def sample_management_by_month(
    month: int,
    year: int | None = Query(default=None, ge=2000),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await sample_management_list(month=month, year=year, db=db, current_user=current_user)


@app.get("/sample-management/year/{year}")
async def sample_management_by_year(
    year: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await sample_management_list(year=year, db=db, current_user=current_user)


async def _sample_export_rows(
    db: AsyncSession,
    current_user: User,
    year: int | None,
    month: int | None,
    status_filter: str | None,
    sample_type: str | None,
    facility: str | None,
    clinician: str | None,
    department: str | None,
    priority: str | None,
    funding_type: str | None,
    search: str | None,
    date_from: str | None,
    date_to: str | None,
):
    payload = await sample_management_list(
        year=year,
        month=month,
        status_filter=status_filter,
        sample_type=sample_type,
        facility=facility,
        clinician=clinician,
        department=department,
        priority=priority,
        funding_type=funding_type,
        search=search,
        date_from=date_from,
        date_to=date_to,
        page=1,
        page_size=500,
        sort_by="created_date",
        sort_order="desc",
        db=db,
        current_user=current_user,
    )
    return payload["rows"], payload.get("summary", {})


@app.get("/sample-management/export/csv")
async def sample_management_export_csv(
    year: int | None = Query(default=None, ge=2000),
    month: int | None = Query(default=None, ge=1, le=12),
    status_filter: str | None = Query(default=None, alias="status"),
    sample_type: str | None = Query(default=None),
    facility: str | None = Query(default=None),
    clinician: str | None = Query(default=None),
    department: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    funding_type: str | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows, _ = await _sample_export_rows(db, current_user, year, month, status_filter, sample_type, facility, clinician, department, priority, funding_type, search, date_from, date_to)

    headers = [
        "sample_number", "sample_id", "request_number", "client_name", "national_id", "age", "sex", "date_of_birth", "phone",
        "facility", "ward", "department", "requesting_clinician", "sample_type", "specimen", "test_requested",
        "collection_date", "collection_time", "received_date", "received_time", "priority", "funding_type",
        "medical_aid", "membership_number", "status", "laboratory", "notes", "barcode", "created_by",
        "created_date", "updated_date"
    ]

    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=headers)
    writer.writeheader()
    for row in rows:
        writer.writerow({header: row.get(header) for header in headers})

    content = buffer.getvalue().encode("utf-8")
    filename = f"sample-management-{year or 'all'}-{month or 'all'}.csv"
    return StreamingResponse(
        io.BytesIO(content),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/sample-management/export/excel")
async def sample_management_export_excel(
    year: int | None = Query(default=None, ge=2000),
    month: int | None = Query(default=None, ge=1, le=12),
    status_filter: str | None = Query(default=None, alias="status"),
    sample_type: str | None = Query(default=None),
    facility: str | None = Query(default=None),
    clinician: str | None = Query(default=None),
    department: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    funding_type: str | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from openpyxl import Workbook  # pyright: ignore[reportMissingModuleSource]
    from openpyxl.styles import Font  # pyright: ignore[reportMissingModuleSource]

    rows, _ = await _sample_export_rows(db, current_user, year, month, status_filter, sample_type, facility, clinician, department, priority, funding_type, search, date_from, date_to)
    headers = [
        "Sample Number", "Sample ID", "Request Number", "Client Name", "National ID", "Age", "Sex", "Date of Birth", "Phone",
        "Facility", "Ward", "Department", "Requesting Clinician", "Sample Type", "Specimen", "Test Requested",
        "Collection Date", "Collection Time", "Received Date", "Received Time", "Priority", "Funding Type",
        "Medical Aid", "Membership Number", "Status", "Laboratory", "Notes", "Barcode", "Created By",
        "Created Date", "Updated Date"
    ]

    keys = [
        "sample_number", "sample_id", "request_number", "client_name", "national_id", "age", "sex", "date_of_birth", "phone",
        "facility", "ward", "department", "requesting_clinician", "sample_type", "specimen", "test_requested",
        "collection_date", "collection_time", "received_date", "received_time", "priority", "funding_type",
        "medical_aid", "membership_number", "status", "laboratory", "notes", "barcode", "created_by",
        "created_date", "updated_date"
    ]

    wb = Workbook()
    ws = wb.active
    ws.title = "FSH Sample Management"
    ws.append(headers)
    for cell in ws[1]:
        cell.font = Font(bold=True)

    for row in rows:
        ws.append([row.get(key) for key in keys])

    for idx, _ in enumerate(headers, start=1):
        ws.column_dimensions[chr(64 + min(idx, 26))].width = 20

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    filename = f"sample-management-{year or 'all'}-{month or 'all'}.xlsx"
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@app.get("/sample-management/export/pdf")
async def sample_management_export_pdf(
    year: int | None = Query(default=None, ge=2000),
    month: int | None = Query(default=None, ge=1, le=12),
    status_filter: str | None = Query(default=None, alias="status"),
    sample_type: str | None = Query(default=None),
    facility: str | None = Query(default=None),
    clinician: str | None = Query(default=None),
    department: str | None = Query(default=None),
    priority: str | None = Query(default=None),
    funding_type: str | None = Query(default=None),
    search: str | None = Query(default=None),
    date_from: str | None = Query(default=None),
    date_to: str | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from reportlab.lib import colors  # pyright: ignore[reportMissingModuleSource]
    from reportlab.lib.pagesizes import landscape, A4  # pyright: ignore[reportMissingModuleSource]
    from reportlab.lib.styles import getSampleStyleSheet  # pyright: ignore[reportMissingModuleSource]
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer  # pyright: ignore[reportMissingModuleSource]

    rows, _ = await _sample_export_rows(db, current_user, year, month, status_filter, sample_type, facility, clinician, department, priority, funding_type, search, date_from, date_to)
    report_month = calendar.month_name[month] if month else "All Months"
    report_year = str(year) if year else "All Years"

    table_headers = ["Sample ID", "Request #", "Client", "Facility", "Specimen", "Test Requested", "Status", "Collection Date", "Priority"]
    table_data = [table_headers]
    for row in rows:
        table_data.append([
            row.get("sample_id"),
            row.get("request_number"),
            row.get("client_name") or row.get("patient_name"),
            row.get("facility"),
            row.get("specimen"),
            row.get("test_requested"),
            row.get("status"),
            row.get("collection_date"),
            row.get("priority"),
        ])

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
    styles = getSampleStyleSheet()

    header = [
        Paragraph("<b>Biozone Analytics (BZA)</b>", styles["Title"]),
        Paragraph("Food Sample Management Report", styles["Heading2"]),
        Paragraph(f"Generated date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", styles["Normal"]),
        Paragraph(f"Generated by: {current_user.username}", styles["Normal"]),
        Paragraph(f"Selected month: {report_month}", styles["Normal"]),
        Paragraph(f"Selected year: {report_year}", styles["Normal"]),
        Spacer(1, 10),
    ]

    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#d6f5dd")),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ]))

    def _page_number(canvas_obj, doc_obj):
        canvas_obj.saveState()
        canvas_obj.setFont("Helvetica", 8)
        canvas_obj.drawRightString(820, 20, f"Page {doc_obj.page}")
        canvas_obj.restoreState()

    doc.build(header + [table], onFirstPage=_page_number, onLaterPages=_page_number)
    buffer.seek(0)
    filename = f"sample-management-{year or 'all'}-{month or 'all'}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

# ==============================
# PASSWORD RESET
# ==============================
@app.post("/auth/password-reset")
async def request_password_reset(data: PasswordResetRequest, db: AsyncSession = Depends(get_db)):
    token = crud.create_password_reset_token(data.email)
    print(f"RESET LINK → http://localhost:5173/reset?token={token}")
    return {"message": "If the email exists, a reset link has been sent."}

@app.post("/auth/password-reset/confirm")
async def confirm_password_reset(data: PasswordResetConfirm, db: AsyncSession = Depends(get_db)):
    try:
        payload = crud.verify_password_reset_token(data.token)
        email = payload["sub"]
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

    if not crud.reset_user_password(db, email, data.new_password):
        raise HTTPException(status_code=404, detail="User not found")

    return {"message": "Password reset successful"}

# ==============================
# PUBMED FETCH
# ==============================
#@app.get("/pubmed/")
#async def fetch_pubmed(query: str):
#    try:
#        search_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term={query}&retmode=json&retmax=20"
#        search_data = requests.get(search_url).json()
#        id_list = search_data.get("esearchresult", {}).get("idlist", [])
#        if not id_list:
#            return {"results": []}
#        ids = ",".join(id_list)
#        summary_url = f"https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id={ids}&retmode=json"
#        summary_data = requests.get(summary_url).json()
#        articles = summary_data.get("result", {})
#        return {"results": [
#            {"pmid": pmid,
#             "title": articles.get(pmid, {}).get("title"),
#             "journal": articles.get(pmid, {}).get("fulljournalname"),
#             "pubdate": articles.get(pmid, {}).get("pubdate"),
#             "authors": articles.get(pmid, {}).get("authors"),
#             "doi": articles.get(pmid, {}).get("elocationid")}
#            for pmid in id_list if articles.get(pmid)
#        ]}
#    except Exception as e:
#        raise HTTPException(status_code=500, detail=f"PubMed fetch failed: {str(e)}")

# ==============================
# SYSTEM SETTINGS & PAYMENT VERIFICATION
# ==============================
from app.config import (
    is_valid_payment_code,
    get_code_license_type,
    VALID_PAYMENT_CODE,
    SUBSCRIPTION_PERIOD_DAYS
)

@app.get("/system-settings/", response_model=schemas.SystemSettingsOut)
async def get_system_settings(db: AsyncSession = Depends(get_db)):
    """Fetch system settings including payment status"""
    try:
        from sqlalchemy import select
        
        result = await db.execute(select(SystemSettings))
        settings = result.scalar()
        
        if not settings:
            # Create default settings if none exist
            settings = SystemSettings(
                labName="Biozone Analytics (BZA)",
                turnaroundTime="24",
                enableNotifications=True,
                maintenanceMode=False,
                defaultReportFormat="PDF",
                dataRetentionDays=365,
                paymentStatus="inactive"
            )
            db.add(settings)
            await db.commit()
            await db.refresh(settings)
        
        return settings
    except Exception as e:
        print(f"Error fetching system settings: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch system settings")


@app.put("/system-settings/", response_model=schemas.SystemSettingsOut)
async def update_system_settings(
    settings_update: schemas.SystemSettingsBase,
    db: AsyncSession = Depends(get_db),
    request: Request = None,
    current_user: User = Depends(get_current_user),
):
    """Update system settings (only if system is not locked)"""
    try:
        from sqlalchemy import select
        
        result = await db.execute(select(SystemSettings))
        settings = result.scalar()
        
        if not settings:
            settings = SystemSettings()
            db.add(settings)
        
        # Update only provided fields
        update_data = settings_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(settings, field, value)
        
        settings.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(settings)

        # Audit log: who updated system settings
        try:
            ip = request.client.host if request and request.client else None
            changed_fields = list(update_data.keys()) if update_data else []
            await crud.create_audit_log(
                db=db,
                role=current_user.role,
                action="UPDATE system-settings",
                details=f"Updated fields: {changed_fields}",
                ip_address=ip,
                user_id=current_user.id,
                username=current_user.username,
            )
        except Exception:
            pass

        return settings
    except Exception as e:
        print(f"Error updating system settings: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update system settings")


@app.post("/system-settings/verify-payment/", response_model=schemas.PaymentVerificationResponse)
async def verify_payment(
    payment_req: schemas.PaymentVerificationRequest,
    db: AsyncSession = Depends(get_db),
    request: Request = None,
    current_user: User = Depends(get_current_user),
):
    """
    Verify payment code and unlock system for next 60 days
    
    Checks against stored payment codes in database first,
    then falls back to config codes if not found
    """
    try:
        from sqlalchemy import select
        
        code = payment_req.code.strip().upper()
        today = datetime.now().date()
        
        # First, check against database stored codes
        result = await db.execute(
            select(PaymentCode).where(
                PaymentCode.code == code,
                PaymentCode.validFrom <= today,
                PaymentCode.validUntil >= today,
                PaymentCode.isUsed == False
            )
        )
        payment_code = result.scalar()
        
        if payment_code:
            # Code found and is valid for current date
            license_type = payment_code.licenseType
            period = payment_code.period
            
            # Mark code as used
            payment_code.isUsed = True
            payment_code.usedDate = datetime.utcnow()
            
            # Update system settings
            result = await db.execute(select(SystemSettings))
            settings = result.scalar()
            if not settings:
                settings = SystemSettings()
                db.add(settings)
            
            now = datetime.utcnow()
            settings.lastPaymentDate = now
            settings.paymentStatus = "active"
            settings.updated_at = now
            
            await db.commit()
            await db.refresh(settings)
            
            print(f"[PAYMENT] Database code '{code}' ({period}) verified for license type '{license_type}'")
            # Audit log: successful verification using DB code
            try:
                ip = request.client.host if request and request.client else None
                await crud.create_audit_log(
                    db=db,
                    role=current_user.role,
                    action="VERIFY PAYMENT (DB)",
                    details=f"Code used: {code} (period={period}, license={license_type})",
                    ip_address=ip,
                    user_id=current_user.id,
                    username=current_user.username,
                )
            except Exception:
                pass

            return schemas.PaymentVerificationResponse(
                success=True,
                message=f"Payment verified successfully! ({period} - {license_type}). System unlocked for {SUBSCRIPTION_PERIOD_DAYS} days.",
                lastPaymentDate=settings.lastPaymentDate
            )
        
        # Fall back to config codes if database code not found
        if not is_valid_payment_code(code):
            return schemas.PaymentVerificationResponse(
                success=False,
                message="Invalid payment verification code. Please contact your administrator."
            )
        
        # Get license type for logging
        license_type = get_code_license_type(code)
        
        # Update system settings with current date
        result = await db.execute(select(SystemSettings))
        settings = result.scalar()
        if not settings:
            settings = SystemSettings()
            db.add(settings)
        
        now = datetime.utcnow()
        settings.lastPaymentDate = now
        settings.paymentStatus = "active"
        settings.updated_at = now
        
        await db.commit()
        await db.refresh(settings)
        
        print(f"[PAYMENT] Config code verified. License type '{license_type}'. System unlocked until {now + timedelta(days=SUBSCRIPTION_PERIOD_DAYS)}")
        try:
            ip = request.client.host if request and request.client else None
            await crud.create_audit_log(
                db=db,
                role=current_user.role,
                action="VERIFY PAYMENT (CONFIG)",
                details=f"Config code used: {payment_req.code} (license={license_type})",
                ip_address=ip,
                user_id=current_user.id,
                username=current_user.username,
            )
        except Exception:
            pass

        return schemas.PaymentVerificationResponse(
            success=True,
            message=f"Payment verified successfully! System unlocked for {SUBSCRIPTION_PERIOD_DAYS} days. ({license_type})",
            lastPaymentDate=settings.lastPaymentDate
        )
    except Exception as e:
        print(f"Error verifying payment: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Payment verification failed")


@app.get("/system-settings/payment-status")
async def get_payment_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return payment lock status and currently valid payment code metadata."""
    try:
        now = datetime.utcnow()
        today = now.date()

        result = await db.execute(select(SystemSettings))
        settings = result.scalar()

        locked = True
        days_remaining = 0
        last_payment_date = settings.lastPaymentDate if settings else None

        if settings and settings.lastPaymentDate:
            days_elapsed = (now - settings.lastPaymentDate).days
            days_remaining = max(0, SUBSCRIPTION_PERIOD_DAYS - days_elapsed)
            locked = days_remaining <= 0 or str(settings.paymentStatus or "").lower() in {"inactive", "locked"}

        # Active/valid payment codes for current date and not used
        result = await db.execute(
            select(PaymentCode).where(
                PaymentCode.validFrom <= today,
                PaymentCode.validUntil >= today,
                PaymentCode.isUsed == False,
            )
        )
        active_codes = result.scalars().all()

        return {
            "locked": locked,
            "daysRemaining": days_remaining,
            "subscriptionDays": SUBSCRIPTION_PERIOD_DAYS,
            "lastPaymentDate": last_payment_date,
            "hasActiveDbCodes": len(active_codes) > 0,
            "activeCodePeriods": [c.period for c in active_codes],
        }
    except Exception as e:
        print(f"Error fetching payment status: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment status")


@app.get("/payment-codes/", response_model=schemas.PaymentCodesList)
async def get_payment_codes(
    includeUsed: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(permission_required("Manage users and roles")),
):
    """Get all available payment codes (admin only)"""
    try:
        from sqlalchemy import select, func
        
        if includeUsed:
            result = await db.execute(select(PaymentCode))
            codes = result.scalars().all()
        else:
            result = await db.execute(select(PaymentCode).where(PaymentCode.isUsed == False))
            codes = result.scalars().all()
        
        result = await db.execute(select(func.count(PaymentCode.id)))
        total = result.scalar()
        
        result = await db.execute(select(func.count(PaymentCode.id)).where(PaymentCode.isUsed == True))
        used = result.scalar()
        
        active = total - used
        
        return schemas.PaymentCodesList(
            codes=codes,
            total=total,
            active=active,
            used=used
        )
    except Exception as e:
        print(f"Error fetching payment codes: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment codes")


@app.post("/payment-codes/create/", response_model=schemas.PaymentCodeOut)
async def create_payment_code(
    code_data: schemas.PaymentCodeCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(permission_required("Manage users and roles")),
):
    """Create a new payment code"""
    try:
        from sqlalchemy import select
        
        # Check if code already exists
        result = await db.execute(select(PaymentCode).where(PaymentCode.code == code_data.code))
        existing = result.scalar()
        if existing:
            raise HTTPException(status_code=400, detail="Code already exists")
        
        payment_code = PaymentCode(
            code=code_data.code.upper(),
            validFrom=code_data.validFrom,
            validUntil=code_data.validUntil,
            period=code_data.period,
            licenseType=code_data.licenseType,
            description=code_data.description,
            isUsed=False
        )
        
        db.add(payment_code)
        await db.commit()
        await db.refresh(payment_code)
        
        print(f"[ADMIN] New payment code created: {payment_code.code} ({payment_code.period})")
        
        return payment_code
    except Exception as e:
        print(f"Error creating payment code: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create payment code")


@app.post("/payment-codes/bulk-create/")
async def bulk_create_payment_codes(
    codes_data: List[schemas.PaymentCodeCreate],
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(permission_required("Manage users and roles")),
):
    """Create multiple payment codes at once"""
    try:
        from sqlalchemy import select
        
        created_codes = []
        failed_codes = []
        
        for code_data in codes_data:
            try:
                # Check if code already exists
                result = await db.execute(select(PaymentCode).where(PaymentCode.code == code_data.code))
                existing = result.scalar()
                if existing:
                    failed_codes.append({
                        "code": code_data.code,
                        "error": "Code already exists"
                    })
                    continue
                
                payment_code = PaymentCode(
                    code=code_data.code.upper(),
                    validFrom=code_data.validFrom,
                    validUntil=code_data.validUntil,
                    period=code_data.period,
                    licenseType=code_data.licenseType,
                    description=code_data.description,
                    isUsed=False
                )
                
                db.add(payment_code)
                created_codes.append(code_data.code)
            except Exception as e:
                failed_codes.append({
                    "code": code_data.code,
                    "error": str(e)
                })
        
        await db.commit()
        
        print(f"[ADMIN] Bulk created {len(created_codes)} payment codes")
        
        return {
            "success": True,
            "created": len(created_codes),
            "failed": len(failed_codes),
            "created_codes": created_codes,
            "failed_codes": failed_codes
        }
    except Exception as e:
        print(f"Error bulk creating payment codes: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to bulk create payment codes")


# ==============================
# ADMIN CHECK ROUTE
# ==============================
@app.get("/admin/check-admin/")
async def check_admin(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Check if current user can manage users/roles based on permission mapping."""
    can_manage = await _has_permission(db, current_user.role, "Manage users and roles")
    return {"is_admin": can_manage}


# ==============================
# ROLE PERMISSIONS ROUTES
# ==============================
@app.get("/admin/permissions/")
async def get_permissions(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(permission_required("Manage users and roles"))
):
    """Get all role permissions"""
    try:
        from sqlalchemy import select
        
        result = await db.execute(select(models.RolePermission))
        perms = result.scalars().all()
        
        # Group by role
        permissions_dict = {}
        for perm in perms:
            if perm.role not in permissions_dict:
                permissions_dict[perm.role] = []
            permissions_dict[perm.role].append(perm.permission)
        
        return {"permissions": permissions_dict}
    except Exception as e:
        print(f"Error fetching permissions: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch permissions")


@app.put("/admin/permissions/")
async def update_permissions(
    data: schemas.PermissionsUpdate,
    db: AsyncSession = Depends(get_db),
    request: Request = None,
    current_user: User = Depends(permission_required("Manage users and roles"))
):
    """Update role permissions"""
    try:
        from sqlalchemy import select, delete

        legacy_permission_map = {
            "Access patient lab results": "Access food test results",
            "Register new patients": "Register new food clients",
            "Initiate lab requests": "Initiate food test requests",
            "Access patient history": "Access food test history",
        }

        def normalize_permission_label(permission: str) -> str:
            return legacy_permission_map.get(permission, permission)
        
        # Delete all existing permissions
        await db.execute(delete(models.RolePermission))
        await db.commit()
        
        # Insert new permissions
        for role, permissions in data.permissions.items():
            for permission in set(normalize_permission_label(p) for p in permissions):
                perm_obj = models.RolePermission(
                    role=role,
                    permission=permission
                )
                db.add(perm_obj)
        
        await db.commit()
        
        # Audit log
        try:
            ip = request.client.host if request and request.client else None
            roles_updated = list(data.permissions.keys())
            await crud.create_audit_log(
                db=db,
                role=current_user.role,
                action="UPDATE role-permissions",
                details=f"Updated permissions for roles: {roles_updated}",
                ip_address=ip,
                user_id=current_user.id,
                username=current_user.username,
            )
        except Exception:
            pass
        
        return {"message": "Permissions updated successfully"}
    except Exception as e:
        print(f"Error updating permissions: {e}")
        await db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update permissions")


# ==============================
# STATIC FILES AND SPA FALLBACK
# ==============================

# Get the absolute path to the frontend dist folder
FRONTEND_DIST_PATH = Path(__file__).parent.parent.parent / "frontend" / "dist"

# Mount the static assets folder
if FRONTEND_DIST_PATH.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST_PATH / "assets")), name="assets")

# Serve index.html for all non-API routes (SPA fallback)
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    """Serve React SPA - fallback for all routes except API endpoints"""
    # Don't serve SPA for API routes
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi"):
        raise HTTPException(status_code=404, detail="Not found")
    
    index_path = FRONTEND_DIST_PATH / "index.html"
    if index_path.exists():
        return FileResponse(index_path)
    
    raise HTTPException(status_code=404, detail="Frontend not built")


# ==============================
# EMAIL ENDPOINTS
# ==============================
@app.get("/api/emails/")
async def get_emails(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Get all emails"""
    stmt = select(Email).order_by(Email.created_at.desc())
    result = await db.execute(stmt)
    emails = result.scalars().all()
    return [{"id": e.id, "recipient": e.recipient, "subject": e.subject, "status": e.status, "created_at": e.created_at} for e in emails]


@app.post("/api/emails/send/")
async def send_email(
    data: dict,
    db: AsyncSession = Depends(get_db), 
    current_user = Depends(get_current_user)
):
    """Send an email"""
    recipient = data.get("recipient")
    subject = data.get("subject")
    message = data.get("message")
    
    if not all([recipient, subject, message]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    email = Email(
        recipient=recipient,
        subject=subject,
        message=message,
        user_id=current_user.id,
        status="sent"
    )
    db.add(email)
    await db.commit()
    await db.refresh(email)
    return {"id": email.id, "recipient": email.recipient, "subject": email.subject, "status": email.status}


# ==============================
# APPOINTMENT ENDPOINTS
# ==============================
@app.get("/api/appointments/")
async def get_appointments(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    """Get all appointments"""
    stmt = select(Appointment).order_by(Appointment.appointment_datetime)
    result = await db.execute(stmt)
    appointments = result.scalars().all()
    return [
        {
            "id": a.id, 
            "patient_name": a.patient_name, 
            "patient_email": a.patient_email,
            "appointment_datetime": a.appointment_datetime,
            "doctor": a.doctor,
            "type": a.type,
            "notes": a.notes
        } for a in appointments
    ]


@app.post("/api/appointments/schedule/")
async def schedule_appointment(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Schedule an appointment"""
    from datetime import datetime as dt
    
    patient_name = data.get("patient_name")
    patient_email = data.get("patient_email")
    appointment_datetime = data.get("appointment_datetime")
    doctor = data.get("doctor")
    appt_type = data.get("type", "Lab Test")
    notes = data.get("notes")
    
    if not all([patient_name, patient_email, appointment_datetime]):
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    try:
        appt_dt = dt.fromisoformat(appointment_datetime)
    except:
        raise HTTPException(status_code=400, detail="Invalid datetime format")
    
    appointment = Appointment(
        patient_name=patient_name,
        patient_email=patient_email,
        appointment_datetime=appt_dt,
        doctor=doctor,
        type=appt_type,
        notes=notes,
        user_id=current_user.id
    )
    db.add(appointment)
    await db.commit()
    await db.refresh(appointment)
    return {
        "id": appointment.id,
        "patient_name": appointment.patient_name,
        "patient_email": appointment.patient_email,
        "appointment_datetime": appointment.appointment_datetime,
        "type": appointment.type
    }


@app.delete("/api/appointments/{appointment_id}/")
async def cancel_appointment(
    appointment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Cancel an appointment"""
    stmt = select(Appointment).where(Appointment.id == appointment_id)
    result = await db.execute(stmt)
    appointment = result.scalar_one_or_none()
    
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")
    
    await db.delete(appointment)
    await db.commit()
    return {"msg": "Appointment cancelled"}


# ==============================
# ROOT
# ==============================
@app.get("/")
async def root():
    return {"msg": "Biozone Analytics (BZA) API running with async FastAPI, users, lab tests, PubMed integration."}