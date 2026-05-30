import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapH2O } from './h2o.js';

function makeH2OClient(response: Record<string, unknown>) {
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

describe('wrapH2O', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const h2o = makeH2OClient({
      model: 'h2oai/h2o-danube3-4b-chat',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapH2O(h2o, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'h2oai/h2o-danube3-4b-chat',
      messages: [{ role: 'user', content: 'Hello from H2O.ai!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'h2oai/h2o-danube3-4b-chat',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const h2o = makeH2OClient({
      model: 'h2oai/h2o-danube3-1.8b-chat',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapH2O(h2o, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'h2oai/h2o-danube3-1.8b-chat',
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

    const h2o = makeH2OClient({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapH2O(h2o, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = h2o.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const h2o = makeH2OClient({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapH2O(h2o, tracker);
    await wrapped.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-R1',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const h2o = makeH2OClient({ model: 'h2oai/h2o-danube3-4b-chat' });

    const wrapped = wrapH2O(h2o, tracker);
    await wrapped.chat.completions.create({
      model: 'h2oai/h2o-danube3-4b-chat',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const h2o = makeH2OClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (h2o as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapH2O(h2o as typeof h2o & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'h2oai/h2o-danube3-4b-chat',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from H2O.ai!' } }],
    };
    const h2o = makeH2OClient(expectedResult);

    const wrapped = wrapH2O(h2o, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'h2oai/h2o-danube3-4b-chat',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
