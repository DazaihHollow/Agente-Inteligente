from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.database import get_db
from src.modules.intelligence.processor import ContentProcessor

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

@router.post("/process")
async def process_content(limit: int = 10, db: AsyncSession = Depends(get_db)):
    """
    Gatillo manual para procesar datos crudos y convertirlos en vectores.
    """
    processor = ContentProcessor()
    try:
        count = await processor.process_batch(db, limit)
        return {"status": "success", "processed_count": count, "message": f"Se procesaron {count} elementos."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
