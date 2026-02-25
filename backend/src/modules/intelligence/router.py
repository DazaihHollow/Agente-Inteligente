from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.database import get_db
from src.modules.intelligence.processor import ContentProcessor

from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select, update
from src.modules.intelligence.models import Product

router = APIRouter(prefix="/intelligence", tags=["Intelligence"])

@router.post("/process")
async def process_content(limit: int = 100, db: AsyncSession = Depends(get_db)):
    """
    Gatillo manual para procesar datos crudos y convertirlos en vectores.
    """
    processor = ContentProcessor()
    try:
        count = await processor.process_batch(db, limit)
        return {"status": "success", "processed_count": count, "message": f"Se procesaron {count} elementos."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    access_level: Optional[str] = None

@router.put("/products/{product_id}")
async def update_product(product_id: int, product: ProductUpdate, db: AsyncSession = Depends(get_db)):
    """
    Actualiza los datos de un producto.
    """
    # Verificar si existe
    result = await db.execute(select(Product).where(Product.id == product_id))
    existing_product = result.scalar_one_or_none()
    
    if not existing_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    # Actualizar campos
    update_data = product.model_dump(exclude_unset=True)
    if not update_data:
        return {"message": "No changes provided"}

    stmt = (
        update(Product)
        .where(Product.id == product_id)
        .values(**update_data)
        .execution_options(synchronize_session="fetch")
    )
    
    await db.execute(stmt)
    await db.commit()
    
    return {"status": "success", "message": "Producto actualizado correctamente"}

@router.get("/products")
async def list_products(db: AsyncSession = Depends(get_db)):
    """
    Lista todos los productos (para el panel administrativo).
    Excluye el campo 'embedding' que causa problemas de serialización y sobrecarga de datos.
    """
    # Seleccionar solo las columnas necesarias
    from sqlalchemy import select
    from sqlalchemy.orm import Load
    
    # Usamos load_only para elegir qué campos traer y evitar el embedding
    stmt = select(Product).options(Load(Product).load_only(
        Product.id, 
        Product.name, 
        Product.description, 
        Product.access_level
    )).order_by(Product.id)
    
    result = await db.execute(stmt)
    return result.scalars().all()
