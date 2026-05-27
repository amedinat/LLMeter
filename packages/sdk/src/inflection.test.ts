import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapInflection } from './inflection.js';

function makeInflectionClient(response: Record<string, unknown>) {
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

describe('wrapInflection', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const inflection = makeInflectionClient({
      model: 'inflection-3-productivity',
      usage: { prompt_tokens: 200, completion_tokens: 80 },
    });

    const wrapped = wrapInflection(inflection, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'inflection-3-productivity',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'inflection-3-productivity',
      inputTokens: 200,
      outputTokens: 80,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const inflection = makeInflectionClient({
      model: 'inflection-3-pi',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapInflection(inflection, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'inflection-3-pi', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Inflection AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const inflection = makeInflectionClient({
      model: 'inflection-3-productivity',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapInflection(inflection, tracker);
    await wrapped.chat.completions.create(
      { model: 'inflection-3-productivity', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (inflection.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const inflection = makeInflectionClient({
      model: 'inflection-2.5',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapInflection(inflection, tracker);
    await wrapped.chat.completions.create({
      model: 'inflection-2.5',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const inflection = makeInflectionClient({ model: 'inflection-3-productivity' });
    const wrapped = wrapInflection(inflection, tracker);
    await wrapped.chat.completions.create({
      model: 'inflection-3-productivity',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const inflection = makeInflectionClient({
      model: 'inflection-3-pi',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapInflection(inflection, tracker);
    await wrapped.chat.completions.create(
      { model: 'inflection-3-pi', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (inflection.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const inflection = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapInflection(inflection, tracker);
    await (wrapped as typeof inflection).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
