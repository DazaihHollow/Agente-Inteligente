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
        
    async with engine.connect() as conn:
        # Check counts
        r_raw = await conn.execute(text("SELECT COUNT(*) FROM raw_data"))
        r_prod = await conn.execute(text("SELECT COUNT(*) FROM products"))
        r_sale = await conn.execute(text("SELECT COUNT(*) FROM sales"))
        
        raw_count = r_raw.scalar()
        prod_count = r_prod.scalar()
        sale_count = r_sale.scalar()
        
        print(f"--- ESTADO DE LA BASE DE DATOS ---")
        print(f"RawData (pendientes): {raw_count}")
        print(f"Products (inventario): {prod_count}")
        print(f"Sales (ventas): {sale_count}")
        
        if prod_count > 0 and sale_count == 0:
            print("\n[!] DETECTADO: Los datos se procesaron como productos genéricos (lógica antigua).")
            print("Para arreglarlo, debemos limpiar y re-ingresar.")
        elif sale_count > 0:
            print("\n[OK] Se detectaron ventas en la base de datos.")

if __name__ == "__main__":
    asyncio.run(main())
