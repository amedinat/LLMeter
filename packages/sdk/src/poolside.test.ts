import { describe, it, expect, vi } from 'vitest';
import { wrapPoolside } from './poolside.js';

function makeMockClient(response: Record<string, unknown>) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(response),
      },
    },
  };
}

function makeTracker() {
  return { track: vi.fn() };
}

describe('wrapPoolside', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'poolside-malibu-70b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapPoolside(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'poolside-malibu-70b',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'poolside-malibu-70b',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'poolside-malibu-13b',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapPoolside(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'poolside-malibu-13b', messages: [] },
      { llmeter_customer_id: 'poolside_user_123' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'poolside_user_123' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'poolside-malibu-7b' });
    const tracker = makeTracker();
    const tracked = wrapPoolside(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'poolside-malibu-7b',
      messages: [],
    });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapPoolside(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'deepseek-ai/DeepSeek-R1', messages: [] },
      { llmeter_customer_id: 'enterprise_dev_456', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id not set', async () => {
    const client = makeMockClient({
      model: 'poolside-malibu-70b',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapPoolside(client as never, tracker as never, 'poolside_app');

    await tracked.chat.completions.create({ model: 'poolside-malibu-70b', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'poolside_app' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'meta-llama/Llama-3.1-8B-Instruct' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapPoolside(client as never, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'poolside-malibu-70b',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });
    const tracker = makeTracker();
    const tracked = wrapPoolside(client as never, tracker as never);

    const params = {
      model: 'poolside-malibu-70b',
      messages: [{ role: 'user', content: 'Write a TypeScript function to safely parse JSON.' }],
      temperature: 0.2,
    };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
