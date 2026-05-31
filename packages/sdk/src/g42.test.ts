import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapG42 } from './g42.js';

function makeG42Client(response: Record<string, unknown>) {
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

describe('wrapG42', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const g42 = makeG42Client({
      model: 'inceptionai/jais-30b-chat',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapG42(g42, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'inceptionai/jais-30b-chat',
      messages: [{ role: 'user', content: 'مرحبا!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'inceptionai/jais-30b-chat',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const g42 = makeG42Client({
      model: 'inceptionai/jais-13b-chat',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapG42(g42, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'inceptionai/jais-13b-chat',
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

    const g42 = makeG42Client({
      model: 'meta-llama/Meta-Llama-3.3-70B-Instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapG42(g42, tracker);
    await wrapped.chat.completions.create(
      { model: 'meta-llama/Meta-Llama-3.3-70B-Instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = g42.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const g42 = makeG42Client({
      model: 'deepseek-ai/DeepSeek-R1',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapG42(g42, tracker);
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

    const g42 = makeG42Client({ model: 'inceptionai/jais-30b-chat' });

    const wrapped = wrapG42(g42, tracker);
    await wrapped.chat.completions.create({
      model: 'inceptionai/jais-30b-chat',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const g42 = makeG42Client({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (g42 as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapG42(g42 as typeof g42 & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'inceptionai/jais-30b-chat',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'أهلاً وسهلاً!' } }],
    };
    const g42 = makeG42Client(expectedResult);

    const wrapped = wrapG42(g42, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'inceptionai/jais-30b-chat',
      messages: [{ role: 'user', content: 'مرحبا!' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
