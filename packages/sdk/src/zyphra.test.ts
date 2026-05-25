import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapZyphra } from './zyphra.js';

function makeZyphraClient(response: Record<string, unknown>) {
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

describe('wrapZyphra', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const zyphra = makeZyphraClient({
      model: 'zamba2-7b-instruct',
      usage: { prompt_tokens: 300, completion_tokens: 120 },
    });

    const wrapped = wrapZyphra(zyphra, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'zamba2-7b-instruct',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'zamba2-7b-instruct',
      inputTokens: 300,
      outputTokens: 120,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const zyphra = makeZyphraClient({
      model: 'zamba2-2.7b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapZyphra(zyphra, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'zamba2-2.7b', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Zyphra', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const zyphra = makeZyphraClient({
      model: 'zamba2-1.2b',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapZyphra(zyphra, tracker);
    await wrapped.chat.completions.create(
      { model: 'zamba2-1.2b', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (zyphra.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const zyphra = makeZyphraClient({
      model: 'zamba2-7b',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapZyphra(zyphra, tracker);
    await wrapped.chat.completions.create({
      model: 'zamba2-7b',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const zyphra = makeZyphraClient({ model: 'zamba2-mini' });
    const wrapped = wrapZyphra(zyphra, tracker);
    await wrapped.chat.completions.create({
      model: 'zamba2-mini',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const zyphra = makeZyphraClient({
      model: 'zamba2-7b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapZyphra(zyphra, tracker);
    await wrapped.chat.completions.create(
      { model: 'zamba2-7b-instruct', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (zyphra.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const zyphra = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapZyphra(zyphra, tracker);
    await (wrapped as typeof zyphra).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
