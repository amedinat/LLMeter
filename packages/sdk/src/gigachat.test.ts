import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapGigaChat } from './gigachat.js';

function makeGigaChatClient(response: Record<string, unknown>) {
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

describe('wrapGigaChat', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const gigachat = makeGigaChatClient({
      model: 'GigaChat-Max',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapGigaChat(gigachat, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'GigaChat-Max',
      messages: [{ role: 'user', content: 'Привет!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'GigaChat-Max',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const gigachat = makeGigaChatClient({
      model: 'GigaChat-Pro',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapGigaChat(gigachat, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'GigaChat-Pro', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to GigaChat', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const gigachat = makeGigaChatClient({
      model: 'GigaChat-Lite',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapGigaChat(gigachat, tracker);
    await wrapped.chat.completions.create(
      { model: 'GigaChat-Lite', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (gigachat.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const gigachat = makeGigaChatClient({
      model: 'GigaChat-Lite',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapGigaChat(gigachat, tracker);
    await wrapped.chat.completions.create({
      model: 'GigaChat-Lite',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const gigachat = makeGigaChatClient({ model: 'GigaChat-Max' });
    const wrapped = wrapGigaChat(gigachat, tracker);
    await wrapped.chat.completions.create({
      model: 'GigaChat-Max',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const gigachat = makeGigaChatClient({
      model: 'GigaChat-Pro',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapGigaChat(gigachat, tracker);
    await wrapped.chat.completions.create(
      { model: 'GigaChat-Pro', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (gigachat.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const gigachat = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapGigaChat(gigachat, tracker);
    await (wrapped as typeof gigachat).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
