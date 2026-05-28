import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapIONOS } from './ionos.js';

function makeIONOSClient(response: Record<string, unknown>) {
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

describe('wrapIONOS', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ionos = makeIONOSClient({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapIONOS(ionos, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      messages: [{ role: 'user', content: 'Hello from IONOS!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ionos = makeIONOSClient({
      model: 'mistralai/Mistral-7B-Instruct-v0.3',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapIONOS(ionos, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'mistralai/Mistral-7B-Instruct-v0.3',
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

    const ionos = makeIONOSClient({
      model: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapIONOS(ionos, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Meta-Llama-3.1-8B-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = ionos.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ionos = makeIONOSClient({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapIONOS(ionos, tracker);
    await wrapped.chat.completions.create({
      model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ionos = makeIONOSClient({ model: 'meta-llama/Meta-Llama-3.3-70B-Instruct' });

    const wrapped = wrapIONOS(ionos, tracker);
    await wrapped.chat.completions.create({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const ionos = makeIONOSClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (ionos as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapIONOS(ionos as typeof ionos & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'DeepSeek R1 on IONOS' } }],
    };
    const ionos = makeIONOSClient(expectedResult);

    const wrapped = wrapIONOS(ionos, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'deepseek-ai/DeepSeek-R1',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
