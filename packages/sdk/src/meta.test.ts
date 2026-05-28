import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapMeta } from './meta.js';

function makeMetaClient(response: Record<string, unknown>) {
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

describe('wrapMeta', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const meta = makeMetaClient({
      model: 'Llama-4-Scout-17B-16E-Instruct-FP8',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapMeta(meta, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'Llama-4-Scout-17B-16E-Instruct-FP8',
      messages: [{ role: 'user', content: 'Hello from Meta Llama!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'Llama-4-Scout-17B-16E-Instruct-FP8',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const meta = makeMetaClient({
      model: 'Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapMeta(meta, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'Llama-3.3-70B-Instruct',
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

    const meta = makeMetaClient({
      model: 'Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapMeta(meta, tracker);
    await wrapped.chat.completions.create(
      { model: 'Llama-3.1-8B-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = meta.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const meta = makeMetaClient({
      model: 'Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapMeta(meta, tracker);
    await wrapped.chat.completions.create({
      model: 'Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const meta = makeMetaClient({ model: 'Llama-4-Maverick-17B-128E-Instruct-FP8' });

    const wrapped = wrapMeta(meta, tracker);
    await wrapped.chat.completions.create({
      model: 'Llama-4-Maverick-17B-128E-Instruct-FP8',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const meta = makeMetaClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (meta as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapMeta(meta as typeof meta & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'Llama-3.1-405B-Instruct-FP8',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from Meta Llama!' } }],
    };
    const meta = makeMetaClient(expectedResult);

    const wrapped = wrapMeta(meta, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'Llama-3.1-405B-Instruct-FP8',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
