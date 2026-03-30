from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.shared.database import get_db
from src.modules.intelligence.processor import ContentProcessor

from pydantic import BaseModel
from typing import Optional
from sqlalchemy import select, update
from src.modules.intelligence.models import Product, Staff, Client

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
    price: Optional[float] = None
    stock: Optional[int] = None
    category: Optional[str] = None
    agent_instruction: Optional[str] = None

class ProductCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    access_level: Optional[str] = "private"
    price: Optional[float] = 0.0
    stock: Optional[int] = 0
    category: Optional[str] = None
    agent_instruction: Optional[str] = None

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    monthly_goal: Optional[float] = None

class StaffCreate(BaseModel):
    name: str
    role: str
    email: str
    department: str
    status: Optional[str] = 'Activo'
    monthly_goal: Optional[float] = 0.0

class ClientCreate(BaseModel):
    name: str
    contact_email: str
    phone: Optional[str] = None
    customer_type: Optional[str] = 'Corporativo (B2B)'
    industry: Optional[str] = 'Tecnología'
    status: Optional[str] = 'Prospecto'
    acquisition_channel: Optional[str] = 'Sitio Web'

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    contact_email: Optional[str] = None
    phone: Optional[str] = None
    customer_type: Optional[str] = None
    industry: Optional[str] = None
    status: Optional[str] = None
    acquisition_channel: Optional[str] = None

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

@router.post("/products/{product_id}/recalculate")
async def recalculate_vector(product_id: int, db: AsyncSession = Depends(get_db)):
    """
    Recalcula el embedding de un producto especifico.
    """
    from src.modules.intelligence.service import EmbeddingService
    import json
    
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    payload = {
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "stock": product.stock
    }
    payload_str = json.dumps(payload)
    
    embedding_service = EmbeddingService()
    vector = await embedding_service.generate(payload_str)
    
    product.embedding = vector
    await db.commit()
    
    return {"status": "success", "message": "Vector de IA recalculado."}

@router.post("/products")
async def create_product(product: ProductCreate, db: AsyncSession = Depends(get_db)):
    """
    Crea un nuevo producto en el inventario.
    """
    new_product = Product(**product.model_dump())
    db.add(new_product)
    await db.commit()
    await db.refresh(new_product)
    return {"status": "success", "message": "Producto creado correctamente", "product_id": new_product.id}

@router.delete("/products/{product_id}")
async def delete_product(product_id: int, db: AsyncSession = Depends(get_db)):
    """
    Elimina un producto del inventario.
    """
    result = await db.execute(select(Product).where(Product.id == product_id))
    existing_product = result.scalar_one_or_none()
    
    if not existing_product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    await db.delete(existing_product)
    await db.commit()
    return {"status": "success", "message": "Producto eliminado"}

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
        Product.access_level,
        Product.price,
        Product.stock,
        Product.agent_instruction
    )).order_by(Product.id)
    
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/staff")
async def list_staff(db: AsyncSession = Depends(get_db)):
    """Lista todos los empleados."""
    result = await db.execute(select(Staff).order_by(Staff.id))
    return result.scalars().all()

@router.post("/staff")
async def create_staff(staff: StaffCreate, db: AsyncSession = Depends(get_db)):
    """Crea un nuevo empleado."""
    new_staff = Staff(**staff.model_dump())
    db.add(new_staff)
    await db.commit()
    await db.refresh(new_staff)
    return {"status": "success", "message": "Empleado creado correctamente", "staff_id": new_staff.id}

@router.put("/staff/{staff_id}")
async def update_staff(staff_id: int, staff_in: StaffUpdate, db: AsyncSession = Depends(get_db)):
    """Actualiza datos de un empleado."""
    result = await db.execute(select(Staff).where(Staff.id == staff_id))
    existing_staff = result.scalar_one_or_none()
    
    if not existing_staff:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
        
    update_data = staff_in.model_dump(exclude_unset=True)
    if update_data:
        stmt = update(Staff).where(Staff.id == staff_id).values(**update_data).execution_options(synchronize_session="fetch")
        await db.execute(stmt)
        await db.commit()
    return {"status": "success", "message": "Empleado actualizado"}

@router.delete("/staff/{staff_id}")
async def delete_staff(staff_id: int, db: AsyncSession = Depends(get_db)):
    """Elimina un empleado."""
    result = await db.execute(select(Staff).where(Staff.id == staff_id))
    existing_staff = result.scalar_one_or_none()
    
    if not existing_staff:
        raise HTTPException(status_code=404, detail="Empleado no encontrado")
        
    await db.delete(existing_staff)
    await db.commit()
    return {"status": "success", "message": "Empleado eliminado"}

@router.get("/clients")
async def list_clients(db: AsyncSession = Depends(get_db)):
    """Lista todos los clientes."""
    result = await db.execute(select(Client).order_by(Client.id))
    return result.scalars().all()

@router.post("/clients")
async def create_client(client: ClientCreate, db: AsyncSession = Depends(get_db)):
    """Crea un nuevo cliente."""
    new_client = Client(**client.model_dump())
    db.add(new_client)
    await db.commit()
    await db.refresh(new_client)
    return {"status": "success", "message": "Cliente creado correctamente", "client_id": new_client.id}

@router.put("/clients/{client_id}")
async def update_client(client_id: int, client_in: ClientUpdate, db: AsyncSession = Depends(get_db)):
    """Actualiza datos de un cliente."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    existing_client = result.scalar_one_or_none()
    
    if not existing_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    update_data = client_in.model_dump(exclude_unset=True)
    if update_data:
        stmt = update(Client).where(Client.id == client_id).values(**update_data).execution_options(synchronize_session="fetch")
        await db.execute(stmt)
        await db.commit()
    return {"status": "success", "message": "Cliente actualizado"}

@router.delete("/clients/{client_id}")
async def delete_client(client_id: int, db: AsyncSession = Depends(get_db)):
    """Elimina un cliente."""
    result = await db.execute(select(Client).where(Client.id == client_id))
    existing_client = result.scalar_one_or_none()
    
    if not existing_client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
    await db.delete(existing_client)
    await db.commit()
    return {"status": "success", "message": "Cliente eliminado"}


