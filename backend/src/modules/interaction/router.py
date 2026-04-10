from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from src.shared.database import get_db
from src.modules.interaction.service import ChatService
from src.modules.auth.dependencies import get_current_user
from src.modules.intelligence.models import User

router = APIRouter(prefix="/chat", tags=["Interaction"])

class ChatRequest(BaseModel):
    message: str

@router.post("/")
async def ask_agent(request: ChatRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    """
    Endpoint para conversar con la IA usando datos del negocio (RAG).
    """
    service = ChatService()
    try:
        # Pasamos el rol basado en el token del JWT autenticado, garantizando seguridad estricta
        resultado = await service.ask(request.message, db, role=current_user.role)
        return resultado
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
