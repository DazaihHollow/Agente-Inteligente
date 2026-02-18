import asyncio
import os
import sys

sys.path.append(os.getcwd())

from src.shared.database import SessionLocal
from src.modules.intelligence.models import Product
from src.modules.intelligence.service import EmbeddingService
from src.modules.interaction.service import ChatService
from sqlalchemy import text
from dotenv import load_dotenv

load_dotenv()

async def test_rbac():
    print("🛡️ Iniciando prueba de Control de Acceso (RBAC)...")
    
    # 1. Limpiar DB
    async with SessionLocal() as db:
        await db.execute(text("TRUNCATE TABLE products RESTART IDENTITY CASCADE;"))
        await db.commit()

    # 2. Insertar Datos de Prueba (Uno Público, Uno Privado)
    embedding_service = EmbeddingService()
    emb_public = await embedding_service.generate("Laptop Gamer")
    emb_private = await embedding_service.generate("Salarios Ejecutivos")

    async with SessionLocal() as db:
        prod_public = Product(name="Laptop Gamer", description="Laptop de alto rendimiento", embedding=emb_public, access_level="public")
        prod_private = Product(name="Salarios 2024", description="Lista de sueldos de gerencia", embedding=emb_private, access_level="private")
        db.add(prod_public)
        db.add(prod_private)
        await db.commit()
        print("✅ Datos insertados: 1 Público, 1 Privado.")

    # 3. Probar como 'customer'
    print("\n🕵️  Probando como CUSTOMER (Debería ver solo Laptop)...")
    chat_service = ChatService()
    async with SessionLocal() as db:
        res_customer = await chat_service.ask("dime que info tienes", db, role="customer")
        print(f"🤖 Respuesta: {res_customer['response']}")
        if "Salarios" in res_customer['response']:
             print("❌ FALLO: Customer vio datos privados.")
        else:
             print("✅ ÉXITO: Customer no vio datos privados.")

    # 4. Probar como 'admin'
    print("\n👮 Probando como ADMIN (Debería ver todo)...")
    async with SessionLocal() as db:
        res_admin = await chat_service.ask("dime que info tienes sobre salarios", db, role="admin")
        print(f"🤖 Respuesta: {res_admin['response']}")
        if "Salarios" in res_admin['response'] or "sueldos" in res_admin['response']:
             print("✅ ÉXITO: Admin accedió a datos privados.")
        else:
             print("❌ FALLO: Admin no pudo ver datos privados.")

if __name__ == "__main__":
    asyncio.run(test_rbac())
