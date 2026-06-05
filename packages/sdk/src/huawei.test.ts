import { describe, it, expect, vi } from 'vitest';
import { wrapHuawei } from './huawei.js';

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

describe('wrapHuawei', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'pangu-pro',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapHuawei(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'pangu-pro',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'pangu-pro',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'pangu-standard',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapHuawei(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'pangu-standard', messages: [] },
      { llmeter_customer_id: 'huawei_user_456' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'huawei_user_456' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'llama-3.3-70b-instruct' });
    const tracker = makeTracker();
    const tracked = wrapHuawei(client as never, tracker as never);

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
    const tracked = wrapHuawei(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'deepseek-v3', messages: [] },
      { llmeter_customer_id: 'huawei_enterprise_789', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('falls back to defaultCustomerId when no llmeter_customer_id in options', async () => {
    const client = makeMockClient({
      model: 'pangu-pro',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapHuawei(
      client as never,
      tracker as never,
      'default-huawei-tenant'
    );

    await tracked.chat.completions.create({ model: 'pangu-pro', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default-huawei-tenant' })
    );
  });

  it('proxies all other properties on the client', async () => {
    const client = {
      ...makeMockClient({ model: 'qwen2.5-72b-instruct' }),
      someOtherProp: { doSomething: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapHuawei(client as never, tracker as never);

    expect((tracked as typeof client).someOtherProp).toBe(client.someOtherProp);
  });

  it('returns the completion result unchanged', async () => {
    const response = {
      model: 'pangu-ultra',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
      choices: [{ message: { role: 'assistant', content: '盘古大模型响应' } }],
    };
    const client = makeMockClient(response);
    const tracker = makeTracker();
    const tracked = wrapHuawei(client as never, tracker as never);

    const result = await tracked.chat.completions.create({
      model: 'pangu-ultra',
      messages: [{ role: 'user', content: '你好，华为盘古!' }],
    });

    expect(result).toBe(response);
  });
});
