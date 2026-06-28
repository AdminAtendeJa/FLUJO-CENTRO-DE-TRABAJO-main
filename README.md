# FLUJO-CENTRO-DE-TRABAJO

Plataforma integral de gestión migratoria para Cubanos BR.

## Estructura

```
CUBANOS_BR_MARCOS/
├── DASHBOARDOperacional/   ← App React (Vite) — Dashboard operacional
├── DASHBOARDFinanciero/    ← App Vanilla JS — Dashboard financiero
├── chrome-extension/       ← Extensión Chrome MV3 para autocompletar formularios
├── TABLAS/                 ← Scripts de migración de datos
└── workflow/               ← Workflows de automatización n8n
```

## Setup — Dashboard Operacional

```bash
cd CUBANOS_BR_MARCOS/DASHBOARDOperacional
cp .env.example .env          # Configurar credenciales Supabase + Groq
npm install
npm run dev                   # http://localhost:5173
```

**Variables requeridas:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`  
**Opcionales:** `VITE_GROQ_API_KEY`, `VITE_N8N_WEBHOOK_URL`, `VITE_KOMMO_WEBHOOK_URL`

## Setup — Dashboard Financiero

```bash
cd CUBANOS_BR_MARCOS/DASHBOARDFinanciero
# Crear config.js a partir de config.template.js con tus credenciales Supabase
# Servir con cualquier servidor estático:
npx -y serve .                # http://localhost:3000
```

**Alternativa Docker:**
```bash
docker-compose up
```

## Stack Tecnológico

| Componente | Stack |
|-----------|-------|
| Dashboard Operacional | React 19 + Vite 8 + Supabase + Groq API |
| Dashboard Financiero | Vanilla JS + Chart.js + Supabase CDN |
| Extensión Chrome | Manifest V3 |
| Base de datos | Supabase (PostgreSQL) |
| Deploy | Docker + Nginx |
