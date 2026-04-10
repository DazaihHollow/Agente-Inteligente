from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from typing import Optional, List
from src.shared.database import get_db
from src.modules.data_ingestion.models import RawData
from src.modules.intelligence.processor import ContentProcessor
import pandas as pd
import io
from src.modules.auth.dependencies import get_current_user, RequireRole
from src.modules.intelligence.models import User

router = APIRouter(prefix="/ingestion", tags= ["Ingestion"], dependencies=[Depends(get_current_user)])
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
    category: str = "Hardware"

@router.post("/")
async def ingest_data(request: IngestionRequest, db: AsyncSession = Depends(get_db)):
    """ Endpoint genérico modificado para procesar síncronamente """
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

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from src.modules.intelligence.models import Sale, Product
from datetime import datetime

class EditSaleRequest(BaseModel):
    customer_name: str
    product_name: str
    quantity: int
    sale_date: str
    price: float
    price_total: float
    payment_method: str
    seller_name: str
    category: str

@router.get("/sales")
async def list_sales(db: AsyncSession = Depends(get_db)):
    """ Listar todas las ventas para gestión manual """
    result = await db.execute(select(Sale).options(selectinload(Sale.product)).order_by(Sale.sale_date.desc()))
    sales = result.scalars().all()
    
    response = []
    for s in sales:
        total = s.price_total or 0
        qty = s.quantity or 1
        response.append({
            "id": s.id,
            "product_name": s.product.name if s.product else "Desconocido",
            "quantity": qty,
            "sale_date": s.sale_date.strftime("%Y-%m-%d") if s.sale_date else "",
            "price": round(total / qty, 2),
            "price_total": total,
            "customer_name": s.customer_name or "Desconocido",
            "seller_name": s.seller_name or "Desconocido",
            "category": s.category or "General",
            "payment_method": s.payment_method or "N/A"
        })
    return response

@router.put("/sales/{sale_id}")
async def update_sale(sale_id: int, request: EditSaleRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Sale).options(selectinload(Sale.product)).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
        
    sale.customer_name = request.customer_name
    sale.quantity = request.quantity
    sale.price_total = request.price_total
    sale.seller_name = request.seller_name
    sale.category = request.category
    sale.payment_method = request.payment_method
    
    try:
        sale.sale_date = datetime.strptime(request.sale_date, "%Y-%m-%d")
    except:
        pass
        
    if sale.product:
        sale.product.name = request.product_name
        
    await db.commit()
    return {"status": "success", "message": "Venta actualizada"}

@router.delete("/sales/{sale_id}", dependencies=[Depends(RequireRole(["admin"]))])
async def delete_sale(sale_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Sale).where(Sale.id == sale_id))
    sale = result.scalar_one_or_none()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")
        
    await db.delete(sale)
    await db.commit()
    return {"status": "success", "message": "Venta eliminada"}

@router.post("/manual-sale")
async def manual_sale(sale: ManualSaleRequest, db: AsyncSession = Depends(get_db)):
    """ Ingreso de una venta manual individual """
    try:
        payload = sale.model_dump()
        payload['source'] = 'manual_entry'
        
        new_data = RawData(source="manual_entry", payload=payload)
        db.add(new_data)
        await db.commit()
        
        # Procesar lote (limite alto para destrancar cola si hay retrasos)
        processed = await processor.process_batch(db, limit=50)
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