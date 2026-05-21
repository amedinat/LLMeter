import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapSarvam } from './sarvam.js';

function makeSarvamClient(response: Record<string, unknown>) {
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

describe('wrapSarvam', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sarvam = makeSarvamClient({
      model: 'sarvam-m',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapSarvam(sarvam, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'sarvam-m',
      messages: [{ role: 'user', content: 'नमस्ते!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'sarvam-m',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sarvam = makeSarvamClient({
      model: 'sarvam-1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapSarvam(sarvam, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'sarvam-1', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Sarvam AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const sarvam = makeSarvamClient({
      model: 'sarvam-m',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapSarvam(sarvam, tracker);
    await wrapped.chat.completions.create(
      { model: 'sarvam-m', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (sarvam.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sarvam = makeSarvamClient({
      model: 'sarvam-2b-v0.5',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapSarvam(sarvam, tracker);
    await wrapped.chat.completions.create({
      model: 'sarvam-2b-v0.5',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sarvam = makeSarvamClient({ model: 'sarvam-m' });
    const wrapped = wrapSarvam(sarvam, tracker);
    await wrapped.chat.completions.create({
      model: 'sarvam-m',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const sarvam = makeSarvamClient({
      model: 'sarvam-m',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapSarvam(sarvam, tracker);
    await wrapped.chat.completions.create(
      { model: 'sarvam-m', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (sarvam.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const sarvam = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapSarvam(sarvam, tracker);
    await (wrapped as typeof sarvam).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
