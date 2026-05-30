import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapMiMo } from './mimo.js';

function makeMiMoClient(response: Record<string, unknown>) {
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

describe('wrapMiMo', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mimo = makeMiMoClient({
      model: 'mimo-v2.5-pro',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapMiMo(mimo, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'mimo-v2.5-pro',
      messages: [{ role: 'user', content: 'Hello from MiMo!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'mimo-v2.5-pro',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mimo = makeMiMoClient({
      model: 'mimo-v2-flash',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapMiMo(mimo, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'mimo-v2-flash',
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

    const mimo = makeMiMoClient({
      model: 'mimo-v2.5',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapMiMo(mimo, tracker);
    await wrapped.chat.completions.create(
      { model: 'mimo-v2.5', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = mimo.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mimo = makeMiMoClient({
      model: 'mimo-v2-omni',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapMiMo(mimo, tracker);
    await wrapped.chat.completions.create({
      model: 'mimo-v2-omni',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mimo = makeMiMoClient({ model: 'mimo-v2.5-pro' });

    const wrapped = wrapMiMo(mimo, tracker);
    await wrapped.chat.completions.create({
      model: 'mimo-v2.5-pro',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const mimo = makeMiMoClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (mimo as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapMiMo(mimo as typeof mimo & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'mimo-v2.5-pro',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from Xiaomi MiMo!' } }],
    };
    const mimo = makeMiMoClient(expectedResult);

    const wrapped = wrapMiMo(mimo, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'mimo-v2.5-pro',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
