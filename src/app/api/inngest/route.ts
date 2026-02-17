import { serve } from 'inngest/next';
import { inngest } from '@/lib/inngest/client';
import { pollUsage, checkAnomalies, syncNewProvider } from '@/lib/inngest/functions';

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [pollUsage, checkAnomalies, syncNewProvider],
});
