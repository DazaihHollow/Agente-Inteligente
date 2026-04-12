from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from src.shared.database import get_db
from src.modules.interaction.service import ChatService

router = APIRouter(prefix="/chat", tags=["Interaction"])

class ChatRequest(BaseModel):
    message: str
    role: str = "customer"

@router.post("")
async def ask_agent(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    """
    Endpoint para conversar con la IA usando datos del negocio (RAG).
    """
    service = ChatService()
    try:
        resultado = await service.ask(request.message, db, role=request.role)
        return resultado
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
