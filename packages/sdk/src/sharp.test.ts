import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapSharp } from './sharp.js';

function makeSharpClient(response: Record<string, unknown>) {
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

describe('wrapSharp', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sharp = makeSharpClient({
      model: 'sharp-ai-34b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapSharp(sharp, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'sharp-ai-34b-instruct',
      messages: [{ role: 'user', content: 'Explain COCORO AI in Japanese.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'sharp-ai-34b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sharp = makeSharpClient({
      model: 'sharp-ai-7b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapSharp(sharp, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'sharp-ai-7b', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Sharp AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const sharp = makeSharpClient({
      model: 'sharp-ai-34b',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapSharp(sharp, tracker);
    await wrapped.chat.completions.create(
      { model: 'sharp-ai-34b', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (sharp.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sharp = makeSharpClient({
      model: 'sharp-ai-7b-instruct',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapSharp(sharp, tracker);
    await wrapped.chat.completions.create({
      model: 'sharp-ai-7b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const sharp = makeSharpClient({ model: 'sharp-ai-34b-instruct' });
    const wrapped = wrapSharp(sharp, tracker);
    await wrapped.chat.completions.create({
      model: 'sharp-ai-34b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const sharp = makeSharpClient({
      model: 'sharp-ai-7b',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapSharp(sharp, tracker);
    await wrapped.chat.completions.create(
      { model: 'sharp-ai-7b', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (sharp.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const sharp = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapSharp(sharp, tracker);
    await (wrapped as typeof sharp).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
