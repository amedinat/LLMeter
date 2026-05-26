import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapArcee } from './arcee.js';

function makeArceeClient(response: Record<string, unknown>) {
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

describe('wrapArcee', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const arcee = makeArceeClient({
      model: 'arcee-maestro',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapArcee(arcee, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'arcee-maestro',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'arcee-maestro',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const arcee = makeArceeClient({
      model: 'arcee-nova',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapArcee(arcee, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'arcee-nova', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Arcee', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const arcee = makeArceeClient({
      model: 'arcee-agent',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapArcee(arcee, tracker);
    await wrapped.chat.completions.create(
      { model: 'arcee-agent', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (arcee.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const arcee = makeArceeClient({
      model: 'arcee-lite',
      usage: { prompt_tokens: 80, completion_tokens: 40 },
    });

    const wrapped = wrapArcee(arcee, tracker);
    await wrapped.chat.completions.create({
      model: 'arcee-lite',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const arcee = makeArceeClient({ model: 'arcee-maestro' });
    const wrapped = wrapArcee(arcee, tracker);
    await wrapped.chat.completions.create({
      model: 'arcee-maestro',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const arcee = makeArceeClient({
      model: 'arcee-blitz',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapArcee(arcee, tracker);
    await wrapped.chat.completions.create(
      { model: 'arcee-blitz', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (arcee.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ url: 'https://example.com/image.png' });

    const arcee = {
      chat: {
        completions: { create: vi.fn() },
      },
      images: { generate: originalFn },
    };

    const wrapped = wrapArcee(arcee, tracker);
    await (wrapped as typeof arcee).images.generate({});
    expect(originalFn).toHaveBeenCalled();
  });
});
