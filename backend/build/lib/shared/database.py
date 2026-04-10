from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from pydantic_settings import BaseSettings, SettingsConfigDict

# Configuracion de la base de datos (lee el archivo .env)
class Settings(BaseSettings):
    DATABASE_URL: str
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

settings = Settings()

# Crea motor de conexion de base de datos asincrono
engine = create_async_engine(
    settings.DATABASE_URL,
    echo=True # muestra el sql en la terminal
)

# Crea la fabrica de sesiones asincronas
SessionLocal = async_sessionmaker(bind=engine, expire_on_commit=False)

# Clase base para todos los modelos de base de datos
class Base(DeclarativeBase):
    pass

# Dependencia para FastAPI (para usar en los endpoints)
async def get_db():
    async with SessionLocal() as session:
        yield session