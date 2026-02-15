from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from src.shared.database import get_db
from src.modules.data_ingestion.models import RawData

router = APIRouter(prefix="/ingestion", tags= ["Ingestion"])

# Esquema de entrada (pydantic)
class IngestionRequest(BaseModel):
    source: str
    payload: dict | list # puede ser un objeto o una lista de objetos

# Endpoint para recibir datos crudos
@router.post("/")
async def ingest_data(request: IngestionRequest, db: AsyncSession = Depends(get_db)):
    """
    Recibe datos crudos de n8n u otras fuentes
    """
    try:
        new_data = RawData(
            source=request.source,
            payload=request.payload
        )
        db.add(new_data)
        await db.commit()
        await db.refresh(new_data)

        return {"status": "success", "id": new_data.id, "message": "Datos guardados correctamente"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error guardando datos: {str(e)}")