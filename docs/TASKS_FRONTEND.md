# LLMeter — Tareas de Frontend

**Estado:** Pendiente
**Prioridad:** Alta

---

## 1. Landing Page (Marketing)
- [ ] **Hero Section**: Título, subtítulo, botón CTA "Start Free", imagen/mockup del dashboard.
- [ ] **Features Section**: Grid de 3 col con iconos (Multi-provider, Alerts, Security).
- [ ] **Pricing Section**: Cards para Free ($0), Pro ($29), Team ($79).
- [ ] **Footer**: Links legales, GitHub repo, copyright.
- [ ] **Mobile Responsiveness**: Verificar en viewport móvil.

## 2. Autenticación
- [ ] **Login Page (`/login`)**:
    - [ ] Card central con logo.
    - [ ] Botón "Sign in with Google".
    - [ ] Input email + botón "Send Magic Link".
    - [ ] Manejo de estados (loading, success, error).
- [ ] **Auth Callback (`/auth/callback`)**:
    - [ ] Verificar código de intercambio.
    - [ ] Redirigir a `/dashboard` o `/onboarding`.

## 3. Dashboard Layout (App Shell)
- [ ] **Sidebar**:
    - [ ] Logo LLMeter.
    - [ ] Menú de navegación (Dashboard, Providers, Alerts, Settings).
    - [ ] User profile dropdown (Avatar, Email, Sign out).
    - [ ] Mobile menu (Sheet/Drawer).
- [ ] **Header**:
    - [ ] Breadcrumbs.
    - [ ] Theme toggle (Dark/Light).

## 4. Dashboard Home (`/dashboard`)
- [ ] **Stats Cards**:
    - [ ] Componente `StatsCard` (Label, Value, Trend, Icon).
    - [ ] Grid de 4 cards (Total Spend, Requests, Top Provider, Forecast).
- [ ] **Spend Chart**:
    - [ ] Componente `SpendLineChart` (Recharts).
    - [ ] Selector de rango de fecha (7d, 30d, 90d).
    - [ ] Tooltips personalizados.
- [ ] **Usage Table**:
    - [ ] `DataTable` (shadcn/ui) para desglose por modelo.
    - [ ] Columnas: Model, Provider, Requests, Tokens, Cost.
    - [ ] Sortable headers.

## 5. Gestión de Proveedores (`/providers`)
- [ ] **Provider List**:
    - [ ] Lista de cards con proveedores conectados.
    - [ ] Estado de conexión (Badge: Connected, Error, Syncing).
    - [ ] Botón "Disconnect" (AlertDialog confirmación).
- [ ] **Connect Modal**:
    - [ ] Dialog para agregar nuevo proveedor.
    - [ ] Selector de proveedor (OpenAI, Anthropic).
    - [ ] Input para API Key (password type).
    - [ ] Validación de input.

## 6. Alertas (`/alerts`)
- [ ] **Alert List**: Tabla de alertas configuradas.
- [ ] **Create Alert Dialog**: Formulario para definir tipo (Mensual/Diario), monto y emails.

## 7. Settings (`/settings`)
- [ ] **Profile Form**: Nombre, email (readonly).
- [ ] **Billing Portal**: Link a Stripe Customer Portal (si es Pro).
