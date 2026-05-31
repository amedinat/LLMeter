import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMeter } from './client.js';
import { wrapVoyage } from './voyage.js';

function makeVoyageClient(response: Record<string, unknown>) {
  return {
    embeddings: {
      create: vi.fn().mockResolvedValue(response),
    },
  };
}

beforeEach(() => {
  vi.useFakeTimers();
});

describe('wrapVoyage', () => {
  it('tracks usage from embedding response', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const voyage = makeVoyageClient({
      model: 'voyage-3',
      usage: { total_tokens: 500 },
    });

    const wrapped = wrapVoyage(voyage, tracker, 'user_abc');
    await wrapped.embeddings.create({
      model: 'voyage-3',
      input: ['Hello from Voyage AI!'],
    });

    expect(trackSpy).toHaveBeenCalledWith({
      model: 'voyage-3',
      inputTokens: 500,
      outputTokens: 0,
      customerId: 'user_abc',
    });
  });

  it('uses llmeter_customer_id from options', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const voyage = makeVoyageClient({
      model: 'voyage-code-3',
      usage: { total_tokens: 100 },
    });

    const wrapped = wrapVoyage(voyage, tracker);
    await wrapped.embeddings.create(
      {
        model: 'voyage-code-3',
        input: ['function hello() {}'],
      },
      { llmeter_customer_id: 'customer_xyz' }
    );

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'customer_xyz' })
    );
  });

  it('strips llmeter_customer_id from options before forwarding', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const voyage = makeVoyageClient({
      model: 'voyage-3-lite',
      usage: { total_tokens: 10 },
    });

    const wrapped = wrapVoyage(voyage, tracker);
    await wrapped.embeddings.create(
      { model: 'voyage-3-lite', input: ['test'] },
      { llmeter_customer_id: 'u1', truncation: true }
    );

    const callArgs = voyage.embeddings.create.mock.calls[0];
    expect(callArgs[1]).not.toHaveProperty('llmeter_customer_id');
    expect(callArgs[1]).toHaveProperty('truncation', true);
  });

  it('uses anonymous as default customer id', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const voyage = makeVoyageClient({
      model: 'voyage-3',
      usage: { total_tokens: 30 },
    });

    const wrapped = wrapVoyage(voyage, tracker);
    await wrapped.embeddings.create({
      model: 'voyage-3',
      input: ['test'],
    });

    expect(trackSpy).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: 'anonymous' })
    );
  });

  it('does not track when usage is missing', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const trackSpy = vi.spyOn(tracker, 'track');

    const voyage = makeVoyageClient({ model: 'voyage-3' });

    const wrapped = wrapVoyage(voyage, tracker);
    await wrapped.embeddings.create({
      model: 'voyage-3',
      input: ['test'],
    });

    expect(trackSpy).not.toHaveBeenCalled();
  });

  it('passes through non-create properties unchanged', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });
    const voyage = makeVoyageClient({ model: 'test', usage: { total_tokens: 1 } });
    (voyage as Record<string, unknown>).someOtherProp = 'value';

    const wrapped = wrapVoyage(voyage as typeof voyage & { someOtherProp: string }, tracker);
    expect((wrapped as Record<string, unknown>).someOtherProp).toBe('value');
  });

  it('returns the embedding result from the underlying client', async () => {
    const tracker = new LLMeter({ apiKey: 'lm_test', flushInterval: 0 });

    const expectedResult = {
      model: 'voyage-3',
      usage: { total_tokens: 200 },
      data: [{ embedding: [0.1, 0.2, 0.3], index: 0 }],
    };
    const voyage = makeVoyageClient(expectedResult);

    const wrapped = wrapVoyage(voyage, tracker);
    const result = await wrapped.embeddings.create({
      model: 'voyage-3',
      input: ['Hello from Voyage AI MTEB #1 embeddings!'],
    });

    expect(result).toEqual(expectedResult);
  });
});
