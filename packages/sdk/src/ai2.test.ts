import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapAI2 } from './ai2.js';

function makeAI2Client(response: Record<string, unknown>) {
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

describe('wrapAI2', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ai2 = makeAI2Client({
      model: 'olmo-2-13b-instruct',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapAI2(ai2, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'olmo-2-13b-instruct',
      messages: [{ role: 'user', content: 'Hello from AI2 OLMo!' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'olmo-2-13b-instruct',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ai2 = makeAI2Client({
      model: 'olmo-2-7b-instruct',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapAI2(ai2, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'olmo-2-7b-instruct',
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

    const ai2 = makeAI2Client({
      model: 'tulu-3-8b',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapAI2(ai2, tracker);
    await wrapped.chat.completions.create(
      { model: 'tulu-3-8b', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = ai2.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ai2 = makeAI2Client({
      model: 'olmo-2-13b-instruct',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapAI2(ai2, tracker);
    await wrapped.chat.completions.create({
      model: 'olmo-2-13b-instruct',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const ai2 = makeAI2Client({ model: 'olmo-2-13b-instruct' });

    const wrapped = wrapAI2(ai2, tracker);
    await wrapped.chat.completions.create({
      model: 'olmo-2-13b-instruct',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const ai2 = makeAI2Client({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (ai2 as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapAI2(ai2 as typeof ai2 & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'molmo-72b',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hello from AI2 — open-source multimodal inference!' } }],
    };
    const ai2 = makeAI2Client(expectedResult);

    const wrapped = wrapAI2(ai2, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'molmo-72b',
      messages: [{ role: 'user', content: 'Hello from AI2!' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
