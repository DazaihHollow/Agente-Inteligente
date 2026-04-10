from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from pydantic import BaseModel
from src.shared.database import get_db
from src.modules.reports.service import ReportService
from io import BytesIO

class CustomDashboardRequest(BaseModel):
    prompt: str

class ExportCustomRequest(BaseModel):
    title: str
    data: list
    format: str # 'pdf' | 'excel'

router = APIRouter(prefix="/reports", tags=["Reports"])

report_service = ReportService()

@router.get("/stats")
async def get_stats(db: AsyncSession = Depends(get_db)):
    """
    Obtiene estadísticas generales del inventario.
    """
    return await report_service.get_stats(db)

@router.get("/sales")
async def get_sales_stats(
    month: Optional[int] = Query(0, ge=0, le=12),
    year: Optional[int] = Query(None, ge=2000),
    customer_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    """
    Obtiene estadísticas de ventas filtradas por mes/año/cliente.
    """
    return await report_service.get_sales_stats(db, month, year, customer_name)

@router.get("/customers")
async def list_customers(db: AsyncSession = Depends(get_db)):
    """
    Obtiene la lista de nombres de clientes únicos.
    """
    return await report_service.list_customers(db)

@router.post("/custom")
async def get_custom_dashboard(
    request: CustomDashboardRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Genera un dashboard dinámico mediante IA basado en una progunta.
    """
    return await report_service.get_custom_dashboard_data(db, request.prompt)

@router.post("/export-custom")
async def export_custom_dashboard(request: ExportCustomRequest):
    """
    Exporta datos personalizados recibidos en formato PDF o Excel.
    """
    buffer = await report_service.export_custom_data(request.title, request.data, request.format)
    
    filename = f"custom_export.{'xlsx' if request.format == 'excel' else 'pdf'}"
    media_type = "application/pdf" if request.format == 'pdf' else "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    
    headers = {
        'Content-Disposition': f'attachment; filename="{filename}"'
    }
    
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type=media_type,
        headers=headers
    )

@router.get("/excel")
async def download_excel(db: AsyncSession = Depends(get_db)):
    """
    Descarga el inventario completo en formato Excel (.xlsx).
    """
    excel_buffer = await report_service.generate_excel(db)
    
    headers = {
        'Content-Disposition': 'attachment; filename="inventario.xlsx"'
    }
    
    return StreamingResponse(
        iter([excel_buffer.getvalue()]),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers=headers
    )

@router.get("/pdf")
async def download_pdf(db: AsyncSession = Depends(get_db)):
    """
    Descarga un reporte resumen en formato PDF.
    """
    # Note: ReportService.generate_pdf needs to return BytesIO or bytes
    pdf_buffer = await report_service.generate_pdf(db) # This might need adjustment based on implementation
    
    # fpdf2 output() returns bytearray, so wrapped in BytesIO in service.
    
    headers = {
        'Content-Disposition': 'attachment; filename="reporte_inventario.pdf"'
    }
    
    return StreamingResponse(
        iter([pdf_buffer.getvalue()]), # bytes
        media_type="application/pdf",
        headers=headers
    )
