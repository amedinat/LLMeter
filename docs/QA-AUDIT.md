# LLMeter — QA Audit Report
Date: 2026-02-18

## Summary
**Overall Score: B-** — Buen scaffolding con tipado TypeScript sólido y estructura modular. Sin embargo, hay issues funcionales importantes: rutas duplicadas, funcionalidad TODO sin implementar, falta de tests, y varios edge cases sin manejar. El proyecto necesita trabajo antes de ser deployable.

---

## Critical Issues (must fix before release)

### C1. Rutas de Auth Callback Duplicadas
- **Archivos:** `src/app/auth/callback/route.ts` y `src/app/(auth)/callback/route.ts`
- **Problema:** Existen DOS handlers de callback con lógica ligeramente diferente. El de `app/auth/` tiene manejo de `x-forwarded-host` para load balancers; el de `app/(auth)/` es más simple. Esto puede causar comportamiento impredecible dependiendo de la URL de redirect configurada en Supabase.
- **Fix:** Eliminar uno. Mantener el de `app/auth/callback/route.ts` (más completo) y eliminar `app/(auth)/callback/route.ts`.

### C2. Inngest Client ID Desactualizado
- **Archivo:** `src/lib/inngest/client.ts:4`
- **Problema:** `id: 'costlens'` — el proyecto se llama LLMeter pero el ID de Inngest sigue siendo "costlens" (nombre anterior). Esto causará conflictos si alguna vez se despliega otro servicio con el mismo ID.
- **Fix:** Cambiar a `id: 'llmeter'`.

### C3. Inngest Functions Son Todos TODOs
- **Archivo:** `src/lib/inngest/functions.ts`
- **Problema:** Las tres funciones (`pollUsage`, `checkAnomalies`, `syncNewProvider`) son placeholders vacíos. Los cron jobs están registrados pero no hacen nada. En producción, Inngest ejecutará estos jobs cada hora sin efecto.
- **Fix:** Implementar o deshabilitar los cron triggers hasta que estén listos.

### C4. PATCH de Providers Sin Validación Zod
- **Archivo:** `src/app/api/providers/[id]/route.ts:52`
- **Problema:** El endpoint PATCH acepta `body` sin pasar por `updateProviderSchema`. Existe un `updateProviderSchema` en validators pero no se usa. Cualquier campo arbitrario podría enviarse.
- **Fix:** Agregar validación con `updateProviderSchema.safeParse(body)`.

### C5. request.json() Sin Try/Catch
- **Archivos:** `src/app/api/providers/route.ts:46`, `src/app/api/providers/[id]/route.ts:52`
- **Problema:** `await request.json()` puede lanzar si el body no es JSON válido. Sin try/catch, retorna un 500 genérico.
- **Fix:** Envolver en try/catch y retornar 400 con mensaje claro.

---

## Major Issues (should fix)

### M1. Landing Page — URLs Hardcoded Incorrectas
- **Archivo:** `src/app/page.tsx:20,61,222`
- **Problema:** Links apuntan a `https://github.com/projects/llmeter` en vez de `https://github.com/amedinat/LLMeter`. También link de Twitter a `https://twitter.com/llmeter` que probablemente no existe.
- **Fix:** Actualizar URLs al repo real.

### M2. Footer Referencia a shadcn
- **Archivo:** `src/app/page.tsx:221`
- **Problema:** `Built by <a href="https://twitter.com/shadcn">LLMeter Team</a>` — el link va a @shadcn en vez de al equipo real.
- **Fix:** Actualizar el link.

### M3. No Hay Error Boundary
- **Problema:** No existe `error.tsx` ni `not-found.tsx` en ninguna ruta. Un error runtime en el dashboard mostrará la página de error genérica de Next.js.
- **Fix:** Crear `src/app/error.tsx`, `src/app/(dashboard)/error.tsx` y `src/app/not-found.tsx`.

### M4. No Hay Loading States
- **Problema:** No existen archivos `loading.tsx` para ninguna ruta. Las transiciones de navegación no mostrarán feedback visual.
- **Fix:** Crear `loading.tsx` con skeletons en `/dashboard`, `/providers`, `/alerts`, `/settings`.

### M5. No Hay Tests
- **Problema:** No existe ningún test (ni unit, ni e2e, ni integration). No hay configuración de testing framework.
- **Fix:** Configurar Vitest + Testing Library. Escribir tests para crypto.ts, validators, API routes como mínimo.

### M6. Mobile Navigation Ausente
- **Archivo:** `src/app/(dashboard)/layout.tsx:30`
- **Problema:** El sidebar está hidden en mobile (`hidden sm:flex`) pero no hay hamburger menu ni Sheet para mobile.
- **Fix:** Agregar Sheet/Drawer con trigger de hamburger en el header mobile.

### M7. Provider API Key No Se Valida Contra el Provider
- **Archivo:** `src/app/api/providers/route.ts:58-60`
- **Problema:** El TODO para validar la API key contra el provider (e.g., llamar a OpenAI `/v1/models`) está comentado. Se guarda cualquier string >= 10 chars como "API key".
- **Fix:** Descomentar y usar `getAdapter(provider).validateKey(apiKey)`.

### M8. Pricing Inconsistente con PRD
- **Archivo:** `src/app/page.tsx` vs `docs/PLAN.md`
- **Problema:** Landing muestra $0/$19/$49 pero el plan original mencionaba $0/$29/$79. Necesita alinearse.
- **Fix:** Decidir precios finales y actualizar ambos documentos.

---

## Minor Issues (nice to have)

### m1. SidebarNav Usa Index como Key
- **Archivo:** `src/components/dashboard/sidebar-nav.tsx:37`
- **Problema:** `key={index}` en lugar de `key={item.href}`. Funciona pero no es ideal para React reconciliation.
- **Fix:** Cambiar a `key={item.href}`.

### m2. UserNav Menu Items No Funcionales
- **Archivo:** `src/components/dashboard/user-nav.tsx:51-63`
- **Problema:** "Profile", "Billing", "Settings" no tienen onClick ni Link. Son decorativos.
- **Fix:** Conectar con navegación o remover hasta que estén implementados.

### m3. Login Magic Link Email — Sin Rate Limit
- **Archivo:** `src/features/auth/actions/login.ts`
- **Problema:** La server action no tiene rate limiting. Un atacante podría enviar miles de magic links. (Supabase tiene su propio rate limit, pero es mejor tener defensa en profundidad.)

### m4. SpendSummaryCard Componente No Usado
- **Archivo:** `src/features/dashboard/components/spend-summary-card.tsx`
- **Problema:** Componente definido pero no importado/usado en ningún lugar. Dead code.
- **Fix:** Remover o integrar.

### m5. No Hay Dark Mode Toggle
- **Problema:** Se importa `next-themes` en dependencies pero no hay ThemeProvider ni toggle implementado.
- **Fix:** Agregar ThemeProvider en layout raíz y toggle en header.

### m6. Anthropic Validation Hace API Call Real
- **Archivo:** `src/lib/providers/anthropic-adapter.ts:12-24`
- **Problema:** La validación envía un mensaje real ("hi") a Claude para verificar la key. Esto consume tokens del usuario.
- **Fix:** Usar un endpoint que no consuma tokens (e.g., GET /v1/models o similar).

### m7. `any` Implícito en CustomTooltip
- **Archivo:** `src/features/dashboard/components/spend-line-chart.tsx:36-43`
- **Problema:** Los types del CustomTooltip usan `?` opcionales pero el tipo real de Recharts es `TooltipProps`. Debería usar el tipo genérico de Recharts.

### m8. Falta Favicon/OG Image
- **Problema:** No hay favicon personalizado ni OG image para social sharing.

---

## Positive Observations

1. **Tipado TypeScript sólido** — Interfaces bien definidas en `src/types/index.ts`, sin uso de `any`.
2. **Validación Zod** — Schemas definidos para providers y alerts con tipos derivados.
3. **Encriptación bien implementada** — AES-256-GCM con salt+IV únicos por operación, key derivation con scrypt.
4. **RLS en Supabase** — Todas las tablas tienen Row Level Security habilitado con policies correctas.
5. **Estructura modular** — Separación clara en features, lib, components, types.
6. **Provider adapter pattern** — Diseño extensible con registry pattern para agregar nuevos providers.
7. **Auth middleware** — Correcto uso de `getUser()` (no `getSession()`) para validar server-side.
8. **Dashboard components** — Componentes bien tipados con props interfaces claras.
9. **Fixture system** — Mock data que sigue exactamente las interfaces de tipos.

---

## Recommended New User Stories / Tasks

| # | Historia / Task | Prioridad |
|---|----------------|-----------|
| 1 | Eliminar ruta duplicada de auth callback | P0 |
| 2 | Corregir Inngest client ID de "costlens" a "llmeter" | P0 |
| 3 | Implementar validación Zod en PATCH /api/providers/:id | P0 |
| 4 | Agregar try/catch a request.json() en API routes | P0 |
| 5 | Configurar Vitest + escribir tests para crypto, validators, API routes | P1 |
| 6 | Crear error.tsx y loading.tsx para todas las rutas | P1 |
| 7 | Implementar navegación mobile (Sheet/Drawer) | P1 |
| 8 | Activar validación de API key contra provider externo | P1 |
| 9 | Corregir URLs hardcoded en landing page | P1 |
| 10 | Implementar Inngest polling functions (Track 2 completo) | P1 |
| 11 | Agregar ThemeProvider y dark mode toggle | P2 |
| 12 | Conectar menu items de UserNav | P2 |
| 13 | Remover dead code (SpendSummaryCard sin usar) | P2 |
| 14 | Agregar favicon y OG meta tags | P2 |
| 15 | Decidir y alinear precios (landing vs PRD) | P1 |
