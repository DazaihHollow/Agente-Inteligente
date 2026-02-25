import pandas as pd
from fpdf import FPDF
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract
from src.modules.intelligence.models import Product, Sale
from io import BytesIO
import litellm
import os
import json

class ReportService:
    async def get_stats(self, db: AsyncSession):
        """
        Obtiene estadísticas generales del inventario.
        """
        # Total Productos
        total_query = select(func.count(Product.id))
        total_result = await db.execute(total_query)
        total_products = total_result.scalar()

        # Productos Públicos vs Privados
        public_query = select(func.count(Product.id)).where(Product.access_level == 'public')
        public_result = await db.execute(public_query)
        public_products = public_result.scalar()
        
        private_products = total_products - public_products

        return {
            "total_products": total_products,
            "public_products": public_products,
            "private_products": private_products
        }

    async def generate_excel(self, db: AsyncSession) -> BytesIO:
        """
        Genera un archivo Excel con todos los productos.
        """
        query = select(Product)
        result = await db.execute(query)
        products = result.scalars().all()

        # Convertir a DataFrame
        data = []
        for p in products:
            data.append({
                "ID": p.id,
                "Nombre": p.name,
                "Descripción": p.description,
                "Nivel Acceso": p.access_level
            })
        
        df = pd.DataFrame(data)
        
        # Guardar en buffer
        output = BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name="Inventario")
        
        output.seek(0)
        return output

    async def generate_pdf(self, db: AsyncSession) -> BytesIO:
        """
        Genera un reporte PDF simple.
        """
        stats = await self.get_stats(db)
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", size=16)
        
        pdf.cell(0, 10, txt="Reporte de Inventario - Agente Inteligente", ln=True, align="C")
        pdf.ln(10)
        
        pdf.set_font("helvetica", size=12)
        pdf.cell(0, 10, txt=f"Total Productos: {stats['total_products']}", ln=True)
        pdf.cell(0, 10, txt=f"Públicos: {stats['public_products']}", ln=True)
        pdf.cell(0, 10, txt=f"Privados: {stats['private_products']}", ln=True)
        
        # Listado de productos (Limitado a 50)
        pdf.ln(10)
        pdf.set_font("helvetica", "B", 14)
        pdf.cell(0, 10, txt="Últimos Productos Registrados:", ln=True)
        
        pdf.set_font("helvetica", size=10)
        query = select(Product).limit(50).order_by(Product.id.desc())
        result = await db.execute(query)
        products = result.scalars().all()
        
        for p in products:
            # Clean text to avoid latin-1 errors in basic fpdf
            name = p.name.encode('latin-1', 'replace').decode('latin-1')
            access = p.access_level
            pdf.cell(0, 8, txt=f"- {name} [{access}]", ln=True)

        # Output to buffer
        pdf_output = pdf.output() # returns bytes in fpdf2
        return BytesIO(pdf_output)

    async def list_customers(self, db: AsyncSession):
        """
        Lista todos los nombres de clientes únicos que existen en las ventas.
        """
        query = select(func.distinct(Sale.customer_name)).order_by(Sale.customer_name)
        result = await db.execute(query)
        return [row[0] for row in result.all() if row[0]]

    async def get_sales_stats(self, db: AsyncSession, month: int = None, year: int = None, customer_name: str = None):
        """
        Obtiene estadísticas de ventas filtradas por mes, año y/o cliente.
        Si month es None o 0, se considera el año completo.
        """
        query = select(
            func.sum(Sale.price_total).label("total_profit"),
            func.sum(Sale.quantity).label("total_sold"),
            func.count(func.distinct(Sale.customer_name)).label("total_clients")
        )
        
        # Filtrado por año (obligatorio si se provee)
        if year:
            query = query.where(extract('year', Sale.sale_date) == year)
            
        # Filtrado por mes (opcional, 0 o None significa 'todo el año')
        if month and month > 0:
            query = query.where(extract('month', Sale.sale_date) == month)

        # Filtrado por cliente
        if customer_name and customer_name != "Todos":
            query = query.where(Sale.customer_name == customer_name)
            
        result = await db.execute(query)
        stats = result.fetchone()
        
        # Breakdown by category
        cat_query = select(
            Sale.category,
            func.sum(Sale.price_total).label("total")
        ).group_by(Sale.category)
        
        if year:
            cat_query = cat_query.where(extract('year', Sale.sale_date) == year)
        if month and month > 0:
            cat_query = cat_query.where(extract('month', Sale.sale_date) == month)
        if customer_name and customer_name != "Todos":
            cat_query = cat_query.where(Sale.customer_name == customer_name)
            
        cat_result = await db.execute(cat_query)
        breakdown = [{"category": row.category, "total": row.total} for row in cat_result]

        # Breakdown by Seller and Category (Software vs Hardware)
        seller_query = select(
            Sale.seller_name,
            Sale.category,
            func.sum(Sale.price_total).label("total")
        ).group_by(Sale.seller_name, Sale.category)
        
        if year:
            seller_query = seller_query.where(extract('year', Sale.sale_date) == year)
        if month and month > 0:
            seller_query = seller_query.where(extract('month', Sale.sale_date) == month)
        if customer_name and customer_name != "Todos":
            seller_query = seller_query.where(Sale.customer_name == customer_name)

        seller_result = await db.execute(seller_query)
        
        # Agrupar por vendedor en el formato deseado
        sellers_map = {}
        for row in seller_result:
            s_name = row.seller_name or "Sin Asignar"
            if s_name not in sellers_map:
                sellers_map[s_name] = {"name": s_name, "software": 0, "hardware": 0, "total": 0}
            
            cat_lower = row.category.lower()
            if "software" in cat_lower:
                sellers_map[s_name]["software"] += row.total
            elif "hardware" in cat_lower:
                sellers_map[s_name]["hardware"] += row.total
            
            sellers_map[s_name]["total"] += row.total

        seller_stats = list(sellers_map.values())
        seller_stats.sort(key=lambda x: x["total"], reverse=True)

        return {
            "total_profit": stats.total_profit or 0,
            "total_sold": stats.total_sold or 0,
            "total_clients": stats.total_clients or 0,
            "breakdown": breakdown,
            "seller_stats": seller_stats
        }

    async def get_custom_dashboard_data(self, db: AsyncSession, prompt: str):
        """
        Usa IA para generar datos de dashboard personalizados basados en una pregunta.
        """
        system_prompt = """
        Eres un experto en análisis de datos comerciales. Tu tarea es traducir una pregunta del usuario en parámetros de agrupación y filtrado para una base de datos de ventas.
        La tabla 'sales' tiene las siguientes columnas: 
        - category (Software, Hardware, Servicios)
        - region (Norte, Sur, Centro, Este, Oeste)
        - customer_type (Corporativo, Individual, Gobierno)
        - price_total (float)
        - quantity (int)
        
        Debes responder ÚNICAMENTE con un objeto JSON con el siguiente formato:
        {
            "title": "Título descriptivo y profesional del dashboard",
            "chart_type": "bar" o "pie",
            "group_by": "category" o "region" o "customer_type",
            "filters": {
                "category": "valor exacto" (opcional),
                "region": "valor exacto" (opcional),
                "customer_type": "valor exacto" (opcional)
            }
        }
        Ejemplo: Si preguntan "Ventas de software por región", respondes group_by: "region" y filters: {"category": "Software"}.
        """
        
        try:
            response = await litellm.acompletion(
                model="groq/llama-3.3-70b-versatile",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Usuario pregunta: {prompt}"}
                ],
                api_key=os.getenv("GROQ_API_KEY"),
                response_format={ "type": "json_object" }
            )
            
            plan = json.loads(response.choices[0].message.content)
            
            # Base Query for Chart
            group_col = getattr(Sale, plan.get("group_by", "category"))
            query = select(
                group_col.label("name"),
                func.sum(Sale.price_total).label("value")
            ).group_by(group_col)
            
            # Base Query for KPIs
            kpi_query = select(
                func.sum(Sale.price_total).label("total_profit"),
                func.sum(Sale.quantity).label("total_sold"),
                func.avg(Sale.price_total).label("avg_ticket")
            )
            
            if "filters" in plan:
                for key, value in plan["filters"].items():
                    if value and hasattr(Sale, key):
                        query = query.where(getattr(Sale, key) == value)
                        kpi_query = kpi_query.where(getattr(Sale, key) == value)
            
            # Execute Chart Data
            result = await db.execute(query)
            data = [{"name": str(row.name), "value": float(row.value)} for row in result]
            
            # Execute KPI Data
            kpi_result = await db.execute(kpi_query)
            kpi_row = kpi_result.fetchone()
            
            return {
                "title": plan.get("title", "Dashboard Personalizado"),
                "chart_type": plan.get("chart_type", "bar"),
                "kpis": {
                    "total_profit": float(kpi_row.total_profit or 0),
                    "total_sold": int(kpi_row.total_sold or 0),
                    "avg_ticket": float(kpi_row.avg_ticket or 0)
                },
                "data": data
            }
        except Exception as e:
            print(f"Error en Custom Dashboard IA: {e}")
            return {
                "title": "Error al generar dashboard",
                "chart_type": "bar",
                "kpis": {"total_profit": 0, "total_sold": 0, "avg_ticket": 0},
                "data": [],
                "error": str(e)
            }

    async def export_custom_data(self, title: str, data: list, format: str) -> BytesIO:
        """
        Exporta datos personalizados recibidos del frontend en PDF o Excel.
        """
        df = pd.DataFrame(data)
        
        if format == 'excel':
            output = BytesIO()
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name="Data Personalizada")
            output.seek(0)
            return output
        else: # PDF
            pdf = FPDF()
            pdf.add_page()
            pdf.set_font("helvetica", "B", 16)
            pdf.cell(0, 10, txt=title, ln=True, align="C")
            pdf.ln(10)
            
            pdf.set_font("helvetica", "B", 12)
            # Headers
            if data:
                cols = list(data[0].keys())
                for col in cols:
                    pdf.cell(40, 10, txt=col.capitalize(), border=1)
                pdf.ln()
                
                pdf.set_font("helvetica", size=10)
                for item in data:
                    for col in cols:
                        val = str(item.get(col, ""))
                        pdf.cell(40, 8, txt=val, border=1)
                    pdf.ln()
            
            pdf_output = pdf.output()
            return BytesIO(pdf_output)
