import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapGroq } from './groq.js';

function makeGroqClient(response: Record<string, unknown>) {
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

describe('wrapGroq', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const groq = makeGroqClient({
      model: 'llama-3.3-70b-versatile',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapGroq(groq, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'llama-3.3-70b-versatile',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const groq = makeGroqClient({
      model: 'llama-3.1-8b-instant',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapGroq(groq, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'llama-3.1-8b-instant', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Groq', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const groq = makeGroqClient({
      model: 'llama-3.3-70b-versatile',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapGroq(groq, tracker);
    await wrapped.chat.completions.create(
      { model: 'llama-3.3-70b-versatile', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (groq.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const groq = makeGroqClient({
      model: 'gemma2-9b-it',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapGroq(groq, tracker);
    await wrapped.chat.completions.create({ model: 'gemma2-9b-it', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const groq = makeGroqClient({ model: 'llama-3.3-70b-versatile' });
    const wrapped = wrapGroq(groq, tracker);
    await wrapped.chat.completions.create({ model: 'llama-3.3-70b-versatile', messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const groq = makeGroqClient({
      model: 'llama-3.1-8b-instant',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapGroq(groq, tracker);
    await wrapped.chat.completions.create(
      { model: 'llama-3.1-8b-instant', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (groq.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ transcription: 'hello' });

    const groq = {
      chat: {
        completions: { create: vi.fn() },
      },
      audio: { transcriptions: { create: originalFn } },
    };

    const wrapped = wrapGroq(groq, tracker);
    await (wrapped as typeof groq).audio.transcriptions.create({});
    expect(originalFn).toHaveBeenCalled();
  });
});
