import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapYi } from './yi.js';

function makeYiClient(response: Record<string, unknown>) {
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

describe('wrapYi', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const yi = makeYiClient({
      model: 'yi-lightning',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapYi(yi, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'yi-lightning',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'yi-lightning',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const yi = makeYiClient({
      model: 'yi-large',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapYi(yi, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'yi-large', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to 01.AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const yi = makeYiClient({
      model: 'yi-medium',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapYi(yi, tracker);
    await wrapped.chat.completions.create(
      { model: 'yi-medium', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (yi.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const yi = makeYiClient({
      model: 'yi-spark',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapYi(yi, tracker);
    await wrapped.chat.completions.create({
      model: 'yi-spark',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const yi = makeYiClient({ model: 'yi-large-turbo' });
    const wrapped = wrapYi(yi, tracker);
    await wrapped.chat.completions.create({
      model: 'yi-large-turbo',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const yi = makeYiClient({
      model: 'yi-large-preview',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapYi(yi, tracker);
    await wrapped.chat.completions.create(
      { model: 'yi-large-preview', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (yi.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const yi = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapYi(yi, tracker);
    await (wrapped as typeof yi).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
