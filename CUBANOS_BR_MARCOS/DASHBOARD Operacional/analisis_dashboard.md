# Análisis Completo: Proyecto DASHBOARDOperacional

Este documento presenta un análisis arquitectónico y funcional profundo del proyecto **DASHBOARDOperacional** para la agencia migratoria "Cubanos BR".

## 1. Arquitectura General y Tecnologías

El proyecto es una **Single Page Application (SPA)** construida con las siguientes tecnologías:
- **Framework Core:** React 19 + Vite.
- **Enrutamiento:** Enrutamiento nativo basado en Hash (implementado en `App.jsx` escuchando eventos `hashchange`) en lugar de usar `react-router-dom`.
- **Estado y Caché:** `@tanstack/react-query` (v5) para gestión de estado del servidor y optimización de fetch, junto con Context API (`GlobalAiChatContext`, `ThemeContext`).
- **Base de Datos / Backend:** **Supabase** (PostgreSQL) usando `@supabase/supabase-js`.
- **Estilos:** CSS estándar con variables globales (`index.css` y `App.css`). No se utiliza TailwindCSS; el sistema de diseño depende de clases personalizadas y estilos en línea (`style={{...}}`) fuertemente inyectados en los componentes.
- **Inteligencia Artificial:** Integración profunda con la API de **Groq** usando modelos LLaMA 3 y LLaMA 4 Scout (visión).
- **Despliegue y Contenerización:** Orquestado con Docker (`Dockerfile` y `docker-compose.yml`) optimizado con límites de recursos de CPU (0.25 - 0.5) y Memoria (128M - 256M) y configuración para proxy Traefik y Nginx.

## 2. Estructura de Componentes Principales

La interfaz se divide conceptualmente en "Vistas" controladas desde el componente maestro `App.jsx`:

1. **`App.jsx`**: Actúa como el layout global de la aplicación (Sidebar + Topbar) y orquestador principal. Gestiona la autenticación con Supabase, el tema global (Light/Dark) y el estado de la vista (`currentView`: 'dashboard', 'clients', 'client').
2. **`HomeView.jsx`**: El panel general o "Dashboard" (Trámites).
3. **`ClientListView.jsx`**: Listado general de clientes. Incluye buscadores y paginación.
4. **`ClientView.jsx`**: El corazón del sistema operacional. Es un componente masivo (+2000 líneas) que consolida toda la información de un cliente individual:
   - **Información Personal:** Renderizado dinámicamente según configuración.
   - **Documentos (`ClientDocuments.jsx`):** Subida drag-and-drop con OCR automático.
   - **Relaciones (`ClientRelations.jsx`):** Vínculos entre perfiles familiares y herencia de datos/documentos.
   - **Generador PDF (`PDFGenerator.jsx`):** Creación de documentos usando `@react-pdf/renderer` y manipulación con `pdf-lib`.
5. **`GlobalAiChat.jsx`**: Un componente "Drawer" o FAB (Floating Action Button) persistente que provee asistencia IA continua al operario.

## 3. Integración de Inteligencia Artificial (IA)

La IA no es un simple chatbot, sino una herramienta de backoffice profundamente integrada en los flujos operativos, gestionada en `src/services/aiService.js`:

> [!TIP]
> **Optimización OCR Automática**
> Cuando un usuario sube un documento de identidad (PDF/Imagen) en `ClientView`, el sistema dispara automáticamente el modelo de visión (`meta-llama/llama-4-scout-17b-16e-instruct`) configurado en Groq para hacer OCR y extracción estructurada de datos (MRZ, nombres, fechas, documento).

- **Asistente Contextual (RAG):** El chat (`chatWithClientContext`) tiene acceso completo a:
  - Base de datos (Supabase): Información del cliente, trámites en curso.
  - CRM (`crmBridgeService.js`): Interacción con Kommo CRM y n8n para leer el historial de WhatsApp del cliente.
- **Agentic Tool Calling:** El chat global usa `chatWithTools` permitiendo a la IA ejecutar acciones en tiempo real como `searchClientsByName`, `countPendingProcedures` y `getOverallStats`.

## 4. Modelado de Datos y Entidades (Supabase)

El sistema utiliza un esquema flexible de datos (Entity-Attribute-Value - EAV):
- `clientes`: Tabla principal con columnas fijas (nombre, cpf, nacionalidad, etc.).
- `categorias_datos_operacionales` y `campos_datos_operacionales`: Definen la estructura dinámica (metadatos) para campos personalizados.
- `cliente_datos_operacionales`: Almacena los valores personalizados vinculados a un cliente.
- `relaciones_clientes`: Vincula perfiles (ej. padre-hijo, esposos).
- `documentos_operacionales`: Almacena metadatos y estados (pendiente/verificado) de los archivos alojados en Storage.
- `entradas`: Representan los Trámites o procedimientos migratorios asociados a un cliente.

## 5. Áreas de Oportunidad y Refactorización

> [!WARNING]
> **Deuda Técnica en `ClientView.jsx`**
> El componente `ClientView` asume una responsabilidad masiva gestionando fetching, subida de archivos, IA, modales, manipulación de fechas (toIsoDate/toSlashDate) y lógica de relacionamiento de contactos. Esto puede afectar el rendimiento y la mantenibilidad.

1. **Desacoplamiento Lógico:** Extraer la lógica de gestión de estados y peticiones complejas a **Custom Hooks** (ej. `useClientForms`, `useDocumentUpload`).
2. **Estilos en Línea:** Hay una gran saturación de `style={{...}}`. Mover esto a clases CSS en `index.css` o adoptar CSS Modules facilitaría la personalización y escalabilidad del modo oscuro.
3. **Manejo de Errores y Loading:** Centralizar estados de UI a través de `react-query` ya implementado, reduciendo `useStates` booleanos innecesarios (`isSaving`, `uploading`, `isDeleting`).
4. **React Router:** Migrar del enrutamiento basado en hash manual (`window.location.hash`) al estándar `react-router-dom` mejoraría la navegación profunda y el code-splitting.

## Resumen Ejecutivo

**DASHBOARDOperacional** es un sistema sólido, moderno y muy avanzado (particularmente por su integración nativa de agentes de IA y procesamiento de visión documental en tiempo real). El enfoque en una SPA estática con llamadas seguras y rápidas lo hace altamente performante, aunque a nivel de código fuente requiere un cuidado especial en la fragmentación de componentes monolíticos (como `ClientView`) para asegurar su longevidad técnica.
