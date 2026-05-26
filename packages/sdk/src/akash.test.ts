import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapAkash } from './akash.js';

function makeAkashClient(response: Record<string, unknown>) {
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

describe('wrapAkash', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const akash = makeAkashClient({
      model: 'Meta-Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapAkash(akash, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'Meta-Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'Meta-Llama-3.3-70B-Instruct',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const akash = makeAkashClient({
      model: 'Meta-Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapAkash(akash, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'Meta-Llama-3.1-8B-Instruct', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Akash', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const akash = makeAkashClient({
      model: 'Mistral-7B-Instruct-v0.3',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapAkash(akash, tracker);
    await wrapped.chat.completions.create(
      { model: 'Mistral-7B-Instruct-v0.3', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (akash.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const akash = makeAkashClient({
      model: 'DeepSeek-R1',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapAkash(akash, tracker);
    await wrapped.chat.completions.create({
      model: 'DeepSeek-R1',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const akash = makeAkashClient({ model: 'Meta-Llama-3.3-70B-Instruct' });
    const wrapped = wrapAkash(akash, tracker);
    await wrapped.chat.completions.create({
      model: 'Meta-Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const akash = makeAkashClient({
      model: 'Qwen2.5-72B-Instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapAkash(akash, tracker);
    await wrapped.chat.completions.create(
      { model: 'Qwen2.5-72B-Instruct', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (akash.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const akash = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapAkash(akash, tracker);
    await (wrapped as typeof akash).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
