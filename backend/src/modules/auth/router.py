from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from src.shared.database import get_db
from src.modules.auth.schemas import Token, UserResponse, UserLogin
from src.modules.auth.service import verify_password, create_access_token, get_user_by_email, ACCESS_TOKEN_EXPIRE_MINUTES
from src.modules.auth.dependencies import get_current_user

from src.modules.auth.dependencies import get_current_user
from src.modules.intelligence.models import User, Staff, Sale, Product
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=Token)
async def login_for_access_token(db: AsyncSession = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    # OAuth2PasswordRequestForm mapea el campo 'username' del form, por lo que usamos form_data.username
    user = await get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.get("/profile")
async def get_my_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Obtiene el perfil completo: Datos de Usuario + Datos de Empleado + Estadísticas de sus ventas.
    """
    # 1. Buscar datos de empleado vinculados por email
    staff_result = await db.execute(select(Staff).where(Staff.email == current_user.email))
    staff_data = staff_result.scalar_one_or_none()
    
    if not staff_data:
        return {
            "user": current_user,
            "staff": None,
            "stats": {"total_revenue": 0, "sales_count": 0, "goal_progress": 0},
            "sales": []
        }
        
    # 2. Consultar sus ventas (todas)
    sales_result = await db.execute(
        select(Sale)
        .options(selectinload(Sale.product))
        .where(Sale.seller_name == staff_data.name)
        .order_by(Sale.sale_date.desc())
    )
    all_sales = sales_result.scalars().all()
    
    # 3. Calcular métricas
    total_rev = sum(s.price_total for s in all_sales) or 0
    goal = staff_data.monthly_goal or 0
    progress = (total_rev / goal * 100) if goal > 0 else 0
    
    return {
        "user": {
            "email": current_user.email,
            "role": current_user.role
        },
        "staff": {
            "name": staff_data.name,
            "role": staff_data.role,
            "department": staff_data.department,
            "monthly_goal": staff_data.monthly_goal,
            "status": staff_data.status
        },
        "stats": {
            "total_revenue": round(total_rev, 2),
            "sales_count": len(all_sales),
            "goal_progress": round(progress, 2)
        },
        "sales": [
            {
                "id": s.id,
                "product": s.product.name if s.product else "Desconocido",
                "total": s.price_total,
                "date": s.sale_date.strftime("%Y-%m-%d"),
                "customer": s.customer_name
            } for s in all_sales
        ]
    }

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

@router.put("/change-password")
async def change_password(request: PasswordChangeRequest, current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    """
    Permite al usuario cambiar su propia contraseña verificando la anterior.
    """
    if not verify_password(request.old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")
    
    from src.modules.auth.service import get_password_hash
    current_user.hashed_password = get_password_hash(request.new_password)
    await db.commit()
    return {"status": "success", "message": "Contraseña actualizada correctamente"}
