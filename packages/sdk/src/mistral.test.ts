import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapMistral } from './mistral.js';

function makeMistralClient(response: Record<string, unknown>) {
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

describe('wrapMistral', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mistral = makeMistralClient({
      model: 'mistral-large-latest',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapMistral(mistral, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'mistral-large-latest',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'mistral-large-latest',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mistral = makeMistralClient({
      model: 'mistral-small-latest',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapMistral(mistral, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'mistral-small-latest', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Mistral', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const mistral = makeMistralClient({
      model: 'mistral-medium-latest',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapMistral(mistral, tracker);
    await wrapped.chat.completions.create(
      { model: 'mistral-medium-latest', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (mistral.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mistral = makeMistralClient({
      model: 'codestral-latest',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapMistral(mistral, tracker);
    await wrapped.chat.completions.create({
      model: 'codestral-latest',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const mistral = makeMistralClient({ model: 'mistral-large-latest' });
    const wrapped = wrapMistral(mistral, tracker);
    await wrapped.chat.completions.create({
      model: 'mistral-large-latest',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const mistral = makeMistralClient({
      model: 'mistral-small-latest',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapMistral(mistral, tracker);
    await wrapped.chat.completions.create(
      { model: 'mistral-small-latest', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (mistral.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ id: 'emb_123' });

    const mistral = {
      chat: {
        completions: { create: vi.fn() },
      },
      embeddings: { create: originalFn },
    };

    const wrapped = wrapMistral(mistral, tracker);
    await (wrapped as typeof mistral).embeddings.create({});
    expect(originalFn).toHaveBeenCalled();
  });
});
