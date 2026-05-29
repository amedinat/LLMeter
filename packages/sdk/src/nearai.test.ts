import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapNearAI } from './nearai.js';

function makeNearAIClient(response: Record<string, unknown>) {
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

describe('wrapNearAI', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nearai = makeNearAIClient({
      model: 'nearai/llama-3-3-70b',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapNearAI(nearai, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'nearai/llama-3-3-70b',
      messages: [{ role: 'user', content: 'Hello from NEAR AI!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'nearai/llama-3-3-70b',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nearai = makeNearAIClient({
      model: 'nearai/deepseek-r1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapNearAI(nearai, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'nearai/deepseek-r1',
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

    const nearai = makeNearAIClient({
      model: 'nearai/llama-3-1-8b',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapNearAI(nearai, tracker);
    await wrapped.chat.completions.create(
      { model: 'nearai/llama-3-1-8b', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = nearai.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nearai = makeNearAIClient({
      model: 'nearai/qwen-2-5-72b',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapNearAI(nearai, tracker);
    await wrapped.chat.completions.create({
      model: 'nearai/qwen-2-5-72b',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nearai = makeNearAIClient({ model: 'nearai/mistral-7b' });

    const wrapped = wrapNearAI(nearai, tracker);
    await wrapped.chat.completions.create({
      model: 'nearai/mistral-7b',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const nearai = makeNearAIClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (nearai as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapNearAI(nearai as typeof nearai & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'nearai/llama-3-1-70b',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from NEAR AI!' } }],
    };
    const nearai = makeNearAIClient(expectedResult);

    const wrapped = wrapNearAI(nearai, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'nearai/llama-3-1-70b',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
