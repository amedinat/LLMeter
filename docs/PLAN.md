# LLMeter — Plan de Ejecución Paralelo

Este plan está diseñado para que **múltiples agentes de desarrollo** (humanos o IA) puedan trabajar en paralelo minimizando conflictos de merge y dependencias bloqueantes.

---

## Estrategia de Paralelización

El proyecto se divide en 4 "Tracks" independientes. Cada track tiene un owner (agente) y responsabilidades claras.

### 🛤️ Track 1: Core & Foundation (Bloqueante inicial)
*Responsable de la infraestructura base, auth y layout.*
1. **Setup Inicial**: Next.js, Tailwind, Supabase client, Shadcn (Ya scaffolded).
2. **Auth Flow**: Login page, Providers login, RLS base en DB.
3. **App Shell**: Sidebar, Header, Navegación móvil.
4. **CI/CD**: GitHub Actions para lint/test.

### 🛤️ Track 2: Ingestion Engine (Backend Heavy)
*Responsable de traer los datos. Puede trabajar casi 100% en `src/lib`, `src/app/api` y `supabase/`.*
1. **DB Schema**: Definir tablas SQL finales.
2. **Encryption Module**: Crear `lib/crypto.ts`.
3. **Provider Connect API**: Endpoint para validar y guardar keys.
4. **Inngest Polling**: Jobs para OpenAI y Anthropic.

### 🛤️ Track 3: Dashboard UI (Frontend Heavy)
*Responsable de visualizar datos. Puede trabajar con datos mockeados (fixtures) mientras Track 2 termina.*
1. **Mock Data**: Crear `lib/fixtures.ts` con datos de uso falsos realistas.
2. **Components**: StatsCard, LineChart, UsageTable.
3. **Dashboard Page**: Ensamblar componentes en `/dashboard`.
4. **Alerts UI**: Interfaz para crear/listar alertas.

### 🛤️ Track 4: Marketing & Monetization
*Responsable de la cara pública y conversión.*
1. **Landing Page**: Copywriting y diseño en `/page.tsx`.
2. **Stripe Integration**: Configurar productos y webhook handler.
3. **Legal**: Términos y Privacidad.

---

## Dependencias Críticas

1. **Track 1 (Auth)** bloquea el acceso real a la app, pero Track 3 puede avanzar en rutas públicas o con hardcoded user.
2. **Track 2 (Ingestion)** es necesario para ver datos reales en Track 3.
   - *Solución:* Track 3 usa Mocks estrictos definidos en TypeScript interfaces compartidas.

---

## Flujo de Trabajo Sugerido

1. **Día 1 (Setup):**
   - Agente A: Configura Supabase Auth y Tablas base (Track 1 & 2).
   - Agente B: Crea componentes UI base (Button, Card, Input) y Layout (Track 1).

2. **Día 2 (Core Features):**
   - Agente A: Implementa Inngest Jobs y API de OpenAI (Track 2).
   - Agente B: Construye Dashboard con datos mock (Track 3).

3. **Día 3 (Integration):**
   - Agente A: Conecta Dashboard (B) con API real (A).
   - Agente B: Implementa Landing Page y Stripe (Track 4).

---

## Definición de Hecho (DoD) para un Task
- Código implementado y linted (`just lint`).
- Tipos TypeScript estrictos (no `any`).
- Si es backend: Endpoint probado con `curl` o Postman.
- Si es frontend: Componente responsive y accesible.
