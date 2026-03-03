import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { pollUsage, checkAlerts, syncNewProvider } from '@/lib/inngest/functions';
import { expireTrials, expireGracePeriods } from '@/lib/inngest/billing';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pollUsage, checkAlerts, syncNewProvider, expireTrials, expireGracePeriods],
});
