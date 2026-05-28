import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapFal } from './fal.js';

function makeFalClient(response: Record<string, unknown>) {
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

describe('wrapFal', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const fal = makeFalClient({
      model: 'fal-ai/meta-llama-3.3-70b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapFal(fal, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'fal-ai/meta-llama-3.3-70b-instruct',
      messages: [{ role: 'user', content: 'Hello from fal.ai!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'fal-ai/meta-llama-3.3-70b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const fal = makeFalClient({
      model: 'fal-ai/deepseek-r1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapFal(fal, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'fal-ai/deepseek-r1', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to fal.ai', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const fal = makeFalClient({
      model: 'fal-ai/meta-llama-3.3-70b-instruct',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapFal(fal, tracker);
    await wrapped.chat.completions.create(
      { model: 'fal-ai/meta-llama-3.3-70b-instruct', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (fal.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const fal = makeFalClient({ model: 'fal-ai/meta-llama-3.3-70b-instruct' });
    const wrapped = wrapFal(fal, tracker);
    await wrapped.chat.completions.create({
      model: 'fal-ai/meta-llama-3.3-70b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const fal = makeFalClient({
      model: 'fal-ai/meta-llama-3.3-70b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapFal(fal, tracker);
    await wrapped.chat.completions.create(
      { model: 'fal-ai/meta-llama-3.3-70b-instruct', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (fal.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('uses defaultCustomerId when no options provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const fal = makeFalClient({
      model: 'fal-ai/meta-llama-3.3-70b-instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapFal(fal, tracker);
    await wrapped.chat.completions.create({
      model: 'fal-ai/meta-llama-3.3-70b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const fal = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapFal(fal, tracker);
    await (wrapped as typeof fal).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
