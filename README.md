# **📘 Documentación: Sistema Inteligente, Automatización de Minería y Análisis de Datos.**

**Versión del Documento:** 2.0

**Estado:** Aprobado para Desarrollo

**Fecha:** Febrero 2026

## ---

**1\. Visión del Producto**

El sistema es una plataforma de inteligencia de negocios dual que cierra el ciclo entre la adquisición de datos y la acción comercial.

* **Ingesta:** Extracción automatizada de datos de compras mediante **Web Scraping** (n8n).  
* **Procesamiento:** Creación de perfiles de usuario y vectores de gustos mediante **Machine Learning**.  
* **Actores:**  
  1. **Agente Administrativo (B2B):** Asistente de IA para Marketing. Genera reportes (PDF/Excel), responde consultas SQL en lenguaje natural y sugiere estrategias.  
  2. **Agente Cliente (B2C):** Chatbot de recomendaciones personalizadas basadas en búsqueda semántica (vectores).

## ---

**2\. ⚠️ Matriz de Compatibilidad y Versiones (Estricto)**

**IMPORTANTE:** Para garantizar compatibilidad se utilizarán las siguientes versiones.

### **2.1 Backend (Python & IA)**

* **Python:** 3.11.x (Evitar 3.12 por compatibilidad con ciertas librerías de ML).  
* **FastAPI:** \>= 0.109.0 (Soporte nativo Pydantic v2).  
* **Pydantic:** \>= 2.6.0 (Obligatorio v2 para compatibilidad con LangChain moderno).  
* **LangChain:** \>= 0.1.0 (Versiones 0.0.x son obsoletas).  
* **SQLAlchemy:** \>= 2.0.25 (Sintaxis moderna asíncrona).

### **2.2 Infraestructura de Datos**

* **PostgreSQL:** Versión 16 (Requerido para índices HNSW rápidos en pgvector).  
* **pgvector:** \>= 0.5.0 (Preinstalado en imagen Docker pgvector/pgvector:pg16).  
* **n8n:** 1.x (Latest) (Ejecutado vía Docker).

### **2.3 Frontend (JavaScript & Build)**

* **Node.js:** 20.x LTS (Iron) (Requerido para Vite 5).  
* **Vite:** ^5.1.0 (Motor de construcción).  
* **React:** 18.2.0 (Estable).

## ---

**3\. Arquitectura del Sistema**

### **3.1 Backend: Arquitectura Hexagonal (Ports & Adapters)**

* **Dominio:** Entidades y reglas puras.  
* **Aplicación:** Casos de uso y orquestación.  
* **Infraestructura:** Adaptadores para BD, Webhooks n8n, y Clientes MCP/OpenAI.

### **3.2 Frontend: Feature-Sliced Design (FSD)**

Organización celular por valor de negocio, no por tipo técnico.

* **Capas:** app \-\> pages \-\> widgets \-\> features \-\> entities \-\> shared.  
* **Regla:** Las capas superiores solo pueden importar de las inferiores.

## ---

**4\. Stack Tecnológico Detallado**

| Área | Tecnología | Rol |
| :---- | :---- | :---- |
| **Backend** | **Python 3.11 \+ FastAPI** | API REST asíncrona de alto rendimiento. |
| **Frontend** | **React (JS) \+ Vite** | Interfaz de usuario reactiva y rápida. |
| **Base de Datos** | **PostgreSQL \+ pgvector** | Almacenamiento relacional y vectorial híbrido. |
| **Orquestación IA** | **LangChain (LangGraph)** | Gestión de estado y flujo de agentes. |
| **Conexión IA** | **LiteLLM \+ Instructor** | Abstracción de modelos y salida JSON estructurada. |
| **Protocolo IA** | **MCP (Model Context Protocol)** | Conexión segura entre LLM y Base de Datos local. |
| **Automatización** | **n8n (Docker)** | Web Scraping, ETL y tareas programadas. |
| **Ciencia de Datos** | **Pandas \+ Scikit-learn** | Limpieza de datos y Clustering de usuarios. |
| **Infraestructura** | **Docker Compose** | Contenerización de servicios (DB, n8n). |

## ---

**5\. Modelo de Datos Híbrido**

Diseñado para soportar datos "sucios" del scraping y datos "limpios" del negocio.

1. **raw\_scraped\_data (JSONB):** Almacén de llegada para datos crudos desde n8n.  
2. **products (SQL \+ Vector):** Catálogo normalizado con columna embedding para búsqueda semántica.  
3. **customer\_profiles (SQL \+ Vector):** Perfil del usuario, segmento de riesgo y vector de preferencias.  
4. **sales\_history (SQL):** Transacciones limpias para reportes financieros.

## ---

## 

## 

## 

## 

## 

## 

## **6\. Estructura de Archivos del Proyecto**

crm-intelligence-system/  
├── ops/                           \# INFRAESTRUCTURA (Docker)  
│   ├── docker-compose.yml         \# Levanta Postgres 16 y n8n  
│   └── pg\_init/                   \# Scripts SQL (Activar vector extension)  
│  
├── backend/                       \# API HEXAGONAL (Python)  
│   ├── src/  
│   │   ├── modules/               \# Bounded Contexts  
│   │   │   ├── data\_ingestion/    \# ETL & Scraping  
│   │   │   ├── intelligence/      \# Perfiles & Vectores  
│   │   │   └── interaction/       \# Chatbots & Reportes  
│   │   ├── shared/                \# Kernel compartido  
│   │   └── main.py                \# Entry point FastAPI  
│   ├── pyproject.toml             \# Dependencias Python  
│   └── alembic/                   \# Migraciones BD  
│  
└── frontend/                      \# UI CELULAR (React JS \+ Vite)  
    ├── src/  
    │   ├── app/                   \# Config Global  
    │   ├── pages/                 \# Vistas (Admin/Customer)  
    │   ├── widgets/               \# Bloques UI complejos  
    │   ├── features/              \# Lógica de negocio (Exportar, Filtrar)  
    │   ├── entities/              \# Modelos visuales  
    │   └── shared/                \# UI Kit  
    ├── vite.config.js             \# Config Proxy y Build  
    ├── jsconfig.json              \# Alias de rutas (@/)  
    └── package.json               \# Dependencias Node

## ---

**7\. Guía de Inicio Rápido (Developers)**

1. **Infraestructura:**  
   Bash  
   cd ops && docker-compose up \-d  \# Inicia BD y n8n

2. **Backend:**  
   Bash  
   cd backend  
   python \-m venv venv             \# Python 3.11  
   source venv/bin/activate  
   pip install \-e .                \# Instala dependencias de pyproject.toml  
   uvicorn src.main:app \--reload

3. **Frontend:**  
   Bash  
   cd frontend  
   npm install                     \# Node 20  
   npm run dev                     \# Inicia Vite