import asyncio
from app.database import async_session
from sqlalchemy import text

async def check_db():
    async with async_session() as session:
        # Check database type
        result = await session.execute(text('SELECT version()'))
        version = result.scalar()
        print('Database version:', version[:50] + '...')
        
        # Check if lab_results table exists and has data
        try:
            result = await session.execute(text("SELECT COUNT(*) FROM lab_results"))
            count = result.scalar()
            print(f'Lab results count: {count}')
        except Exception as e:
            print(f'Error checking lab_results: {e}')

asyncio.run(check_db())