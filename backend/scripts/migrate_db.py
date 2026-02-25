import asyncio
import sys
import os

# Añadir el directorio raíz al path
sys.path.append(os.getcwd())

from src.shared.database import engine
from sqlalchemy import text

async def main():
    if sys.platform == 'win32':
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())
        
    async with engine.begin() as conn:
        print("Intentando agregar la columna 'customer_name' a la tabla 'sales'...")
        try:
            await conn.execute(text("ALTER TABLE sales ADD COLUMN customer_name VARCHAR"))
            print("Columna 'customer_name' agregada.")
        except Exception:
            print("Columna 'customer_name' ya existe.")

        try:
            await conn.execute(text("ALTER TABLE sales ADD COLUMN seller_name VARCHAR"))
            print("Columna 'seller_name' agregada.")
        except Exception:
            print("Columna 'seller_name' ya existe.")

if __name__ == "__main__":
    asyncio.run(main())
