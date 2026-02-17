import { inngest } from './client';

/**
 * Polls usage data from all active providers for a given user.
 * Scheduled to run every hour via Inngest cron.
 */
export const pollUsage = inngest.createFunction(
  { id: 'poll-usage', name: 'Poll Provider Usage Data' },
  { cron: '0 * * * *' }, // Every hour
  async ({ step }) => {
    // TODO: Implement provider polling
    // 1. Fetch all active providers
    // 2. For each provider, pull usage data
    // 3. Normalize and store in usage_records
    await step.run('fetch-providers', async () => {
      // Placeholder — will query Supabase for active providers
      return { providers: [] };
    });
  }
);

/**
 * Checks for anomalies in spending patterns.
 * Runs every 6 hours.
 */
export const checkAnomalies = inngest.createFunction(
  { id: 'check-anomalies', name: 'Check Spending Anomalies' },
  { cron: '0 */6 * * *' }, // Every 6 hours
  async ({ step }) => {
    await step.run('detect-anomalies', async () => {
      // TODO: Implement anomaly detection
      // Z-score + moving average approach
      return { anomalies: [] };
    });
  }
);

/**
 * Syncs usage data for a newly connected provider.
 * Triggered by event when user adds a provider.
 */
export const syncNewProvider = inngest.createFunction(
  { id: 'sync-new-provider', name: 'Sync New Provider Data' },
  { event: 'provider/connected' },
  async ({ event, step }) => {
    const { providerId, userId } = event.data;

    await step.run('initial-sync', async () => {
      // TODO: Pull last 30 days of usage data
      // This gives the user immediate value
      return { providerId, userId, synced: false };
    });
  }
);
