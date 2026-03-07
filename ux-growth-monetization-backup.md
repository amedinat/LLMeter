# User Experience & Growth Strategy - LLMeter (2026-02-23)

## 1. User Journey (UX) - "The Aha Moment"
La experiencia está diseñada para minimizar la fricción ("Zero-Code Integration").

### Fase 1: Descubrimiento & Onboarding
*   **Trigger:** Usuario (Dev/CTO) ve una factura de OpenAI de $500 y no sabe por qué.
*   **Landing Page:** Ve la promesa: "Conecta tu API Key, ve tus costos en 30 segundos. Sin cambiar código."
*   **Sign Up:** Login con Google/GitHub (rápido).
*   **The Hook (El Gancho):** Pantalla vacía con un solo botón gigante: **"Connect Provider"**.
*   **Acción:** Usuario pega su API Key de OpenAI (Read-Only si es paranoico).
*   **The Aha Moment (Instant Value):** En <5 segundos, LLMeter descarga el historial de uso de los últimos 30 días.
    *   *Usuario piensa:* "Wow, ya veo mi gasto de ayer sin instalar ningún SDK."

### Fase 2: Retención (El Hábito)
*   **Alertas:** Usuario configura "Avísame si gasto más de $10 hoy".
*   **Email Diario:** Recibe un reporte a las 8 AM: "Ayer gastaste $12.50 (↑20%). Top modelo: GPT-4."
*   **Optimización:** LLMeter sugiere: "Estás usando GPT-4 para tareas simples. Cambia a GPT-3.5 y ahorra $150/mes."

---

## 2. Estrategia de Promoción (Go-To-Market)
El target son desarrolladores y fundadores técnicos (Indie Hackers, Startups).

### Canales Orgánicos (Gratis)
1.  **Hacker News / Reddit (r/OpenAI, r/LocalLLaMA):**
    *   *Post:* "Hice una herramienta open source para trackear costos de OpenAI sin tocar código."
    *   *Valor:* Mostrar screenshots del dashboard comparando costos.
2.  **Twitter/X Building in Public:**
    *   Compartir gráficas de ahorro real: "LLMeter me ayudó a bajar mi factura de $200 a $50."
    *   Taggear a fundadores de IA.
3.  **Directorios de IA:**
    *   Lanzar en Product Hunt (con el ángulo de "Open Source").
    *   Listar en "There's an AI for that".

### Growth Loops (Viralidad)
*   **"Powered by LLMeter":** Reportes públicos compartibles (tipo status page) para startups que quieren mostrar transparencia.
*   **Open Source:** El repo en GitHub actúa como marketing. La gente le da estrella, lo forkear, y termina usando la versión hosted por comodidad.

---

## 3. Monetización & Flujo de Pago
Qué pasa cuando el usuario decide pagar.

### El Modelo: Freemium
*   **Free:** 1 proveedor, 14 días de historia, alertas básicas.
*   **Pro ($19/mes):** Proveedores ilimitados, historia ilimitada, alertas avanzadas (Slack), equipos.

### User Flow de Pago (Técnico)
1.  **Upgrade:** Usuario intenta agregar un segundo proveedor o ver historia de hace 2 meses.
2.  **Paywall:** Modal "Upgrade to Pro to unlock unlimited history".
3.  **Checkout:** Redirección a Stripe Checkout (hosted).
4.  **Webhook:** Stripe avisa a LLMeter (`checkout.session.completed`).
5.  **Provisioning:**
    *   Supabase actualiza `profiles.plan = 'pro'`.
    *   Se desbloquean features instantáneamente.
    *   Email de bienvenida al tier Pro.
6.  **Portal:** Usuario gestiona su suscripción en el Customer Portal de Stripe (cancelar, facturas).

### Infraestructura Necesaria (Próximos Pasos)
*   Configurar productos en Stripe.
*   Implementar Webhook handler en Next.js.
*   Gatear features en el frontend (mostrar candadito 🔒).
