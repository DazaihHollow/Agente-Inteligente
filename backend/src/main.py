from contextlib import asynccontextmanager
from fastapi import FastAPI
from sqlalchemy import text
from src.shared.database import engine, Base
from src.modules.data_ingestion.router import router as ingestion_router
from src.modules.intelligence.router import router as intelligence_router
from src.modules.interaction.router import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Crear tablas (Si no existen)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    try:
        # Verificar conexión
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            print("\n✅ CONEXION EXITOSA Y TABLAS CREADAS!\n")
    except Exception as e:
        print(f"\n❌ ERROR DE INICIO: {e}\n")
    yield

app = FastAPI(
    title="Agente Inteligente API",
    description="Backend con Arquitectura Hexagonal para Sistema de Agentes Inteligentes",
    version="0.1.0",
    lifespan=lifespan
)

app.include_router(ingestion_router)
app.include_router(intelligence_router)
app.include_router(chat_router)

@app.get("/health")
async def health_check():
    """
    Health Check Endpoint
    Used by Docker and monitoring tools to verify the API is responsive.
    """
    return {"status": "ok", "system": "operational"}