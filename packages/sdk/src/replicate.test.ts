import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapReplicate } from './replicate.js';

function makeReplicateClient(response: Record<string, unknown>) {
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

describe('wrapReplicate', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const replicate = makeReplicateClient({
      model: 'meta/llama-3.3-70b-instruct',
      usage: { prompt_tokens: 600, completion_tokens: 250 },
    });

    const wrapped = wrapReplicate(replicate, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta/llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta/llama-3.3-70b-instruct',
      inputTokens: 600,
      outputTokens: 250,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const replicate = makeReplicateClient({
      model: 'deepseek-ai/deepseek-r1',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });

    const wrapped = wrapReplicate(replicate, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'deepseek-ai/deepseek-r1', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Replicate', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const replicate = makeReplicateClient({
      model: 'qwen/qwen2.5-72b-instruct',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapReplicate(replicate, tracker);
    await wrapped.chat.completions.create(
      { model: 'qwen/qwen2.5-72b-instruct', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (replicate.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const replicate = makeReplicateClient({
      model: 'meta/llama-3.1-8b-instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapReplicate(replicate, tracker);
    await wrapped.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const replicate = makeReplicateClient({ model: 'mistralai/mixtral-8x7b-instruct-v0.1' });
    const wrapped = wrapReplicate(replicate, tracker);
    await wrapped.chat.completions.create({
      model: 'mistralai/mixtral-8x7b-instruct-v0.1',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const replicate = makeReplicateClient({
      model: 'google-deepmind/gemma-2-9b-it',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapReplicate(replicate, tracker);
    await wrapped.chat.completions.create(
      { model: 'google-deepmind/gemma-2-9b-it', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (replicate.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const replicate = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapReplicate(replicate, tracker);
    await (wrapped as typeof replicate).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
