import { describe, it, expect, vi } from 'vitest';
import { wrapInfomaniak } from './infomaniak.js';

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

describe('wrapInfomaniak', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapInfomaniak(client, tracker as never);

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
    const tracked = wrapInfomaniak(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'mistral-7b-instruct', messages: [] },
      { llmeter_customer_id: 'swiss_tenant_xyz' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'swiss_tenant_xyz' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'llama-3.1-8b-instruct' });
    const tracker = makeTracker();
    const tracked = wrapInfomaniak(client, tracker as never);

    await tracked.chat.completions.create({ model: 'llama-3.1-8b-instruct', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({ model: 'deepseek-r1', usage: { prompt_tokens: 5, completion_tokens: 5 } });
    const tracker = makeTracker();
    const tracked = wrapInfomaniak(client, tracker as never);

    await tracked.chat.completions.create(
      { model: 'deepseek-r1', messages: [] },
      { llmeter_customer_id: 'user_1', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id not set', async () => {
    const client = makeMockClient({
      model: 'mixtral-8x7b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });
    const tracker = makeTracker();
    const tracked = wrapInfomaniak(client, tracker as never, 'company_default');

    await tracked.chat.completions.create({ model: 'mixtral-8x7b-instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'company_default' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'qwen-2.5-72b-instruct' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapInfomaniak(client, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'llama-3.1-405b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapInfomaniak(client, tracker as never);

    const params = { model: 'llama-3.1-405b-instruct', messages: [{ role: 'user', content: 'test' }], temperature: 0.7 };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
