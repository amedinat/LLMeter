import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapDoubao } from './doubao.js';

function makeDoubaoClient(response: Record<string, unknown>) {
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

describe('wrapDoubao', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const doubao = makeDoubaoClient({
      model: 'doubao-pro-32k',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapDoubao(doubao, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'doubao-pro-32k',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'doubao-pro-32k',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const doubao = makeDoubaoClient({
      model: 'doubao-lite-32k',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapDoubao(doubao, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'doubao-lite-32k', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Doubao', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const doubao = makeDoubaoClient({
      model: 'doubao-1-5-lite-32k',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapDoubao(doubao, tracker);
    await wrapped.chat.completions.create(
      { model: 'doubao-1-5-lite-32k', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (doubao.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const doubao = makeDoubaoClient({
      model: 'doubao-pro-128k',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapDoubao(doubao, tracker);
    await wrapped.chat.completions.create({
      model: 'doubao-pro-128k',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const doubao = makeDoubaoClient({ model: 'doubao-pro-32k' });
    const wrapped = wrapDoubao(doubao, tracker);
    await wrapped.chat.completions.create({
      model: 'doubao-pro-32k',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const doubao = makeDoubaoClient({
      model: 'doubao-lite-4k',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapDoubao(doubao, tracker);
    await wrapped.chat.completions.create(
      { model: 'doubao-lite-4k', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (doubao.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const doubao = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapDoubao(doubao, tracker);
    await (wrapped as typeof doubao).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
