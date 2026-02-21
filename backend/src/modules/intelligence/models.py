from sqlalchemy import Column, Integer, String, Text, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
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

class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    quantity = Column(Integer)
    price_total = Column(Float)
    sale_date = Column(DateTime, default=datetime.utcnow)
    category = Column(String) # Software / Hardware
    region = Column(String)
    customer_type = Column(String) # Corporate / Individual

    product = relationship("Product")
