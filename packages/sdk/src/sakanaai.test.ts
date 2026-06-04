import { describe, it, expect, vi } from 'vitest';
import { wrapSakanaAI } from './sakanaai.js';

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

describe('wrapSakanaAI', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'EvoLLM-JP-v1-7B',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapSakanaAI(client as never, tracker as never);

    await tracked.chat.completions.create({ model: 'EvoLLM-JP-v1-7B', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'EvoLLM-JP-v1-7B',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapSakanaAI(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'Llama-3.3-70B-Instruct', messages: [] },
      { llmeter_customer_id: 'sakana_user_123' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'sakana_user_123' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'Mistral-7B-Instruct' });
    const tracker = makeTracker();
    const tracked = wrapSakanaAI(client as never, tracker as never);

    await tracked.chat.completions.create({ model: 'Mistral-7B-Instruct', messages: [] });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('removes llmeter_customer_id from options before forwarding', async () => {
    const client = makeMockClient({
      model: 'EvoLLM-JP-A-v1-7B',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapSakanaAI(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'EvoLLM-JP-A-v1-7B', messages: [] },
      { llmeter_customer_id: 'jp_dev_456', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('uses defaultCustomerId when llmeter_customer_id not set', async () => {
    const client = makeMockClient({
      model: 'DeepSeek-R1',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapSakanaAI(client as never, tracker as never, 'sakana_app');

    await tracked.chat.completions.create({ model: 'DeepSeek-R1', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'sakana_app' })
    );
  });

  it('passes through non-chat properties unchanged', async () => {
    const client = {
      ...makeMockClient({ model: 'EvoVLM-JP-v1-7B' }),
      models: { list: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapSakanaAI(client as never, tracker as never);

    expect((tracked as typeof client).models).toBe(client.models);
  });

  it('forwards params correctly to underlying client', async () => {
    const client = makeMockClient({
      model: 'Qwen2.5-72B-Instruct',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });
    const tracker = makeTracker();
    const tracked = wrapSakanaAI(client as never, tracker as never);

    const params = {
      model: 'Qwen2.5-72B-Instruct',
      messages: [{ role: 'user', content: '進化的AIモデルマージについて説明してください。' }],
      temperature: 0.7,
    };
    await tracked.chat.completions.create(params);

    expect(client.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });
});
