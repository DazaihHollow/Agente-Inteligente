import asyncio
from sqlalchemy import text
from src.shared.database import SessionLocal

async def alter_table():
    async with SessionLocal() as session:
        # Check if column exists first to avoid errors
        try:
            await session.execute(text("ALTER TABLE sales ADD COLUMN payment_method VARCHAR;"))
            await session.commit()
            print("Columna 'payment_method' anadida con exito a la tabla 'sales'.")
        except Exception as e:
            print(f"Error (quizas la columna ya existe): {e}")

if __name__ == "__main__":
    asyncio.run(alter_table())
