from litellm import completion
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.modules.intelligence.service import EmbeddingService
from src.modules.intelligence.models import Product
import os

class ChatService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        # Se utilizara Gemini para generar las respuestas
        self.llm_model = os.getenv("LLM_MODEL", "gemini/gemini-1.5-flash")
        self.api_key = os.getenv("GEMINI_API_KEY")

    async def ask(self, question: str, db: AsyncSession):
        # Se convierte la pregunta en vector
        query_vector = await self.embedding_service.generate(question)

        # Se busca similitud semantica en la base de datos
        # El operador <-> mide la distancia (mientras menor sea, mas simillar son)

        stmt = select(Product).order_by(Product.embedding.l2_distance(query_vector)).limit(3)
        result = await db.execute(stmt)
        similar_products = result.scalars().all()

        # Se construye el contexto para la IA
        context_text = "\n\n".join([
            f"- {p.name}: {p.description}" for p in similar_products
        ])

        system_prompt = f"""
        Eres un asistente experto en marketing y ventas. Usa SOLAMENTE la siguiente informacion de contexto para responder a la pregunta del usuario. Si la respuesta no esta en el contexto, di "No poseo informacion sobre eso"

        Contexto:
        {context_text}
        """

        # Generar respuesta con gemini
        response = completion(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            api_key=self.api_key
        )

        return {
            "response": response['choices'][0]['message']['content'],
            "sources": [p.name for p in similar_products]
        }