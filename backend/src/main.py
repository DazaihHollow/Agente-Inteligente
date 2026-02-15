from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from src.shared.database import engine

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        # Intenta conectar a la base de datos
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("\n✅ CONEXION A BASE DE DATOS EXITOSA!\n")
    except Exception as e:
        print(f"\n❌ ERROR DE CONEXION A BASE DE DATOS: {e}\n")
    yield

app = FastAPI(
    title="Agente Inteligente API",
    description="Backend con Arquitectura Hexagonal para Sistema de Agentes Inteligentes",
    version="0.1.0",
    lifespan=lifespan
)

@app.get("/health")
async def health_check():
    """
    Health Check Endpoint
    Used by Docker and monitoring tools to verify the API is responsive.
    """
    return {"status": "ok", "system": "operational"}