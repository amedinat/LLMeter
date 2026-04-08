import { describe, it, expect, vi, beforeEach } from 'vitest';
import { sendSlackAlert } from './send-alert';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sendSlackAlert', () => {
  const baseParams = {
    webhookUrl: 'https://hooks.slack.com/services/T000/B000/xxxx',
    alertType: 'monthly' as const,
    currentSpend: 75.5,
    threshold: 50,
  };

  it('sends POST request to the webhook URL', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const result = await sendSlackAlert(baseParams);
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe(baseParams.webhookUrl);
    expect(options.method).toBe('POST');
    expect(options.headers['Content-Type']).toBe('application/json');
  });

  it('includes alert type label in header block', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await sendSlackAlert(baseParams);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const headerBlock = body.blocks.find((b: { type: string }) => b.type === 'header');
    expect(headerBlock.text.text).toContain('Monthly Budget');
  });

  it('uses anomaly label for anomaly type', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await sendSlackAlert({ ...baseParams, alertType: 'anomaly' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const headerBlock = body.blocks.find((b: { type: string }) => b.type === 'header');
    expect(headerBlock.text.text).toContain('Anomaly');
  });

  it('uses daily label for daily threshold type', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await sendSlackAlert({ ...baseParams, alertType: 'daily' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const headerBlock = body.blocks.find((b: { type: string }) => b.type === 'header');
    expect(headerBlock.text.text).toContain('Daily Threshold');
  });

  it('includes top contributors when provided', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const contributors = [
      { model: 'gpt-4o', provider: 'openai', cost: 0.025 },
      { model: 'claude-3-5-sonnet', provider: 'anthropic', cost: 0.015 },
    ];
    await sendSlackAlert({ ...baseParams, topContributors: contributors });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const hasContributors = body.blocks.some(
      (b: { type: string; text?: { text: string } }) =>
        b.type === 'section' && b.text?.text?.includes('openai/gpt-4o')
    );
    expect(hasContributors).toBe(true);
  });

  it('skips contributors section when none provided', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await sendSlackAlert(baseParams);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const hasContributorsSection = body.blocks.some(
      (b: { type: string; text?: { text: string } }) =>
        b.type === 'section' && b.text?.text?.includes('Top contributors')
    );
    expect(hasContributorsSection).toBe(false);
  });

  it('includes dashboard URL in action button', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    await sendSlackAlert({ ...baseParams, dashboardUrl: 'https://llmeter.org/dashboard' });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const actionsBlock = body.blocks.find((b: { type: string }) => b.type === 'actions');
    expect(actionsBlock.elements[0].url).toBe('https://llmeter.org/dashboard');
  });

  it('returns false when webhook returns non-200', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400 });
    const result = await sendSlackAlert(baseParams);
    expect(result).toBe(false);
  });

  it('returns false when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('network error'));
    const result = await sendSlackAlert(baseParams);
    expect(result).toBe(false);
  });

  it('limits top contributors to 3 entries', async () => {
    mockFetch.mockResolvedValue({ ok: true });
    const contributors = [
      { model: 'gpt-4o', provider: 'openai', cost: 0.025 },
      { model: 'claude-3-5-sonnet', provider: 'anthropic', cost: 0.015 },
      { model: 'gemini-2.0-flash', provider: 'google', cost: 0.01 },
      { model: 'llama-3', provider: 'openrouter', cost: 0.005 },
    ];
    await sendSlackAlert({ ...baseParams, topContributors: contributors });
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const contributorsSection = body.blocks.find(
      (b: { type: string; text?: { text: string } }) =>
        b.type === 'section' && b.text?.text?.includes('Top contributors')
    );
    // Should have at most 3 bullet points (llama-3 should be excluded)
    expect(contributorsSection.text.text).not.toContain('llama-3');
  });
});
