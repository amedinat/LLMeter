# Plan de Atribución Multi-Tenant (LLMeter)

## Objetivo
Permitir a usuarios de LLMeter rastrear y atribuir costos de LLM por cliente/tenant, habilitando facturación pass-through y visibilidad de uso por cliente.

---

## Fase MT-D: Ingestion API + DB Schema ✅
**Commit:** cf71439
**Alcance:**
- Tablas: `api_keys`, `customer_usage_records`, `customers` (con RLS)
- Endpoint POST `/api/ingest` autenticado por API key (SHA-256 hash)
- Validación con Zod, cálculo de costo basado en catálogo de precios
- Migración: `20260326_add_multi_tenant_ingestion.sql`

## Fase MT-A: API Key Management UI ✅
**Commit:** 2e93a2d
**Alcance:**
- CRUD de API keys desde Settings (generar, listar, revocar)
- API routes: GET/POST `/api/api-keys`, DELETE `/api/api-keys/[id]`
- Componente `ApiKeysSection` integrado en Settings page
- Key mostrada una sola vez al generarla (seguridad)

## Fase MT-B: Customer Attribution Dashboard ✅
**Commit:** b9fd666
**Alcance:**
- Nueva página `/customers` en el dashboard
- Vista de lista de clientes con uso agregado y costo total
- Drill-down por cliente: uso por modelo, por día, tendencia
- Filtros por rango de fechas
- Nav item "Customers" en sidebar (lucide: Users)

## Fase MT-C: Customer Management + SDK Docs ✅
**Commits:** 322eb05, 963dadd, 58c7132, 3e5ec70
**Alcance:**
- CRUD de customer metadata (display_name, metadata JSON)
- Página de documentación inline para el SDK/API de ingestion
- Snippet de código copiable (curl, Node.js, Python)
- Rate limiting en endpoint de ingestion

## Merge Final ✅
**Commit:** 12419a3
- Merge de main (MT-A, MT-B) + develop (MT-C) en develop
- Build verificado exitosamente
- Todas las fases multi-tenant completadas
