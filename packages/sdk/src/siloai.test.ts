import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapSiloAI } from './siloai.js';

function makeSiloAIClient(response: Record<string, unknown>) {
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

describe('wrapSiloAI', () => {
  it('tracks usage from completion response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const siloai = makeSiloAIClient({
      model: 'viking-33b-v0.1',
      usage: { prompt_tokens: 500, completion_tokens: 200 },
    });

    const wrapped = wrapSiloAI(siloai, tracker, 'user_abc');
    await wrapped.chat.completions.create({
      model: 'viking-33b-v0.1',
      messages: [{ role: 'user', content: 'Hei! Vad är AI?' }],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'viking-33b-v0.1',
      inputTokens: 500,
      outputTokens: 200,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const siloai = makeSiloAIClient({
      model: 'viking-7b-v0.1',
      usage: { prompt_tokens: 100, completion_tokens: 50 },
    });

    const wrapped = wrapSiloAI(siloai, tracker);
    await wrapped.chat.completions.create(
      {
        model: 'viking-7b-v0.1',
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

    const siloai = makeSiloAIClient({
      model: 'viking-33b-v0.1',
      usage: { prompt_tokens: 10, completion_tokens: 5 },
    });

    const wrapped = wrapSiloAI(siloai, tracker);
    await wrapped.chat.completions.create(
      { model: 'viking-33b-v0.1', messages: [] },
      { llmeter_customer_id: 'u1', stream: false }
    );

    const callArgs = siloai.chat.completions.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('stream', false);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const siloai = makeSiloAIClient({
      model: 'viking-70b-v0.1',
      usage: { prompt_tokens: 30, completion_tokens: 15 },
    });

    const wrapped = wrapSiloAI(siloai, tracker);
    await wrapped.chat.completions.create({
      model: 'viking-70b-v0.1',
      messages: [],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const siloai = makeSiloAIClient({ model: 'viking-33b-v0.1' });

    const wrapped = wrapSiloAI(siloai, tracker);
    await wrapped.chat.completions.create({
      model: 'viking-33b-v0.1',
      messages: [],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const siloai = makeSiloAIClient({ model: 'test', usage: { prompt_tokens: 1, completion_tokens: 1 } });
    (siloai as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapSiloAI(siloai as typeof siloai & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the completion result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'viking-33b-v0.1',
      usage: { prompt_tokens: 200, completion_tokens: 400 },
      choices: [{ message: { content: 'Hej! Jag är en AI-assistent från Silo AI — tränad på nordiska språk.' } }],
    };
    const siloai = makeSiloAIClient(expectedResult);

    const wrapped = wrapSiloAI(siloai, tracker);
    const result = await wrapped.chat.completions.create({
      model: 'viking-33b-v0.1',
      messages: [{ role: 'user', content: 'Vad är du?' }],
    });

    expect(result).toEqual(expectedResult);
  });
});
