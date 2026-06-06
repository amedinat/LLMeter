import { describe, it, expect, vi } from 'vitest';
import { wrapSKTelecom } from './sktelecom.js';

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

describe('wrapSKTelecom', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'a-dot-70b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapSKTelecom(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'a-dot-70b',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'a-dot-70b',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'a-dot-7b',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapSKTelecom(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'a-dot-7b', messages: [] },
      { llmeter_customer_id: 'sktelecom_user_456' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'sktelecom_user_456' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'meta-llama/Llama-3.3-70B-Instruct' });
    const tracker = makeTracker();
    const tracked = wrapSKTelecom(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('strips llmeter_customer_id from options passed to the provider', async () => {
    const client = makeMockClient({
      model: 'a-dot-13b',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapSKTelecom(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'a-dot-13b', messages: [] },
      { llmeter_customer_id: 'sktelecom_enterprise_789', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('falls back to defaultCustomerId when no llmeter_customer_id in options', async () => {
    const client = makeMockClient({
      model: 'a-dot-70b',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapSKTelecom(
      client as never,
      tracker as never,
      'default-sktelecom-tenant'
    );

    await tracked.chat.completions.create({
      model: 'a-dot-70b',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default-sktelecom-tenant' })
    );
  });

  it('proxies all other properties on the client', async () => {
    const client = {
      ...makeMockClient({ model: 'meta-llama/Llama-3.1-8B-Instruct' }),
      someOtherProp: { doSomething: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapSKTelecom(client as never, tracker as never);

    expect((tracked as typeof client).someOtherProp).toBe(client.someOtherProp);
  });

  it('returns the completion result unchanged', async () => {
    const response = {
      model: 'a-dot-70b',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
      choices: [{ message: { role: 'assistant', content: '한국 AI 기술은 빠르게 발전하고 있습니다.' } }],
    };
    const client = makeMockClient(response);
    const tracker = makeTracker();
    const tracked = wrapSKTelecom(client as never, tracker as never);

    const result = await tracked.chat.completions.create({
      model: 'a-dot-70b',
      messages: [{ role: 'user', content: '한국 AI 기술의 최신 동향을 알려주세요.' }],
    });

    expect(result).toBe(response);
  });
});
