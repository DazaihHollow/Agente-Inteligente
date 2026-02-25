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
        # 1. Borrar ventas (por si acaso hay alguna huérfana)
        await conn.execute(text("DELETE FROM sales"))
        
        # 2. Borrar productos creados por la lógica antigua
        # Buscamos los que tienen el título característico de la versión anterior
        result = await conn.execute(text("DELETE FROM products WHERE name LIKE 'Procesado desde n8n%'"))
        deleted_count = result.rowcount
        
        # 3. Borrar RawData residual (para empezar de cero)
        await conn.execute(text("DELETE FROM raw_data"))
        
        print(f"--- LIMPIEZA COMPLETADA ---")
        print(f"Productos eliminados: {deleted_count}")
        print(f"Ventas reiniciadas: OK")
        print(f"Datos crudos eliminados: OK")
        print("\n[!] Ya puedes volver a ejecutar la ingesta en n8n.")

if __name__ == "__main__":
    asyncio.run(main())
