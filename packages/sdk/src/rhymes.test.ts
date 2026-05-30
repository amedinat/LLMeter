import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapRhymes } from './rhymes.js';

function makeRhymesClient(response: Record<string, unknown>) {
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

describe('wrapRhymes', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const rhymes = makeRhymesClient({
      model: 'aria',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapRhymes(rhymes, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'aria',
      messages: [{ role: 'user', content: 'Hello from Rhymes AI!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'aria',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const rhymes = makeRhymesClient({
      model: 'aria-text',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapRhymes(rhymes, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'aria-text',
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

    const rhymes = makeRhymesClient({
      model: 'aria',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapRhymes(rhymes, tracker);
    await wrapped.chat.completions.create(
      { model: 'aria', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = rhymes.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const rhymes = makeRhymesClient({
      model: 'aria-mini',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapRhymes(rhymes, tracker);
    await wrapped.chat.completions.create({
      model: 'aria-mini',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const rhymes = makeRhymesClient({ model: 'aria-text' });

    const wrapped = wrapRhymes(rhymes, tracker);
    await wrapped.chat.completions.create({
      model: 'aria-text',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const rhymes = makeRhymesClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (rhymes as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapRhymes(rhymes as typeof rhymes & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'aria',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Ciao dal Rhymes AI!' } }],
    };
    const rhymes = makeRhymesClient(expectedResult);

    const wrapped = wrapRhymes(rhymes, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'aria',
      messages: [{ role: 'user', content: 'test' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
