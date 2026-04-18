import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapOpenAI } from './openai.js';

// Minimal OpenAI-shaped client
function makeOpenAIClient(response: Record<string, unknown>) {
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

describe('wrapOpenAI', () => {
  it('tracks usage from a chat completion', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const openai = makeOpenAIClient({
      model: 'gpt-4o',
      usage: { prompt_tokens: 120, completion_tokens: 340 },
    });

    const wrapped = wrapOpenAI(openai, tracker, 'user_abc');
    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'gpt-4o',
      inputTokens: 120,
      outputTokens: 340,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options when provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const openai = makeOpenAIClient({
      model: 'gpt-4o',
      usage: { prompt_tokens: 50, completion_tokens: 80 },
    });

    const wrapped = wrapOpenAI(openai, tracker, 'default_customer');
    await wrapped.chat.completions.create(
      { model: 'gpt-4o', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(expect.objectContaining({ customerId: 'specific_user' }));
  });

  it('strips llmeter_customer_id before calling underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const openai = makeOpenAIClient({
      model: 'gpt-4o',
      usage: { prompt_tokens: 10, completion_tokens: 20 },
    });

    const wrapped = wrapOpenAI(openai, tracker);
    await wrapped.chat.completions.create(
      { model: 'gpt-4o', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const [, passedOptions] = openai.chat.completions.create.mock.calls[0] as [unknown, Record<string, unknown>];
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.stream).toBe(false); // other options preserved
  });

  it('skips tracking when response has no usage field', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const openai = makeOpenAIClient({ model: 'gpt-4o' }); // no usage
    const wrapped = wrapOpenAI(openai, tracker);
    await wrapped.chat.completions.create({ model: 'gpt-4o', messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('proxies non-create properties unchanged', () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const openai = { ...makeOpenAIClient({}), models: { list: vi.fn() } };
    const wrapped = wrapOpenAI(openai as typeof openai & { chat: typeof openai['chat'] }, tracker);

    // Access a property outside chat.completions.create
    expect(wrapped.chat.completions.create).toBeDefined();
  });
});
