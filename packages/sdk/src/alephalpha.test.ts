import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapAlephAlpha } from './alephalpha.js';

function makeAlephAlphaClient(response: Record<string, unknown>) {
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

describe('wrapAlephAlpha', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeAlephAlphaClient({
      model: 'pharia-1-llm-7b-cc',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapAlephAlpha(client, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'pharia-1-llm-7b-cc',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'pharia-1-llm-7b-cc',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeAlephAlphaClient({
      model: 'luminous-extended',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapAlephAlpha(client, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'luminous-extended', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Aleph Alpha', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const client = makeAlephAlphaClient({
      model: 'luminous-base',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapAlephAlpha(client, tracker);
    await wrapped.chat.completions.create(
      { model: 'luminous-base', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (client.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeAlephAlphaClient({
      model: 'pharia-1-llm-4x4b-cc',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapAlephAlpha(client, tracker);
    await wrapped.chat.completions.create({
      model: 'pharia-1-llm-4x4b-cc',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const client = makeAlephAlphaClient({ model: 'luminous-supreme' });
    const wrapped = wrapAlephAlpha(client, tracker);
    await wrapped.chat.completions.create({
      model: 'luminous-supreme',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const client = makeAlephAlphaClient({
      model: 'luminous-base-control',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapAlephAlpha(client, tracker);
    await wrapped.chat.completions.create(
      { model: 'luminous-base-control', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (client.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const client = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapAlephAlpha(client, tracker);
    await (wrapped as typeof client).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
