import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapSambaNova } from './sambanova.js';

function makeSambanovaClient(response: Record<string, unknown>) {
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

describe('wrapSambaNova', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sambanova = makeSambanovaClient({
      model: 'Meta-Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapSambaNova(sambanova, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'Meta-Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'Meta-Llama-3.3-70B-Instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sambanova = makeSambanovaClient({
      model: 'DeepSeek-R1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapSambaNova(sambanova, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'DeepSeek-R1', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to SambaNova', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const sambanova = makeSambanovaClient({
      model: 'Meta-Llama-3.1-405B-Instruct',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapSambaNova(sambanova, tracker);
    await wrapped.chat.completions.create(
      { model: 'Meta-Llama-3.1-405B-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (sambanova.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sambanova = makeSambanovaClient({
      model: 'Meta-Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapSambaNova(sambanova, tracker);
    await wrapped.chat.completions.create({
      model: 'Meta-Llama-3.1-8B-Instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sambanova = makeSambanovaClient({ model: 'Qwen2.5-72B-Instruct' });
    const wrapped = wrapSambaNova(sambanova, tracker);
    await wrapped.chat.completions.create({
      model: 'Qwen2.5-72B-Instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const sambanova = makeSambanovaClient({
      model: 'DeepSeek-V3',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapSambaNova(sambanova, tracker);
    await wrapped.chat.completions.create(
      { model: 'DeepSeek-V3', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (sambanova.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const sambanova = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapSambaNova(sambanova, tracker);
    await (wrapped as typeof sambanova).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
