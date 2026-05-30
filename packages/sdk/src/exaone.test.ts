import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapEXAONE } from './exaone.js';

function makeEXAONEClient(response: Record<string, unknown>) {
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

describe('wrapEXAONE', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const exaone = makeEXAONEClient({
      model: 'exaone-3.5-7.8b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapEXAONE(exaone, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'exaone-3.5-7.8b-instruct',
      messages: [{ role: 'user', content: 'Hello from EXAONE!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'exaone-3.5-7.8b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const exaone = makeEXAONEClient({
      model: 'exaone-deep-7.8b',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapEXAONE(exaone, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'exaone-deep-7.8b',
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

    const exaone = makeEXAONEClient({
      model: 'exaone-3.5-2.4b-instruct',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapEXAONE(exaone, tracker);
    await wrapped.chat.completions.create(
      { model: 'exaone-3.5-2.4b-instruct', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = exaone.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const exaone = makeEXAONEClient({
      model: 'exaone-3.0-7.8b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapEXAONE(exaone, tracker);
    await wrapped.chat.completions.create({
      model: 'exaone-3.0-7.8b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const exaone = makeEXAONEClient({ model: 'exaone-3.5-7.8b' });

    const wrapped = wrapEXAONE(exaone, tracker);
    await wrapped.chat.completions.create({
      model: 'exaone-3.5-7.8b',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const exaone = makeEXAONEClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (exaone as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapEXAONE(exaone as typeof exaone & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'exaone-3.5-7.8b-instruct',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from EXAONE!' } }],
    };
    const exaone = makeEXAONEClient(expectedResult);

    const wrapped = wrapEXAONE(exaone, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'exaone-3.5-7.8b-instruct',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
