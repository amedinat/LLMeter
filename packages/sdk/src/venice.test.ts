import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapVenice } from './venice.js';

function makeVeniceClient(response: Record<string, unknown>) {
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

describe('wrapVenice', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const venice = makeVeniceClient({
      model: 'llama-3.3-70b',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapVenice(venice, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'llama-3.3-70b',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const venice = makeVeniceClient({
      model: 'llama-3.1-8b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapVenice(venice, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'llama-3.1-8b', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Venice AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const venice = makeVeniceClient({
      model: 'deepseek-r1',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapVenice(venice, tracker);
    await wrapped.chat.completions.create(
      { model: 'deepseek-r1', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (venice.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const venice = makeVeniceClient({
      model: 'qwen-2.5-72b',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapVenice(venice, tracker);
    await wrapped.chat.completions.create({
      model: 'qwen-2.5-72b',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const venice = makeVeniceClient({ model: 'llama-3.3-70b' });
    const wrapped = wrapVenice(venice, tracker);
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const venice = makeVeniceClient({
      model: 'mistral-7b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapVenice(venice, tracker);
    await wrapped.chat.completions.create(
      { model: 'mistral-7b-instruct', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (venice.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const venice = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapVenice(venice, tracker);
    await (wrapped as typeof venice).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
