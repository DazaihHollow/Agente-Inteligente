from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.modules.data_ingestion.models import RawData
from src.modules.intelligence.models import Product, Sale
from src.modules.intelligence.service import EmbeddingService
import json
from datetime import datetime

class ContentProcessor:
    def __init__(self):
        self.embedding_service = EmbeddingService()

    async def process_batch(self, db: AsyncSession, limit: int = 100):
        # Buscar datos crudos (se traen todos, idealmente filtrados por "no procesados")
        result = await db.execute(select(RawData).limit(limit))
        raw_items = result.scalars().all()

        processed_count = 0
        
        # Cache para evitar re-generar embeddings o buscar el mismo producto muchas veces en el mismo batch
        product_cache = {}

        for item in raw_items:
            payload_raw = item.payload
            
            # Convertir payload único en lista para procesar de forma uniforme
            payload_list = payload_raw if isinstance(payload_raw, list) else [payload_raw]

            for payload_data in payload_list:
                # 1. Detectar si es una venta o un producto genérico
                is_sale = False
                if isinstance(payload_data, dict):
                    # Si tiene claves de venta, lo tratamos como tal
                    if 'sale_date' in payload_data or 'price_total' in payload_data:
                        is_sale = True

                if is_sale:
                    # --- PROCESAR VENTA ---
                    product_name = payload_data.get('product_name', 'Producto Desconocido')
                    
                    # Buscar producto existente o crear uno base
                    if product_name in product_cache:
                        product_id = product_cache[product_name]
                    else:
                        # Buscar en DB
                        p_result = await db.execute(select(Product).where(Product.name == product_name))
                        prod = p_result.scalar_one_or_none()
                        
                        if not prod:
                            # Crear producto base para esta venta
                            payload_str = json.dumps(payload_data)
                            vector = await self.embedding_service.generate(payload_str)
                            prod = Product(
                                name=product_name,
                                description=f"Auto-creado desde venta: {product_name}",
                                embedding=vector,
                                access_level=payload_data.get('access_level', 'private')
                            )
                            db.add(prod)
                            await db.flush() # Para obtener el ID
                        
                        product_id = prod.id
                        product_cache[product_name] = product_id

                    # Parsear fecha
                    sale_date_str = payload_data.get('sale_date')
                    try:
                        sale_date = datetime.strptime(sale_date_str, "%Y-%m-%d %H:%M:%S")
                    except:
                        sale_date = datetime.utcnow()

                    # Crear registro de venta
                    new_sale = Sale(
                        product_id=product_id,
                        quantity=payload_data.get('quantity', 1),
                        price_total=payload_data.get('price_total', 0),
                        sale_date=sale_date,
                        category=payload_data.get('category', 'General'),
                        region=payload_data.get('region', 'Global'),
                        customer_type=payload_data.get('customer_type', 'Individual'),
                        customer_name=payload_data.get('customer_name', 'Cliente Genérico'),
                        seller_name=payload_data.get('seller_name', 'Vendedor Sin Asignar')
                    )
                    db.add(new_sale)

                else:
                    # --- PROCESAR PRODUCTO GENERICO (RAG) ---
                    payload_str = json.dumps(payload_data)
                    vector = await self.embedding_service.generate(payload_str)

                    if not vector:
                        continue

                    product_name = f"Dato Crudo {item.id}"
                    if isinstance(payload_data, dict):
                        for key in ['name', 'product_name', 'nombre', 'title']:
                            if key in payload_data:
                                product_name = payload_data[key]
                                break

                    new_product = Product(
                        name=product_name, 
                        description=payload_str, 
                        embedding=vector,
                        access_level=payload_data.get('access_level', 'private')
                    )
                    db.add(new_product)

            # Borrar dato crudo una vez procesado
            await db.delete(item)
            processed_count += len(payload_list)

        await db.commit()
        return processed_count