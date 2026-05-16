import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapDeepSeek } from './deepseek.js';

function makeDeepSeekClient(response: Record<string, unknown>) {
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

describe('wrapDeepSeek', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const deepseek = makeDeepSeekClient({
      model: 'deepseek-chat',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapDeepSeek(deepseek, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'deepseek-chat',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const deepseek = makeDeepSeekClient({
      model: 'deepseek-reasoner',
      usage: { prompt_tokens: 200, completion_tokens: 80 },
    });

    const wrapped = wrapDeepSeek(deepseek, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'deepseek-reasoner', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to DeepSeek', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const deepseek = makeDeepSeekClient({
      model: 'deepseek-chat',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapDeepSeek(deepseek, tracker);
    await wrapped.chat.completions.create(
      { model: 'deepseek-chat', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (deepseek.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const deepseek = makeDeepSeekClient({
      model: 'deepseek-coder',
      usage: { prompt_tokens: 100, completion_tokens: 60 },
    });

    const wrapped = wrapDeepSeek(deepseek, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek-coder',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const deepseek = makeDeepSeekClient({ model: 'deepseek-chat' });
    const wrapped = wrapDeepSeek(deepseek, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek-chat',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const deepseek = makeDeepSeekClient({
      model: 'deepseek-reasoner',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapDeepSeek(deepseek, tracker);
    await wrapped.chat.completions.create(
      { model: 'deepseek-reasoner', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (deepseek.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ choices: [] });

    const deepseek = {
      chat: {
        completions: { create: vi.fn() },
      },
      models: { list: originalFn },
    };

    const wrapped = wrapDeepSeek(deepseek, tracker);
    await (wrapped as typeof deepseek).models.list();
    expect(originalFn).toHaveBeenCalled();
  });
});
