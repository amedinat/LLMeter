import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapVast } from './vast.js';

function makeVastClient(response: Record<string, unknown>) {
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

describe('wrapVast', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vast = makeVastClient({
      model: 'llama-3.3-70b',
      usage: { prompt_tokens: 400, completion_tokens: 150 },
    });

    const wrapped = wrapVast(vast, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'llama-3.3-70b',
      messages: [{ role: 'user', content: 'Peer-to-peer GPU marketplace, tracked by LLMeter.' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'llama-3.3-70b',
      inputTokens: 400,
      outputTokens: 150,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vast = makeVastClient({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapVast(vast, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
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

    const vast = makeVastClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapVast(vast, tracker);
    await wrapped.chat.completions.create(
      { model: 'deepseek-ai/DeepSeek-R1', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = vast.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toEqual({ stream: false });
  });

  it('uses defaultCustomerId when no llmeter_customer_id in options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vast = makeVastClient({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      usage: { prompt_tokens: 200, completion_tokens: 100 },
    });

    const wrapped = wrapVast(vast, tracker, 'default_user');
    await wrapped.chat.completions.create({ model: 'mistralai/Mistral-7B-Instruct-v0.3', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'default_user' })
    );
  });

  it('does not track when usage is absent', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vast = makeVastClient({ model: 'meta-llama/Meta-Llama-3.3-70B-Instruct' });

    const wrapped = wrapVast(vast, tracker);
    await wrapped.chat.completions.create({ model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', messages: [] });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('forwards original call arguments to underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const vast = makeVastClient({
      model: 'Qwen/Qwen2.5-72B-Instruct',
      usage: { prompt_tokens: 50, completion_tokens: 25 },
    });

    const wrapped = wrapVast(vast, tracker);
    const params = {
      model: 'Qwen/Qwen2.5-72B-Instruct',
      messages: [{ role: 'user' as const, content: 'Marketplace pricing, tracked by LLMeter.' }],
      temperature: 0.7,
    };
    await wrapped.chat.completions.create(params);

    expect(vast.chat.completions.create).toHaveBeenCalledWith(params, undefined);
  });

  it('uses anonymous as default customerId when none provided', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const vast = makeVastClient({
      model: 'deepseek-ai/DeepSeek-V3',
      usage: { prompt_tokens: 300, completion_tokens: 150 },
    });

    const wrapped = wrapVast(vast, tracker);
    await wrapped.chat.completions.create({ model: 'deepseek-ai/DeepSeek-V3', messages: [] });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });
});
