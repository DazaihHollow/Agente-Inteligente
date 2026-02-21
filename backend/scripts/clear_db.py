import asyncio
import os
import sys

sys.path.append(os.getcwd())

from src.shared.database import SessionLocal
from src.modules.intelligence.models import Product
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def clear_db():
    print("🧹 Vaciando tablas...")
    async with SessionLocal() as db:
        await db.execute(text("TRUNCATE TABLE sales RESTART IDENTITY CASCADE;"))
        await db.execute(text("TRUNCATE TABLE products RESTART IDENTITY CASCADE;"))
        await db.commit()
        print("✅ Base de datos limpia (products y sales).")

if __name__ == "__main__":
    asyncio.run(clear_db())
