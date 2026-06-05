import { describe, it, expect, vi } from 'vitest';
import { wrapChinaMobile } from './chinamobile.js';

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

describe('wrapChinaMobile', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'jiutian-13b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapChinaMobile(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'jiutian-13b',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'jiutian-13b',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'jiutian-13b-v2',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapChinaMobile(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'jiutian-13b-v2', messages: [] },
      { llmeter_customer_id: 'chinamobile_user_456' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'chinamobile_user_456' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'llama-3.3-70b-instruct' });
    const tracker = makeTracker();
    const tracked = wrapChinaMobile(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'llama-3.3-70b-instruct',
      messages: [],
    });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('strips llmeter_customer_id from options passed to the provider', async () => {
    const client = makeMockClient({
      model: 'deepseek-v3',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapChinaMobile(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'deepseek-v3', messages: [] },
      { llmeter_customer_id: 'chinamobile_enterprise_789', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('falls back to defaultCustomerId when no llmeter_customer_id in options', async () => {
    const client = makeMockClient({
      model: 'jiutian-6b',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapChinaMobile(
      client as never,
      tracker as never,
      'default-chinamobile-tenant'
    );

    await tracked.chat.completions.create({ model: 'jiutian-6b', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default-chinamobile-tenant' })
    );
  });

  it('proxies all other properties on the client', async () => {
    const client = {
      ...makeMockClient({ model: 'qwen2.5-72b-instruct' }),
      someOtherProp: { doSomething: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapChinaMobile(client as never, tracker as never);

    expect((tracked as typeof client).someOtherProp).toBe(client.someOtherProp);
  });

  it('returns the completion result unchanged', async () => {
    const response = {
      model: 'jiutian-multimodal',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
      choices: [{ message: { role: 'assistant', content: '九天大模型 Jiutian response' } }],
    };
    const client = makeMockClient(response);
    const tracker = makeTracker();
    const tracked = wrapChinaMobile(client as never, tracker as never);

    const result = await tracked.chat.completions.create({
      model: 'jiutian-multimodal',
      messages: [{ role: 'user', content: '你好，中国移动九天大模型！' }],
    });

    expect(result).toBe(response);
  });
});
