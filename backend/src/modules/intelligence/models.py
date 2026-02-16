from sqlalchemy import Column, Integer, String, Text
from pgvector.sqlalchemy import Vector
from src.shared.database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    description = Column(Text)
    # Vector de 768 dimensiones (Estándar Gemini text-embedding-004)
    embedding = Column(Vector(768))
