import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapHeurist } from './heurist.js';

function makeHeuristClient(response: Record<string, unknown>) {
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

describe('wrapHeurist', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const heurist = makeHeuristClient({
      model: 'meta-llama/llama-3.3-70b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapHeurist(heurist, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Hello from Heurist!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/llama-3.3-70b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const heurist = makeHeuristClient({
      model: 'deepseek-ai/deepseek-r1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapHeurist(heurist, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'deepseek-ai/deepseek-r1',
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

    const heurist = makeHeuristClient({
      model: 'mistralai/mistral-7b-instruct-v0.3',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapHeurist(heurist, tracker);
    await wrapped.chat.completions.create(
      { model: 'mistralai/mistral-7b-instruct-v0.3', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = heurist.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const heurist = makeHeuristClient({
      model: 'qwen/qwen2.5-72b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapHeurist(heurist, tracker);
    await wrapped.chat.completions.create({
      model: 'qwen/qwen2.5-72b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const heurist = makeHeuristClient({ model: 'microsoft/phi-3-mini-128k-instruct' });

    const wrapped = wrapHeurist(heurist, tracker);
    await wrapped.chat.completions.create({
      model: 'microsoft/phi-3-mini-128k-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const heurist = makeHeuristClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (heurist as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapHeurist(heurist as typeof heurist & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'meta-llama/llama-3.1-70b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from Heurist!' } }],
    };
    const heurist = makeHeuristClient(expectedResult);

    const wrapped = wrapHeurist(heurist, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'meta-llama/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
