import asyncio
import os
import sys

# Añadir el directorio raíz al path para que encuentre 'src'
sys.path.append(os.getcwd())

from src.shared.database import SessionLocal
from src.modules.intelligence.models import Product
from sqlalchemy import select
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

async def list_products():
    print("📋 Listando productos en la Base de Datos...")
    print("-" * 60)
    
    async with SessionLocal() as db:
        result = await db.execute(select(Product).order_by(Product.id))
        products = result.scalars().all()
        
        if not products:
            print("❌ La base de datos está vacía.")
            return

        print(f"✅ Se encontraron {len(products)} registros:")
        for p in products:
            print(f"🆔 ID: {p.id}")
            print(f"📌 Nombre: {p.name}")
            print(f"📝 Descripción: {p.description[:100]}...") 
            print("-" * 60)

if __name__ == "__main__":
    asyncio.run(list_products())
