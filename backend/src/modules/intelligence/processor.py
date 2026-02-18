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

            # Intentar extraer un nombre del payload
            payload_data = item.payload
            product_name = f"Procesado desde {item.source}"
            
            if isinstance(payload_data, dict):
                # Buscar claves comunes de nombre
                for key in ['name', 'nombre', 'cliente', 'empresa', 'product', 'title']:
                    if key in payload_data:
                        product_name = payload_data[key]
                        break

            # Intentar extraer access_level del payload, sino usar default 'private'
            key_access = 'private'
            if isinstance(payload_data, dict):
                key_access = payload_data.get('access_level', 'private')

            # Guardar como producto
            new_product = Product(
                name=product_name, 
                description=payload_str, 
                embedding=vector,
                access_level=key_access
            )
            db.add(new_product)

            # (Opcional) Aquí deberíamos marcar el RawData como "procesado" o borrarlo
            # Borrar dato crudo una vez procesado
            await db.delete(item)
            processed_count += 1


        await db.commit()
        return processed_count