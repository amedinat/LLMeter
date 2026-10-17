import { createAdminClient } from '@/lib/supabase/admin';
import { getResendClient, EMAIL_FROM } from '@/lib/email/client';

/**
 * Weekly product report with an explicit kill/scale rule.
 *
 * The rule is the point: a product that does not cross its threshold by
 * day 30 after publication is killed without discussion. The report says
 * KILL / KEEP / SCALE; the human confirms or vetoes in one minute.
 *
 * Config (env):
 *   WEEKLY_REPORT_TO   recipient(s), comma separated. Without it the report
 *                      is computed and logged but not emailed.
 *   EXT_PUBLISHED_AT   ISO date the extension went live in the Chrome Web
 *                      Store. Starts the 30-day clock. Absent → clock stopped.
 *   EXT_INSTALLS       optional manual override for store installs until the
 *                      Web Store API is wired (the store does not expose this
 *                      number without OAuth).
 */

export const KILL_DAY = 30;
export const KILL_MIN_SALES = 5;
export const KILL_MIN_INSTALLS = 300;
export const SCALE_SALES_PER_30D = 20;

export type Verdict = 'KILL' | 'KEEP' | 'SCALE' | 'NOT_LIVE';

export interface ExtensionMetrics {
  publishedAt: Date | null;
  installs: number | null;
  salesTotal: number;
  sales7d: number;
  sales30d: number;
  activeDevices7d: number;
  activeDevices30d: number;
  validations7d: number;
}

export interface CoreMetrics {
  signups7d: number;
  signupsTotal: number;
  paidProfiles: number;
  paddleEvents7d: number;
}

export interface WeeklyReport {
  generatedAt: Date;
  extension: ExtensionMetrics & { daysLive: number | null; verdict: Verdict; reason: string };
  core: CoreMetrics;
}

export function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / 86_400_000);
}

/** Pure rule. Installs are optional because the store does not report them yet. */
export function decideVerdict(
  m: ExtensionMetrics,
  now: Date,
): { verdict: Verdict; reason: string; daysLive: number | null } {
  if (!m.publishedAt) {
    return {
      verdict: 'NOT_LIVE',
      daysLive: null,
      reason: 'No publicada en la Chrome Web Store (EXT_PUBLISHED_AT vacío). El reloj de 30 días no ha empezado.',
    };
  }
  const daysLive = daysBetween(m.publishedAt, now);

  if (m.sales30d >= SCALE_SALES_PER_30D) {
    return {
      verdict: 'SCALE',
      daysLive,
      reason: `${m.sales30d} ventas en 30 días (umbral ${SCALE_SALES_PER_30D}). Invertir: reseñas, segundo canal (Edge Add-ons), P2.`,
    };
  }

  if (daysLive >= KILL_DAY) {
    const lowSales = m.salesTotal < KILL_MIN_SALES;
    const lowInstalls = m.installs !== null && m.installs < KILL_MIN_INSTALLS;
    if (lowSales || lowInstalls) {
      const parts = [];
      if (lowSales) parts.push(`${m.salesTotal} ventas < ${KILL_MIN_SALES}`);
      if (lowInstalls) parts.push(`${m.installs} instalaciones < ${KILL_MIN_INSTALLS}`);
      return {
        verdict: 'KILL',
        daysLive,
        reason: `Día ${daysLive}: ${parts.join(' y ')}. Retirar de la cola y arrancar P2 (=LLMCOST() Sheets + actor Apify).`,
      };
    }
    return {
      verdict: 'KEEP',
      daysLive,
      reason: `Día ${daysLive}: cruzó el umbral mínimo (${m.salesTotal} ventas). Seguir sin invertir más hasta ${SCALE_SALES_PER_30D}/30d.`,
    };
  }

  const salesPace = daysLive > 0 ? (m.salesTotal / daysLive) * KILL_DAY : 0;
  return {
    verdict: 'KEEP',
    daysLive,
    reason: `Día ${daysLive} de ${KILL_DAY}. Ritmo proyectado a día 30: ${salesPace.toFixed(1)} ventas (mínimo ${KILL_MIN_SALES}).`,
  };
}

export function buildReport(ext: ExtensionMetrics, core: CoreMetrics, now: Date): WeeklyReport {
  const d = decideVerdict(ext, now);
  return { generatedAt: now, extension: { ...ext, ...d }, core };
}

export function renderText(r: WeeklyReport): string {
  const e = r.extension;
  const installs = e.installs === null ? 'n/d (leer en el panel de la Web Store)' : String(e.installs);
  return [
    `LLMeter — reporte semanal ${r.generatedAt.toISOString().slice(0, 10)}`,
    '',
    `VEREDICTO P1 (Live Cost): ${e.verdict}`,
    e.reason,
    '',
    'Extensión',
    `  días publicada: ${e.daysLive ?? '—'}`,
    `  instalaciones: ${installs}`,
    `  ventas: total ${e.salesTotal} · 7d ${e.sales7d} · 30d ${e.sales30d}`,
    `  dispositivos activos: 7d ${e.activeDevices7d} · 30d ${e.activeDevices30d}`,
    `  validaciones de licencia 7d: ${e.validations7d}`,
    '',
    'LLMeter core',
    `  registros: 7d ${r.core.signups7d} · total ${r.core.signupsTotal}`,
    `  perfiles de pago: ${r.core.paidProfiles}`,
    `  eventos Paddle 7d: ${r.core.paddleEvents7d}`,
    '',
    `Reglas: KILL si día ≥${KILL_DAY} y (<${KILL_MIN_SALES} ventas o <${KILL_MIN_INSTALLS} instalaciones). SCALE si ≥${SCALE_SALES_PER_30D} ventas/30d.`,
  ].join('\n');
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c] as string);
}

export function renderHtml(r: WeeklyReport): string {
  const color = { KILL: '#b91c1c', KEEP: '#374151', SCALE: '#047857', NOT_LIVE: '#6b7280' }[r.extension.verdict];
  return `<div style="font-family:ui-monospace,Menlo,monospace;font-size:14px;line-height:1.5">
<p style="font-size:18px;font-weight:700;color:${color}">P1 Live Cost: ${r.extension.verdict}</p>
<pre style="white-space:pre-wrap">${escapeHtml(renderText(r))}</pre>
</div>`;
}

function iso(d: Date): string {
  return d.toISOString();
}

async function count(
  q: PromiseLike<{ count: number | null; error: { message: string } | null }>,
): Promise<number> {
  const { count: n, error } = await q;
  if (error) throw new Error(error.message);
  return n ?? 0;
}

export async function collectMetrics(now: Date): Promise<{ ext: ExtensionMetrics; core: CoreMetrics }> {
  const supabase = createAdminClient();
  const d7 = iso(new Date(now.getTime() - 7 * 86_400_000));
  const d30 = iso(new Date(now.getTime() - 30 * 86_400_000));

  const lic = () => supabase.from('extension_licenses').select('id', { count: 'exact', head: true });
  const dev = () => supabase.from('extension_license_devices').select('device_id', { count: 'exact', head: true });
  const prof = () => supabase.from('profiles').select('id', { count: 'exact', head: true });

  const [salesTotal, sales7d, sales30d, activeDevices7d, activeDevices30d, validations7d, signupsTotal, signups7d, paidProfiles, paddleEvents7d] =
    await Promise.all([
      count(lic().eq('status', 'active')),
      count(lic().gte('created_at', d7)),
      count(lic().gte('created_at', d30)),
      count(dev().gte('last_seen_at', d7)),
      count(dev().gte('last_seen_at', d30)),
      count(lic().gte('last_validated_at', d7)),
      count(prof()),
      count(prof().gte('created_at', d7)),
      count(prof().neq('plan', 'free')),
      count(supabase.from('paddle_events').select('id', { count: 'exact', head: true }).gte('created_at', d7)),
    ]);

  const publishedRaw = process.env.EXT_PUBLISHED_AT;
  const publishedAt = publishedRaw && !Number.isNaN(Date.parse(publishedRaw)) ? new Date(publishedRaw) : null;
  const installsRaw = process.env.EXT_INSTALLS;
  const installs = installsRaw && /^\d+$/.test(installsRaw) ? Number(installsRaw) : null;

  return {
    ext: { publishedAt, installs, salesTotal, sales7d, sales30d, activeDevices7d, activeDevices30d, validations7d },
    core: { signups7d, signupsTotal, paidProfiles, paddleEvents7d },
  };
}

export async function runWeeklyReport(now = new Date()): Promise<{ verdict: Verdict; emailed: boolean; text: string }> {
  const { ext, core } = await collectMetrics(now);
  const report = buildReport(ext, core, now);
  const text = renderText(report);

  const to = (process.env.WEEKLY_REPORT_TO ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const resend = getResendClient();
  let emailed = false;
  if (to.length && resend) {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject: `[LLMeter] P1 Live Cost: ${report.extension.verdict} — semana ${now.toISOString().slice(0, 10)}`,
      html: renderHtml(report),
      text,
    });
    if (error) console.error(`[cron/weekly-report] email failed: ${error.message}`);
    else emailed = true;
  } else {
    console.warn('[cron/weekly-report] WEEKLY_REPORT_TO or RESEND_API_KEY missing; report not emailed');
  }
  return { verdict: report.extension.verdict, emailed, text };
}
