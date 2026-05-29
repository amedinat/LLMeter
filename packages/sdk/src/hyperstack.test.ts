import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapHyperstack } from './hyperstack.js';

function makeHyperstackClient(response: Record<string, unknown>) {
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

describe('wrapHyperstack', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const hyperstack = makeHyperstackClient({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapHyperstack(hyperstack, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello from Hyperstack!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const hyperstack = makeHyperstackClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapHyperstack(hyperstack, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'deepseek-ai/DeepSeek-R1',
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

    const hyperstack = makeHyperstackClient({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapHyperstack(hyperstack, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Meta-Llama-3.1-8B-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = hyperstack.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const hyperstack = makeHyperstackClient({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapHyperstack(hyperstack, tracker);
    await wrapped.chat.completions.create({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const hyperstack = makeHyperstackClient({ model: 'mistralai/Mistral-7B-Instruct-v0.3' });

    const wrapped = wrapHyperstack(hyperstack, tracker);
    await wrapped.chat.completions.create({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const hyperstack = makeHyperstackClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (hyperstack as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapHyperstack(hyperstack as typeof hyperstack & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from Hyperstack!' } }],
    };
    const hyperstack = makeHyperstackClient(expectedResult);

    const wrapped = wrapHyperstack(hyperstack, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
