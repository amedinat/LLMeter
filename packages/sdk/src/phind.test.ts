import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapPhind } from './phind.js';

function makePhindClient(response: Record<string, unknown>) {
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

describe('wrapPhind', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const phind = makePhindClient({
      model: 'phind-70b-v2',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapPhind(phind, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'phind-70b-v2',
      messages: [{ role: 'user', content: 'How do I implement a binary search tree in Rust?' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'phind-70b-v2',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const phind = makePhindClient({
      model: 'phind-34b-v2',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapPhind(phind, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'phind-34b-v2',
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

    const phind = makePhindClient({
      model: 'phind-70b-v2',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapPhind(phind, tracker);
    await wrapped.chat.completions.create(
      { model: 'phind-70b-v2', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = phind.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const phind = makePhindClient({
      model: 'phind-instant',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapPhind(phind, tracker);
    await wrapped.chat.completions.create({
      model: 'phind-instant',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const phind = makePhindClient({ model: 'phind-70b-v2' });

    const wrapped = wrapPhind(phind, tracker);
    await wrapped.chat.completions.create({
      model: 'phind-70b-v2',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const phind = makePhindClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (phind as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapPhind(phind as typeof phind & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'phind-70b-v2',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Here is how you implement a binary search tree in Rust...' } }],
    };
    const phind = makePhindClient(expectedResult);

    const wrapped = wrapPhind(phind, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'phind-70b-v2',
      messages: [{ role: 'user', content: 'Rust BST?' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
