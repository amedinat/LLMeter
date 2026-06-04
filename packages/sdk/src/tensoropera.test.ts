import { describe, it, expect, vi } from 'vitest';
import { wrapTensorOpera } from './tensoropera.js';

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

describe('wrapTensorOpera', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapTensorOpera(client, tracker as never);

    await tracked.chat.completions.create({ model: 'llama-3.3-70b-instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'llama-3.3-70b-instruct',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'mistral-7b-instruct',
      usage: { prompt_tokens: 20, completion_tokens: 10 },
    });
    const tracker = makeTracker();
    const tracked = wrapTensorOpera(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'mistral-7b-instruct', messages: [] },
      { llmeter_customer_id: 'tenant_xyz' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'tenant_xyz' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'llama-3.1-8b-instruct' });
    const tracker = makeTracker();
    const tracked = wrapTensorOpera(client, tracker as never);

    await tracked.chat.completions.create({ model: 'llama-3.1-8b-instruct', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({ model: 'deepseek-r1', usage: { prompt_tokens: 5, completion_tokens: 5 } });
    const tracker = makeTracker();
    const tracked = wrapTensorOpera(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'deepseek-r1', messages: [] },
      { llmeter_customer_id: 'user_1', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id is not set', async () => {
    const client = makeMockClient({
      model: 'qwen2.5-72b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });
    const tracker = makeTracker();
    const tracked = wrapTensorOpera(client, tracker as never, 'default_tenant');

    await tracked.chat.completions.create({ model: 'qwen2.5-72b-instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default_tenant' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'llama-3.1-70b-instruct', usage: { prompt_tokens: 10, completion_tokens: 5 } }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapTensorOpera(client, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params to underlying client unchanged', async () => {
    const client = makeMockClient({ model: 'mixtral-8x7b-instruct', usage: { prompt_tokens: 40, completion_tokens: 20 } });
    const tracker = makeTracker();
    const tracked = wrapTensorOpera(client, tracker as never);

    const params = { model: 'mixtral-8x7b-instruct', messages: [{ role: 'user', content: 'Hi' }], temperature: 0.7 };
    await tracked.chat.completions.create(params as never);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
