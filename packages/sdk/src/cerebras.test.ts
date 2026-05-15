import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapCerebras } from './cerebras.js';

function makeCerebrasClient(response: Record<string, unknown>) {
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

describe('wrapCerebras', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cerebras = makeCerebrasClient({
      model: 'llama-3.3-70b',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapCerebras(cerebras, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'llama-3.3-70b',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cerebras = makeCerebrasClient({
      model: 'llama3.1-8b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapCerebras(cerebras, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'llama3.1-8b', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Cerebras', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const cerebras = makeCerebrasClient({
      model: 'llama3.1-8b',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapCerebras(cerebras, tracker);
    await wrapped.chat.completions.create(
      { model: 'llama3.1-8b', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (cerebras.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cerebras = makeCerebrasClient({
      model: 'deepseek-r1-distill-llama-70b',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapCerebras(cerebras, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek-r1-distill-llama-70b',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cerebras = makeCerebrasClient({ model: 'llama-3.3-70b' });
    const wrapped = wrapCerebras(cerebras, tracker);
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const cerebras = makeCerebrasClient({
      model: 'qwen-3-32b',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapCerebras(cerebras, tracker);
    await wrapped.chat.completions.create(
      { model: 'qwen-3-32b', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (cerebras.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const cerebras = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapCerebras(cerebras, tracker);
    await (wrapped as typeof cerebras).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
