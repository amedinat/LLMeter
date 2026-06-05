import { describe, it, expect, vi } from 'vitest';
import { wrapChinaUnicom } from './chinaunicom.js';

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

describe('wrapChinaUnicom', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'yuanjing-pro',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapChinaUnicom(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'yuanjing-pro',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'yuanjing-pro',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'yuanjing-standard',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapChinaUnicom(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'yuanjing-standard', messages: [] },
      { llmeter_customer_id: 'unicom_user_456' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'unicom_user_456' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'llama-3.3-70b-instruct' });
    const tracker = makeTracker();
    const tracked = wrapChinaUnicom(client as never, tracker as never);

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
    const tracked = wrapChinaUnicom(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'deepseek-v3', messages: [] },
      { llmeter_customer_id: 'unicom_enterprise_789', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('falls back to defaultCustomerId when no llmeter_customer_id in options', async () => {
    const client = makeMockClient({
      model: 'yuanjing-pro',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapChinaUnicom(
      client as never,
      tracker as never,
      'default-unicom-tenant'
    );

    await tracked.chat.completions.create({ model: 'yuanjing-pro', messages: [] });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default-unicom-tenant' })
    );
  });

  it('proxies all other properties on the client', async () => {
    const client = {
      ...makeMockClient({ model: 'qwen2.5-72b-instruct' }),
      someOtherProp: { doSomething: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapChinaUnicom(client as never, tracker as never);

    expect((tracked as typeof client).someOtherProp).toBe(client.someOtherProp);
  });

  it('returns the completion result unchanged', async () => {
    const response = {
      model: 'yuanjing-plus',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
      choices: [{ message: { role: 'assistant', content: '元景大模型响应' } }],
    };
    const client = makeMockClient(response);
    const tracker = makeTracker();
    const tracked = wrapChinaUnicom(client as never, tracker as never);

    const result = await tracked.chat.completions.create({
      model: 'yuanjing-plus',
      messages: [{ role: 'user', content: '你好，中国联通元景!' }],
    });

    expect(result).toBe(response);
  });
});
