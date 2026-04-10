import asyncio
from src.shared.database import SessionLocal
from sqlalchemy import select
from src.modules.intelligence.models import Product
from src.modules.intelligence.service import EmbeddingService
import json

async def main():
    embedding_service = EmbeddingService()
    async with SessionLocal() as db:
        result = await db.execute(select(Product).where(Product.embedding.is_(None)))
        products = result.scalars().all()
        for p in products:
            payload = json.dumps({"name": p.name, "description": p.description, "price": p.price, "stock": p.stock})
            vec = await embedding_service.generate(payload)
            p.embedding = vec
            print(f"Generated embedding for {p.name}")
        await db.commit()

if __name__ == "__main__":
    asyncio.run(main())
