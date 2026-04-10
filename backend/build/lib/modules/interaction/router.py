from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from src.shared.database import get_db
from src.modules.interaction.service import ChatService

router = APIRouter(prefix="/chat", tags=["Interaction"])

class ChatRequest(BaseModel):
    message: str
    role: str = "customer" # customer | admin

@router.post("")
async def chat_endpoint(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Endpoint para conversar con la IA usando datos del negocio (RAG).
    """
    service = ChatService()
    try:
        # Pasamos el rol al servicio
        resultado = await service.ask(request.message, db, role=request.role)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
