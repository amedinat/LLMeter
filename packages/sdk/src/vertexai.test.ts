import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapVertexAI } from './vertexai.js';

function makeVertexAIClient(response: Record<string, unknown>) {
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

describe('wrapVertexAI', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vertex = makeVertexAIClient({
      model: 'google/gemini-2.5-flash',
      usage: { prompt_tokens: 600, completion_tokens: 250 },
    });

    const wrapped = wrapVertexAI(vertex, tracker, 'user_xyz');
    await wrapped.chat.completions.create({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: 'Hello from Vertex AI!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'google/gemini-2.5-flash',
      inputTokens: 600,
      outputTokens: 250,
      customerId: 'user_xyz',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vertex = makeVertexAIClient({
      model: 'google/gemini-2.0-flash',
      usage: { prompt_tokens: 120, completion_tokens: 60 },
    });

    const wrapped = wrapVertexAI(vertex, tracker, 'default');
    await wrapped.chat.completions.create(
      { model: 'google/gemini-2.0-flash', messages: [] },
      { llmeter_customer_id: 'specific_user' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'specific_user' })
    );
  });

  it('strips llmeter_customer_id from options passed to Vertex AI', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const vertex = makeVertexAIClient({
      model: 'google/gemini-2.5-flash',
      usage: { prompt_tokens: 50, completion_tokens: 20 },
    });

    const wrapped = wrapVertexAI(vertex, tracker);
    await wrapped.chat.completions.create(
      { model: 'google/gemini-2.5-flash', messages: [] },
      { llmeter_customer_id: 'u1', timeout: 5000 }
    );

    const [, passedOptions] = (vertex.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, Record<string, unknown>];
    expect(passedOptions).toBeDefined();
    expect('llmeter_customer_id' in passedOptions).toBe(false);
    expect(passedOptions.timeout).toBe(5000);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vertex = makeVertexAIClient({
      model: 'google/gemini-1.5-pro',
      usage: { prompt_tokens: 300, completion_tokens: 100 },
    });

    const wrapped = wrapVertexAI(vertex, tracker);
    await wrapped.chat.completions.create({
      model: 'google/gemini-1.5-pro',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('skips tracking when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vertex = makeVertexAIClient({ model: 'google/gemini-2.0-flash' });
    const wrapped = wrapVertexAI(vertex, tracker);
    await wrapped.chat.completions.create({
      model: 'google/gemini-2.0-flash',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through no options when only llmeter_customer_id is provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const vertex = makeVertexAIClient({
      model: 'google/gemini-2.5-flash',
      usage: { prompt_tokens: 40, completion_tokens: 18 },
    });

    const wrapped = wrapVertexAI(vertex, tracker);
    await wrapped.chat.completions.create(
      { model: 'google/gemini-2.5-flash', messages: [] },
      { llmeter_customer_id: 'u2' }
    );

    const [, passedOptions] = (vertex.chat.completions.create as ReturnType<typeof vi.fn>).mock.calls[0] as [unknown, unknown];
    expect(passedOptions).toBeUndefined();
  });

  it('proxies other methods on the client unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const originalFn = vi.fn().mockResolvedValue({ result: 'ok' });

    const vertex = {
      chat: {
        completions: { create: vi.fn() },
      },
      models: { list: originalFn },
    };

    const wrapped = wrapVertexAI(vertex, tracker);
    await (wrapped as typeof vertex).models.list();
    expect(originalFn).toHaveBeenCalled();
  });
});
