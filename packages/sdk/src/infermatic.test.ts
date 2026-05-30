import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapInfermatic } from './infermatic.js';

function makeInfermaticClient(response: Record<string, unknown>) {
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

describe('wrapInfermatic', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infermatic = makeInfermaticClient({
      model: 'infermatic/mn-midnight-rose-103b',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapInfermatic(infermatic, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'infermatic/mn-midnight-rose-103b',
      messages: [{ role: 'user', content: 'Hello from Infermatic!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'infermatic/mn-midnight-rose-103b',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infermatic = makeInfermaticClient({
      model: 'infermatic/wizardlm-2-70b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapInfermatic(infermatic, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'infermatic/wizardlm-2-70b',
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

    const infermatic = makeInfermaticClient({
      model: 'infermatic/openhermes-2.5-mistral-7b',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapInfermatic(infermatic, tracker);
    await wrapped.chat.completions.create(
      { model: 'infermatic/openhermes-2.5-mistral-7b', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = infermatic.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infermatic = makeInfermaticClient({
      model: 'infermatic/mythomax-l2-13b',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapInfermatic(infermatic, tracker);
    await wrapped.chat.completions.create({
      model: 'infermatic/mythomax-l2-13b',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const infermatic = makeInfermaticClient({ model: 'infermatic/mistral-7b-instruct' });

    const wrapped = wrapInfermatic(infermatic, tracker);
    await wrapped.chat.completions.create({
      model: 'infermatic/mistral-7b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const infermatic = makeInfermaticClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (infermatic as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapInfermatic(infermatic as typeof infermatic & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'infermatic/llama-3-70b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from Infermatic!' } }],
    };
    const infermatic = makeInfermaticClient(expectedResult);

    const wrapped = wrapInfermatic(infermatic, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'infermatic/llama-3-70b-instruct',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
