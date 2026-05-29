import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapInternLM } from './internlm.js';

function makeInternLMClient(response: Record<string, unknown>) {
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

describe('wrapInternLM', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const internlm = makeInternLMClient({
      model: 'internlm3-8b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapInternLM(internlm, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'internlm3-8b-instruct',
      messages: [{ role: 'user', content: 'Hello from InternLM!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'internlm3-8b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const internlm = makeInternLMClient({
      model: 'internlm2-5-20b-chat',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapInternLM(internlm, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'internlm2-5-20b-chat',
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

    const internlm = makeInternLMClient({
      model: 'internlm2-math-20b',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapInternLM(internlm, tracker);
    await wrapped.chat.completions.create(
      { model: 'internlm2-math-20b', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = internlm.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const internlm = makeInternLMClient({
      model: 'internlm2-5-7b-chat',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapInternLM(internlm, tracker);
    await wrapped.chat.completions.create({
      model: 'internlm2-5-7b-chat',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const internlm = makeInternLMClient({ model: 'internlm2-34b' });

    const wrapped = wrapInternLM(internlm, tracker);
    await wrapped.chat.completions.create({
      model: 'internlm2-34b',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const internlm = makeInternLMClient({
      model: 'test',
      usage: { prompt_tokens: 1, completion_tokens: 1 },
    });
    (internlm as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapInternLM(
      internlm as typeof internlm & { someOtherProp: string },
      tracker
    );
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'internlm3-8b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from InternLM!' } }],
    };
    const internlm = makeInternLMClient(expectedResult);

    const wrapped = wrapInternLM(internlm, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'internlm3-8b-instruct',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
