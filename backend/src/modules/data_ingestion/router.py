from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from src.shared.database import get_db
from src.modules.data_ingestion.models import RawData
from src.modules.intelligence.processor import ContentProcessor
import pandas as pd
import io

router = APIRouter(prefix="/ingestion", tags= ["Ingestion"])
processor = ContentProcessor()

from sqlalchemy import text
@router.get("/fix-db")
async def fix_db(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("ALTER TABLE sales ADD COLUMN payment_method VARCHAR;"))
        await db.commit()
        return {"status": "ok"}
    except Exception as e:
        await db.rollback()
        return {"status": "error", "error": str(e)}

# Esquemas de entrada
class IngestionRequest(BaseModel):
    source: str
    access_level: str = "private"
    payload: dict | list

class ManualSaleRequest(BaseModel):
    customer_name: str
    product_name: str
    quantity: int
    sale_date: str
    price: float
    price_total: float
    payment_method: str
    seller_name: str

@router.post("/")
async def ingest_data(request: IngestionRequest, db: AsyncSession = Depends(get_db)):
    """ Endpoint clásico (n8n/json genérico) modificado para procesar síncronamente """
    try:
        final_payload = request.payload
        if isinstance(final_payload, dict):
            final_payload['access_level'] = request.access_level
        
        new_data = RawData(source=request.source, payload=final_payload)
        db.add(new_data)
        await db.commit()
        await db.refresh(new_data)
        
        # Procesar inmediatamente
        processed = await processor.process_batch(db, limit=10)
        return {"status": "success", "id": new_data.id, "processed_items": processed, "message": "Datos guardados y procesados"}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/manual-sale")
async def manual_sale(sale: ManualSaleRequest, db: AsyncSession = Depends(get_db)):
    """ Ingreso de una venta manual individual """
    try:
        payload = sale.model_dump()
        payload['source'] = 'manual_entry'
        
        new_data = RawData(source="manual_entry", payload=payload)
        db.add(new_data)
        await db.commit()
        
        # Procesar inmediatamente
        processed = await processor.process_batch(db, limit=1)
        return {"status": "success", "message": "Venta procesada exitosamente."}
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Error guardando venta: {str(e)}")

@router.post("/upload-sales")
async def upload_sales(file: UploadFile = File(...), db: AsyncSession = Depends(get_db)):
    """ Subida masiva de ventas mediante Excel o CSV """
    try:
        content = await file.read()
        
        # Detectar el formato
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith('.xlsx') or file.filename.endswith('.xls'):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(status_code=400, detail="Formato no soportado. Usa CSV o Excel.")
            
        # Convertir dataframe a lista de diccionarios, rellenando nulos
        df = df.fillna("")
        records = df.to_dict(orient="records")
        
        # Para ser flexibles, en lugar de mapear agresivamente aquí, lo mandamos todo como RawData
        # y que el procesador lo lea.
        payload = {
            "source": "excel_upload",
            "filename": file.filename,
            "records": records
        }
        
        new_data = RawData(source="excel_upload", payload=records)
        db.add(new_data)
        await db.commit()
        
        # Procesar todo al instante (se queda cargando la petición)
        processed = await processor.process_batch(db, limit=50) # Procesar varios raudatas si se acumulan
        
        return {"status": "success", "message": f"Archivo procesado: {len(records)} filas leídas y vectorizadas."}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error procesando el archivo: {str(e)}")