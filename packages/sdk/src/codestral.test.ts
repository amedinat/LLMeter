import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapCodestral } from './codestral.js';

function makeCodestralClient(response: Record<string, unknown>) {
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

describe('wrapCodestral', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const codestral = makeCodestralClient({
      model: 'codestral-2501',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapCodestral(codestral, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'codestral-2501',
      messages: [{ role: 'user', content: 'Write a TypeScript quicksort.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'codestral-2501',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const codestral = makeCodestralClient({
      model: 'devstral-small-2505',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapCodestral(codestral, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'devstral-small-2505', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Codestral', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const codestral = makeCodestralClient({
      model: 'codestral-mamba-latest',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapCodestral(codestral, tracker);
    await wrapped.chat.completions.create(
      { model: 'codestral-mamba-latest', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (codestral.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const codestral = makeCodestralClient({
      model: 'codestral-2405',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapCodestral(codestral, tracker);
    await wrapped.chat.completions.create({
      model: 'codestral-2405',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const codestral = makeCodestralClient({ model: 'codestral-2501' });
    const wrapped = wrapCodestral(codestral, tracker);
    await wrapped.chat.completions.create({
      model: 'codestral-2501',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const codestral = makeCodestralClient({
      model: 'codestral-mamba-2407',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapCodestral(codestral, tracker);
    await wrapped.chat.completions.create(
      { model: 'codestral-mamba-2407', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (codestral.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const codestral = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapCodestral(codestral, tracker);
    await (wrapped as typeof codestral).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
