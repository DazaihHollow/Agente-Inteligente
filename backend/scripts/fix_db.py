import asyncio
import os
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()
db_url = os.environ.get("DATABASE_URL")

async def run():
    print(f"Connecting to {db_url}")
    engine = create_async_engine(db_url)
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE sales ADD COLUMN payment_method VARCHAR;"))
            print("payment_method added.")
        except Exception as e:
            print(f"payment_method failed: {e}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(run())
