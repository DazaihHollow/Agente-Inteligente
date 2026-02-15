from fastapi import FastAPI

app = FastAPI(
    title="Agente Inteligente API",
    description="Backend con Arquitectura Hexagonal para Sistema de Agentes Inteligentes",
    version="0.1.0"
)

@app.get("/health")
async def health_check():
    """
    Health Check Endpoint
    Used by Docker and monitoring tools to verify the API is responsive.
    """
    return {"status": "ok", "system": "operational"}