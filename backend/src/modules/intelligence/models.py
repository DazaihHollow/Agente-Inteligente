from sqlalchemy import Column, Integer, String, Text
from pgvector.sqlalchemy import Vector
from src.shared.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    # Vector de 384 dimensiones (Estándar all-MiniLM-L6-v2)
    embedding = Column(Vector(384))
    
    # Control de Acceso: 'public' (Clientes) vs 'private' (Admin)
    access_level = Column(String, default='private')
