import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapNousResearch } from './nousresearch.js';

function makeNousResearchClient(response: Record<string, unknown>) {
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

describe('wrapNousResearch', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nous = makeNousResearchClient({
      model: 'NousResearch/Hermes-3-Llama-3.1-70B',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapNousResearch(nous, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'NousResearch/Hermes-3-Llama-3.1-70B',
      messages: [{ role: 'user', content: 'Hello from Nous Forge!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'NousResearch/Hermes-3-Llama-3.1-70B',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nous = makeNousResearchClient({
      model: 'NousResearch/Hermes-2-Pro-Mistral-7B',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapNousResearch(nous, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'NousResearch/Hermes-2-Pro-Mistral-7B',
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

    const nous = makeNousResearchClient({
      model: 'NousResearch/Hermes-3-Llama-3.1-8B',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapNousResearch(nous, tracker);
    await wrapped.chat.completions.create(
      { model: 'NousResearch/Hermes-3-Llama-3.1-8B', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = nous.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nous = makeNousResearchClient({
      model: 'NousResearch/Hermes-2-Pro-Mistral-7B',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapNousResearch(nous, tracker);
    await wrapped.chat.completions.create({
      model: 'NousResearch/Hermes-2-Pro-Mistral-7B',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nous = makeNousResearchClient({ model: 'NousResearch/Hermes-3-Llama-3.1-70B' });

    const wrapped = wrapNousResearch(nous, tracker);
    await wrapped.chat.completions.create({
      model: 'NousResearch/Hermes-3-Llama-3.1-70B',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const nous = makeNousResearchClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (nous as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapNousResearch(nous as typeof nous & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'NousResearch/Hermes-3-Llama-3.1-405B',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from Nous Forge!' } }],
    };
    const nous = makeNousResearchClient(expectedResult);

    const wrapped = wrapNousResearch(nous, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'NousResearch/Hermes-3-Llama-3.1-405B',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
