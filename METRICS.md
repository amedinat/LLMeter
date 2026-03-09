# LLMeter — Metricas y Seguimiento

> Estado actual: MVP completado, pre-lanzamiento
> Ultima actualizacion: 2026-03-07

## Fase actual: PRE-LANZAMIENTO

### Checklist de lanzamiento

| Item | Estado | Notas |
|------|--------|-------|
| MVP funcional | OK | Next.js + Supabase + 4 providers |
| Tests | OK | 120 tests passing |
| Repo publico | OK | GitHub, AGPL-3.0 |
| CONTRIBUTING.md | OK | |
| OG Image / Social preview | PENDIENTE | |
| Dominio propio | PENDIENTE | Recomendado: llmeter.dev |
| Deploy produccion (Vercel) | PENDIENTE | Verificar |
| Launch drafts | OK | HN, Reddit, X, Dev.to, PH |
| Screenshots dashboard | PENDIENTE | Necesarios para PH y articulo |

## Metricas POST-LANZAMIENTO

### Semana 1 (vanity check — solo para calibrar)

| Metrica | Objetivo | Real | Fuente |
|---------|----------|------|--------|
| GitHub stars | >20 | — | GitHub API |
| Signups (free tier) | >10 | — | Supabase |
| Visitas landing | >500 | — | Vercel Analytics |
| Posts publicados | 4+ (HN, Reddit x2, X) | — | Manual |
| Upvotes HN | >10 | — | HN |

### Mes 1 (senales de vida — The Dip audit)

| Metrica | Objetivo | Real | Fuente |
|---------|----------|------|--------|
| Usuarios registrados | >50 | — | Supabase |
| Usuarios activos (WAU) | >15 | — | Supabase / analytics |
| Providers conectados | >20 | — | BD |
| GitHub stars | >100 | — | GitHub API |
| Issues/PRs de comunidad | >3 | — | GitHub |
| Primer pago (Pro) | >1 | — | Stripe |
| Feedback especifico recibido | >5 piezas | — | GH Issues, email, Reddit |
| Retencion D7 | >30% | — | Supabase |

### Mes 3 (decision point — seguir, pivotar, o abandonar)

| Metrica | Objetivo | Real | Fuente |
|---------|----------|------|--------|
| MRR | >$100 | — | Stripe |
| Usuarios activos mensuales | >30 | — | Analytics |
| Retencion M1 | >20% | — | Supabase |
| NPS / satisfaccion | >7/10 | — | Survey |
| Costo operativo mensual | <$20 | — | Vercel + Supabase bills |
| Contribuciones externas | >2 PRs merged | — | GitHub |

## Auditoria The Dip (aplicar mensualmente post-lanzamiento)

| Pregunta | Respuesta | Fecha |
|----------|-----------|-------|
| Alguien esta pagando? | — | — |
| Hay feedback especifico? | — | — |
| Los usuarios vuelven? | — | — |
| Cuantos angulos de distribucion probamos? | — | — |
| Curva estimada (Dip / Callejon / Precipicio) | — | — |

## Costos vs Ingresos

| Mes | Ingresos (Stripe) | Costos (infra) | Neto | Notas |
|-----|-------------------|----------------|------|-------|
| — | — | — | — | — |

## Instrumentacion implementada

| Componente | Estado | Detalle |
|------------|--------|---------|
| Vercel Analytics | OK | Visitas, referrers, paginas (gratis, layout.tsx) |
| last_seen_at en profiles | OK | Throttled 5min, via ActivityTracker en dashboard layout |
| Tabla user_events | OK | Con RLS, eventos tipados (dashboard_viewed, settings_viewed, etc.) |
| Tracking lib | OK | src/lib/tracking.ts — trackEvent() + updateLastSeen() |
| Migration SQL | OK | supabase/migrations/20260307_add_tracking.sql |

## Decisiones clave

| Fecha | Decision | Razon |
|-------|----------|-------|
| 2026-03-07 | Metricas formalizadas | Framework de seguimiento definido |
| 2026-03-07 | Vercel Analytics sobre Plausible | Gratis, zero-config, suficiente para MVP |
| 2026-03-07 | Instrumentacion de tracking | last_seen_at + user_events + Vercel Analytics implementados |

## Umbrales de decision

- **Mes 1 sin signups**: revisar posicionamiento y canales de distribucion
- **Mes 2 sin pagos**: pivotar pricing o modelo (freemium puro?)
- **Mes 3 sin retencion >15%**: evaluar abandono o pivot mayor
- **Costo > ingresos por 3 meses**: evaluar reduccion de infra o pause
