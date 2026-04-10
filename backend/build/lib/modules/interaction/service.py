from litellm import completion
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from src.modules.intelligence.service import EmbeddingService
from src.modules.intelligence.models import Product, Sale, Staff, Client
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

        sales_context = ""
        crm_context = ""
        mentioned_customers = set()
        mentioned_sellers = set()
        
        q_lower = question.lower()

        # --- BUSQUEDA CONTEXTUAL AVANZADA (ADMIN) ---
        if role == "admin":
            # 1. Analizar Clientes
            clients_stmt = select(Client)
            clients_res = await db.execute(clients_stmt)
            all_clients = clients_res.scalars().all()
            
            relevant_clients = []
            for c in all_clients:
                c_name = c.name.lower()
                c_words = [w for w in c_name.replace(".", "").split() if len(w) > 3]
                
                # Coincidencia directa o parcial del nombre del cliente
                if c_name in q_lower or any(w in q_lower for w in c_words):
                    relevant_clients.append(c)
                    mentioned_customers.add(c.name)
            
            # Si el usuario pide "todos los clientes" o usa palabras clave
            if any(k in q_lower for k in ["cliente", "empresa", "comprador", "prospecto"]) and not relevant_clients:
                relevant_clients = all_clients[:10] # Top 10 por defecTo
            
            if relevant_clients:
                crm_context += "\n[Base de Datos de Clientes]:\n"
                for c in relevant_clients:
                    crm_context += f"- Cliente: {c.name} | Email: {c.contact_email} | Tel: {c.phone} | Industria: {c.industry} | Estado: {c.status} | Tipo: {c.customer_type}\n"

            # 2. Analizar Personal (Staff)
            staff_stmt = select(Staff)
            staff_res = await db.execute(staff_stmt)
            all_staff = staff_res.scalars().all()
            
            relevant_staff = []
            for s in all_staff:
                s_name = s.name.lower()
                s_words = [w for w in s_name.split() if len(w) > 3]
                
                if s_name in q_lower or any(w in q_lower for w in s_words):
                    relevant_staff.append(s)
                    mentioned_sellers.add(s.name)
            
            if any(k in q_lower for k in ["empleado", "vendedor", "staff", "personal", "equipo", "meta"]) and not relevant_staff:
                relevant_staff = all_staff[:10]
            
            if relevant_staff:
                crm_context += "\n[Base de Datos de Personal]:\n"
                for s in relevant_staff:
                    crm_context += f"- Personal: {s.name} | Rol: {s.role} | Depto: {s.department} | Email: {s.email} | Estado: {s.status} | Meta Mensual: ${s.monthly_goal}\n"

            # 3. Analizar Ventas Históricas
            # Filtramos si mencionaron a un cliente, a un vendedor, o palabras sobre compras
            needs_sales = bool(mentioned_customers or mentioned_sellers) or any(k in q_lower for k in ["venta", "vendido", "compr", "historial", "factur"])
            
            if needs_sales:
                sales_query = select(Sale).options(selectinload(Sale.product)).order_by(Sale.sale_date.desc())
                
                if mentioned_customers and not mentioned_sellers:
                    sales_query = sales_query.where(Sale.customer_name.in_(list(mentioned_customers)))
                elif mentioned_sellers and not mentioned_customers:
                    sales_query = sales_query.where(Sale.seller_name.in_(list(mentioned_sellers)))
                elif mentioned_customers and mentioned_sellers:
                    sales_query = sales_query.where(
                        or_(
                            Sale.customer_name.in_(list(mentioned_customers)),
                            Sale.seller_name.in_(list(mentioned_sellers))
                        )
                    )
                
                sales_query = sales_query.limit(10)
                sales_res = await db.execute(sales_query)
                customer_sales = sales_res.scalars().all()
                
                if customer_sales:
                    sales_context = "\n[Historial de Ventas Relevantes (Últimas 10)]:\n"
                    for s in customer_sales:
                        prod_name = s.product.name if s.product else (s.category or "Desconocido")
                        sales_context += f"- Venta #{s.id}: {s.customer_name} compró {s.quantity}x {prod_name} por ${s.price_total} el {s.sale_date.strftime('%Y-%m-%d')}. Vendedor: {s.seller_name} ({s.payment_method})\n"

        # Se construye el contexto para la IA
        context_text = "\n[Catálogo y Conocimiento (RAG)]:\n" + "\n".join([
            f"- {p.name} [{p.category or 'General'}]: {p.description} (Precio Base: ${p.price})" + (f" [INSTRUCCIÓN INTERNA: {p.agent_instruction}]" if p.agent_instruction and role == "admin" else "")
            for p in similar_products
        ])
        
        if role == "admin":
            context_text += crm_context + sales_context

        # Modificación de Prompt según Rol
        if role == "admin":
            system_prompt = f"""
            Eres el Asistente Administrativo Inteligente de este CRM.
            Tienes acceso total al Catálogo, Historial de Ventas, Directorio de Clientes y Personal.
            
            REGLAS:
            1. Cruza la información si te piden métricas o detalles de personas. No inventes datos.
            2. Si la respuesta REALMENTE no está en el contexto, indica cordialmente que no tienes esos registros específicos.
            3. Responde de forma ejecutiva, proactiva y segura.
            
            Contexto:
            {context_text}
            """
        else:
            system_prompt = f"""
            Eres el Asistente de Atención al Cliente de la empresa.
            Tu labor es responder dudas sobre nuestros productos o políticas guiándote estrictamente por el conocimiento documentado.
            
            REGLAS:
            1. Mantén un tono amigable, persuasivo y muy profesional. Responde dudas comerciales.
            2. No hables de precios si no están en el contexto. No inventes productos.
            3. Si preguntan algo que no puedes responder con el contexto dado, sugiereles contactar directamente a un asesor de ventas.
            
            Contexto Disponible:
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