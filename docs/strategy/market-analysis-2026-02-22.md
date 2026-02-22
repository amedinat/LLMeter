# Estrategia de Producto y Análisis de Mercado — LLMeter (2026-02-22)

## 1. El Estándar del Mercado (Benchmark)
La mayoría (Helicone, Langfuse, LangSmith) usan un modelo **Open Core**.

| Feature | **Open Source (Community)** | **SaaS Free (Cloud)** | **SaaS Pro / Enterprise** |
| :--- | :--- | :--- | :--- |
| **Hosting** | Self-hosted (Docker) | Cloud compartida | Cloud dedicada / VPC |
| **Volumen** | Ilimitado (tu infra) | ~50k-100k req/mes | Millones / Custom |
| **Retención** | Ilimitada (tu disco) | 7 - 14 días | 30 días - 1 año |
| **Usuarios** | 1 (o sin auth) | 1 - 3 usuarios | Equipos ilimitados + RBAC |
| **Features** | Trazas, Costos, Dashboards | Todo lo del OS | SSO, Evals, Caching, Alertas |

## 2. Estrategia Recomendada para LLMeter

Para que el modelo de negocio funcione, el Open Source debe ser útil pero **incompleto para equipos grandes**.

### ✅ **Open Core (Repo Público Actual - MVP)**
*El gancho. Debe ser excelente para un desarrollador individual (indie hacker).*
1.  **Observabilidad Básica:** Trazas, latencia, tokens, costos (Dashboard actual).
2.  **Gestión de Costos:** Presupuestos básicos y alertas por email (lo que ya hicimos).
3.  **Auth:** Login personal (GitHub/Google/Email) — *Sin gestión de equipos*.
4.  **Integraciones:** SDKs básicos (Python/JS).
5.  **Retención:** Configurable (el usuario paga su base de datos).

### 💰 **Features Premium (Futuro SaaS / Enterprise)**
*Lo que pagan las empresas.*
1.  **Colaboración (Teams):** Invitar usuarios, roles (Admin/Viewer), compartir dashboards.
2.  **Alertas Avanzadas:** Integración con Slack, Discord, PagerDuty, Webhooks (no solo email).
3.  **Evaluaciones (Evals):** Testear prompts automáticamente (datasets, regresiones).
4.  **Caching Semántico:** Ahorrar costos respondiendo desde caché (feature técnica compleja).
5.  **Enterprise Security:** SSO (Okta, SAML), Audit Logs detallados (compliance), despliegue en VPC.
6.  **Playground Colaborativo:** Probar prompts en equipo y guardar versiones.

## 3. Decisión Táctica
Dado que LLMeter es un solo repo por ahora:

1.  **Mantén todo en el repo público** pero diseña la arquitectura para que las features "Premium" (como Teams o Slack Alerts) sean módulos que se puedan desactivar o separar luego.
2.  **No construyas features Enterprise todavía** (SSO, RBAC complejo). Enfócate en que el **Developer Experience (DX)** del usuario individual sea perfecto.
3.  Si alguien clona el repo y lo usa gratis, ¡bien! Es marketing. Tu negocio será hostearlo para quienes no quieren mantener servidores.
