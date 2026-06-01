import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapModular } from './modular.js';

function makeModularClient(response: Record<string, unknown>) {
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

describe('wrapModular', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const modular = makeModularClient({
      model: 'meta-llama/llama-3.1-70b-instruct',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapModular(modular, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/llama-3.1-70b-instruct',
      messages: [{ role: 'user', content: 'Compiled by MAX, tracked by LLMeter.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/llama-3.1-70b-instruct',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const modular = makeModularClient({
      model: 'meta-llama/llama-3.1-8b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapModular(modular, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: [{ role: 'user', content: 'test' }],
      },
      { llmeter_customer_id: 'customer_xyz' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer_xyz' })
    );
  });

  it('strips llmeter_customer_id from options before forwarding', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const modular = makeModularClient({
      model: 'mistralai/mistral-7b-instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapModular(modular, tracker);
    await wrapped.chat.completions.create(
      { model: 'mistralai/mistral-7b-instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = modular.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toEqual({ stream: false });
  });

  it('uses defaultCustomerId when no llmeter_customer_id in options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const modular = makeModularClient({
      model: 'meta-llama/llama-3.3-70b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });

    const wrapped = wrapModular(modular, tracker, 'default_user');
    await wrapped.chat.completions.create({ model: 'meta-llama/llama-3.3-70b-instruct', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default_user' })
    );
  });

  it('does not track when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const modular = makeModularClient({ model: 'meta-llama/llama-3.1-70b-instruct' });

    const wrapped = wrapModular(modular, tracker);
    await wrapped.chat.completions.create({ model: 'meta-llama/llama-3.1-70b-instruct', messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('forwards original call arguments to underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const modular = makeModularClient({
      model: 'meta-llama/llama-3.1-70b-instruct',
      usage: { prompt_tokens: 50, completion_tokens: 25 },
    });

    const wrapped = wrapModular(modular, tracker);
    const params = {
      model: 'meta-llama/llama-3.1-70b-instruct',
      messages: [{ role: 'user' as const, content: 'Hello from Modular MAX!' }],
      temperature: 0.7,
    };
    await wrapped.chat.completions.create(params);

    expect(modular.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });

  it('uses anonymous as default customerId when none provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const modular = makeModularClient({
      model: 'qwen/qwen2.5-72b-instruct',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });

    const wrapped = wrapModular(modular, tracker);
    await wrapped.chat.completions.create({ model: 'qwen/qwen2.5-72b-instruct', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });
});
