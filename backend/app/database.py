# database.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv
from pathlib import Path
import os

# Load environment variables from .env
load_dotenv()

# PostgreSQL ONLY - No fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL environment variable not set. "
        "BIOZONE requires PostgreSQL. "
        "Set DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/biozone"
    )

if "postgresql" not in DATABASE_URL and "postgres" not in DATABASE_URL:
    raise ValueError(
        "BIOZONE requires PostgreSQL database. "
        f"Current DATABASE_URL uses: {DATABASE_URL.split('://')[0]} - Please use PostgreSQL only."
    )

# Create async engine (asyncpg for Postgres, aiosqlite for SQLite)
engine = create_async_engine(
    DATABASE_URL,
    echo=False,           # Set True for debugging SQL
    future=True,
    pool_pre_ping=True
)

# Session factory (asynchronous)
AsyncSessionLocal = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False
)

# Alias for import convenience
async_session = AsyncSessionLocal

# Base class for models
Base = declarative_base()


# Dependency for FastAPI routes (asynchronous)
async def get_db():
    """
    Provides an async database session for FastAPI endpoints.
    Ensures the session is properly closed after use.
    """
    session = AsyncSessionLocal()
    try:
        yield session
    finally:
        await session.close()


# Initialize database tables
async def init_db():
    """
    Creates all tables based on the models.
    Call this function at app startup if needed.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

