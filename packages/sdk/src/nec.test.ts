import { describe, it, expect, vi } from 'vitest';
import { wrapNEC } from './nec.js';

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

describe('wrapNEC', () => {
  it('tracks usage when completion includes usage data', async () => {
    const client = makeMockClient({
      model: 'cotomi-pro-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });
    const tracker = makeTracker();
    const tracked = wrapNEC(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'cotomi-pro-instruct',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith({
      model: 'cotomi-pro-instruct',
      inputTokens: 100,
      outputTokens: 50,
      customerId: 'anonymous',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const client = makeMockClient({
      model: 'cotomi-light',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });
    const tracker = makeTracker();
    const tracked = wrapNEC(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'cotomi-light', messages: [] },
      { llmeter_customer_id: 'nec_user_456' } as never
    );

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'nec_user_456' })
    );
  });

  it('does not track when usage is missing', async () => {
    const client = makeMockClient({ model: 'meta-llama/Llama-3.3-70B-Instruct' });
    const tracker = makeTracker();
    const tracked = wrapNEC(client as never, tracker as never);

    await tracked.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(tracker.track).not.toHaveBeenCalled();
  });

  it('strips llmeter_customer_id from options passed to the provider', async () => {
    const client = makeMockClient({
      model: 'cotomi-pro',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });
    const tracker = makeTracker();
    const tracked = wrapNEC(client as never, tracker as never);

    await tracked.chat.completions.create(
      { model: 'cotomi-pro', messages: [] },
      { llmeter_customer_id: 'nec_enterprise_789', stream: false } as never
    );

    const callArgs = client.chat.completions.create.mock.calls[0];
    const opts = callArgs[1] as Record<string, unknown>;
    expect(opts).not.toHaveProperty('llmeter_customer_id');
    expect(opts).toHaveProperty('stream', false);
  });

  it('falls back to defaultCustomerId when no llmeter_customer_id in options', async () => {
    const client = makeMockClient({
      model: 'cotomi-pro-instruct',
      usage: { prompt_tokens: 150, completion_tokens: 75 },
    });
    const tracker = makeTracker();
    const tracked = wrapNEC(
      client as never,
      tracker as never,
      'default-nec-tenant'
    );

    await tracked.chat.completions.create({
      model: 'cotomi-pro-instruct',
      messages: [],
    });

    expect(tracker.track).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default-nec-tenant' })
    );
  });

  it('proxies all other properties on the client', async () => {
    const client = {
      ...makeMockClient({ model: 'meta-llama/Llama-3.1-8B-Instruct' }),
      someOtherProp: { doSomething: vi.fn() },
    };
    const tracker = makeTracker();
    const tracked = wrapNEC(client as never, tracker as never);

    expect((tracked as typeof client).someOtherProp).toBe(client.someOtherProp);
  });

  it('returns the completion result unchanged', async () => {
    const response = {
      model: 'cotomi-pro-vision',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
      choices: [{ message: { role: 'assistant', content: '製造業の品質管理において、AIは不良品検出率を98%以上に向上させました。' } }],
    };
    const client = makeMockClient(response);
    const tracker = makeTracker();
    const tracked = wrapNEC(client as never, tracker as never);

    const result = await tracked.chat.completions.create({
      model: 'cotomi-pro-vision',
      messages: [{ role: 'user', content: '製造業における品質管理のAI活用事例を教えてください。' }],
    });

    expect(result).toBe(response);
  });
});
