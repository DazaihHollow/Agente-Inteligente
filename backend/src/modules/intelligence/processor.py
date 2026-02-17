from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.modules.data_ingestion.models import RawData
from src.modules.intelligence.models import Product
from src.modules.intelligence.service import EmbeddingService
import json

class ContentProcessor:
    def __init__(self):
        self.embedding_service = EmbeddingService()

    async def process_batch(self, db: AsyncSession, limit: int = 100):
        # Buscar datos crudos (se traen todos, idealmente filtrados por "no procesados")
        result = await db.execute(select(RawData).limit(limit))
        raw_items = result.scalars().all()

        processed_count = 0
        for item in raw_items:
            # Extraemos texto representativo del payload
            # (Asumimos que el payload es un diccionario simple por ahora)
            payload_str = json.dumps(item.payload)

            # Generar vector
            vector = await self.embedding_service.generate(payload_str)

            if not vector:
                continue

            # Guardar como producto
            new_product = Product(
                name=f"Procesado desde {item.source}", 
                description=payload_str, 
                embedding=vector
            )
            db.add(new_product)

            # (Opcional) Aquí deberíamos marcar el RawData como "procesado" o borrarlo
            # db.delete(item)
            processed_count += 1

        await db.commit()
        return processed_count