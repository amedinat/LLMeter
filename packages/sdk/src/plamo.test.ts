import { describe, it, expect, vi } from 'vitest';
import { wrapPLaMo } from './plamo.js';

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

describe('wrapPLaMo', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'plamo-100b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapPLaMo(client, tracker as never);

    await tracked.chat.completions.create({ model: 'plamo-100b', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'plamo-100b',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'plamo-1-prime',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapPLaMo(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'plamo-1-prime', messages: [] },
      { llmeter_customer_id: 'plamo_customer_123' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'plamo_customer_123' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'plamo-1-mini' });
    const tracker = makeTracker();
    const tracked = wrapPLaMo(client, tracker as never);

    await tracked.chat.completions.create({ model: 'plamo-1-mini', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({
      model: 'plamo-1-turbo',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapPLaMo(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'plamo-1-turbo', messages: [] },
      { llmeter_customer_id: 'tokyo_dev_456', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id not set', async () => {
    const client = makeMockClient({
      model: 'plamo-1-regular',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapPLaMo(client, tracker as never, 'plamo_app');

    await tracked.chat.completions.create({ model: 'plamo-1-regular', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'plamo_app' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'plamo-13b' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapPLaMo(client, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });
    const tracker = makeTracker();
    const tracked = wrapPLaMo(client, tracker as never);

    const params = {
      model: 'llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Chainerについて説明してください。' }],
      temperature: 0.7,
    };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
