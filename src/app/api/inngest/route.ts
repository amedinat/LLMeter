/**
 * Inngest endpoint — exposes function metadata by design.
 * This is intentional and secured by the Inngest signing key
 * (INNGEST_SIGNING_KEY env var) which validates all incoming requests.
 */
import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { pollUsage, checkAlerts, syncNewProvider } from '@/lib/inngest/functions';
import { expireTrials, expireGracePeriods } from '@/lib/inngest/billing';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pollUsage, checkAlerts, syncNewProvider, expireTrials, expireGracePeriods],
});
