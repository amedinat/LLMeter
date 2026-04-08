interface SlackAlertParams {
  webhookUrl: string;
  alertType: 'monthly' | 'daily' | 'anomaly';
  currentSpend: number;
  threshold: number;
  topContributors?: { model: string; provider: string; cost: number }[];
  dashboardUrl?: string;
}

/**
 * Sends an alert notification to a Slack channel via incoming webhook.
 * Only accepts Slack webhook URLs (https://hooks.slack.com/...) as validated
 * upstream by createAlertSchema.
 *
 * @returns true if successfully sent, false on error
 */
export async function sendSlackAlert(params: SlackAlertParams): Promise<boolean> {
  const { webhookUrl, alertType, currentSpend, threshold, topContributors, dashboardUrl } = params;

  const typeLabel =
    alertType === 'monthly' ? 'Monthly Budget' :
    alertType === 'anomaly' ? 'Anomaly Detected' :
    'Daily Threshold';

  const message =
    alertType === 'anomaly'
      ? `Today's spend (*$${currentSpend.toFixed(2)}*) is unusually high compared to your average (*$${threshold.toFixed(2)}*)`
      : `Your ${alertType} spend (*$${currentSpend.toFixed(2)}*) exceeded the threshold (*$${threshold.toFixed(2)}*)`;

  const contributorsText = (topContributors ?? [])
    .slice(0, 3)
    .map((c) => `• ${c.provider}/${c.model}: $${c.cost.toFixed(4)}`)
    .join('\n');

  const url = dashboardUrl ?? 'https://llmeter.org/dashboard';

  const body = {
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⚠️ LLMeter Alert: ${typeLabel}`,
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: message,
        },
      },
      ...(contributorsText
        ? [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*Top contributors:*\n${contributorsText}`,
              },
            },
          ]
        : []),
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'View Dashboard', emoji: true },
            url,
            style: 'primary',
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.warn(`[slack] Webhook returned ${res.status}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[slack] Failed to send alert:', err);
    return false;
  }
}
