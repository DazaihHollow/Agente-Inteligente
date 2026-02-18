import asyncio
import os
import sys

sys.path.append(os.getcwd())

from src.shared.database import SessionLocal
from src.modules.intelligence.models import Product
from src.modules.intelligence.service import EmbeddingService
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def seed_products():
    print("🌱 Sembrando base de datos con productos de ejemplo...")
    
    embedding_service = EmbeddingService()
    
    products = [
        {
            "name": "Silla Ergonómica Pro",
            "description": "Silla de oficina con soporte lumbar ajustable, malla transpirable y reposabrazos 4D. Ideal para largas jornadas de trabajo. Precio: $250. Garantía: 3 años.",
            "access_level": "public"
        },
        {
            "name": "Escritorio Elevable Standing Desk",
            "description": "Escritorio motorizado con altura ajustable de 70cm a 120cm. Tablero de madera maciza de roble. Soporta hasta 80kg. Precio: $450.",
            "access_level": "public"
        },
        {
            "name": "Monitor UltraWide 34 pulgadas",
            "description": "Monitor curvo para productividad. Resolución 4K, tasa de refresco 144Hz. Conectividad USB-C. Precio: $600.",
            "access_level": "public"
        },
        # Un dato privado para verificar que NO se muestre
        {
            "name": "Estrategia de Precios 2025",
            "description": "Documento confidencial con los márgenes de ganancia esperados y descuentos para distribuidores en Q3 2025.",
            "access_level": "private"
        }
    ]

    async with SessionLocal() as db:
        # Opcional: Limpiar antes de sembrar para evitar duplicados en pruebas
        # await db.execute(text("TRUNCATE TABLE products RESTART IDENTITY CASCADE;"))
        
        for p in products:
            print(f"   > Generando vector para: {p['name']}")
            vector = await embedding_service.generate(f"{p['name']}: {p['description']}")
            
            new_prod = Product(
                name=p['name'],
                description=p['description'],
                embedding=vector,
                access_level=p['access_level']
            )
            db.add(new_prod)
        
        await db.commit()
        print("✅ Base de datos poblada exitosamente.")

if __name__ == "__main__":
    asyncio.run(seed_products())
