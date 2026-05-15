import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapAI21 } from './ai21.js';

function makeAI21Client(response: Record<string, unknown>) {
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

describe('wrapAI21', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ai21 = makeAI21Client({
      model: 'jamba-1.5-large',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapAI21(ai21, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'jamba-1.5-large',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'jamba-1.5-large',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ai21 = makeAI21Client({
      model: 'jamba-1.5-mini',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapAI21(ai21, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'jamba-1.5-mini', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to AI21 Labs', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const ai21 = makeAI21Client({
      model: 'jamba-1.5-mini',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapAI21(ai21, tracker);
    await wrapped.chat.completions.create(
      { model: 'jamba-1.5-mini', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (ai21.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ai21 = makeAI21Client({
      model: 'jamba-1.6-large',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapAI21(ai21, tracker);
    await wrapped.chat.completions.create({
      model: 'jamba-1.6-large',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ai21 = makeAI21Client({ model: 'jamba-1.5-large' });
    const wrapped = wrapAI21(ai21, tracker);
    await wrapped.chat.completions.create({
      model: 'jamba-1.5-large',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const ai21 = makeAI21Client({
      model: 'jamba-1.6-mini',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapAI21(ai21, tracker);
    await wrapped.chat.completions.create(
      { model: 'jamba-1.6-mini', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (ai21.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ result: 'ok' });

    const ai21 = {
      chat: {
        completions: { create: vi.fn() },
      },
      embed: { create: originalFn },
    };

    const wrapped = wrapAI21(ai21, tracker);
    await (wrapped as typeof ai21).embed.create({});
    expect(originalFn).toHaveBeenCalled();
  });
});
