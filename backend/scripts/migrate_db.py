import asyncio
import os
import sys

sys.path.append(os.getcwd())

from src.shared.database import SessionLocal
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def migrate_db():
    print("🔄 Migrando esquema de base de datos...")
    async with SessionLocal() as db:
        try:
            # Intentar añadir la columna. Si falla, es porque ya existe.
            await db.execute(text("ALTER TABLE products ADD COLUMN access_level VARCHAR DEFAULT 'private';"))
            await db.commit()
            print("✅ Columna 'access_level' añadida correctamente.")
        except Exception as e:
            print(f"⚠️ La migración no se aplicó (posiblemente ya existe): {e}")
            await db.rollback()

if __name__ == "__main__":
    asyncio.run(migrate_db())
