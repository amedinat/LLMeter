import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapWatsonX } from './watsonx.js';

function makeWatsonXClient(response: Record<string, unknown>) {
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

describe('wrapWatsonX', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const watsonx = makeWatsonXClient({
      model: 'ibm/granite-3-2-8b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapWatsonX(watsonx, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'ibm/granite-3-2-8b-instruct',
      messages: [{ role: 'user', content: 'Hello from WatsonX!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'ibm/granite-3-2-8b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const watsonx = makeWatsonXClient({
      model: 'meta-llama/llama-3-3-70b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapWatsonX(watsonx, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'meta-llama/llama-3-3-70b-instruct', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to WatsonX', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const watsonx = makeWatsonXClient({
      model: 'ibm/granite-3-2-8b-instruct',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapWatsonX(watsonx, tracker);
    await wrapped.chat.completions.create(
      { model: 'ibm/granite-3-2-8b-instruct', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (watsonx.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const watsonx = makeWatsonXClient({
      model: 'ibm/granite-3-2-8b-instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapWatsonX(watsonx, tracker);
    await wrapped.chat.completions.create({
      model: 'ibm/granite-3-2-8b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const watsonx = makeWatsonXClient({ model: 'ibm/granite-13b-instruct-v2' });
    const wrapped = wrapWatsonX(watsonx, tracker);
    await wrapped.chat.completions.create({
      model: 'ibm/granite-13b-instruct-v2',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const watsonx = makeWatsonXClient({
      model: 'ibm/granite-3-2-8b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapWatsonX(watsonx, tracker);
    await wrapped.chat.completions.create(
      { model: 'ibm/granite-3-2-8b-instruct', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (watsonx.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const watsonx = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapWatsonX(watsonx, tracker);
    await (wrapped as typeof watsonx).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
