import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapKyocera } from './kyocera.js';

function makeKaiClient(response: Record<string, unknown>) {
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

describe('wrapKyocera', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const kai = makeKaiClient({
      model: 'kai-34b-instruct',
      usage: { prompt_tokens: 600, completion_tokens: 250 },
    });

    const wrapped = wrapKyocera(kai, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'kai-34b-instruct',
      messages: [{ role: 'user', content: 'Analyse this ceramics manufacturing report.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'kai-34b-instruct',
      inputTokens: 600,
      outputTokens: 250,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const kai = makeKaiClient({
      model: 'kai-7b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapKyocera(kai, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'kai-7b', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Kyocera AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const kai = makeKaiClient({
      model: 'kai-34b',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapKyocera(kai, tracker);
    await wrapped.chat.completions.create(
      { model: 'kai-34b', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (kai.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const kai = makeKaiClient({
      model: 'kai-7b-instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapKyocera(kai, tracker);
    await wrapped.chat.completions.create({
      model: 'kai-7b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const kai = makeKaiClient({ model: 'kai-34b-instruct' });
    const wrapped = wrapKyocera(kai, tracker);
    await wrapped.chat.completions.create({
      model: 'kai-34b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const kai = makeKaiClient({
      model: 'kai-7b',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapKyocera(kai, tracker);
    await wrapped.chat.completions.create(
      { model: 'kai-7b', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (kai.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const kai = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapKyocera(kai, tracker);
    await (wrapped as typeof kai).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
