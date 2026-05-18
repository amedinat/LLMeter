import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapNebius } from './nebius.js';

function makeNebiusClient(response: Record<string, unknown>) {
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

describe('wrapNebius', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nebius = makeNebiusClient({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapNebius(nebius, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/Llama-3.3-70B-Instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nebius = makeNebiusClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapNebius(nebius, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'deepseek-ai/DeepSeek-R1', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Nebius AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const nebius = makeNebiusClient({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapNebius(nebius, tracker);
    await wrapped.chat.completions.create(
      { model: 'Qwen/Qwen2.5-72B-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (nebius.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nebius = makeNebiusClient({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapNebius(nebius, tracker);
    await wrapped.chat.completions.create({
      model: 'meta-llama/Llama-3.1-8B-Instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const nebius = makeNebiusClient({ model: 'mistralai/Mistral-Nemo-Instruct-2407' });
    const wrapped = wrapNebius(nebius, tracker);
    await wrapped.chat.completions.create({
      model: 'mistralai/Mistral-Nemo-Instruct-2407',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const nebius = makeNebiusClient({
      model: 'google/gemma-2-9b-it',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapNebius(nebius, tracker);
    await wrapped.chat.completions.create(
      { model: 'google/gemma-2-9b-it', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (nebius.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const nebius = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapNebius(nebius, tracker);
    await (wrapped as typeof nebius).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
