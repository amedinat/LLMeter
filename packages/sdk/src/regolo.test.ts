import { describe, it, expect, vi } from 'vitest';
import { wrapRegolo } from './regolo.js';

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

describe('wrapRegolo', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'llama-3.3-70b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapRegolo(client as never, tracker as never);

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
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapRegolo(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'mistral-7b-instruct', messages: [] },
      { llmeter_customer_id: 'tenant_italia_123' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'tenant_italia_123' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'llama-3.1-8b-instruct' });
    const tracker = makeTracker();
    const tracked = wrapRegolo(client as never, tracker as never);

    await tracked.chat.completions.create({ model: 'llama-3.1-8b-instruct', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({
      model: 'deepseek-r1',
      usage: { prompt_tokens: 50, completion_tokens: 200 },
    });
    const tracker = makeTracker();
    const tracked = wrapRegolo(client as never, tracker as never);

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
      model: 'qwen2.5-72b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapRegolo(client as never, tracker as never, 'eu_pipeline');

    await tracked.chat.completions.create({ model: 'qwen2.5-72b-instruct', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'eu_pipeline' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'phi-4' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapRegolo(client as never, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'mixtral-8x7b-instruct',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });
    const tracker = makeTracker();
    const tracked = wrapRegolo(client as never, tracker as never);

    const params = {
      model: 'mixtral-8x7b-instruct',
      messages: [{ role: 'user', content: 'Descrivi l\'architettura del Colosseo.' }],
      temperature: 0.7,
    };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
