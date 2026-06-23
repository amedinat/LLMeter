# Plan — Endurecer LLMeter como herramienta de *unit-economics por cliente* (wedge lean)

## Context

John envió 3 emails a sitios de comparativas "best LLM cost tracking tools 2026" pitcheando
LLMeter como *"único open-source con per-customer attribution, sin proxy"*. Este plan hace ese
pitch **cierto, defendible y visible**, y mueve la única métrica que importa: conversión free→paid
(1er cliente de pago — ya confirmado que el cuello de botella es conversión/intención, NO tráfico).

**Lo que la exploración del código real (`amedinat/LLMeter` `main`, HEAD `a156576`) cambió respecto al draft:**

1. **La atribución per-customer YA EXISTE y está completa en `main`** — no hay que portar nada de
   `LLMeter-pro`. El stack vivo: endpoint `POST /api/ingest` (`src/app/api/ingest/route.ts`),
   tablas `customer_usage_records` + `customers` (`supabase/migrations/20260326_add_multi_tenant_ingestion.sql`),
   queries `getCustomersSummary`/`getCustomerDetail` (`src/features/customers/server/queries.ts`),
   página `/customers` (`src/app/(dashboard)/customers/page.tsx`), CRUD `/api/customers/[id]`, y el
   **SDK npm `llmeter`** (`packages/sdk`, `UsageEvent.customerId`). → WS1/WS2 **extienden** esto, no construyen de cero.
2. **El costo per-customer es ESTIMADO por tokens** (el ingest lo calcula con `getModelPricing`), NO
   facturado real. El claim "costo real facturado" aplica **solo al camino provider-level** (read-only
   key). El mensaje (WS3) debe mantener esa honestidad: provider-level = real; per-customer = estimado por tokens.
3. **`/customers` NO está gateada hoy** — la ve cualquier usuario logueado, incluido Free. La feature
   `team-attribution` gatea **solo asientos de equipo** (`/api/team`, `TeamSection`), no la atribución
   per-customer. → **Decisión de John (2026-06-16):** per-customer sigue **libre** (gancho de funnel);
   se gatea a **Pro $19** solo el **nuevo wedge de margen/unit-economics**.
4. **`/compare` y `/migrate` YA están en `PUBLIC_ROUTES`** con match por prefijo
   (`pathname.startsWith(route + '/')`) → las nuevas `/migrate/<rival>` **ya nacen públicas**; solo
   hay que sumarlas a `sitemap.ts`. (Una ruta *top-level* nueva sí requeriría editar `PUBLIC_ROUTES`.)

**Decisiones de John (2026-06-16):** (a) enfoque **wedge-lean**; (b) gatear a Pro **solo margen/unit-economics**
(per-customer libre); (c) **incluir la alerta de margen en v1**.

**Frontera de seguridad (rule 21):** la autonomía llega hasta el PR; **el merge a prod lo aprueba John**.
Las **migraciones NO se auto-aplican a prod** (patrón de `20260512_paddle…`: "never applied to prod") →
los `ALTER TABLE` los corre John en Supabase.

---

## Diferenciador defendible (resumen)

Nadie cruza *costo por cliente* con *revenue por cliente* → **margen/unit-economics por cliente es
espacio en blanco**. Bifrost/LiteLLM hacen per-customer **como gateway/proxy**; AI Vyuh es per-feature
**cloud-only**; AI Cost Board solo per-project. LLMeter = per-customer **sin proxy** + el cruce con revenue.

```
┌─ Camino A: provider read-only key ─────────────┐   spend total / por modelo / por provider
│  (30s, cero código, COSTO REAL FACTURADO)      │──▶ budget alerts, anomaly   [FREE]
└────────────────────────────────────────────────┘
┌─ Camino B: SDK `llmeter` / POST /api/ingest ───┐   customer_usage_records (costo ESTIMADO x tokens)
│  (5 min, customer_id, sin proxy)               │──▶ /customers per-customer  [FREE, gancho]
└───────────────────┬────────────────────────────┘            │
                    │ + revenue por cliente (CSV / metadata)   ▼
                    └────────────────────────────────▶ MARGEN / UNIT-ECONOMICS  [PRO $19]  ◀── el wedge
                                                         · vista cost vs revenue + badge "unprofitable"
                                                         · multi-dim (feature/env)  · alerta de margen
                                                         · widget en /demo (fixture)
```

---

## Orden de PRs (cada uno independiente y mergeable)

```
PR1 (WS5)  compare + 4 migrate nuevos      ── bajo riesgo, ROI inmediato en comparativas
PR2 (WS3)  mensaje "2 caminos" honesto     ── copy, sin backend
PR3 (WS4)  feature-flag `unit-economics`   ── prerequisito de gating de PR5
PR4 (WS2)  multi-dim feature/environment   ── base de datos del wedge (SDK+ingest+schema)
PR5 (WS1)  margen + /demo widget + alerta  ── la joya; depende del flag de PR3
```
PR3 debe entrar **antes o junto con** PR5 (PR5 gatea con el flag que define PR3).

---

## WS1 — Margen / unit-economics por cliente · **P0 · la joya** (PR5)

**Goal:** responder *"¿este cliente es rentable?"* — `Acme paga $99/mo, te cuesta $140/mo en IA → pierdes plata`.

1. **Revenue por cliente (input mínimo, sin integraciones nuevas):**
   - Migración idempotente nueva `supabase/migrations/<fecha>_add_customer_revenue.sql`:
     `ALTER TABLE customers ADD COLUMN IF NOT EXISTS monthly_revenue_usd numeric(12,2);` (estilo de las
     migraciones existentes). **John la corre en Supabase.**
   - `src/lib/validators/customer.ts`: en `updateCustomerSchema` hacer `display_name` **opcional** (hoy es
     `min(1)` obligatorio → bloquea editar solo revenue) y agregar
     `monthly_revenue_usd: z.number().nonnegative().nullable().optional()`.
   - `src/app/api/customers/[id]/route.ts` (PUT): incluir `monthly_revenue_usd` en el `.update({...})`
     (solo setear las claves presentes, para no pisar display_name al editar solo revenue).
   - **CSV bulk** `customer_id → mrr_usd`: nuevo `POST /api/customers/import-revenue` (parsea CSV/JSON map,
     upsert por `(user_id, customer_id)` con CSRF + rate-limit como las otras rutas) + botón "Import revenue (CSV)"
     en `customers-client.tsx`. (Stripe/Paddle MRR auto-sync **diferido** — ver riesgos.)
2. **Vista "Cost vs Revenue por cliente":** extender `getCustomersSummary` (ya hace join a `customers` por
   `display_name`; sumar `monthly_revenue_usd`) y `CustomerSummary` en `src/types/index.ts`
   (`monthly_revenue_usd`, y derivados `margin_usd`, `ai_cost_pct`). En `customers-client.tsx`: columnas
   ordenables `revenue`, `margen %`, `costo IA % del revenue`, **badge rojo "unprofitable"** cuando
   `ai_cost_pct ≥ 100`. Reusar `Table`/`Badge` ya importados.
3. **Alerta de margen (v1, pedido por John):**
   - `src/types/index.ts`: `AlertType` += `'customer_margin'`.
   - `src/lib/validators/alert.ts`: `alertTypes` += `'customer_margin'`; `config.threshold` = % del revenue
     (ej. 100 = margen 0). UI de creación en la sección Alerts/Settings con el nuevo tipo.
   - `src/lib/cron/check-alerts.ts` (`runCheckAlerts`): rama `customer_margin` — por usuario, traer customers
     con `monthly_revenue_usd` no nulo, sumar `customer_usage_records.cost_usd` del período, disparar cuando
     `costo / revenue * 100 ≥ threshold`. Reusar `triggerAlert()` (email+Slack+`alert_events`+`pulseTrack`) ya existente.
4. **Gating Pro:** la vista de margen, el import de revenue y la alerta se muestran/permiten solo si
   `hasFeature(plan, 'unit-economics')` (flag de WS4). Free ve per-customer cost; el margen pide upgrade.

**Por qué gana:** AI Vyuh hace per-feature, Bifrost hace per-customer *budgets* — ninguno cruza con revenue.

---

## WS2 — Atribución multi-dimensional (feature + environment) · **P0** (PR4)

**Goal:** atribución por **cliente + feature + environment + modelo**, sin proxy — empata "per-feature"
(AI Vyuh) y "hierarchical" (Bifrost).

- **SDK** `packages/sdk/src/types.ts`: `UsageEvent`/`WireEvent` += `feature?: string`, `environment?: string`;
  `packages/sdk/src/client.ts::toWireEvent` los pasa cuando están. (Aditivo, retro-compatible.)
- **Ingest** `src/app/api/ingest/route.ts`: `usageEventSchema` += `feature: z.string().optional()`,
  `environment: z.string().optional()`; mapearlos en `recordsToInsert`.
- **DB** migración idempotente: `ALTER TABLE customer_usage_records ADD COLUMN IF NOT EXISTS feature text;`
  + `environment text`. **John la corre.**
- **Query/UI:** `getCustomersSummary`/`getCustomerDetail` aceptan filtro por dimensión; `customers-client.tsx`
  agrega selector de agrupación (cliente/feature/environment/modelo) reusando el patrón de agрupación por
  modelo que ya existe (`CustomerModelTable`). No inventar UI nueva.

---

## WS3 — Mensaje "no SDK" → dos caminos honestos · **P1 · alto ROI** (PR2)

**Goal:** eliminar la contradicción "no SDK/30s" vs "per-customer requiere SDK" que un evaluador marcaría
como "claim inconsistente". Copy puro, sin backend.

- En `src/app/page.tsx`, `src/app/pricing/page.tsx`, `src/app/compare/page.tsx`, las `migrate/*` y el README
  del SDK, contar **dos caminos**:
  - **Camino A — provider-level (30s, cero código, costo REAL facturado):** read-only key → spend total/modelo/provider, budget alerts, anomaly.
  - **Camino B — per-customer (5 min, 1 wrapper, sin proxy, costo estimado por tokens):** SDK `llmeter` o POST al ingest con `customer_id` → costo/margen por cliente.
  - Recalcar en ambos: **nunca toca tus prompts, cero latencia** (vs Helicone proxy / vs Langfuse estimado-sin-billing).
- Snippet copy-paste de 1 línea para el Camino B.

---

## WS4 — Packaging: feature `unit-economics` en Pro $19 · **P1** (PR3)

**Goal (decisión John):** exponer **el margen** (no per-customer, que sigue libre) en el tier de entrada de pago.

- `src/config/plans.ts`: agregar `'unit-economics'` al `Feature` union y a los arrays `features` de
  **pro, team, enterprise** (NO free). Agregar bullet a `pro.featureList` ("Per-customer margin & unit economics").
  **No tocar `paddlePriceId` ni los precios** — solo qué features mapea cada tier.
- `src/app/pricing/page.tsx`: reflejar el bullet. `team` se sigue diferenciando por seats + retención ilimitada + soporte.

---

## WS5 — `/compare` + 4 `/migrate` nuevos · **P1** (PR1)

**Goal:** ganar las comparativas y cubrir a los rivales per-customer más directos (hoy faltan).

- `src/app/compare/page.tsx`: en el array `COMPETITORS`, agregar **Bifrost, LiteLLM, AI Vyuh, AI Cost Board**
  con su `line` + `href`. Ángulos: vs Bifrost/LiteLLM = "per-customer **sin** meter un gateway en tu ruta crítica";
  vs AI Vyuh = "open-source + self-host"; vs AI Cost Board = "per-**customer** + margen, no solo per-project".
- Nuevas páginas `src/app/migrate/{bifrost,litellm,ai-vyuh,ai-cost-board}/page.tsx` siguiendo la plantilla de
  `src/app/migrate/helicone/page.tsx` (metadata + JSON-LD + CTA→/demo). **Ya nacen públicas** (prefijo `/migrate` en `PUBLIC_ROUTES`).
- `src/app/sitemap.ts`: agregar las 4 URLs nuevas (patrón ya presente).

---

## Explícitamente FUERA de scope (wedge-lean — NO construir)

❌ Gateway/proxy, routing, semantic caching (rompe el "sin proxy") · ❌ enforcement activo de budget
(block/throttle — LLMeter por diseño no intercepta) · ❌ evals/tracing/quality (otra categoría) ·
❌ 100+ providers (solo los que pida una comparativa concreta) · ❌ Cloud FinOps multi-cloud · ❌ Stripe/Paddle MRR auto-sync (diferido).

---

## Verificación (end-to-end)

1. **Local:** `pnpm install && pnpm dev`. Tests: `pnpm test` (vitest) — hay tests junto a las rutas tocadas
   (`ingest/route.test.ts`, `customers/route.test.ts`, `check-alerts/route.test.ts`); actualizarlos/extenderlos. `pnpm build` limpio.
2. **WS2/WS1 ingest:** POST a `/api/ingest` con `customer_id`+`feature`+`environment`; setear `monthly_revenue_usd`
   vía PUT `/api/customers/[id]` o el CSV import; verificar que `/customers` muestra margen y badge "unprofitable".
3. **Alerta:** crear alerta `customer_margin`, correr `runCheckAlerts` (o el endpoint cron en dev) con un cliente
   en rojo → email/Slack disparan vía `triggerAlert`.
4. **/demo:** el widget de margen renderiza con el fixture (`getDemoCustomerMargins`), **público sin login**; el resto sigue tras el guard.
5. **Gating (WS4):** cuenta Free → ve per-customer pero el margen pide upgrade; cuenta Pro → margen desbloqueado; checkout Paddle intacto.
6. **WS5:** `/compare` + las 4 `/migrate/*` cargan **200 públicas** y están en `sitemap.ts`; la matriz coincide con los 3 emails de pitch.
7. **Mensaje (WS3):** home/pricing/compare ya no afirman "no SDK" absoluto — cuentan los 2 caminos.
8. **Migraciones:** las 3 columnas nuevas (`monthly_revenue_usd`, `feature`, `environment`) las aplica **John** en Supabase antes de mergear PR4/PR5 a prod.

## Riesgos / decisiones abiertas para John

- **Revenue input manual = fricción.** v1 con CSV/metadata es lo correcto; **Stripe/Paddle MRR auto-sync diferido** hasta señal (post-1er cliente).
- **Migraciones a prod:** no se auto-aplican — John corre 3 `ALTER TABLE` idempotentes en Supabase. Sin ellos PR4/PR5 fallan en prod.
- **Foco 100% LLMeter** (rules 13/21) — nada de Simplifai/2º producto hasta 1er cliente.
