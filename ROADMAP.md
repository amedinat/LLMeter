# Roadmap — LLMeter

## Vision
LLMeter es un monitor open-source de costos de APIs LLM, para devs que necesitan controlar su gasto en IA.
Target: devs con > $20/mes en APIs LLM. Canales: Dev.to, HN, r/LocalLLaMA.

## ✅ Milestone cerrado: Beta pública + primeros pagos (2026-04-13)
- [x] Onboarding simplificado (< 5 min) — 3-step wizard con progress bar (2026-04-13)
- [x] Dashboard de costos por modelo y proyecto — SpendLineChart + UsageTable (2026-04-08)
- [x] Alertas de umbral de gasto (email + Slack webhook) — check-alerts cron (2026-04-08)
- [x] Integración Paddle para Pro $19/mes — checkout + webhook + billing portal (2026-04-06)
- [x] Landing page llmeter.org con pricing claro — /pricing + /migrate/helicone (2026-04-07)
- [x] Exportar reportes CSV — GET /api/usage/export (2026-04-13)
- [x] Exportar reportes PDF — GET /api/usage/export/pdf (2026-04-14)
- [x] Team tier $49/mes — múltiples usuarios por organización (2026-04-13)
- [x] API pública v1 para integraciones — GET /api/v1/usage, providers, customers (2026-04-13)
- [x] Retención de datos: purge automático free-users inactivos 45d — cron + email warning (2026-04-13)
- [x] SEO: canonical www, metadataBase, sitemap, OpenGraph/Twitter Card (2026-04-14)

## Milestone actual: Crecimiento + primeros pagos (target: 2026-05-15)
- [ ] 10 early adopters pagantes
- [ ] Show HN — post en Hacker News (draft listo)
- [ ] 3 artículos Dev.to publicados con tráfico SEO
- [ ] Paddle env vars en producción (Vercel) — bloqueador de cobro activo
- [ ] Payoneer conectado a Paddle — necesario para recibir pagos en Colombia
- [x] Landing /pricing — copy de venta con why pay explícito (2026-04-14, commit 9e2b6d0)
- [x] Links con UTM params en todo contenido publicado (2026-04-15, commit 01909dd)
- [x] Launch drafts (Show HN, Reddit, X, Dev.to) actualizados — 6 providers, Paddle, Vercel Cron (2026-04-15)

## Próximo milestone: Integraciones y retención (target: 2026-07-01)
- [ ] Integración con Grafana (dashboard embed)
- [x] Alertas Slack webhook nativas (gated Pro+) (2026-04-08)
- [x] Comparador de modelos por costo/calidad — /models page, 128 models, 6 providers, filterable (2026-04-15)
- [ ] Soporte multi-cloud (Azure Cognitive Services, AWS Bedrock)
  - [x] AWS Bedrock: `wrapBedrock()` SDK wrapper for ConverseCommand calls (2026-04-17)
  - [x] Azure OpenAI: adapter (validate endpoint+key) + `wrapAzureOpenAI()` SDK wrapper (2026-04-17)
- [x] SDK cliente para ingestion (npm package) — `packages/sdk`, `llmeter` on npm (2026-04-17)
  - [x] `wrapOpenAI()`, `wrapAnthropic()`, `wrapGoogleAI()`, `wrapBedrock()` — 4 provider wrappers, 42 tests
