# LLMeter — Tareas de Backend

**Estado:** Pendiente
**Prioridad:** Alta

---

## 1. Base de Datos (Supabase)
- [ ] **Schema Definition**:
    - [ ] `profiles`: id, email, full_name, avatar_url, billing_tier.
    - [ ] `providers`: id, user_id, type (openai/anthropic), encrypted_key, label, status.
    - [ ] `usage_records`: id, provider_id, date, model, tokens_in, tokens_out, cost_usd.
    - [ ] `alerts`: id, user_id, type, threshold, last_triggered_at.
- [ ] **RLS Policies**:
    - [ ] Configurar `auth.uid() = user_id` para todas las tablas.
    - [ ] Verificar que SELECT/INSERT/UPDATE/DELETE estén protegidos.
- [ ] **Triggers**:
    - [ ] `on_auth_user_created` -> insertar row en `profiles`.

## 2. API Routes (Next.js App Router)
- [ ] **Providers API (`/api/providers`)**:
    - [ ] `POST`: Recibir API Key, validar contra provider externo, encriptar, guardar.
    - [ ] `GET`: Listar proveedores (sin devolver keys).
    - [ ] `DELETE`: Eliminar proveedor y key.
- [ ] **Usage API (`/api/usage`)**:
    - [ ] `GET`: Devolver datos agregados para el dashboard (filtrados por fecha).
    - [ ] Soportar query params: `from`, `to`, `group_by`.

## 3. Inngest Background Jobs
- [ ] **Setup**: Configurar `src/app/api/inngest/route.ts`.
- [ ] **Job: Poll OpenAI**:
    - [ ] Trigger: Cron (cada hora) o Evento manual.
    - [ ] Lógica: Iterar usuarios -> desencriptar key -> fetch `/v1/usage` -> upsert `usage_records`.
- [ ] **Job: Poll Anthropic**:
    - [ ] Similar a OpenAI pero adaptado a su API de reporting.
- [ ] **Job: Check Alerts**:
    - [ ] Ejecutar después de cada polling exitoso.
    - [ ] Comparar gasto acumulado vs umbrales -> enviar email (Resend) si aplica.

## 4. Seguridad & Utilidades
- [ ] **Encryption Service**:
    - [ ] Implementar `encrypt(text)` y `decrypt(text)` usando `AES-256-GCM`.
    - [ ] Usar `ENCRYPTION_SECRET` del environment.
- [ ] **Validation Zod**:
    - [ ] Schemas para todos los inputs de API.

## 5. Webhooks (Stripe)
- [ ] **Stripe Webhook Handler**:
    - [ ] Escuchar `checkout.session.completed` -> actualizar `profiles.billing_tier`.
    - [ ] Escuchar `customer.subscription.deleted` -> downgrade a Free.
