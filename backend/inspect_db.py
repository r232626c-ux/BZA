import asyncio
from app.database import engine
from sqlalchemy import text

async def main():
    async with engine.begin() as conn:
        for table in ['test_categories','lab_tests','users']:
            try:
                result = await conn.execute(text(f'SELECT COUNT(*) FROM {table}'))
                print(table, result.scalar())
            except Exception as e:
                print(table, 'ERR', e)
        try:
            result = await conn.execute(text('SELECT id, code, name FROM test_categories ORDER BY id'))
            print('categories', result.fetchall())
        except Exception as e:
            print('categories ERR', e)
        try:
            result = await conn.execute(text('SELECT id, name, category_id FROM lab_tests ORDER BY id LIMIT 10'))
            print('lab_tests sample', result.fetchall())
        except Exception as e:
            print('lab_tests ERR', e)

asyncio.run(main())
