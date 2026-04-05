# **📘 Documentación:**

**Versión del Documento:** 4.0

**Estado:** Aprobado para Desarrollo (MVP CRM + IA)

**Fecha:** Abril 2026

---

**1\. Visión del Producto**

El sistema es una plataforma CRM Integral e Inteligente que unifica operaciones comerciales, facturación, recursos humanos, y analítica de datos potenciada por Inteligencia Artificial "Aware".

* **Core CRM:** Gestión completa de Clientes (Base unificada), Personal (Directorio y Metas de Vendedores), Inventario (Hardware, Software y Servicios) y Registro de Ventas.
* **Procesamiento AI:** Los objetos generados en el CRM (Productos, Reglas) generan automáticamente *embeddings* semánticos utilizando Machine Learning.
* **Actores de IA (RAG Automático):**  
  1. **Agente Administrativo (Tú):** Asistente interno. Conoce el catálogo, audita ventas históricas cruzando datos de empleados y clientes de forma inteligente para emitir diagnósticos y soportes rápidos.  
  2. **Agente Cliente Público:** Chatbot comercial B2C. Actúa como Ejecutivo de Atención al Cliente, leyendo solo productos marcados como 'publicos', ignorando reglas internas o facturaciones de la empresa para evitar filtraciones de información.

---

**2\. ⚠️ Matriz de Compatibilidad y Versiones (Estricto)**

**IMPORTANTE:** Para garantizar compatibilidad se utilizarán las siguientes versiones.

### **2.1 Backend (Python & IA)**

* **Python:** 3.11.x (Evitar 3.12 por compatibilidad con ciertas librerías de ML).  
* **FastAPI:** \>= 0.109.0 (Soporte nativo Pydantic v2).  
* **Pydantic:** \>= 2.6.0.  
* **SQLAlchemy:** \>= 2.0.25 (Sintaxis moderna asíncrona).

### **2.2 Infraestructura de Datos**

* **PostgreSQL:** Versión 16 (Requerido para índices HNSW rápidos en pgvector).  
* **pgvector:** \>= 0.5.0 (Preinstalado en imagen Docker pgvector/pgvector:pg16).  

### **2.3 Frontend (JavaScript & Build)**

* **Node.js:** 20.x LTS (Iron) (Requerido para Vite 5).  
* **Vite:** ^5.1.0 (Motor de construcción).  
* **React:** 18.2.0 (Estable).
* **Tailwind CSS:** Para diseño inmersivo y responsivo.

---

**3\. Arquitectura del Sistema**

### **3.1 Backend: Arquitectura Modular Limpia (Python)**

* **Dominio:** Entidades relacionales claras (`Sale`, `Product`, `Staff`, `Client`).  
* **Interacción IA:** Módulo "interaction" con oratoria heurística segmentando datos vía RAG usando LLM remotos gratuitos.

### **3.2 Frontend: React + Tailwind UI**

* **Estado Unificado:** Panel gerencial interconectado construido centralizadamente en `AdminDashboard.jsx`.
* **Reglas UI/UX:** Interfaz elegante (dark mode), selects predictivos interbloqueados (Cálculos de Totales e IVA Read-Only previniendo Fallos Operativos Capa 8).

---

**4\. Stack Tecnológico Detallado**

| Área | Tecnología | Rol |
| :---- | :---- | :---- |
| **Backend** | **Python 3.11 \+ FastAPI** | API REST asíncrona de alto rendimiento. |
| **Frontend** | **React (JS) \+ Tailwind CSS** | Interfaz de usuario rica, inmersiva y reactiva. |
| **Base de Datos** | **PostgreSQL \+ pgvector** | Almacenamiento relacional y vectorial híbrido. |
| **Conexión IA** | **LiteLLM / Groq API** | Abstracción de modelos LLM rápidos y precisos. |
| **Infraestructura** | **Docker Compose** | Contenerización de servicios (Solo BD) para agilidad de dev. |

---

**5\. Modelo de Datos Híbrido**

Diseñado para soportar CRM dinámico y semántica relacional:

1. **products (SQL \+ Vector):** Catálogo comercial interactivo (H/W, S/W, Svcs)  y reglas internas de la empresa con métricas vectoriales de coincidencia semántica.  
2. **clients (SQL):** Directorio corporativo con bloqueo automático de duplicados y métricas genéricas de contacto.
3. **staff (SQL):** Control de personal, departamentos y metas de facturación.
4. **sales (SQL):** Transacciones limpias vinculadas entre inventario, cliente y vendedor para cálculos analíticos al instante.

---

## **6\. Estructura de Archivos del Proyecto**

crm-intelligence-system/  
├── ops/                           \# INFRAESTRUCTURA (Docker)  
│   ├── compose.yml                \# Levanta Postgres 16 con PgVector  
│   └── pg\_init/                   \# Scripts de Autoconfiguración BD  
│  
├── backend/                       \# API (Python)  
│   ├── src/  
│   │   ├── modules/               \# Bounded Contexts  
│   │   │   ├── data\_ingestion/    \# Enpoints de inyección de CRM manual  
│   │   │   ├── intelligence/      \# Tablas Generales (Catálogos, Vectores)  
│   │   │   └── interaction/       \# Core de Generación LLM (Chatbots)  
│   │   └── main.py                \# Entry point FastAPI  
│   └── requirements.txt           \# Dependencias Python  
│  
└── frontend/                      \# UI (React JS \+ Vite)  
    ├── src/  
    │   ├── pages/                 \# Dashboard Gerencial Central  
    │   └── index.css              \# Variables y utilidades nativas de estilo  
    └── package.json               \# Dependencias Node

---

**7\. Estructura de commits:**

Estructura: *tipo(alcance): descripción breve*

1. Los Tipos (tipo)
- feat: Añadir funcionalidad.
- fix: Reparación de error/bug.
- docs: Documentación.
- style: Cambios de formato estético UI o código puro.
- refactor: Mejorar lógica interna/rediseños sin destruir features.
- chore: Tareas de servidor o limpieza.

---

**8\. Guía de Inicio Rápido (Developers)**

1. **Infraestructura:**  
   ```bash  
   cd ops && docker-compose up -d  # Inicia BD
   ```

2. **Backend:**  
   ```bash  
   cd backend  
   python -m venv venv  
   source venv/bin/activate  # O ./venv/Scripts/Activate en Windows
   pip install -r requirements.txt
   python -m uvicorn src.main:app --reload
   ```

3. **Frontend:**  
   ```bash  
   cd frontend  
   npm install  
   npm run dev
   ```

---

## **9. Consideraciones de Producción ⚠️**

### **9.1 Límites de la IA (Groq Free Tier)**
El sistema utiliza actualmente el modelo `llama-3.3-70b-versatile` a través de la capa gratuita de Groq.
*   **Límites actuales:** ~30 peticiones por minuto.
*   **Recomendación:** Considerar API Keys empresariales propias si el flujo CRM crece de manera exponencial o corporativa.

### **9.2 Privacidad de Datos y Control RAG**
* Los agentes validan agresivamente el permiso de lectura según el ROL (`Customer` vs `Admin`).
* Los productos nuevos creados desde cero protegen a la empresa inicializándose en estado `private`.
