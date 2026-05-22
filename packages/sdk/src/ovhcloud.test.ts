import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapOVHcloud } from './ovhcloud.js';

function makeOVHcloudClient(response: Record<string, unknown>) {
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

describe('wrapOVHcloud', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ovhcloud = makeOVHcloudClient({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapOVHcloud(ovhcloud, tracker, 'user_eu');
    await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      messages: [{ role: 'user', content: 'Bonjour depuis l\'Europe!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_eu',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ovhcloud = makeOVHcloudClient({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapOVHcloud(ovhcloud, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'mistralai/Mistral-7B-Instruct-v0.3', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to OVHcloud', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const ovhcloud = makeOVHcloudClient({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapOVHcloud(ovhcloud, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Meta-Llama-3.1-70B-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (ovhcloud.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ovhcloud = makeOVHcloudClient({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapOVHcloud(ovhcloud, tracker);
    await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ovhcloud = makeOVHcloudClient({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
    });
    const wrapped = wrapOVHcloud(ovhcloud, tracker);
    await wrapped.chat.completions.create({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const ovhcloud = makeOVHcloudClient({
      model: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapOVHcloud(ovhcloud, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Meta-Llama-3.1-70B-Instruct', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (ovhcloud.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const ovhcloud = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapOVHcloud(ovhcloud, tracker);
    await (wrapped as typeof ovhcloud).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
