import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapCloudflare } from './cloudflare.js';

function makeCloudflareClient(response: Record<string, unknown>) {
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

describe('wrapCloudflare', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cf = makeCloudflareClient({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapCloudflare(cf, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cf = makeCloudflareClient({
      model: '@cf/meta/llama-3.1-8b-instruct-fast',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapCloudflare(cf, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: '@cf/meta/llama-3.1-8b-instruct-fast', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Cloudflare', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const cf = makeCloudflareClient({
      model: '@cf/mistral/mistral-7b-instruct-v0.1',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapCloudflare(cf, tracker);
    await wrapped.chat.completions.create(
      { model: '@cf/mistral/mistral-7b-instruct-v0.1', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (cf.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cf = makeCloudflareClient({
      model: '@cf/google/gemma-7b-it',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapCloudflare(cf, tracker);
    await wrapped.chat.completions.create({
      model: '@cf/google/gemma-7b-it',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const cf = makeCloudflareClient({ model: '@cf/meta/llama-3.2-3b-instruct' });
    const wrapped = wrapCloudflare(cf, tracker);
    await wrapped.chat.completions.create({
      model: '@cf/meta/llama-3.2-3b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const cf = makeCloudflareClient({
      model: '@cf/google/gemma-2b-it',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapCloudflare(cf, tracker);
    await wrapped.chat.completions.create(
      { model: '@cf/google/gemma-2b-it', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (cf.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const cf = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapCloudflare(cf, tracker);
    await (wrapped as typeof cf).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
