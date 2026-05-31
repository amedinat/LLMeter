import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapStability } from './stability.js';

function makeStabilityClient(response: Record<string, unknown>) {
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

describe('wrapStability', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const stability = makeStabilityClient({
      model: 'stablelm-2-12b-chat',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapStability(stability, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'stablelm-2-12b-chat',
      messages: [{ role: 'user', content: 'Hello from StableLM!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'stablelm-2-12b-chat',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const stability = makeStabilityClient({
      model: 'stablelm-zephyr-3b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapStability(stability, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'stablelm-zephyr-3b',
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

    const stability = makeStabilityClient({
      model: 'stable-code-3b',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapStability(stability, tracker);
    await wrapped.chat.completions.create(
      { model: 'stable-code-3b', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = stability.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const stability = makeStabilityClient({
      model: 'stablelm-2-12b-chat',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapStability(stability, tracker);
    await wrapped.chat.completions.create({
      model: 'stablelm-2-12b-chat',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const stability = makeStabilityClient({ model: 'stablelm-2-12b-chat' });

    const wrapped = wrapStability(stability, tracker);
    await wrapped.chat.completions.create({
      model: 'stablelm-2-12b-chat',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const stability = makeStabilityClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (stability as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapStability(stability as typeof stability & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'stablelm-2-12b-chat',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from StableLM 2 — open-source Apache 2.0 language model!' } }],
    };
    const stability = makeStabilityClient(expectedResult);

    const wrapped = wrapStability(stability, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'stablelm-2-12b-chat',
      messages: [{ role: 'user', content: 'Hello from Stability AI!' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
