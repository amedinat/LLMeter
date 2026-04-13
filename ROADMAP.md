# Roadmap — LLMeter

## Vision
LLMeter es un monitor open-source de costos de APIs LLM, para devs que necesitan controlar su gasto en IA.
Target: devs con > $20/mes en APIs LLM. Canales: Dev.to, HN, r/LocalLLaMA.

## Milestone actual: Beta pública + primeros pagos (target: 2026-05-01)
- [x] Onboarding simplificado (< 5 min) — 3-step wizard con progress bar (2026-04-13)
- [x] Dashboard de costos por modelo y proyecto — SpendLineChart + UsageTable (2026-04-08)
- [x] Alertas de umbral de gasto (email + Slack webhook) — check-alerts cron (2026-04-08)
- [x] Integración Paddle para Pro $19/mes — checkout + webhook + billing portal (2026-04-06)
- [x] Landing page llmeter.org con pricing claro — /pricing + /migrate/helicone (2026-04-07)
- [ ] 10 early adopters pagantes

## Próximo milestone: Colaboración (target: 2026-06-01)
- [x] Exportar reportes CSV — GET /api/usage/export (2026-04-13)
- [x] Exportar reportes PDF — GET /api/usage/export/pdf (2026-04-13)
- [x] Team tier $49/mes — múltiples usuarios por organización (2026-04-13)
- [ ] API pública para integraciones

## Backlog (sin priorizar)
- Integración con Grafana
- Alertas Slack/Discord
- Comparador de modelos por costo/calidad
- Soporte multi-cloud (Azure, Bedrock)
