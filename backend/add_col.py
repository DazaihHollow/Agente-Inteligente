import asyncio
from sqlalchemy import text
from src.shared.database import SessionLocal

async def r():
    async with SessionLocal() as db:
        await db.execute(text("ALTER TABLE products ADD COLUMN IF NOT EXISTS agent_instruction TEXT NULL;"))
        await db.commit()
    print("OK")

if __name__ == "__main__":
    asyncio.run(r())
