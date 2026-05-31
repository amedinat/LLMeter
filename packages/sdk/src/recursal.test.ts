import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapRecursal } from './recursal.js';

function makeRecursalClient(response: Record<string, unknown>) {
  return {
    chat: {
      completions: {
        create: vi.fn().mockResolvedValue(response),
      },
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapRecursal', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const recursal = makeRecursalClient({
      model: 'RWKV/v6-Finch-14B-HF',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapRecursal(recursal, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'RWKV/v6-Finch-14B-HF',
      messages: [{ role: 'user', content: 'Hello from RWKV!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'RWKV/v6-Finch-14B-HF',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const recursal = makeRecursalClient({
      model: 'RWKV/v6-Finch-7B-HF',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapRecursal(recursal, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'RWKV/v6-Finch-7B-HF',
        messages: [{ role: 'user', content: 'test' }],
      },
      { llmeter_customer_id: 'customer_xyz' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer_xyz' })
    );
  });

  it('strips llmeter_customer_id from options before forwarding', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const recursal = makeRecursalClient({
      model: 'RWKV/v5-Eagle-7B-HF',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapRecursal(recursal, tracker);
    await wrapped.chat.completions.create(
      { model: 'RWKV/v5-Eagle-7B-HF', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = recursal.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const recursal = makeRecursalClient({
      model: 'RWKV/v6-Finch-14B-HF',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapRecursal(recursal, tracker);
    await wrapped.chat.completions.create({
      model: 'RWKV/v6-Finch-14B-HF',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const recursal = makeRecursalClient({ model: 'RWKV/v6-Finch-14B-HF' });

    const wrapped = wrapRecursal(recursal, tracker);
    await wrapped.chat.completions.create({
      model: 'RWKV/v6-Finch-14B-HF',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const recursal = makeRecursalClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (recursal as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapRecursal(recursal as typeof recursal & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'RWKV/v6-Finch-14B-HF',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from RWKV attention-free inference!' } }],
    };
    const recursal = makeRecursalClient(expectedResult);

    const wrapped = wrapRecursal(recursal, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'RWKV/v6-Finch-14B-HF',
      messages: [{ role: 'user', content: 'Hello from Recursal!' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
