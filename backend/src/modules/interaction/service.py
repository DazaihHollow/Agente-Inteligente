from litellm import completion
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from src.modules.intelligence.service import EmbeddingService
from src.modules.intelligence.models import Product, Sale
from sqlalchemy.orm import selectinload
import os

class ChatService:
    def __init__(self):
        self.embedding_service = EmbeddingService()
        # Se utilizara Groq (Llama 3.3) para generar las respuestas (Gratis y Rapido)
        # Actualizado porque llama3-8b-8192 fue decomisado
        self.llm_model = os.getenv("LLM_MODEL", "groq/llama-3.3-70b-versatile")
        self.api_key = os.getenv("GROQ_API_KEY")

    async def ask(self, question: str, db: AsyncSession, role: str = "customer"):
        # Se convierte la pregunta en vector
        query_vector = await self.embedding_service.generate(question)

        # Se busca similitud semantica en la base de datos
        # El operador <-> mide la distancia (mientras menor sea, mas simillar son)

        # Usamos l2_distance de pgvector.
        query = select(Product).order_by(Product.embedding.l2_distance(query_vector)).limit(3)
        
        # Filtro de Seguridad (RBAC)
        if role == "customer":
            query = query.filter(Product.access_level == "public")
            
        stmt = query
        result = await db.execute(stmt)
        similar_products = result.scalars().all()

        # --- BUSQUEDA DE VENTAS (HISTORIAL COMPRAS) ---
        # Intentamos detectar si se menciona a un cliente en la pregunta
        # Para esto, primero obtenemos todos los nombres de clientes unicos para comparar
        cust_stmt = select(func.distinct(Sale.customer_name))
        cust_res = await db.execute(cust_stmt)
        all_customers = [r[0] for r in cust_res.all() if r[0]]

        sales_context = ""
        mentioned_customers = []
        
        # Heurística de detección más flexible:
        for c in all_customers:
            c_lower = c.lower()
            q_lower = question.lower()
            
            # 1. Coincidencia directa
            if c_lower in q_lower:
                mentioned_customers.append(c)
                continue
            
            # 2. Partes del cliente en la pregunta (ej: "Alpha" en "Alpha Systems")
            # Solo consideramos palabras de más de 3 letras para evitar falsos positivos
            c_words = [w for w in c_lower.replace(".", "").split() if len(w) > 3]
            if any(w in q_lower for w in c_words):
                mentioned_customers.append(c)

        if mentioned_customers:
            sales_stmt = select(Sale).options(selectinload(Sale.product)).where(
                Sale.customer_name.in_(mentioned_customers)
            ).order_by(Sale.sale_date.desc()).limit(10)
            
            sales_res = await db.execute(sales_stmt)
            customer_sales = sales_res.scalars().all()
            
            if customer_sales:
                sales_context = "\nHistorial de Ventas Relevantes:\n"
                for s in customer_sales:
                    prod_name = s.product.name if s.product else "Producto Desconocido"
                    sales_context += f"- Cliente: {s.customer_name} compró {s.quantity}x {prod_name} por ${s.price_total} el {s.sale_date.strftime('%Y-%m-%d')}\n"

        # Se construye el contexto para la IA
        context_text = "\nInformacion de Productos:\n" + "\n".join([
            f"- {p.name}: {p.description}" for p in similar_products
        ])
        
        if sales_context:
            context_text += "\n" + sales_context

        system_prompt = f"""
        Eres un asistente experto en marketing y ventas. 
        Usa la información de contexto proporcionada para responder a las preguntas de manera útil y precisa.
        
        REGLAS:
        1. Si la pregunta es sobre compras de clientes, consulta la sección 'Historial de Ventas Relevantes'. Tómate la libertad de relacionar nombres similares (ej: 'Alpha System' es lo mismo que 'Alpha Systems').
        2. Si la información solicitada está en el contexto, responde detalladamente.
        3. Si la respuesta REALMENTE no está en el contexto, di cordialmente que no posees esa información específica.
        4. No inventes datos fuera del contexto.

        Contexto:
        {context_text}
        """

        # Generar respuesta con LLM (Groq)
        response = completion(
            model=self.llm_model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            api_key=self.api_key
        )

        return {
            "response": response['choices'][0]['message']['content']
        }