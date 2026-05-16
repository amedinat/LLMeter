import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapOpenRouter } from './openrouter.js';

function makeOpenRouterClient(response: Record<string, unknown>) {
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

describe('wrapOpenRouter', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const openrouter = makeOpenRouterClient({
      model: 'anthropic/claude-3-5-sonnet',
      usage: { prompt_tokens: 600, completion_tokens: 250 },
    });

    const wrapped = wrapOpenRouter(openrouter, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'anthropic/claude-3-5-sonnet',
      messages: [{ role: 'user', content: 'Hello!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'anthropic/claude-3-5-sonnet',
      inputTokens: 600,
      outputTokens: 250,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const openrouter = makeOpenRouterClient({
      model: 'openai/gpt-4o',
      usage: { prompt_tokens: 300, completion_tokens: 100 },
    });

    const wrapped = wrapOpenRouter(openrouter, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'openai/gpt-4o', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to OpenRouter', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const openrouter = makeOpenRouterClient({
      model: 'meta-llama/llama-4-maverick',
      usage: { prompt_tokens: 70, completion_tokens: 30 },
    });

    const wrapped = wrapOpenRouter(openrouter, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/llama-4-maverick', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (openrouter.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const openrouter = makeOpenRouterClient({
      model: 'google/gemini-2.0-flash',
      usage: { prompt_tokens: 120, completion_tokens: 50 },
    });

    const wrapped = wrapOpenRouter(openrouter, tracker);
    await wrapped.chat.completions.create({
      model: 'google/gemini-2.0-flash',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const openrouter = makeOpenRouterClient({ model: 'anthropic/claude-3-5-sonnet' });
    const wrapped = wrapOpenRouter(openrouter, tracker);
    await wrapped.chat.completions.create({
      model: 'anthropic/claude-3-5-sonnet',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const openrouter = makeOpenRouterClient({
      model: 'deepseek/deepseek-r1',
      usage: { prompt_tokens: 40, completion_tokens: 20 },
    });

    const wrapped = wrapOpenRouter(openrouter, tracker);
    await wrapped.chat.completions.create(
      { model: 'deepseek/deepseek-r1', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (openrouter.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ credits: 10.0 });

    const openrouter = {
      chat: {
        completions: { create: vi.fn() },
      },
      credits: { get: originalFn },
    };

    const wrapped = wrapOpenRouter(openrouter, tracker);
    await (wrapped as typeof openrouter).credits.get();
    expect(originalFn).toHaveBeenCalled();
  });
});
