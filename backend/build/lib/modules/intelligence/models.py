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
    
    # Datos de Inventario
    price = Column(Float, default=0.0)
    stock = Column(Integer, default=0)
    category = Column(String, nullable=True) # Hardware, Software, Servicios
    
    # Fine-Tuning de IA
    agent_instruction = Column(Text, nullable=True)

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
    customer_name = Column(String) # Nombre del cliente (para métricas netas)
    seller_name = Column(String) # Nombre del vendedor
    payment_method = Column(String, nullable=True) # Cash, Card, Transfer, etc.

    product = relationship("Product")

class Staff(Base):
    __tablename__ = "staff"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    role = Column(String) # Ej: Ejecutivo de Ventas, Gerente
    email = Column(String, unique=True, index=True)
    department = Column(String) # Ej: Ventas, Operaciones
    status = Column(String, default='Activo')
    monthly_goal = Column(Float, default=0.0)

class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    contact_email = Column(String, unique=True, index=True)
    phone = Column(String)
    customer_type = Column(String)
    industry = Column(String)
    status = Column(String, default='Prospecto')
    acquisition_channel = Column(String)
