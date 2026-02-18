# LLMeter — Historias de Usuario

**Versión:** 0.1.0
**Última actualización:** 2026-02-17

---

## Convención

Cada historia sigue el formato:
> **Como** [persona], **quiero** [acción], **para** [beneficio].

Criterios de aceptación en formato Given/When/Then.
Prioridad: P0 (MVP blocker), P1 (MVP nice-to-have), P2 (Phase 2+).

---

## Epic 1: Autenticación y Onboarding

### US-1.1 — Registro con Google OAuth [P0]
**Como** desarrollador indie, **quiero** registrarme con mi cuenta de Google, **para** empezar a usar LLMeter en menos de 30 segundos.

**Criterios de aceptación:**
- Given: usuario no autenticado en `/login`
- When: hace clic en "Sign in with Google"
- Then: se redirige a Google OAuth, regresa a `/dashboard`, se crea perfil en `profiles`

### US-1.2 — Registro con Magic Link [P0]
**Como** desarrollador que no usa Google, **quiero** registrarme con magic link por email, **para** tener una alternativa de acceso.

**Criterios de aceptación:**
- Given: usuario en `/login` ingresa email
- When: hace clic en "Send magic link"
- Then: recibe email con link, al hacer clic queda autenticado en `/dashboard`

### US-1.3 — Logout [P0]
**Como** usuario autenticado, **quiero** cerrar mi sesión, **para** proteger mi cuenta en dispositivos compartidos.

**Criterios de aceptación:**
- Given: usuario autenticado
- When: hace clic en "Sign out" en el menú
- Then: sesión destruida, redirigido a `/login`

### US-1.4 — Protección de rutas [P0]
**Como** usuario no autenticado, **quiero** ser redirigido al login si intento acceder al dashboard, **para** que mis datos estén protegidos.

**Criterios de aceptación:**
- Given: usuario no autenticado
- When: navega a `/dashboard` o cualquier ruta protegida
- Then: redirigido a `/login` con redirect param

---

## Epic 2: Conexión de Proveedores

### US-2.1 — Conectar proveedor OpenAI [P0]
**Como** usuario, **quiero** conectar mi cuenta de OpenAI ingresando mi API key de admin, **para** que LLMeter pueda obtener mis datos de uso.

**Criterios de aceptación:**
- Given: usuario en `/providers`
- When: hace clic en "Connect Provider", selecciona OpenAI, ingresa API key
- Then: key se valida contra la API de OpenAI, se encripta con AES-256-GCM, se guarda en `providers`, se muestra estado "Connected"
- Given: API key inválida
- Then: mensaje de error claro, key no se guarda

### US-2.2 — Conectar proveedor Anthropic [P0]
**Como** usuario, **quiero** conectar mi cuenta de Anthropic, **para** monitorear mi gasto en Claude.

**Criterios de aceptación:**
- Mismo flujo que US-2.1 pero con validación contra Anthropic API
- Requiere org_id además de API key

### US-2.3 — Desconectar proveedor [P0]
**Como** usuario, **quiero** desconectar un proveedor, **para** revocar el acceso a mi API key.

**Criterios de aceptación:**
- Given: usuario en `/providers` con proveedor conectado
- When: hace clic en "Disconnect" y confirma
- Then: API key encriptada eliminada permanentemente de la DB, datos de uso se mantienen (con flag de proveedor desconectado)

### US-2.4 — Ver estado de proveedores [P0]
**Como** usuario, **quiero** ver el estado de mis proveedores conectados, **para** saber si la sincronización está funcionando.

**Criterios de aceptación:**
- Given: usuario en dashboard
- Then: sidebar muestra cada proveedor con: nombre, estado (connected/error/syncing), última sincronización exitosa

---

## Epic 3: Sincronización de Datos

### US-3.1 — Sincronización inicial [P0]
**Como** usuario que acaba de conectar un proveedor, **quiero** que se importen mis últimos 30 días de uso automáticamente, **para** ver mis datos sin esperar.

**Criterios de aceptación:**
- Given: proveedor recién conectado
- When: se completa la conexión
- Then: job de Inngest obtiene últimos 30 días, datos normalizados aparecen en dashboard en < 2 minutos

### US-3.2 — Sincronización periódica [P0]
**Como** usuario, **quiero** que mis datos se actualicen automáticamente cada hora, **para** tener información actualizada sin intervención manual.

**Criterios de aceptación:**
- Given: proveedor conectado
- When: pasa 1 hora desde última sincronización
- Then: Inngest ejecuta polling, nuevos datos aparecen en dashboard

### US-3.3 — Manejo de errores de sincronización [P0]
**Como** usuario, **quiero** ser notificado si la sincronización falla, **para** saber si mis datos están desactualizados.

**Criterios de aceptación:**
- Given: error al sincronizar (rate limit, key revocada, API down)
- Then: estado del proveedor cambia a "Error", tooltip muestra razón, retry automático con backoff exponencial (max 3 intentos)

---

## Epic 4: Dashboard Principal

### US-4.1 — Resumen de gasto total [P0]
**Como** usuario, **quiero** ver mi gasto total del período seleccionado al entrar al dashboard, **para** tener una visión rápida de cuánto estoy gastando.

**Criterios de aceptación:**
- Given: usuario con al menos 1 proveedor conectado
- When: entra a `/dashboard`
- Then: ve cards con: gasto total, gasto por proveedor, cambio vs período anterior (%), número de requests

### US-4.2 — Gráfico de gasto diario [P0]
**Como** usuario, **quiero** ver un gráfico de línea/área con mi gasto diario, **para** identificar tendencias y picos.

**Criterios de aceptación:**
- Given: datos de uso disponibles
- When: selecciona rango de fechas (7d/30d/90d/custom)
- Then: gráfico muestra gasto por día, con líneas separadas por proveedor, tooltip con detalles al hover

### US-4.3 — Desglose por modelo [P0]
**Como** usuario, **quiero** ver qué modelos estoy usando más y cuánto cuestan, **para** optimizar mi selección de modelos.

**Criterios de aceptación:**
- Given: datos de uso disponibles
- Then: tabla muestra: modelo, proveedor, tokens usados, costo, % del total, ordenable por cualquier columna

### US-4.4 — Filtro por rango de fechas [P0]
**Como** usuario, **quiero** filtrar todos los datos del dashboard por rango de fechas, **para** analizar períodos específicos.

**Criterios de aceptación:**
- Given: usuario en dashboard
- When: selecciona preset (7d/30d/90d) o rango personalizado
- Then: todas las cards, gráficos y tablas se actualizan

---

## Epic 5: Vistas de Detalle

### US-5.1 — Detalle por modelo [P1]
**Como** usuario, **quiero** hacer clic en un modelo y ver su uso detallado en el tiempo, **para** entender patrones de uso específicos.

**Criterios de aceptación:**
- Given: tabla de modelos en dashboard
- When: clic en un modelo
- Then: vista detallada con gráfico de uso diario, tabla de uso por día, costo por 1K tokens

### US-5.2 — Detalle por proveedor [P1]
**Como** usuario, **quiero** ver una vista detallada de cada proveedor, **para** comparar costos entre proveedores.

**Criterios de aceptación:**
- Given: dashboard con múltiples proveedores
- When: clic en un proveedor en la sidebar
- Then: dashboard filtrado a ese proveedor con todos sus modelos

---

## Epic 6: Alertas de Presupuesto

### US-6.1 — Crear alerta de presupuesto mensual [P0]
**Como** usuario, **quiero** configurar un límite de gasto mensual, **para** recibir una notificación antes de excederlo.

**Criterios de aceptación:**
- Given: usuario en `/alerts`
- When: crea alerta tipo "Monthly Budget" con monto (ej: $500)
- Then: alerta se guarda, se evalúa en cada sincronización, email enviado cuando gasto >= umbral

### US-6.2 — Crear alerta de pico diario [P1]
**Como** usuario, **quiero** ser alertado si mi gasto diario supera un umbral, **para** detectar anomalías rápidamente.

**Criterios de aceptación:**
- Given: alerta tipo "Daily Spike" configurada con umbral (ej: $50)
- When: gasto de un día supera el umbral
- Then: email enviado con detalle (qué día, cuánto, qué proveedor/modelo contribuyó más)

### US-6.3 — Ver historial de alertas [P1]
**Como** usuario, **quiero** ver un historial de alertas disparadas, **para** revisar incidentes pasados.

**Criterios de aceptación:**
- Given: usuario en `/alerts`
- Then: lista de alertas disparadas con: fecha, tipo, monto que la disparó, estado (active/dismissed)

---

## Epic 7: Landing Page y Conversión

### US-7.1 — Landing page informativa [P0]
**Como** visitante, **quiero** entender qué hace LLMeter y por qué debería usarlo, **para** decidir si me registro.

**Criterios de aceptación:**
- Given: visitante en `/`
- Then: ve hero section, features, pricing, CTA claro, demo/screenshot del dashboard
- Tiempo de carga < 2s (LCP)

### US-7.2 — Upgrade a plan Pro [P1]
**Como** usuario free, **quiero** actualizar mi plan a Pro, **para** conectar más proveedores y tener historial ilimitado.

**Criterios de aceptación:**
- Given: usuario en plan Free
- When: hace clic en "Upgrade" en settings
- Then: redirigido a Stripe Checkout, al completar pago plan se activa inmediatamente

---

## Epic 8: Exportación [P1]

### US-8.1 — Exportar datos a CSV [P1]
**Como** usuario, **quiero** exportar mis datos de uso a CSV, **para** analizarlos en Excel/Sheets o compartirlos con mi equipo.

**Criterios de aceptación:**
- Given: usuario en dashboard con datos
- When: hace clic en "Export CSV"
- Then: se descarga archivo CSV con columnas: fecha, proveedor, modelo, tokens_in, tokens_out, costo

---

## Epic 9: Seguridad

### US-9.1 — Encriptación de API keys [P0] (Non-functional)
**Como** usuario que confía sus API keys a LLMeter, **quiero** que estén encriptadas en reposo, **para** que un breach de la DB no exponga mis keys.

**Criterios de aceptación:**
- API keys encriptadas con AES-256-GCM antes de INSERT
- `ENCRYPTION_SECRET` solo en env vars del server, nunca en código
- Decryption solo ocurre en server-side al momento de hacer polling
- API keys nunca viajan al frontend (ni parciales)

### US-9.2 — Row Level Security [P0] (Non-functional)
**Como** usuario, **quiero** que solo yo pueda ver mis datos, **para** que ningún otro usuario acceda a mi información.

**Criterios de aceptación:**
- RLS habilitado en todas las tablas de usuario
- Policies: `auth.uid() = user_id` en SELECT, INSERT, UPDATE, DELETE
- Testeado: usuario A no puede leer datos de usuario B

---

## Epic 10: Calidad y Estabilidad (derivadas de QA Audit 2026-02-18)

### US-10.1 — Tests unitarios y de integración [P1]
**Como** desarrollador, **quiero** tener una suite de tests automatizados, **para** detectar regresiones antes de cada release.

**Criterios de aceptación:**
- Vitest configurado con Testing Library
- Tests unitarios para: `crypto.ts` (encrypt/decrypt roundtrip), validators (Zod schemas), provider adapters
- Tests de integración para API routes: `/api/providers` (CRUD), `/api/usage` (GET con filtros)
- Cobertura mínima 80% en `src/lib/`
- Script `just test` ejecuta la suite completa

### US-10.2 — Error boundaries y loading states [P1]
**Como** usuario, **quiero** ver feedback visual durante cargas y mensajes amigables si algo falla, **para** no quedarme en una pantalla en blanco.

**Criterios de aceptación:**
- `error.tsx` en: `/app`, `/app/(dashboard)`
- `not-found.tsx` en `/app`
- `loading.tsx` con skeletons en: `/dashboard`, `/providers`, `/alerts`, `/settings`
- Error boundaries muestran botón "Reintentar"

### US-10.3 — Navegación mobile [P1]
**Como** usuario mobile, **quiero** un menú hamburguesa funcional, **para** navegar la app desde mi teléfono.

**Criterios de aceptación:**
- Sheet/Drawer con trigger hamburguesa visible en viewport < 640px
- Sidebar hidden en mobile, Sheet contiene mismos items de navegación
- Sheet se cierra al seleccionar un item

### US-10.4 — Validación de API key contra provider externo [P1]
**Como** usuario, **quiero** que LLMeter verifique mi API key al conectar un proveedor, **para** saber inmediatamente si es válida.

**Criterios de aceptación:**
- POST `/api/providers` valida key contra endpoint del provider (OpenAI: GET `/v1/models`, Anthropic: endpoint no-consumo)
- Si key inválida: retorna 400 con mensaje claro, key NO se guarda
- Anthropic adapter NO consume tokens del usuario al validar

### US-10.5 — Dark mode [P2]
**Como** usuario, **quiero** alternar entre tema claro y oscuro, **para** usar la app cómodamente de noche.

**Criterios de aceptación:**
- ThemeProvider (next-themes) en layout raíz
- Toggle en header del dashboard
- Preferencia persiste en localStorage

### US-10.6 — Favicon y OG meta tags [P2]
**Como** visitante que recibe un link de LLMeter, **quiero** ver una preview atractiva en redes sociales, **para** entender de qué se trata antes de hacer clic.

**Criterios de aceptación:**
- Favicon personalizado (SVG + ICO fallback)
- OG image (1200x630) con branding de LLMeter
- Meta tags: title, description, og:image en layout raíz

---

## Epic 11: Seguridad Avanzada (derivadas de Security Audit 2026-02-18)

### US-11.1 — Hardening del Middleware de Auth [P0]
**Como** operador de LLMeter, **quiero** que el middleware de autenticación no permita bypass por rutas con puntos, **para** garantizar que todas las rutas protegidas requieran sesión válida.

**Criterios de aceptación:**
- Given: ruta protegida como `/dashboard` o `/api/providers`
- When: un usuario no autenticado intenta acceder con variantes como `/dashboard/foo.bar`
- Then: el middleware redirige a `/login` (no permite bypass)
- La exclusión de archivos estáticos se basa en extensiones explícitas (`.css`, `.js`, `.png`, `.svg`, `.ico`) o en el `config.matcher`, no en `pathname.includes('.')`

### US-11.2 — Validación de Redirect Seguro (Anti Open Redirect) [P0]
**Como** usuario que se autentica, **quiero** que el redirect post-login solo me lleve a rutas internas de LLMeter, **para** no ser redirigido a sitios maliciosos.

**Criterios de aceptación:**
- Given: callback de auth con parámetro `next`
- When: `next` contiene un valor como `@malicioso.com` o `//evil.com` o una URL absoluta externa
- Then: se ignora y se redirige a `/dashboard`
- Solo se aceptan rutas relativas que empiecen con `/` y no empiecen con `//`
- Implementar función utilitaria `safeRedirect(url: string): string` reutilizable

### US-11.3 — Rate Limiting en Magic Link [P1]
**Como** operador de LLMeter, **quiero** limitar el envío de magic links por IP y por email, **para** prevenir abuso y spam.

**Criterios de aceptación:**
- Given: un cliente envía más de 5 solicitudes de magic link en 15 minutos
- Then: retorna HTTP 429 con mensaje "Demasiados intentos, intenta más tarde"
- Rate limit por IP y por email (el que se alcance primero)
- Supabase tiene rate limiting propio, pero se implementa defensa en profundidad a nivel de aplicación

### US-11.4 — Headers de Seguridad HTTP [P1]
**Como** operador de LLMeter, **quiero** que la aplicación envíe headers de seguridad estándar, **para** mitigar ataques XSS, clickjacking y sniffing.

**Criterios de aceptación:**
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- Content-Security-Policy configurado para Next.js (script-src, style-src)
- Configurados en `next.config.ts` headers o en middleware

### US-11.5 — Sanitización de Inputs en API Routes [P1]
**Como** operador de LLMeter, **quiero** que todos los endpoints de API validen y saniticen los inputs, **para** prevenir inyección y datos corruptos.

**Criterios de aceptación:**
- `request.json()` envuelto en try/catch en todos los API routes (retorna 400 si body inválido)
- Todos los endpoints PATCH/POST usan validación Zod antes de procesar
- Strings se trimean y tienen longitud máxima definida
- Ningún campo arbitrario llega a la DB sin pasar por schema

### US-11.6 — Eliminar Ruta de Auth Callback Duplicada [P0]
**Como** desarrollador, **quiero** que exista una sola ruta de callback de autenticación, **para** evitar comportamiento impredecible.

**Criterios de aceptación:**
- Solo existe `src/app/auth/callback/route.ts` (el más completo, con soporte de `x-forwarded-host`)
- `src/app/(auth)/callback/route.ts` eliminado
- URL de callback en Supabase dashboard apunta a `/auth/callback`
- Verificado que login/logout siguen funcionando correctamente

---

## Epic 12: Remediación QA (derivadas de QA Audit 2026-02-18)

### US-12.1 — Corregir Inngest Client ID [P0]
**Como** desarrollador, **quiero** que el ID del cliente de Inngest sea "llmeter" y no "costlens", **para** evitar conflictos con otros servicios.

**Criterios de aceptación:**
- `src/lib/inngest/client.ts` tiene `id: 'llmeter'`
- Cualquier referencia a "costlens" en el código eliminada

### US-12.2 — Corregir URLs Hardcoded en Landing Page [P1]
**Como** visitante, **quiero** que los links de la landing page apunten a los recursos correctos, **para** no llegar a páginas inexistentes.

**Criterios de aceptación:**
- Link de GitHub apunta a `https://github.com/amedinat/LLMeter`
- Link de Twitter/footer actualizado o removido si no existe cuenta
- Referencia a shadcn eliminada del footer
- Comillas no escapadas (`'`) reemplazadas por `&apos;` en JSX

### US-12.3 — Extraer SortableHeader como Componente Independiente [P1]
**Como** desarrollador, **quiero** que `SortableHeader` esté definido fuera de `UsageTable`, **para** evitar re-renders innecesarios y seguir buenas prácticas de React.

**Criterios de aceptación:**
- `SortableHeader` es un componente top-level en su propio archivo o al nivel del módulo
- `UsageTable` lo importa en vez de definirlo internamente
- No hay warnings de lint relacionados con componentes anidados

### US-12.4 — Limpieza de Dead Code y Variables Sin Usar [P2]
**Como** desarrollador, **quiero** un codebase limpio sin imports ni variables sin usar, **para** mantener la calidad del código.

**Criterios de aceptación:**
- `Separator` removido de layout.tsx (o usado)
- `TAG_LENGTH` removido de crypto.ts (o usado)
- `UsageRecord` removido de fixtures.ts (o usado)
- `options` removido de middleware.ts (o usado)
- `SpendSummaryCard` integrado o eliminado
- `npm run lint` pasa sin errores ni warnings

### US-12.5 — Alinear Precios entre Landing y Documentación [P1]
**Como** product owner, **quiero** que los precios sean consistentes en toda la app y documentación, **para** no confundir a usuarios ni al equipo.

**Criterios de aceptación:**
- Precios definidos: Free ($0), Pro ($X), Team ($Y) — valores a confirmar con John
- Landing page, PLAN.md y cualquier otra referencia usan los mismos valores
- Pricing section del landing tiene link funcional a signup

---

*Documento mantenido por John Medina & Otto*
