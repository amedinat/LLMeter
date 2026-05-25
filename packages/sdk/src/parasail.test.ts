import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapParasail } from './parasail.js';

function makeParasailClient(response: Record<string, unknown>) {
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

describe('wrapParasail', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const parasail = makeParasailClient({
      model: 'deepseek-ai/DeepSeek-V3-0324',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapParasail(parasail, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3-0324',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'deepseek-ai/DeepSeek-V3-0324',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const parasail = makeParasailClient({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapParasail(parasail, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Parasail', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const parasail = makeParasailClient({
      model: 'google/gemma-4-27b-it',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapParasail(parasail, tracker);
    await wrapped.chat.completions.create(
      { model: 'google/gemma-4-27b-it', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (parasail.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const parasail = makeParasailClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapParasail(parasail, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-R1',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const parasail = makeParasailClient({ model: 'deepseek-ai/DeepSeek-V3-0324' });
    const wrapped = wrapParasail(parasail, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-V3-0324',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const parasail = makeParasailClient({
      model: 'Qwen/Qwen3-235B-A22B',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapParasail(parasail, tracker);
    await wrapped.chat.completions.create(
      { model: 'Qwen/Qwen3-235B-A22B', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (parasail.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const parasail = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapParasail(parasail, tracker);
    await (wrapped as typeof parasail).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
