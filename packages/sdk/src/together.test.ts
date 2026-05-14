import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapTogether } from './together.js';

function makeTogetherClient(response: Record<string, unknown>) {
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

describe('wrapTogether', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const together = makeTogetherClient({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapTogether(together, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const together = makeTogetherClient({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapTogether(together, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Together AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const together = makeTogetherClient({
      model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapTogether(together, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (together.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const together = makeTogetherClient({
      model: 'Qwen/Qwen2.5-72B-Instruct-Turbo',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapTogether(together, tracker);
    await wrapped.chat.completions.create({ model: 'Qwen/Qwen2.5-72B-Instruct-Turbo', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const together = makeTogetherClient({ model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo' });
    const wrapped = wrapTogether(together, tracker);
    await wrapped.chat.completions.create({ model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const together = makeTogetherClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapTogether(together, tracker);
    await wrapped.chat.completions.create(
      { model: 'deepseek-ai/DeepSeek-R1', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (together.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ text: 'response' });

    const together = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapTogether(together, tracker);
    await (wrapped as typeof together).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
